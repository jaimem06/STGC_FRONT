"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { usePosStore, PagoInput, validarClienteFactura } from "@/store/posStore";
import { useUIStore } from "@/store/uiStore";
import {
  CreditCard, Banknote, Landmark, X, Receipt, Wallet, Smartphone,
  FileText, Loader2, Plus, Sparkles, AlertTriangle, CheckCircle2, UserRound,
} from "lucide-react";
import {
  billingApi, crearUrlFacturaPdf, extraerMotivoBilling, Comprobante,
} from "@/lib/billing-service";
import ClienteFactura from "./ClienteFactura";

interface CheckoutModalProps {
  total: number;
  onClose: () => void;
}

const PAYMENT_METHODS = [
  { id: "EFECTIVO", name: "Efectivo", icon: Banknote },
  { id: "TARJETA_CREDITO", name: "Tarjeta de Crédito", icon: CreditCard },
  { id: "TARJETA_DEBITO", name: "Tarjeta de Débito", icon: CreditCard },
  { id: "TRANSFERENCIA", name: "Transferencia", icon: Landmark },
  { id: "DE_UNA", name: "De Una", icon: Smartphone },
  { id: "AHORITA", name: "Ahorita", icon: Wallet },
];

const ELECTRONIC_METHODS = ["TRANSFERENCIA", "TARJETA_CREDITO", "TARJETA_DEBITO", "DE_UNA", "AHORITA"];

const round2 = (n: number) => Math.round(n * 100) / 100;

interface SuccessData {
  pedidoId: string;
  comprobante?: Comprobante;
  clienteResumen: string;
  facturaError?: string;
}

export default function CheckoutModal({ total, onClose }: CheckoutModalProps) {
  const { checkout, loading, facturaConDatos, mostrarFacturaPdf } = usePosStore();
  const { isSidebarCollapsed } = useUIStore();
  // El sidebar es fijo y reserva su ancho en el layout (md:pl-64 / md:pl-20),
  // pero los modales de Radix se centran contra el viewport completo: sin este
  // ajuste, quedan corridos hacia la izquierda (más espacio libre a la derecha)
  // en pantallas md+. En mobile el sidebar no reserva espacio, así que no aplica.
  const modalCenterX = isSidebarCollapsed
    ? "left-1/2 -translate-x-1/2 md:left-[calc(50%+40px)]"
    : "left-1/2 -translate-x-1/2 md:left-[calc(50%+128px)]";
  const [pagos, setPagos] = useState<PagoInput[]>([{ metodoPago: "EFECTIVO", monto: total }]);
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [clienteErrors, setClienteErrors] = useState<Record<string, string>>({});

  const sumaMontos = round2(pagos.reduce((acc, p) => acc + (p.monto || 0), 0));
  const diferencia = round2(total - sumaMontos);
  const cubierto = total > 0 ? Math.min(100, Math.max(0, (sumaMontos / total) * 100)) : 0;
  const isComplete = diferencia === 0 && pagos.length > 0;

  const sumaOtros = (arr: PagoInput[], skip: number) =>
    round2(arr.reduce((acc, p, i) => (i === skip ? acc : acc + (p.monto || 0)), 0));

  /** Recalcula errores de referencia/monto para el arreglo dado (solo campos tocados). */
  const recomputeErrors = (arr: PagoInput[], touchedState: Record<string, boolean>) => {
    const errs: Record<string, string> = {};
    arr.forEach((p) => {
      const k = p.metodoPago;
      if (touchedState[`referencia_${k}`] && ELECTRONIC_METHODS.includes(p.metodoPago) && (!p.referencia_pago || !p.referencia_pago.trim())) {
        errs[`referencia_${k}`] = "Registra el N° de comprobante de esta modalidad";
      }
      if (touchedState[`monto_${k}`] && (!p.monto || p.monto <= 0)) {
        errs[`monto_${k}`] = "El monto debe ser mayor a 0";
      }
    });
    return errs;
  };

  const commit = (arr: PagoInput[], touchedState: Record<string, boolean> = touched) => {
    setPagos(arr);
    setFieldErrors(recomputeErrors(arr, touchedState));
  };

  const addPago = (metodoPago: string) => {
    if (pagos.some((p) => p.metodoPago === metodoPago)) return;
    // El nuevo método absorbe automáticamente el resto pendiente.
    const restante = round2(total - sumaMontos);
    const next = [...pagos, { metodoPago, monto: restante > 0 ? restante : 0, referencia_pago: "" }];
    setPagos(next);
  };

  /**
   * Cambia el monto de una fila y AUTO-BALANCEA: otro método absorbe el resto para
   * que la suma siga cuadrando con el total (así el cajero no calcula a mano).
   */
  const setMonto = (index: number, value: string) => {
    const val = round2(parseFloat(value) || 0);
    const next = pagos.map((p, i) => (i === index ? { ...p, monto: val } : { ...p }));

    if (next.length > 1) {
      // El método que absorbe es el último distinto al editado.
      const balanceIdx = index === next.length - 1 ? next.length - 2 : next.length - 1;
      const resto = round2(total - sumaOtros(next, balanceIdx));
      next[balanceIdx] = { ...next[balanceIdx], monto: resto > 0 ? resto : 0 };
    }
    const k = pagos[index].metodoPago;
    const t = { ...touched, [`monto_${k}`]: true };
    setTouched(t);
    commit(next, t);
  };

  /** Asigna a esta fila exactamente el saldo restante (one-tap). */
  const asignarResto = (index: number) => {
    const k = pagos[index].metodoPago;
    const resto = round2(total - sumaOtros(pagos, index));
    const next = pagos.map((p, i) => (i === index ? { ...p, monto: resto > 0 ? resto : 0 } : p));
    const t = { ...touched, [`monto_${k}`]: true };
    setTouched(t);
    commit(next, t);
  };

  const setReferencia = (index: number, value: string) => {
    const k = pagos[index].metodoPago;
    const next = pagos.map((p, i) => (i === index ? { ...p, referencia_pago: value } : p));
    const t = { ...touched, [`referencia_${k}`]: true };
    setTouched(t);
    commit(next, t);
  };

  const removePago = (index: number) => {
    const restantes = pagos.filter((_, i) => i !== index);
    // Al quitar un método, el último absorbe el resto para mantener el cuadre.
    if (restantes.length >= 1) {
      const lastIdx = restantes.length - 1;
      const resto = round2(total - sumaOtros(restantes, lastIdx));
      restantes[lastIdx] = { ...restantes[lastIdx], monto: resto > 0 ? resto : 0 };
    }
    commit(restantes);
  };

  const handleCheckout = async () => {
    // Al confirmar se validan TODOS los campos, tocados o no.
    const allTouched: Record<string, boolean> = {};
    pagos.forEach((p) => {
      allTouched[`monto_${p.metodoPago}`] = true;
      allTouched[`referencia_${p.metodoPago}`] = true;
    });
    setTouched(allTouched);
    const errs = recomputeErrors(pagos, allTouched);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    if (!isComplete) return;

    // Con factura con datos, el cliente debe estar completo ANTES de cobrar
    // (el billing-service rechaza facturas con datos incompletos).
    const { clienteNombre, clienteApellido, clienteCedula } = usePosStore.getState();
    if (facturaConDatos) {
      const cErrs = validarClienteFactura(clienteNombre, clienteApellido, clienteCedula);
      if (Object.keys(cErrs).length > 0) {
        setClienteErrors(cErrs);
        return;
      }
    }
    // El store limpia el cliente tras cobrar: capturamos el resumen antes.
    const clienteResumen = facturaConDatos
      ? `${clienteNombre} ${clienteApellido} · ${clienteCedula}`.trim()
      : "Consumidor Final";

    const result = await checkout(pagos);
    if (result.success && result.pedidoId) {
      setSuccessData({
        pedidoId: result.pedidoId,
        comprobante: result.comprobante,
        clienteResumen,
        facturaError: result.facturaError,
      });
    }
  };

  /**
   * Emite la factura si hace falta y la muestra en el cuerpo de la página (no
   * en un modal: un PDF de factura completa aprovecha mejor el espacio ahí).
   * Cierra este modal de pago para dar paso a esa vista.
   */
  const handleVerFactura = async () => {
    if (!successData) return;
    setDownloadingPdf(true);
    try {
      let comprobante = successData.comprobante;
      if (!comprobante) {
        comprobante = await billingApi.emitirComprobante(successData.pedidoId);
      }
      const url = await crearUrlFacturaPdf(successData.pedidoId);
      const numero = comprobante.numero_comprobante ?? successData.pedidoId;
      mostrarFacturaPdf(url, numero);
      onClose();
    } catch (e) {
      const motivo = await extraerMotivoBilling(e);
      setSuccessData({
        ...successData,
        facturaError: motivo || "No se pudo generar la factura. Revisa la conexión con el servicio de facturación e inténtalo de nuevo.",
      });
    } finally {
      setDownloadingPdf(false);
    }
  };

  function formatComprobante(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 13);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // ── Pago exitoso: detalle de la factura + acciones ──
  if (successData) {
    const { comprobante, facturaError, clienteResumen } = successData;
    return (
      <Dialog.Root open={true} onOpenChange={onClose}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <Dialog.Content className={`fixed top-1/2 -translate-y-1/2 ${modalCenterX} w-[calc(100%-2rem)] max-w-sm bg-surface rounded-3xl shadow-[0_12px_48px_rgba(31,27,20,0.28)] ring-1 ring-black/[0.04] z-50 p-7 flex flex-col items-center animate-slide-up`}>
            <div className="w-16 h-16 bg-secondary-container rounded-full flex items-center justify-center mb-4 shadow-inner">
              <CheckCircle2 className="w-8 h-8 text-secondary" />
            </div>
            <Dialog.Title className="text-2xl font-display font-bold text-primary mb-1">¡Pago Exitoso!</Dialog.Title>
            <Dialog.Description className="text-sm text-on-surface-variant mb-5 text-center">
              El cobro quedó registrado correctamente.
            </Dialog.Description>

            {/* Detalle de la factura */}
            {comprobante ? (
              <div className="w-full rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-4 mb-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Factura</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-secondary-container text-secondary uppercase">
                    {comprobante.estado_factura}
                  </span>
                </div>
                <p className="font-display font-black text-xl text-primary tabular-nums">{comprobante.numero_comprobante}</p>
                <p className="flex items-center gap-1.5 text-xs font-medium text-on-surface-variant">
                  <UserRound className="w-3.5 h-3.5 shrink-0" /> {clienteResumen}
                </p>
              </div>
            ) : (
              <div className="w-full rounded-2xl border border-tertiary/40 bg-tertiary/10 p-4 mb-5">
                <p className="flex items-start gap-2 text-xs font-semibold text-tertiary">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  Factura pendiente de emitir
                </p>
                {facturaError && (
                  <p className="text-[11px] font-medium text-on-surface-variant mt-1.5 leading-relaxed">{facturaError}</p>
                )}
              </div>
            )}

            <div className="flex gap-3 w-full">
              <button
                onClick={handleVerFactura}
                disabled={downloadingPdf}
                className="flex-1 border-2 border-outline-variant/70 hover:bg-surface-container text-on-surface py-3 rounded-2xl font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
              >
                {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                {downloadingPdf ? "Generando..." : comprobante ? "Ver Factura" : "Reintentar Factura"}
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-primary hover:bg-primary-container text-on-primary py-3 rounded-2xl font-bold text-sm transition-colors active:scale-[0.98]"
              >
                Nuevo Pedido
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  const usedMethods = pagos.map((p) => p.metodoPago);
  const availableMethods = PAYMENT_METHODS.filter((m) => !usedMethods.includes(m.id));

  return (
    <Dialog.Root open={true} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className={`fixed top-1/2 -translate-y-1/2 ${modalCenterX} w-[calc(100%-2rem)] max-w-xl bg-surface rounded-3xl shadow-[0_12px_48px_rgba(31,27,20,0.28)] ring-1 ring-black/[0.04] z-50 flex flex-col max-h-[92vh] overflow-hidden animate-slide-up`}>
          {/* Header */}
          <div className="flex items-center justify-between px-7 pt-6 pb-4 shrink-0 border-b border-outline-variant/30">
            <div>
              <Dialog.Title className="text-2xl font-display font-bold text-primary leading-tight">Procesar Pago</Dialog.Title>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5">Registra la factura y los métodos de pago del pedido</p>
            </div>
            <Dialog.Close className="w-9 h-9 flex items-center justify-center rounded-full text-outline hover:text-error hover:bg-error-container/40 transition-colors shrink-0">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">Registra el tipo de factura y uno o varios métodos de pago hasta cubrir el total del pedido.</Dialog.Description>

          {/* Total + progreso de cobertura */}
          <div className="px-7 pt-5 shrink-0">
            <div className="bg-primary rounded-2xl px-6 py-5 text-on-primary relative overflow-hidden">
              <div className="flex items-end justify-between relative z-10 gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-on-primary/70 uppercase tracking-wider">Total a cobrar</p>
                  <p className="text-4xl font-display font-black leading-tight mt-0.5 tabular-nums">${total.toFixed(2)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-on-primary/70">Ingresado</p>
                  <p className="text-xl font-display font-bold tabular-nums mt-0.5">${sumaMontos.toFixed(2)}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2.5 relative z-10">
                <div className="flex-1 h-1.5 rounded-full bg-on-primary/20 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${isComplete ? "bg-secondary-container" : "bg-tertiary-container"}`}
                    style={{ width: `${cubierto}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold text-on-primary/80 tabular-nums shrink-0">{Math.round(cubierto)}%</span>
              </div>
            </div>
          </div>

          {/* Cliente + lista de pagos (scroll flexible) */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-7 py-5 space-y-4">
            {/* Tipo de factura */}
            <div className="rounded-2xl bg-surface-container-low border border-outline-variant/40 p-4">
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2.5">Facturar a</p>
              <ClienteFactura errors={clienteErrors} onChange={() => setClienteErrors({})} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Métodos de pago</p>
                <span className="text-[11px] font-semibold text-on-surface-variant tabular-nums">
                  {pagos.length} {pagos.length === 1 ? "método" : "métodos"}
                </span>
              </div>
              <div className="space-y-3">
                {pagos.map((pago, index) => {
                  const method = PAYMENT_METHODS.find((m) => m.id === pago.metodoPago)!;
                  const Icon = method.icon;
                  const isElectronic = ELECTRONIC_METHODS.includes(pago.metodoPago);
                  const montoErr = fieldErrors[`monto_${pago.metodoPago}`];
                  const refErr = fieldErrors[`referencia_${pago.metodoPago}`];

                  return (
                    <div
                      key={pago.metodoPago}
                      className="rounded-2xl bg-surface-container-low border border-outline-variant/40 p-4 transition-colors hover:border-primary/30 animate-fade-in"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-sm text-on-surface flex-1 min-w-0 truncate">{method.name}</span>

                        <div className={`flex items-center rounded-xl border bg-surface-container-lowest overflow-hidden shrink-0 ${montoErr ? "border-error" : "border-outline-variant/60"}`}>
                          <span className="pl-3 text-sm font-bold text-on-surface-variant">$</span>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            inputMode="decimal"
                            value={pago.monto || ""}
                            onChange={(e) => setMonto(index, e.target.value)}
                            placeholder="0.00"
                            className="w-24 py-2.5 pr-3 pl-1 text-base font-bold text-primary text-right tabular-nums bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>

                        {pagos.length > 1 && (
                          <button
                            onClick={() => removePago(index)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-outline hover:text-error hover:bg-error-container/50 transition-colors shrink-0"
                            title="Quitar método"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Error del monto, justo debajo de su campo */}
                      {montoErr && (
                        <p className="text-[11px] font-medium text-error mt-1.5 pl-[52px]">{montoErr}</p>
                      )}

                      {/* Fila secundaria: botón Resto + referencia (si aplica) */}
                      <div className="flex items-center gap-2.5 mt-2.5 pl-[52px]">
                        <button
                          onClick={() => asignarResto(index)}
                          className="flex items-center gap-1 text-[11px] font-bold text-secondary hover:text-primary transition-colors shrink-0 px-2 py-1 -ml-2 rounded-lg hover:bg-secondary/10"
                          title="Asignar el saldo restante a este método"
                        >
                          <Sparkles className="w-3 h-3" /> Resto
                        </button>
                        {isElectronic && (
                          <input
                            type="text"
                            value={pago.referencia_pago || ""}
                            onChange={(e) => setReferencia(index, formatComprobante(e.target.value))}
                            placeholder="N° de comprobante xxx-xxx-xxxxxxx"
                            className={`flex-1 min-w-0 text-xs font-medium px-3 py-1.5 rounded-lg bg-surface-container-lowest border outline-none transition-colors ${refErr ? "border-error focus:border-error" : "border-outline-variant/60 focus:border-primary"}`}
                          />
                        )}
                      </div>

                      {/* Error de la referencia, justo debajo de su campo */}
                      {refErr && (
                        <p className="text-[11px] font-medium text-error mt-1.5 pl-[52px]">{refErr}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Agregar método */}
            {availableMethods.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2.5">Agregar método de pago</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableMethods.map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        onClick={() => addPago(m.id)}
                        className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold border border-outline-variant/70 rounded-xl bg-surface-container-lowest hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5 shrink-0" />
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{m.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer: saldo + acciones (fijo) */}
          <div className="shrink-0 px-7 pt-4 pb-6 border-t border-outline-variant/40 bg-surface-container-lowest/60">
            <div
              className={`flex items-center justify-between px-4 py-3 rounded-xl mb-4 text-sm font-bold transition-colors ${
                isComplete
                  ? "bg-secondary/10 text-secondary"
                  : diferencia < 0
                  ? "bg-error/10 text-error"
                  : "bg-tertiary/10 text-tertiary"
              }`}
            >
              <span>{isComplete ? "Pago completo" : diferencia < 0 ? "Excede el total" : "Pendiente por cubrir"}</span>
              <span className="tabular-nums text-base">
                {isComplete ? "✓" : `$${Math.abs(diferencia).toFixed(2)}`}
              </span>
            </div>

            <div className="flex gap-3">
              <Dialog.Close className="flex-1 py-3.5 font-bold text-sm text-on-surface-variant hover:bg-surface-container rounded-2xl transition-colors">
                Cancelar
              </Dialog.Close>
              <button
                onClick={handleCheckout}
                disabled={loading || !isComplete}
                className="flex-[2] bg-secondary hover:bg-secondary/90 text-on-secondary py-3.5 rounded-2xl font-bold text-sm shadow-md shadow-secondary/20 hover:shadow-lg transition-all disabled:opacity-40 disabled:shadow-none flex justify-center items-center gap-2 active:scale-[0.98]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
                {loading ? "Procesando..." : `Cobrar $${total.toFixed(2)}`}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
