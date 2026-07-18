"use client";

import { useState } from "react";
import { usePosStore } from "@/store/posStore";
import { Minus, Plus, ShoppingBag, Trash2, User, X, Check, ShoppingCart, FileText } from "lucide-react";
import CheckoutModal from "./CheckoutModal";
import ClienteFactura from "./ClienteFactura";

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

const IVA_RATE = 0.15;

export default function Cart() {
  const {
    cart, removeFromCart, updateQuantity, clearCart, pedidoEnCobro, cancelPedidoEnCobro,
    clienteNombre, clienteApellido, clienteCedula, facturaConDatos, guardarPedido, loading,
  } = usePosStore();
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  const subtotal = roundCurrency(cart.reduce((acc, item) => acc + item.precioUnitario * item.cantidad, 0));
  const iva = roundCurrency(subtotal * IVA_RATE);
  const total = roundCurrency(subtotal + iva);
  const itemCount = cart.reduce((acc, item) => acc + item.cantidad, 0);
  const clienteLabel = [clienteNombre, clienteApellido].filter(Boolean).join(" ").trim() || "Consumidor Final";

  // El CheckoutModal vive FUERA del condicional de carrito vacío y en una
  // posición estable del árbol: al cobrar, el store vacía el carrito y, si el
  // modal dependiera de la rama "con items", React lo desmontaría justo antes
  // de mostrar la pantalla de éxito con la factura.
  return (
    <>
      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full opacity-70 p-6 text-center bg-surface-container-lowest">
          <div className="w-20 h-20 rounded-3xl bg-surface-container flex items-center justify-center mb-4">
            <ShoppingCart className="w-9 h-9 text-outline" />
          </div>
          <h3 className="text-lg font-display font-bold text-on-surface mb-1">Carrito Vacío</h3>
          <p className="text-sm text-on-surface-variant font-medium max-w-[220px]">Selecciona productos del menú para agregarlos al pedido.</p>
        </div>
      ) : (
        <div className="flex flex-col h-full bg-surface-container-lowest">
          {/* Cliente (compacto) */}
          <div className="px-4 pt-4 pb-3 border-b border-outline-variant/50">
            {!isEditingClient ? (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    {facturaConDatos ? <FileText className="w-4 h-4 text-primary" /> : <User className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-on-surface truncate leading-tight">{clienteLabel}</p>
                    <p className="text-[11px] text-on-surface-variant leading-tight">
                      {facturaConDatos ? clienteCedula || "Cédula pendiente" : "Factura sin datos"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditingClient(true)}
                  className="text-xs font-bold text-secondary hover:text-primary transition-colors shrink-0"
                >
                  Editar
                </button>
              </div>
            ) : (
              <div className="space-y-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Facturar a
                  </span>
                  <button
                    onClick={() => setIsEditingClient(false)}
                    className="flex items-center gap-1 text-xs font-bold text-secondary hover:text-primary transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" /> Listo
                  </button>
                </div>
                <ClienteFactura />
              </div>
            )}
          </div>

          {/* Encabezado del pedido */}
          <div className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-base text-on-surface">Pedido Actual</h2>
              <span className="text-[11px] font-black text-on-secondary bg-secondary rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                {itemCount}
              </span>
            </div>
            <button
              onClick={pedidoEnCobro ? cancelPedidoEnCobro : clearCart}
              className="text-outline hover:text-error hover:bg-error-container/40 p-1.5 rounded-lg transition-colors"
              title={pedidoEnCobro ? "Cancelar pedido" : "Vaciar carrito"}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Items (filas compactas, más espacio de scroll) */}
          <div className="flex-1 overflow-y-auto px-4 pb-3 space-y-2 custom-scrollbar">
            {cart.map((item) => (
              <div
                key={item.productoId}
                className="group flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/40 rounded-2xl pl-3 pr-2 py-2 hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-on-surface truncate leading-tight">{item.nombre}</p>
                  <p className="text-[11px] text-on-surface-variant font-medium leading-tight">
                    ${item.precioUnitario.toFixed(2)} c/u
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-surface-container rounded-full p-0.5 shrink-0">
                  <button
                    onClick={() => updateQuantity(item.productoId, item.cantidad - 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-surface text-on-surface hover:bg-primary hover:text-on-primary transition-colors active:scale-90"
                    aria-label="Disminuir"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-primary tabular-nums">{item.cantidad}</span>
                  <button
                    onClick={() => updateQuantity(item.productoId, item.cantidad + 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-surface text-on-surface hover:bg-primary hover:text-on-primary transition-colors active:scale-90"
                    aria-label="Aumentar"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <span className="w-16 text-right font-bold text-primary text-sm tabular-nums shrink-0">
                  ${roundCurrency(item.precioUnitario * item.cantidad).toFixed(2)}
                </span>

                <button
                  onClick={() => removeFromCart(item.productoId)}
                  className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-outline hover:text-error hover:bg-error-container/50 transition-colors"
                  title="Quitar producto"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Totales y acciones */}
          <div className="p-4 bg-surface border-t border-outline-variant/60 shadow-[0_-6px_16px_-8px_rgba(31,27,20,0.12)]">
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

            <div className="flex gap-2">
              <button
                onClick={() => guardarPedido()}
                disabled={loading}
                className="flex-1 py-3.5 rounded-2xl border-2 border-outline-variant/70 hover:bg-surface-container text-on-surface font-bold text-sm transition-all flex justify-center items-center gap-2 disabled:opacity-50 active:scale-[0.98]"
              >
                <ShoppingBag className="w-4 h-4 shrink-0" />
                <span className="truncate">Guardar</span>
              </button>
              <button
                onClick={() => setShowCheckout(true)}
                disabled={loading}
                className="flex-[1.5] py-3.5 rounded-2xl bg-secondary hover:bg-secondary/90 text-on-secondary font-bold text-base transition-all shadow-md shadow-secondary/20 hover:shadow-lg hover:shadow-secondary/25 flex justify-center items-center gap-2 disabled:opacity-50 active:scale-[0.98]"
              >
                <ShoppingCart className="w-5 h-5 shrink-0" />
                Cobrar ${total.toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCheckout && (
        <CheckoutModal
          total={total}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </>
  );
}
