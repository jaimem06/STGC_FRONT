"use client";

import { useState } from "react";
import { usePosStore } from "@/store/posStore";
import { Minus, Plus, ShoppingBag, Trash2, User } from "lucide-react";
import CheckoutModal from "./CheckoutModal";

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, clearCart, clienteNombre, clienteCedula, setCliente } = usePosStore();
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  const subtotal = cart.reduce((acc, item) => acc + item.precioUnitario * item.cantidad, 0);
  const iva = subtotal * 0.19; // From backend IVA_RATE
  const total = subtotal + iva;

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full opacity-60 p-6 text-center">
        <ShoppingBag className="w-16 h-16 mb-4 text-outline" />
        <h3 className="text-xl font-display font-bold text-on-surface mb-2">Carrito Vacío</h3>
        <p className="text-on-surface-variant font-medium">Selecciona productos del menú para agregarlos al carrito.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface-container-lowest">
      {/* Client Section */}
      <div className="p-4 border-b border-outline-variant bg-surface-container-low">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-primary flex items-center gap-2">
            <User className="w-4 h-4" /> Cliente
          </h3>
          <button 
            onClick={() => setIsEditingClient(!isEditingClient)}
            className="text-xs text-secondary font-medium hover:underline"
          >
            {isEditingClient ? "Cerrar" : "Editar"}
          </button>
        </div>
        
        {isEditingClient ? (
          <div className="space-y-2 mt-2">
            <input 
              type="text" 
              placeholder="Nombre / Razón Social" 
              className="w-full text-sm p-2 rounded border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              value={clienteNombre}
              onChange={(e) => setCliente(e.target.value, clienteCedula)}
            />
            <input 
              type="text" 
              placeholder="Cédula / RUC" 
              className="w-full text-sm p-2 rounded border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              value={clienteCedula}
              onChange={(e) => setCliente(clienteNombre, e.target.value)}
            />
          </div>
        ) : (
          <div className="bg-surface-container p-2 rounded-lg text-sm">
            <p className="font-medium text-on-surface line-clamp-1">{clienteNombre}</p>
            <p className="text-on-surface-variant text-xs">{clienteCedula}</p>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-outline-variant">
        <h2 className="font-display font-bold text-lg text-on-surface">Pedido Actual</h2>
        <button 
          onClick={clearCart}
          className="text-error hover:bg-error-container p-2 rounded-lg transition-colors"
          title="Vaciar Carrito"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {cart.map((item) => (
          <div key={item.productoId} className="flex flex-col gap-2 bg-surface p-3 rounded-xl border border-outline-variant shadow-sm">
            <div className="flex justify-between items-start">
              <h4 className="font-semibold text-on-surface text-sm line-clamp-2 pr-2">{item.nombre}</h4>
              <span className="font-bold text-primary">${(item.precioUnitario * item.cantidad).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-on-surface-variant font-medium">${item.precioUnitario.toFixed(2)} c/u</span>
              <div className="flex items-center gap-3 bg-surface-container rounded-lg p-1">
                <button 
                  onClick={() => updateQuantity(item.productoId, item.cantidad - 1)}
                  className="w-6 h-6 flex items-center justify-center rounded bg-surface hover:bg-outline-variant transition-colors text-on-surface"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-sm font-bold w-4 text-center">{item.cantidad}</span>
                <button 
                  onClick={() => updateQuantity(item.productoId, item.cantidad + 1)}
                  className="w-6 h-6 flex items-center justify-center rounded bg-surface hover:bg-outline-variant transition-colors text-on-surface"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Totals & Checkout */}
      <div className="p-4 bg-surface border-t border-outline-variant shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="space-y-2 mb-4 text-sm font-medium">
          <div className="flex justify-between text-on-surface-variant">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-on-surface-variant">
            <span>IVA (19%)</span>
            <span>${iva.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-display font-bold text-primary pt-2 border-t border-outline-variant">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
        
        <button
          onClick={() => setShowCheckout(true)}
          className="w-full py-3.5 rounded-xl bg-secondary hover:bg-secondary-container hover:text-on-surface text-on-secondary font-bold text-lg transition-all shadow-md hover:shadow-lg flex justify-center items-center gap-2"
        >
          <ShoppingBag className="w-5 h-5" />
          Procesar Pago
        </button>
      </div>

      {showCheckout && (
        <CheckoutModal 
          total={total}
          onClose={() => setShowCheckout(false)} 
        />
      )}
    </div>
  );
}
