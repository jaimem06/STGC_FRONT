"use client";

import { useEffect, useState } from "react";
import { usePosStore } from "@/store/posStore";
import ProductList from "./components/ProductList";
import Cart from "./components/Cart";
import RegisterModal from "./components/RegisterModal";
import OrdersPanel from "./components/OrdersPanel";
import { Coffee, Store, ClipboardList } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

type ModalType = "OPEN" | "CLOSE" | null;

export default function PosPage() {
  const { fetchProductos, fetchPedidosActivos, loading, isRegisterOpen } = usePosStore();
  const [modalType, setModalType] = useState<ModalType>(null);
  const [showOrdersPanel, setShowOrdersPanel] = useState(false);

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  useEffect(() => {
    if (isRegisterOpen) {
      fetchPedidosActivos();
    }
  }, [isRegisterOpen, fetchPedidosActivos]);

  if (loading && !isRegisterOpen) {
    return <LoadingSpinner size={48} message="Cargando POS..." fullPage />;
  }

  return (
    <>
      {!isRegisterOpen ? (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
          <Store className="w-24 h-24 text-primary opacity-50 mb-6" />
          <h1 className="text-3xl font-display font-bold text-primary mb-4">Caja Cerrada</h1>
          <p className="text-on-surface-variant mb-8 max-w-md">
            Para comenzar a registrar ventas, debes realizar la apertura de caja indicando el monto inicial en efectivo.
          </p>
          <button
            onClick={() => setModalType("OPEN")}
            className="bg-primary hover:bg-primary-container text-on-primary px-8 py-3 rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2"
          >
            <Coffee className="w-5 h-5" />
            Abrir Turno de Caja
          </button>
        </div>
      ) : (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-display font-bold text-on-surface">Punto de Venta</h1>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowOrdersPanel(!showOrdersPanel); if (!showOrdersPanel) fetchPedidosActivos(); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant hover:bg-surface-container transition-colors text-sm font-medium"
              >
                <ClipboardList className="w-4 h-4" />
                Pedidos Activos
              </button>
              <button
                onClick={() => setModalType("CLOSE")}
                className="text-sm text-error hover:bg-error-container hover:text-error px-4 py-2 rounded-lg transition-colors font-medium border border-error/30"
              >
                Cerrar Caja
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
            <div className="flex-1 flex flex-col bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
              <div className="p-4 border-b border-outline-variant bg-surface-container-low">
                <h2 className="text-xl font-display font-bold text-primary flex items-center gap-2">
                  <Coffee className="w-5 h-5" />
                  Menú de Productos
                </h2>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <ProductList />
              </div>
            </div>

            <div className="w-full md:w-[420px] flex flex-col bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
              {showOrdersPanel ? <OrdersPanel onClose={() => setShowOrdersPanel(false)} /> : <Cart />}
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
