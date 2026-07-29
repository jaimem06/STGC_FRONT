"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { usePosStore } from "@/store/posStore";
import type { ResumenCaja, Turno } from "@/lib/pos-service";
import { Store, X, Receipt, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import Confirm from "@/components/Confirm";

interface RegisterModalProps {
  type: "OPEN" | "CLOSE";
  onClose: () => void;
}

const PAYMENT_LABELS: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TARJETA_CREDITO: "Tarjeta de Crédito",
  TARJETA_DEBITO: "Tarjeta de Débito",
  TRANSFERENCIA: "Transferencia",
  DE_UNA: "De Una",
  AHORITA: "Ahorita"
};

const money = (value: unknown) => (typeof value === "number" ? value : 0).toFixed(2);

const formatoFecha = (valor?: string | null) => {
  if (!valor) return null;
  const fecha = new Date(valor);
  return isNaN(fecha.getTime()) ? null : fecha.toLocaleString();
};

/** Botón de cierre estándar (esquina superior derecha) para todos los modales de caja. */
function BotonCerrar() {
  return (
    <Dialog.Close
      aria-label="Cerrar"
      className="p-1.5 -mr-1.5 -mt-1.5 rounded-full text-outline hover:bg-surface-container hover:text-on-surface transition-colors shrink-0"
    >
      <X className="w-5 h-5" />
    </Dialog.Close>
  );
}

/** Fila etiqueta/valor del arqueo. */
function Fila({ label, value, sub, destacado }: { label: string; value: string; sub?: string; destacado?: boolean }) {
  return (
    <div className={`flex justify-between items-baseline gap-3 ${destacado ? "text-on-surface" : "text-on-surface-variant"}`}>
      <span className={`min-w-0 ${destacado ? "font-bold" : ""}`}>
        {label}
        {sub && <span className="block text-[11px] text-outline font-normal">{sub}</span>}
      </span>
      <span className={`tabular-nums shrink-0 ${destacado ? "font-black text-base text-primary" : "font-bold"}`}>{value}</span>
    </div>
  );
}

/** Detalle del arqueo del turno: con cuánto se abrió y cuánto se ha cobrado. */
function ArqueoTurno({ turno, resumen }: { turno: Turno | null; resumen: ResumenCaja }) {
  const desglose = resumen.desglose ?? {};
  const apertura = formatoFecha(turno?.fechaApertura);

  return (
    <div className="bg-surface-container-low rounded-xl p-3 space-y-2 text-sm">
      <Fila
        label="Monto de apertura"
        sub={apertura ? `Turno abierto el ${apertura}` : undefined}
        value={`$${money(resumen.montoApertura)}`}
      />
      <Fila
        label="Cobrado en el turno"
        sub={`${resumen.totalTransacciones} ${resumen.totalTransacciones === 1 ? "venta" : "ventas"}`}
        value={`$${money(resumen.montoVentasTotal)}`}
      />

      <div className="border-t border-outline-variant pt-2">
        <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
          Desglose por método de pago
        </span>
        {Object.keys(desglose).length === 0 ? (
          <p className="text-xs text-on-surface-variant italic">Sin cobros registrados en este turno</p>
        ) : (
          Object.entries(desglose).map(([metodo, monto]) => (
            <div key={metodo} className="flex justify-between text-xs text-on-surface-variant">
              <span>{PAYMENT_LABELS[metodo] || metodo}</span>
              <span className="tabular-nums font-semibold">${money(monto)}</span>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-outline-variant pt-2">
        <Fila label="Monto esperado de cierre" value={`$${money(resumen.montoCierreEsperado)}`} destacado />
      </div>
    </div>
  );
}

export default function RegisterModal({ type, onClose }: RegisterModalProps) {
  const { abrirCaja, cerrarCaja, loading, resumenCaja, loadingResumen, fetchResumenCaja, turno } = usePosStore();
  const [monto, setMonto] = useState("");
  const [cierreResult, setCierreResult] = useState<{ turno: Turno; resumen: ResumenCaja } | null>(null);

  const [confirmState, setConfirmState] = useState<{ open: boolean; title: string; message: string; action: () => void } | null>(null);

  // El cierre necesita el arqueo actualizado: se recarga al abrir el modal para
  // que el monto esperado incluya cobros hechos justo antes de cerrar.
  useEffect(() => {
    if (type === "CLOSE") fetchResumenCaja();
  }, [type, fetchResumenCaja]);

  const montoIngresado = parseFloat(monto);
  const montoValido = !isNaN(montoIngresado) && montoIngresado >= 0;
  const esperado = resumenCaja?.montoCierreEsperado ?? null;
  const diferencia = montoValido && esperado !== null ? Math.round((montoIngresado - esperado) * 100) / 100 : null;
  const cuadra = diferencia !== null && diferencia === 0;
  // El cierre solo se habilita cuando el arqueo declarado cuadra exactamente
  // con lo que el sistema espera (el backend aplica la misma regla).
  const puedeCerrar = type === "CLOSE" && !!resumenCaja && cuadra;

  const handleSubmit = async () => {
    if (!montoValido) return;

    if (type === "CLOSE") {
      if (!puedeCerrar) return;
      setConfirmState({
        open: true,
        title: "Cierre de Caja",
        message: `Se cerrará el turno con $${money(montoIngresado)} en caja, que coincide con el monto esperado. ¿Confirmas el cierre?`,
        action: async () => {
          const result = await cerrarCaja(montoIngresado);
          if (result) {
            setCierreResult(result);
          }
          // Si falla, el modal permanece abierto con el arqueo recargado para
          // que el cajero corrija el monto en lugar de perder el formulario.
        }
      });
    } else {
      setConfirmState({
        open: true,
        title: "Apertura de Caja",
        message: `Se abrirá el turno con un monto base de $${money(montoIngresado)}. ¿Confirmas la apertura?`,
        action: async () => {
          const success = await abrirCaja(montoIngresado);
          if (success) onClose();
        }
      });
    }
  };

  // Resumen final tras cerrar la caja.
  if (cierreResult) {
    const { turno: turnoCerrado, resumen } = cierreResult;
    return (
      <Dialog.Root open={true} onOpenChange={onClose}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-xl z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-sm bg-surface rounded-2xl shadow-[0_12px_48px_rgba(31,27,20,0.28)] ring-1 ring-black/[0.04] z-50 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                  <Receipt className="w-6 h-6" />
                </div>
                <Dialog.Title className="text-xl font-display font-bold text-on-surface">
                  Cierre de Caja
                </Dialog.Title>
              </div>
              <BotonCerrar />
            </div>
            <Dialog.Description className="sr-only">Resumen del cierre de caja del turno recién cerrado.</Dialog.Description>

            <div className="p-3 rounded-xl mb-4 text-center bg-success/10 text-success">
              <span className="font-bold text-lg">✓ Caja cerrada y cuadrada</span>
            </div>

            <div className="space-y-2 text-sm mb-4">
              <p className="font-semibold text-on-surface">Resumen del Turno</p>
              <ArqueoTurno turno={turnoCerrado} resumen={resumen} />
              <div className="bg-surface-container-low rounded-xl p-3 space-y-1.5 text-sm">
                <Fila label="Monto declarado al cierre" value={`$${money(turnoCerrado?.montoCierreFisico)}`} />
                <Fila label="Diferencia" value={`$${money(turnoCerrado?.diferencia)}`} />
                {formatoFecha(turnoCerrado?.fechaCierre) && (
                  <p className="text-[11px] text-outline pt-1">Cerrado el {formatoFecha(turnoCerrado?.fechaCierre)}</p>
                )}
              </div>
            </div>

            <button onClick={onClose}
              className="w-full py-3 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary-container hover:text-on-surface transition-colors">
              Finalizar
            </button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <Dialog.Root open={true} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-xl z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-sm bg-surface rounded-2xl shadow-[0_12px_48px_rgba(31,27,20,0.28)] ring-1 ring-black/[0.04] z-50 p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${type === 'OPEN' ? 'bg-secondary/10 text-secondary' : 'bg-error/10 text-error'}`}>
                <Store className="w-6 h-6" />
              </div>
              <Dialog.Title className="text-xl font-display font-bold text-on-surface">
                {type === "OPEN" ? "Apertura de Caja" : "Cierre de Caja"}
              </Dialog.Title>
            </div>
            <BotonCerrar />
          </div>

          <Dialog.Description className="text-sm text-on-surface-variant mb-4">
            {type === "OPEN"
              ? "Registra el monto base con el que inicias tu turno. Servirá de referencia para el cuadre al cerrar la caja."
              : "Revisa el arqueo del turno y declara el monto total registrado en caja, sumando todos los métodos de cobro (efectivo, tarjetas, transferencias y billeteras)."
            }
          </Dialog.Description>

          {/* Arqueo: con cuánto se abrió y con cuánto debe cerrarse */}
          {type === "CLOSE" && (
            <div className="mb-4">
              {loadingResumen && !resumenCaja ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-on-surface-variant bg-surface-container-low rounded-xl">
                  <Loader2 className="w-4 h-4 animate-spin" /> Calculando el arqueo del turno...
                </div>
              ) : resumenCaja ? (
                <ArqueoTurno turno={turno} resumen={resumenCaja} />
              ) : (
                <p className="text-sm text-error bg-error/10 rounded-xl p-3">
                  No se pudo calcular el arqueo del turno. Recarga la página antes de cerrar la caja.
                </p>
              )}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="monto-caja" className="text-sm font-semibold text-on-surface-variant mb-2 block">
              {type === "OPEN" ? "Monto inicial del turno" : "Monto total registrado en caja"}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-medium">$</span>
              <input
                id="monto-caja"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className={`w-full pl-8 pr-4 py-3 bg-surface-container-lowest text-lg font-medium rounded-xl border outline-none focus:ring-1 ${
                  type === "CLOSE" && montoValido && !cuadra
                    ? "border-error focus:border-error focus:ring-error"
                    : "border-outline-variant focus:border-primary focus:ring-primary"
                }`}
              />
            </div>

            {/* Verificación del cuadre en vivo: sin coincidencia no se puede cerrar */}
            {type === "CLOSE" && resumenCaja && montoValido && (
              cuadra ? (
                <p className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-success">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  El monto coincide con el esperado. Ya puedes cerrar la caja.
                </p>
              ) : (
                <p className="flex items-start gap-1.5 mt-2 text-xs font-semibold text-error">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    {diferencia! > 0 ? "Sobran" : "Faltan"} ${money(Math.abs(diferencia!))} respecto a los
                    ${money(esperado)} esperados. Corrige el monto para poder cerrar la caja.
                  </span>
                </p>
              )
            )}
          </div>

          <div className="flex gap-3">
            <Dialog.Close className="flex-1 py-3 font-medium text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors">
              Cancelar
            </Dialog.Close>
            <button
              onClick={handleSubmit}
              disabled={loading || !montoValido || (type === "CLOSE" && !puedeCerrar)}
              title={type === "CLOSE" && montoValido && !cuadra ? "El monto declarado debe coincidir con el monto esperado" : undefined}
              className={`flex-[2] py-3 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center ${
                type === 'OPEN'
                ? 'bg-secondary hover:bg-secondary-container text-on-secondary hover:text-on-surface'
                : 'bg-error hover:bg-error-container text-on-error hover:text-error'
              }`}
            >
              {loading ? "Procesando..." : type === "OPEN" ? "Abrir Caja" : "Cerrar Caja"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>

      {confirmState && (
        <Confirm
          open={confirmState.open}
          onOpenChange={(open) => !open && setConfirmState(null)}
          title={confirmState.title}
          description={confirmState.message}
          confirmText="CONFIRMAR"
          variant="warning"
          onConfirm={() => {
            setConfirmState(null);
            confirmState.action();
          }}
        />
      )}
    </Dialog.Root>
  );
}
