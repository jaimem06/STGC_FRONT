"use client";

import { usePosStore, Product } from "@/store/posStore";
import { PackageOpen, Plus } from "lucide-react";
import Image from "next/image";

export default function ProductList() {
  const { productos, addToCart, cart } = usePosStore();

  if (productos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full opacity-60">
        <PackageOpen className="w-16 h-16 mb-4 text-outline" />
        <p className="text-on-surface-variant font-medium">No hay productos disponibles</p>
      </div>
    );
  }

  // Group by category if needed, or just list them all
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
      {productos.map((product) => {
        const cartItem = cart.find(item => item.productoId === product.id);
        const inCartQuantity = cartItem?.cantidad || 0;
        const isOutOfStock = product.stockActual <= inCartQuantity;

        return (
          <div
            key={product.id}
            onClick={() => !isOutOfStock && addToCart(product)}
            className={`relative group bg-surface-container-lowest rounded-xl border p-3 flex flex-col cursor-pointer transition-all duration-200
              ${isOutOfStock ? 'border-error/30 opacity-60 cursor-not-allowed' : 'border-outline-variant hover:border-primary hover:shadow-md hover:-translate-y-1'}`}
          >
            <div className="aspect-square bg-surface-container rounded-lg mb-3 flex items-center justify-center overflow-hidden">
              {product.imagenUrl ? (
                <img src={product.imagenUrl} alt={product.nombre} className="w-full h-full object-cover" />
              ) : (
                <CoffeeCupIcon className="w-12 h-12 text-tertiary opacity-50" />
              )}
            </div>
            <div className="flex-1 flex flex-col">
              <span className="text-xs font-semibold text-secondary mb-1 uppercase tracking-wider">{product.categoria}</span>
              <h3 className="font-bold text-on-surface text-sm leading-tight mb-2 line-clamp-2">{product.nombre}</h3>
              <div className="mt-auto flex items-center justify-between">
                <span className="font-display font-bold text-primary">${product.precioUnitario.toFixed(2)}</span>
                <span className="text-xs bg-surface-container-high px-2 py-1 rounded text-on-surface-variant font-medium">
                  Stock: {product.stockActual - inCartQuantity}
                </span>
              </div>
            </div>
            
            {!isOutOfStock && (
              <div className="absolute top-2 right-2 bg-primary text-on-primary p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Plus className="w-4 h-4" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CoffeeCupIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <line x1="6" x2="6" y1="2" y2="4" />
      <line x1="10" x2="10" y1="2" y2="4" />
      <line x1="14" x2="14" y1="2" y2="4" />
    </svg>
  );
}
