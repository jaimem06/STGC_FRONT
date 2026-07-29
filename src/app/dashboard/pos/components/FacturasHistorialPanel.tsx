"use client";

import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { usePosStore } from "@/store/posStore";
import { billingApi, ComprobanteResumen, EstadoFactura, crearUrlFacturaPdf, rangoDeHoy } from "@/lib/billing-service";
import { toast } from "@/lib/notifications";
import { X, Receipt, Search, FileText, Loader2, Ban, RotateCcw, Info, CreditCard, CalendarDays } from "lucide-react";

interface FacturasHistorialPanelProps {
  onClose: () => void;
}

const PAGE_SIZE = 20;

const ESTILO_ESTADO: Record<EstadoFactura, string> = {
  BORRADOR: "bg-surface-container-high text-on-surface-variant",
  PENDIENTE: "bg-tertiary text-on-tertiary",
  PAGADA: "bg-success text-on-success",
  ANULADA: "bg-error text-on-error",
  REEMBOLSADA: "bg-primary text-on-primary",
};

const TEXTO_ESTADO: Record<EstadoFactura, string> = {
  BORRADOR: "Borrador",
  PENDIENTE: "Pendiente de pago",
  PAGADA: "Pagada",
  ANULADA: "Anulada",
  REEMBOLSADA: "Reembolsada",
};

// Reglas del ciclo de vida (deben reflejar InvoiceStatus::puede_transicionar_a
// del billing-service): solo se ofrecen las acciones que el backend aceptará.
const PUEDE_ANULAR: EstadoFactura[] = ["BORRADOR", "PENDIENTE", "PAGADA"];
const PUEDE_REEMBOLSAR: EstadoFactura[] = ["PAGADA"];
// El PDF (comprobante real) solo existe una vez que hubo un pago de por medio.
const TIENE_PDF: EstadoFactura[] = ["PAGADA", "ANULADA", "REEMBOLSADA"];
// BORRADOR/PENDIENTE significan que el pedido detrás todavía no se cobró:
// la acción útil ahí no es "ver factura" (no existe PDF todavía) sino cobrar.
const PUEDE_COBRAR: EstadoFactura[] = ["BORRADOR", "PENDIENTE"];

type AccionPendiente = { tipo: "ANULAR" | "REEMBOLSAR"; comprobante: ComprobanteResumen };

/** Pide el motivo obligatorio (auditoría) antes de anular o reembolsar una factura. */
function MotivoDialog({ accion, onCancel, onConfirm, loading }: {
  accion: AccionPendiente;
  onCancel: () => void;
  onConfirm: (motivo: string) => void;
  loading: boolean;
}) {
  const [motivo, setMotivo] = useState("");
  const esAnular = accion.tipo === "ANULAR";

  return (
    <Dialog.Root open={true} onOpenChange={(open) => !open && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-md z-[110]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-sm bg-surface rounded-3xl shadow-[0_12px_48px_rgba(31,27,20,0.28)] ring-1 ring-black/[0.04] z-[110] p-6 animate-slide-up">
          <div className="flex items-start justify-between gap-3 mb-1">
            <Dialog.Title className="text-lg font-display font-bold text-primary">
              {esAnular ? "Anular factura" : "Marcar como reembolsada"}
            </Dialog.Title>
            <Dialog.Close
              aria-label="Cerrar"
              disabled={loading}
              className="p-1.5 -mr-1.5 -mt-1 rounded-full text-outline hover:bg-surface-container hover:text-on-surface transition-colors shrink-0 disabled:opacity-40"
            >
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="text-sm text-on-surface-variant mb-4">
            {esAnular
              ? `Factura ${accion.comprobante.numero_comprobante}: se invalida el monto, pero queda el registro para auditoría.`
              : `Factura ${accion.comprobante.numero_comprobante}: confirma que el dinero ya fue devuelto al cliente.`}
          </Dialog.Description>
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Motivo (obligatorio)</label>
          <textarea
            autoFocus
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={3}
            placeholder={esAnular ? "Ej. error de digitación, solicitud del cliente..." : "Ej. producto devuelto, cobro duplicado..."}
            className="w-full mt-1.5 text-sm px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/50 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none"
          />
          <div className="flex gap-3 mt-4">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={() => onConfirm(motivo)}
              disabled={loading || !motivo.trim()}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm text-white shadow-md transition-all disabled:opacity-40 flex items-center justify-center gap-2 ${
                esAnular ? "bg-error" : "bg-primary"
              }`}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {esAnular ? "Anular" : "Reembolsar"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/**
 * Facturación del día del cajero autenticado (no de todos los cajeros ni de
 * jornadas anteriores): cubre el ciclo de vida completo de la factura -- ver
 * el PDF de lo ya cobrado, y anular/reembolsar según el estado -- sin depender
 * de haberla dejado abierta en el momento del cobro.
 *
 * El corte por día se calcula en la zona horaria del navegador y se aplica en
 * el backend, de modo que el conteo total y la paginación también quedan
 * acotados a la jornada en curso.
 */
export default function FacturasHistorialPanel({ onClose }: FacturasHistorialPanelProps) {
  const { mostrarFacturaPdf, fetchPedidosActivos, loadPedidoForCheckout } = usePosStore();
  const [comprobantes, setComprobantes] = useState<ComprobanteResumen[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [abriendoPedidoId, setAbriendoPedidoId] = useState<string | null>(null);
  const [cobrandoPedidoId, setCobrandoPedidoId] = useState<string | null>(null);
  const [accionPendiente, setAccionPendiente] = useState<AccionPendiente | null>(null);
  const [procesandoAccion, setProcesandoAccion] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cargar = async (query: string, offset: number, append: boolean) => {
    (append ? setLoadingMore : setLoading)(true);
    try {
      // El rango se recalcula en cada carga: si la jornada cambia con el panel
      // abierto (turnos que cruzan la medianoche), el listado sigue el día real.
      const { desde, hasta } = rangoDeHoy();
      const res = await billingApi.listarMisComprobantes({ q: query || undefined, desde, hasta, limit: PAGE_SIZE, offset });
      setComprobantes((prev) => (append ? [...prev, ...res.comprobantes] : res.comprobantes));
      setTotal(res.total);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "No se pudo cargar el historial de facturación");
    } finally {
      (append ? setLoadingMore : setLoading)(false);
    }
  };

  useEffect(() => {
    cargar("", 0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buscar = (valor: string) => {
    setQ(valor);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => cargar(valor, 0, false), 300);
  };

  const verFactura = async (comprobante: ComprobanteResumen) => {
    setAbriendoPedidoId(comprobante.pedido_id);
    try {
      const url = await crearUrlFacturaPdf(comprobante.pedido_id);
      mostrarFacturaPdf(url, comprobante.numero_comprobante);
      onClose();
    } catch {
      toast.error("No se pudo abrir la factura. Intenta de nuevo.");
    } finally {
      setAbriendoPedidoId(null);
    }
  };

  /**
   * Cobra el pedido detrás de una factura BORRADOR/PENDIENTE: lo carga en el
   * carrito (igual que "Cobrar" en Pedidos Activos) y cierra este panel para
   * dar paso al checkout. El pedido sigue EN_EDICION en el POS mientras la
   * factura no esté PAGADA, así que siempre debería aparecer en esa lista.
   */
  const cobrarPedido = async (comprobante: ComprobanteResumen) => {
    setCobrandoPedidoId(comprobante.pedido_id);
    try {
      await fetchPedidosActivos();
      const pedido = usePosStore.getState().pedidosActivos.find((p) => p.id === comprobante.pedido_id);
      if (!pedido) {
        toast.error("Este pedido ya no está disponible para cobrar (puede que ya se haya pagado o anulado).");
        return;
      }
      loadPedidoForCheckout(pedido);
      onClose();
    } catch {
      toast.error("No se pudo cargar el pedido para cobrarlo. Intenta de nuevo.");
    } finally {
      setCobrandoPedidoId(null);
    }
  };

  const confirmarAccion = async (motivo: string) => {
    if (!accionPendiente) return;
    setProcesandoAccion(true);
    try {
      const { tipo, comprobante } = accionPendiente;
      const actualizado = tipo === "ANULAR"
        ? await billingApi.anularComprobante(comprobante.pedido_id, motivo)
        : await billingApi.reembolsarComprobante(comprobante.pedido_id, motivo);
      setComprobantes((prev) => prev.map((c) => (
        c.pedido_id === comprobante.pedido_id
          ? { ...c, estado_factura: actualizado.estado_factura, motivo_estado: motivo }
          : c
      )));
      toast.success(tipo === "ANULAR" ? "Factura anulada" : "Factura marcada como reembolsada");
      setAccionPendiente(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "No se pudo actualizar el estado de la factura");
    } finally {
      setProcesandoAccion(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface-container-lowest">
      <div className="p-4 border-b border-outline-variant flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-display font-bold text-lg text-on-surface flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Mis Facturas de Hoy
          </h2>
          <p className="text-[11px] text-on-surface-variant flex items-center gap-1 mt-0.5">
            <CalendarDays className="w-3 h-3 shrink-0" />
            {new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Cerrar panel de facturas"
          className="p-1.5 -mr-1.5 -mt-1 rounded-full text-outline hover:bg-surface-container hover:text-on-surface transition-colors shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 pb-2 border-b border-outline-variant/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
          <input
            type="search"
            placeholder="Buscar entre las facturas de hoy..."
            value={q}
            onChange={(e) => buscar(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-on-surface-variant">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando historial...
          </div>
        ) : comprobantes.length === 0 ? (
          <div className="text-center py-12 text-on-surface-variant font-medium">
            {q ? "No se encontraron facturas de hoy con esa búsqueda" : "Todavía no has emitido facturas hoy"}
          </div>
        ) : (
          <>
            {comprobantes.map((c) => {
              const cliente = [c.cliente_nombre, c.cliente_apellido].filter(Boolean).join(" ") || "Consumidor Final";
              const fecha = c.fecha_pago ? new Date(c.fecha_pago) : null;
              const puedeAnular = PUEDE_ANULAR.includes(c.estado_factura);
              const puedeReembolsar = PUEDE_REEMBOLSAR.includes(c.estado_factura);
              const tienePdf = TIENE_PDF.includes(c.estado_factura);
              const puedeCobrar = PUEDE_COBRAR.includes(c.estado_factura);

              return (
                <div key={c.pedido_id} className="bg-surface p-4 rounded-xl border border-outline-variant shadow-sm">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <div className="min-w-0">
                      <p className="font-display font-bold text-sm text-primary tabular-nums truncate">{c.numero_comprobante}</p>
                      <p className="text-sm font-semibold text-on-surface truncate">{cliente}</p>
                    </div>
                    <span className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${ESTILO_ESTADO[c.estado_factura] || "bg-surface-container-high text-on-surface-variant"}`}>
                      {TEXTO_ESTADO[c.estado_factura] || c.estado_factura}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-on-surface-variant mb-3">
                    <span>{fecha ? fecha.toLocaleString() : "Sin fecha de pago (aún no cobrada)"}</span>
                    {c.total != null && <span className="font-bold text-on-surface">${c.total.toFixed(2)}</span>}
                  </div>

                  {c.motivo_estado && (
                    <p className="flex items-start gap-1.5 text-[11px] text-on-surface-variant bg-surface-container-lowest rounded-lg px-2.5 py-2 mb-3">
                      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      {c.motivo_estado}
                    </p>
                  )}

                  <div className="flex gap-2">
                    {puedeCobrar ? (
                      <button
                        onClick={() => cobrarPedido(c)}
                        disabled={cobrandoPedidoId === c.pedido_id}
                        title="Cobrar este pedido ahora"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors disabled:opacity-50"
                      >
                        {cobrandoPedidoId === c.pedido_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                        {cobrandoPedidoId === c.pedido_id ? "Cargando..." : "Cobrar pedido"}
                      </button>
                    ) : (
                      <button
                        onClick={() => verFactura(c)}
                        disabled={!tienePdf || abriendoPedidoId === c.pedido_id}
                        title={tienePdf ? undefined : "El PDF solo está disponible una vez que hubo un pago registrado"}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {abriendoPedidoId === c.pedido_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                        {abriendoPedidoId === c.pedido_id ? "Abriendo..." : "Ver factura"}
                      </button>
                    )}
                    {puedeAnular && (
                      <button
                        onClick={() => setAccionPendiente({ tipo: "ANULAR", comprobante: c })}
                        title="Anular factura"
                        className="w-9 flex items-center justify-center rounded-lg bg-error/10 text-error hover:bg-error/20 transition-colors"
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {puedeReembolsar && (
                      <button
                        onClick={() => setAccionPendiente({ tipo: "REEMBOLSAR", comprobante: c })}
                        title="Marcar como reembolsada"
                        className="w-9 flex items-center justify-center rounded-lg bg-tertiary/10 text-tertiary hover:bg-tertiary/20 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {comprobantes.length < total && (
              <button
                onClick={() => cargar(q, comprobantes.length, true)}
                disabled={loadingMore}
                className="w-full py-2.5 text-sm font-bold text-primary hover:bg-primary/5 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                {loadingMore ? "Cargando..." : `Cargar más (${total - comprobantes.length} restantes)`}
              </button>
            )}
          </>
        )}
      </div>

      {accionPendiente && (
        <MotivoDialog
          accion={accionPendiente}
          loading={procesandoAccion}
          onCancel={() => !procesandoAccion && setAccionPendiente(null)}
          onConfirm={confirmarAccion}
        />
      )}
    </div>
  );
}
