"use client";

import { useState } from "react";
import { usePosStore, Pedido } from "@/store/posStore";
import { posService } from "@/lib/pos-service";
import { billingApi } from "@/lib/billing-service";
import { toast } from "@/lib/notifications";
import { X, Pencil, Ban, ArrowLeft, ShoppingBag, CreditCard, FileText, Loader2, Minus, Plus, User, Save } from "lucide-react";
import Confirm from "@/components/Confirm";

interface OrdersPanelProps {
  onClose: () => void;
}

export default function OrdersPanel({ onClose }: OrdersPanelProps) {
  const { pedidosActivos, fetchPedidosActivos, fetchProductos, loadPedidoForCheckout } = usePosStore();
  const [editingPedido, setEditingPedido] = useState<Pedido | null>(null);
  const [confirmAnnul, setConfirmAnnul] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emitiendoFacturaId, setEmitiendoFacturaId] = useState<string | null>(null);

  // Edit state
  const [editNombre, setEditNombre] = useState("");
  const [editApellido, setEditApellido] = useState("");
  const [editCedula, setEditCedula] = useState("");
  const [editItems, setEditItems] = useState<Array<{ productoId: string; nombre: string; cantidad: number; precioUnitario: number }>>([]);
  // Buffer local de edición de cantidad (por producto): permite escribir un
  // número de golpe (p. ej. "100") en vez de pulsar "+" cien veces.
  const [cantidadEditando, setCantidadEditando] = useState<Record<string, string>>({});

  const confirmarCantidadEditada = (index: number, productoId: string) => {
    const texto = cantidadEditando[productoId];
    if (texto !== undefined) {
      const parsed = parseInt(texto, 10);
      if (texto.trim() !== "" && !isNaN(parsed) && parsed > 0) {
        updateEditItemQty(index, parsed);
      }
      setCantidadEditando((prev) => {
        const next = { ...prev };
        delete next[productoId];
        return next;
      });
    }
  };

  const startEditing = (pedido: Pedido) => {
    setEditingPedido(pedido);
    setEditNombre(pedido.cliente_nombre || "");
    setEditApellido(pedido.cliente_apellido || "");
    setEditCedula(pedido.cliente_cedula || "");
    setEditItems(pedido.items.map(i => ({
      productoId: i.productoId,
      nombre: i.nombre,
      cantidad: i.cantidad,
      precioUnitario: i.precioUnitario
    })));
  };

  const updateEditItemQty = (index: number, cantidad: number) => {
    if (cantidad <= 0) {
      setEditItems(editItems.filter((_, i) => i !== index));
      return;
    }
    const nuevos = [...editItems];
    nuevos[index] = { ...nuevos[index], cantidad };
    setEditItems(nuevos);
  };

  const removeEditItem = (index: number) => {
    setEditItems(editItems.filter((_, i) => i !== index));
  };

  const saveEdits = async () => {
    if (!editingPedido) return;
    if (editItems.length === 0) {
      toast.error("El pedido debe tener al menos un producto");
      return;
    }
    setLoading(true);
    try {
      await posService.actualizarPedido(editingPedido.id, {
        cliente_nombre: editNombre,
        cliente_apellido: editApellido,
        cliente_cedula: editCedula,
        items: editItems.map(i => ({
          productoId: i.productoId,
          nombre: i.nombre,
          cantidad: i.cantidad,
          precioUnitario: i.precioUnitario
        }))
      });
      toast.success("Pedido actualizado exitosamente");
      setEditingPedido(null);
      await fetchPedidosActivos();
      await fetchProductos();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Error al actualizar pedido");
    }
    setLoading(false);
  };

  /**
   * Emite formalmente la factura de un pedido aún sin pagar: queda PENDIENTE
   * ("la factura ha sido emitida pero el pago aún no se ha registrado"), a
   * diferencia del BORRADOR automático que ya existe al guardar el pedido.
   */
  const emitirFacturaFormal = async (pedidoId: string) => {
    setEmitiendoFacturaId(pedidoId);
    try {
      const comprobante = await billingApi.emitirComprobante(pedidoId, { formal: true });
      toast.success(`Factura ${comprobante.numero_comprobante} emitida (pendiente de pago)`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "No se pudo emitir la factura");
    } finally {
      setEmitiendoFacturaId(null);
    }
  };

  const annulPedido = async (id: string) => {
    setLoading(true);
    try {
      await posService.anularPedido(id);
      toast.success("Pedido anulado exitosamente");
      setConfirmAnnul(null);
      await fetchPedidosActivos();
      await fetchProductos();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Error al anular pedido");
    }
    setLoading(false);
  };

  if (editingPedido) {
    const subtotal = editItems.reduce((acc, i) => acc + i.cantidad * i.precioUnitario, 0);
    const iva = Math.round(subtotal * 0.15 * 100) / 100;
    const total = Math.round((subtotal + iva) * 100) / 100;

    return (
      <div className="flex flex-col h-full bg-surface-container-lowest">
        {/* Encabezado */}
        <div className="p-4 border-b border-outline-variant/50 flex items-center gap-3 shrink-0">
          <button
            onClick={() => setEditingPedido(null)}
            className="w-8 h-8 flex items-center justify-center rounded-full text-outline hover:text-primary hover:bg-surface-container transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h2 className="font-display font-bold text-lg text-on-surface leading-tight">Editar Pedido</h2>
            <p className="text-[11px] text-on-surface-variant font-medium truncate">Pedido #{editingPedido.id.substring(0, 8)}</p>
          </div>
        </div>

        {/* Datos del cliente */}
        <div className="px-4 pt-3 pb-4 border-b border-outline-variant/50 space-y-2 shrink-0">
          <p className="flex items-center gap-1.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
            <User className="w-3.5 h-3.5" /> Datos del cliente
          </p>
          <input
            type="text"
            placeholder="Nombres"
            autoComplete="off"
            value={editNombre}
            onChange={(e) => setEditNombre(e.target.value)}
            className="w-full text-sm px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/50 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Apellidos"
              autoComplete="off"
              value={editApellido}
              onChange={(e) => setEditApellido(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/50 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
            />
            <input
              type="text"
              inputMode="numeric"
              placeholder="Cédula / RUC"
              autoComplete="off"
              maxLength={13}
              value={editCedula}
              onChange={(e) => setEditCedula(e.target.value.replace(/\D/g, "").slice(0, 13))}
              className="w-full text-sm px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/50 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
            />
          </div>
        </div>

        {/* Ítems del pedido */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 space-y-2">
          {editItems.length === 0 && (
            <div className="text-center py-10 text-on-surface-variant font-medium text-sm">
              Sin productos: anula el pedido o vuelve al menú para agregar alguno.
            </div>
          )}
          {editItems.map((item, index) => (
            <div
              key={index}
              className="group flex items-center gap-2 bg-surface border border-outline-variant/40 rounded-2xl pl-3 pr-2 py-2 hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-on-surface truncate leading-tight">{item.nombre}</p>
                <p className="text-[11px] text-on-surface-variant font-medium leading-tight">
                  ${item.precioUnitario.toFixed(2)} c/u
                </p>
              </div>

              <div className="flex items-center gap-1 bg-surface-container rounded-full p-0.5 shrink-0">
                <button
                  onClick={() => updateEditItemQty(index, item.cantidad - 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-surface text-on-surface hover:bg-primary hover:text-on-primary transition-colors active:scale-90"
                  aria-label="Disminuir"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={cantidadEditando[item.productoId] ?? item.cantidad}
                  onChange={(e) => setCantidadEditando((prev) => ({ ...prev, [item.productoId]: e.target.value }))}
                  onFocus={(e) => e.target.select()}
                  onBlur={() => confirmarCantidadEditada(index, item.productoId)}
                  onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                  title="Escribe la cantidad para agregar varias unidades de una vez"
                  aria-label={`Cantidad de ${item.nombre}`}
                  className="w-11 text-center text-sm font-bold text-primary tabular-nums bg-transparent outline-none rounded-lg focus:ring-1 focus:ring-primary/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  onClick={() => updateEditItemQty(index, item.cantidad + 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-surface text-on-surface hover:bg-primary hover:text-on-primary transition-colors active:scale-90"
                  aria-label="Aumentar"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <span className="w-16 text-right font-bold text-primary text-sm tabular-nums shrink-0">
                ${(item.cantidad * item.precioUnitario).toFixed(2)}
              </span>

              <button
                onClick={() => removeEditItem(index)}
                className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-outline hover:text-error hover:bg-error-container/50 transition-colors"
                title="Quitar producto"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Totales y acciones */}
        <div className="p-4 bg-surface border-t border-outline-variant/60 shadow-[0_-6px_16px_-8px_rgba(31,27,20,0.12)] shrink-0">
          <div className="space-y-1.5 mb-3.5 text-sm">
            <div className="flex justify-between text-on-surface-variant">
              <span>Subtotal</span>
              <span className="tabular-nums font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>IVA (15%)</span>
              <span className="tabular-nums font-medium">${iva.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-outline-variant/50">
              <span className="font-display font-bold text-base text-on-surface">Total</span>
              <span className="font-display font-black text-xl text-primary tabular-nums">${total.toFixed(2)}</span>
            </div>
          </div>

          {editItems.length === 0 ? (
            <button
              onClick={async () => { if (editingPedido) { await annulPedido(editingPedido.id); setEditingPedido(null); } }}
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-error hover:bg-error/90 text-on-error font-bold text-sm transition-all shadow-md shadow-error/20 hover:shadow-lg flex justify-center items-center gap-2 disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
              {loading ? "Anulando..." : "Anular pedido (sin productos)"}
            </button>
          ) : (
            <button
              onClick={saveEdits}
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-primary hover:bg-primary-container text-on-primary font-bold text-sm transition-all shadow-md shadow-primary/20 hover:shadow-lg flex justify-center items-center gap-2 disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {loading ? "Guardando..." : "Guardar Cambios"}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface-container-lowest">
      <div className="p-4 border-b border-outline-variant flex items-center justify-between">
        <h2 className="font-display font-bold text-lg text-on-surface flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" />
          Pedidos en Edición
        </h2>
        <button
          onClick={onClose}
          aria-label="Cerrar panel de pedidos"
          title="Cerrar"
          className="p-1.5 -mr-1.5 rounded-full text-outline hover:bg-surface-container hover:text-on-surface transition-colors shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {pedidosActivos.length === 0 ? (
          <div className="text-center py-12 text-on-surface-variant font-medium">
            No hay pedidos activos
          </div>
        ) : (
          pedidosActivos.map((pedido) => (
            <div key={pedido.id} className="bg-surface p-4 rounded-xl border border-outline-variant shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-xs text-on-surface-variant">Pedido #{pedido.id.substring(0, 8)}</p>
                  <p className="text-sm font-semibold">
                    {[pedido.cliente_nombre, pedido.cliente_apellido].filter(Boolean).join(" ") || "Consumidor Final"}
                  </p>
                </div>
                <span className="font-bold text-primary">${pedido.total.toFixed(2)}</span>
              </div>
              <div className="text-xs text-on-surface-variant mb-3">
                {pedido.items.length} producto(s) · {new Date(pedido.fechaCreacion).toLocaleTimeString()}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { loadPedidoForCheckout(pedido); onClose(); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors">
                  <CreditCard className="w-3.5 h-3.5" /> Cobrar
                </button>
                <button onClick={() => startEditing(pedido)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg bg-surface-container hover:bg-outline-variant transition-colors">
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </button>
                <button onClick={() => setConfirmAnnul(pedido.id)}
                  title="Cancela el pedido de forma permanente en el sistema (no solo en esta pantalla)"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg bg-error/10 text-error hover:bg-error/20 transition-colors">
                  <Ban className="w-3.5 h-3.5" /> Anular pedido
                </button>
              </div>
              <button
                onClick={() => emitirFacturaFormal(pedido.id)}
                disabled={emitiendoFacturaId === pedido.id}
                title="Emite la factura formalmente aunque todavía no se cobre (queda PENDIENTE)"
                className="w-full mt-2 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold rounded-lg border border-tertiary/40 text-tertiary hover:bg-tertiary/10 transition-colors disabled:opacity-50"
              >
                {emitiendoFacturaId === pedido.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                {emitiendoFacturaId === pedido.id ? "Emitiendo..." : "Emitir factura (pendiente de pago)"}
              </button>
            </div>
          ))
        )}
      </div>

      {confirmAnnul && (
        <Confirm
          open={true}
          onOpenChange={(open) => { if (!open) setConfirmAnnul(null); }}
          title="Anular Pedido"
          description="Esta acción cancela el pedido de forma permanente en el sistema (no solo lo quita de esta lista) y no se puede deshacer. El inventario no se verá afectado."
          confirmText="ANULAR"
          variant="danger"
          onConfirm={() => annulPedido(confirmAnnul)}
        />
      )}
    </div>
  );
}
