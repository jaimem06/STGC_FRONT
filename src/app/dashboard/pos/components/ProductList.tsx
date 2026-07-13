"use client";

import { useState } from "react";
import { usePosStore, Product } from "@/store/posStore";
import { PackageOpen, Plus, Search } from "lucide-react";

export default function ProductList() {
  const { productos, addToCart, cart } = usePosStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("TODOS");
  const [minStock, setMinStock] = useState<number>(0);
  const [maxStock, setMaxStock] = useState<number>(Infinity);

  const filtered = productos.filter((product) => {
    const cartItem = cart.find((item) => item.productoId === product.id);
    const inCartQuantity = cartItem?.cantidad || 0;
    const availableStock = product.stockActual - inCartQuantity;
    const isOutOfStock = product.stockActual <= 0;

    if (searchTerm && !product.nombre.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterStatus === "DISPONIBLE" && isOutOfStock) return false;
    if (filterStatus === "AGOTADO" && !isOutOfStock) return false;
    if (availableStock < minStock) return false;
    if (maxStock < Infinity && availableStock > maxStock) return false;
    return true;
  });

  if (productos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full opacity-60">
        <PackageOpen className="w-16 h-16 mb-4 text-outline" />
        <p className="text-on-surface-variant font-medium">No hay productos disponibles</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm p-2 rounded-lg border border-outline-variant bg-surface outline-none"
          >
            <option value="TODOS">Todos</option>
            <option value="DISPONIBLE">Disponible</option>
            <option value="AGOTADO">Agotado</option>
          </select>
          <input
            type="number"
            placeholder="Stock min"
            value={minStock || ""}
            onChange={(e) => setMinStock(parseInt(e.target.value) || 0)}
            className="w-24 text-sm p-2 rounded-lg border border-outline-variant bg-surface outline-none"
          />
          <input
            type="number"
            placeholder="Stock max"
            value={maxStock === Infinity ? "" : maxStock}
            onChange={(e) => setMaxStock(e.target.value ? parseInt(e.target.value) : Infinity)}
            className="w-24 text-sm p-2 rounded-lg border border-outline-variant bg-surface outline-none"
          />
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
        {filtered.map((product) => {
          const cartItem = cart.find(item => item.productoId === product.id);
          const inCartQuantity = cartItem?.cantidad || 0;
          const availableStock = product.stockActual - inCartQuantity;
          const isOutOfStock = product.stockActual <= 0;

          return (
            <div
              key={product.id}
              onClick={() => !isOutOfStock && addToCart(product)}
              className={`relative group bg-surface-container-lowest rounded-xl border p-3 flex flex-col cursor-pointer transition-all duration-200
                ${isOutOfStock
                  ? 'border-error/30 opacity-60 cursor-not-allowed'
                  : 'border-outline-variant hover:border-primary hover:shadow-md hover:-translate-y-1'}`}
            >
              {/* Status Badge (HU008-CA1) */}
              <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                isOutOfStock
                  ? 'bg-error/20 text-error'
                  : 'bg-success/20 text-success'
              }`}>
                {isOutOfStock ? "Agotado" : "Disponible"}
              </div>

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
                  <span className={`text-xs px-2 py-1 rounded font-medium ${
                    isOutOfStock
                      ? 'bg-error/10 text-error'
                      : 'bg-surface-container-high text-on-surface-variant'
                  }`}>
                    Stock: {availableStock}
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

      {filtered.length === 0 && (
        <div className="text-center py-12 text-on-surface-variant font-medium">
          No se encontraron productos con los filtros aplicados
        </div>
      )}
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
