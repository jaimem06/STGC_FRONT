"use client";

import { useEffect, useState } from "react";
import { usePosStore } from "@/store/posStore";
import ProductList from "./components/ProductList";
import Cart from "./components/Cart";
import RegisterModal from "./components/RegisterModal";
import OrdersPanel from "./components/OrdersPanel";
import { Coffee, Store, ClipboardList, ShoppingCart, X } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

type ModalType = "OPEN" | "CLOSE" | null;
type MobilePanel = "cart" | "orders" | null;

const IVA_RATE = 0.15;

export default function PosPage() {
  const { fetchProductos, fetchPedidosActivos, loading, isRegisterOpen, cart } = usePosStore();
  const [modalType, setModalType] = useState<ModalType>(null);
  const [showOrdersPanel, setShowOrdersPanel] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null);

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  useEffect(() => {
    if (isRegisterOpen) {
      fetchPedidosActivos();
    }
  }, [isRegisterOpen, fetchPedidosActivos]);

  const cartCount = cart.reduce((acc, item) => acc + item.cantidad, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + item.precioUnitario * item.cantidad, 0);
  const cartTotal = Math.round(cartSubtotal * (1 + IVA_RATE) * 100) / 100;

  if (loading && !isRegisterOpen) {
    return <LoadingSpinner size={48} message="Cargando POS..." fullPage />;
  }

  return (
    <>
      {!isRegisterOpen ? (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-primary/5 flex items-center justify-center mb-6">
            <Store className="w-12 h-12 sm:w-14 sm:h-14 text-primary opacity-70" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-primary mb-3">Caja Cerrada</h1>
          <p className="text-on-surface-variant mb-8 max-w-md text-sm sm:text-base">
            Para comenzar a registrar ventas, debes realizar la apertura de caja indicando el monto inicial en efectivo.
          </p>
          <button
            onClick={() => setModalType("OPEN")}
            className="bg-primary hover:bg-primary-container text-on-primary px-6 sm:px-8 py-3 rounded-xl font-medium transition-colors shadow-sm hover:shadow-md flex items-center gap-2 active:scale-[0.98]"
          >
            <Coffee className="w-5 h-5" />
            Abrir Turno de Caja
          </button>
        </div>
      ) : (
        <div className="flex flex-col lg:h-[calc(100vh-6rem)]">
          {/* Header */}
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
            <h1 className="text-xl sm:text-2xl font-display font-bold text-on-surface">Punto de Venta</h1>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowOrdersPanel(!showOrdersPanel); if (!showOrdersPanel) fetchPedidosActivos(); }}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border transition-colors text-sm font-medium ${
                  showOrdersPanel
                    ? "bg-primary/10 border-primary/40 text-primary"
                    : "border-outline-variant hover:bg-surface-container"
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                <span className="hidden sm:inline">Pedidos Activos</span>
                <span className="sm:hidden">Pedidos</span>
              </button>
              <button
                onClick={() => setModalType("CLOSE")}
                className="flex items-center gap-2 text-sm text-error hover:bg-error-container hover:text-error px-3 sm:px-4 py-2 rounded-xl transition-colors font-medium border border-error/30"
              >
                <Store className="w-4 h-4" />
                <span className="hidden sm:inline">Cerrar Caja</span>
                <span className="sm:hidden">Cerrar</span>
              </button>
            </div>
          </div>

          {/* Main layout */}
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 flex-1 lg:min-h-0">
            {/* Products */}
            <div className="flex-1 flex flex-col bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden lg:min-h-0">
              <div className="p-4 border-b border-outline-variant bg-surface-container-low">
                <h2 className="text-lg sm:text-xl font-display font-bold text-primary flex items-center gap-2">
                  <Coffee className="w-5 h-5" />
                  Menú de Productos
                </h2>
              </div>
              <div className="lg:flex-1 lg:overflow-auto p-4 pb-24 lg:pb-4">
                <ProductList />
              </div>
            </div>

            {/* Desktop right panel */}
            <div className="hidden lg:flex w-full lg:w-[420px] flex-col bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
              {showOrdersPanel ? <OrdersPanel onClose={() => setShowOrdersPanel(false)} /> : <Cart />}
            </div>
          </div>

          {/* Mobile floating cart bar */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-3 bg-surface/95 backdrop-blur-md border-t border-outline-variant shadow-[0_-4px_16px_rgba(31,27,20,0.08)]">
            <button
              onClick={() => setMobilePanel("cart")}
              className="w-full flex items-center justify-between gap-3 bg-primary text-on-primary px-4 py-3 rounded-xl font-bold shadow-sm active:scale-[0.99] transition-transform"
            >
              <span className="flex items-center gap-2">
                <span className="relative">
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-tertiary text-on-tertiary text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </span>
                Ver Pedido
              </span>
              <span className="font-display">${cartTotal.toFixed(2)}</span>
            </button>
          </div>
        </div>
      )}

      {/* Mobile slide-up panel (cart / orders) */}
      {isRegisterOpen && mobilePanel && (
        <div className="lg:hidden fixed inset-0 z-[70] flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobilePanel(null)}
          />
          <div className="relative bg-surface rounded-t-3xl shadow-2xl h-[88vh] flex flex-col overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between p-3 border-b border-outline-variant shrink-0">
              <div className="flex gap-1 bg-surface-container rounded-xl p-1">
                <button
                  onClick={() => setMobilePanel("cart")}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    mobilePanel === "cart" ? "bg-surface text-primary shadow-sm" : "text-on-surface-variant"
                  }`}
                >
                  Pedido
                </button>
                <button
                  onClick={() => { setMobilePanel("orders"); fetchPedidosActivos(); }}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    mobilePanel === "orders" ? "bg-surface text-primary shadow-sm" : "text-on-surface-variant"
                  }`}
                >
                  Pedidos activos
                </button>
              </div>
              <button
                onClick={() => setMobilePanel(null)}
                className="p-2 rounded-full text-outline hover:bg-surface-container hover:text-on-surface transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              {mobilePanel === "orders"
                ? <OrdersPanel onClose={() => setMobilePanel("cart")} />
                : <Cart />}
            </div>
          </div>
        </div>
      )}

      {modalType && (
        <RegisterModal
          type={modalType}
          onClose={() => setModalType(null)}
        />
      )}
    </>
  );
}
