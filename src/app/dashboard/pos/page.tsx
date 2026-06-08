"use client";

import { useEffect, useState } from "react";
import { usePosStore } from "@/store/posStore";
import ProductList from "./components/ProductList";
import Cart from "./components/Cart";
import RegisterModal from "./components/RegisterModal";
import { Coffee, Store } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function PosPage() {
  const { fetchProductos, loading, isRegisterOpen } = usePosStore();
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  useEffect(() => {
    // Ideally we should check if a register is already open by an API call.
    // Assuming we just fetch products for now.
    fetchProductos();
  }, [fetchProductos]);

  if (loading && !isRegisterOpen) {
    return <LoadingSpinner size={48} message="Cargando POS..." fullPage />;
  }

  if (!isRegisterOpen) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
        <Store className="w-24 h-24 text-primary opacity-50 mb-6" />
        <h1 className="text-3xl font-display font-bold text-primary mb-4">Caja Cerrada</h1>
        <p className="text-on-surface-variant mb-8 max-w-md">
          Para comenzar a registrar ventas, debes realizar la apertura de caja indicando el monto inicial en efectivo.
        </p>
        <button
          onClick={() => setShowRegisterModal(true)}
          className="bg-primary hover:bg-primary-container text-on-primary px-8 py-3 rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2"
        >
          <Coffee className="w-5 h-5" />
          Abrir Turno de Caja
        </button>

        {showRegisterModal && (
          <RegisterModal
            type="OPEN"
            onClose={() => setShowRegisterModal(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-8rem)]">
      {/* Left Area - Products */}
      <div className="flex-1 flex flex-col bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
        <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
          <h2 className="text-xl font-display font-bold text-primary flex items-center gap-2">
            <Coffee className="w-5 h-5" />
            Menú de Productos
          </h2>
          <button
            onClick={() => setShowRegisterModal(true)}
            className="text-sm text-error hover:bg-error-container hover:text-error px-3 py-1.5 rounded-lg transition-colors font-medium"
          >
            Cerrar Caja
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <ProductList />
        </div>
      </div>

      {/* Right Area - Cart */}
      <div className="w-full md:w-[400px] flex flex-col bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
        <Cart />
      </div>

      {showRegisterModal && (
        <RegisterModal
          type="CLOSE"
          onClose={() => setShowRegisterModal(false)}
        />
      )}
    </div>
  );
}
