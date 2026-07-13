"use client";

import { useState } from "react";
import { usePosStore, Pedido } from "@/store/posStore";
import { posService } from "@/lib/pos-service";
import { toast } from "@/lib/notifications";
import { X, Pencil, Ban, ArrowLeft, ShoppingBag, CreditCard } from "lucide-react";
import Confirm from "@/components/Confirm";

interface OrdersPanelProps {
  onClose: () => void;
}

export default function OrdersPanel({ onClose }: OrdersPanelProps) {
  const { pedidosActivos, fetchPedidosActivos, fetchProductos, loadPedidoForCheckout } = usePosStore();
  const [editingPedido, setEditingPedido] = useState<Pedido | null>(null);
  const [confirmAnnul, setConfirmAnnul] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Edit state
  const [editNombre, setEditNombre] = useState("");
  const [editApellido, setEditApellido] = useState("");
  const [editCedula, setEditCedula] = useState("");
  const [editItems, setEditItems] = useState<Array<{ productoId: string; nombre: string; cantidad: number; precioUnitario: number }>>([]);

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
        <div className="p-4 border-b border-outline-variant flex items-center gap-3">
          <button onClick={() => setEditingPedido(null)} className="text-outline hover:text-on-surface transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-display font-bold text-lg text-on-surface">Editar Pedido</h2>
        </div>

        <div className="p-4 border-b border-outline-variant space-y-2">
          <input type="text" placeholder="Nombre" value={editNombre} onChange={(e) => setEditNombre(e.target.value)}
            className="w-full text-sm p-2 rounded border border-outline-variant focus:border-primary outline-none" />
          <input type="text" placeholder="Apellidos" value={editApellido} onChange={(e) => setEditApellido(e.target.value)}
            className="w-full text-sm p-2 rounded border border-outline-variant focus:border-primary outline-none" />
          <input type="text" placeholder="Cédula" value={editCedula} onChange={(e) => setEditCedula(e.target.value)}
            className="w-full text-sm p-2 rounded border border-outline-variant focus:border-primary outline-none" />
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {editItems.map((item, index) => (
            <div key={index} className="bg-surface p-3 rounded-xl border border-outline-variant">
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold text-sm">{item.nombre}</span>
                <button onClick={() => removeEditItem(index)} className="text-error hover:text-error/80">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => updateEditItemQty(index, item.cantidad - 1)}
                  className="w-7 h-7 flex items-center justify-center rounded bg-surface-container hover:bg-outline-variant transition-colors">-</button>
                <span className="font-bold">{item.cantidad}</span>
                <button onClick={() => updateEditItemQty(index, item.cantidad + 1)}
                  className="w-7 h-7 flex items-center justify-center rounded bg-surface-container hover:bg-outline-variant transition-colors">+</button>
                <span className="text-sm text-on-surface-variant ml-auto">${(item.cantidad * item.precioUnitario).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-surface border-t border-outline-variant">
          <div className="space-y-1 text-sm mb-4">
            <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>IVA (15%)</span><span>${iva.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-lg"><span>Total</span><span>${total.toFixed(2)}</span></div>
          </div>
          {editItems.length === 0 ? (
            <button onClick={async () => { if (editingPedido) { await annulPedido(editingPedido.id); setEditingPedido(null); } }}
              disabled={loading}
              className="w-full py-3 bg-error text-on-error rounded-xl font-bold hover:bg-error-container transition-colors disabled:opacity-50">
              {loading ? "Anulando..." : "Anular Pedido (sin productos)"}
            </button>
          ) : (
            <button onClick={saveEdits} disabled={loading}
              className="w-full py-3 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary-container hover:text-on-surface transition-colors disabled:opacity-50">
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
        <button onClick={onClose} className="text-outline hover:text-error transition-colors">
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
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg bg-error/10 text-error hover:bg-error/20 transition-colors">
                  <Ban className="w-3.5 h-3.5" /> Anular
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {confirmAnnul && (
        <Confirm
          open={true}
          onOpenChange={(open) => { if (!open) setConfirmAnnul(null); }}
          title="Anular Pedido"
          description="¿Está seguro de que desea anular este pedido? El inventario no se verá afectado."
          confirmText="ANULAR"
          variant="danger"
          onConfirm={() => annulPedido(confirmAnnul)}
        />
      )}
    </div>
  );
}
