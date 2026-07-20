"use client";

import { useMemo, useState } from "react";
import { usePosStore, Product } from "@/store/posStore";
import { PackageOpen, Plus, Search, X } from "lucide-react";

type Disponibilidad = "TODOS" | "DISPONIBLE" | "STOCK_BAJO" | "AGOTADO";
type Orden = "NOMBRE" | "PRECIO_ASC" | "PRECIO_DESC" | "STOCK";

const FILTROS: { valor: Disponibilidad; etiqueta: string; activo: string; inactivo: string }[] = [
  { valor: "TODOS", etiqueta: "Todos", activo: "bg-primary text-on-primary border-primary", inactivo: "bg-surface text-on-surface-variant border-outline-variant hover:border-primary" },
  { valor: "DISPONIBLE", etiqueta: "Disponibles", activo: "bg-success text-on-success border-success", inactivo: "bg-success/10 text-success border-success/30 hover:border-success" },
  { valor: "STOCK_BAJO", etiqueta: "Stock bajo", activo: "bg-tertiary text-on-tertiary border-tertiary", inactivo: "bg-tertiary/10 text-tertiary border-tertiary/30 hover:border-tertiary" },
  { valor: "AGOTADO", etiqueta: "Agotados", activo: "bg-error text-on-error border-error", inactivo: "bg-error/10 text-error border-error/30 hover:border-error" },
];

/**
 * Estado de venta del producto. Se apoya en el estado que reporta el inventario
 * y, si no llega, lo deduce del stock mínimo. Un producto en STOCK_BAJO sigue
 * siendo vendible: solo avisa de que conviene reponerlo.
 */
function estadoDeVenta(product: Product): Disponibilidad {
  if (product.stockActual <= 0) return "AGOTADO";
  if (product.estado === "STOCK_BAJO") return "STOCK_BAJO";
  if (product.stockMinimo != null && product.stockActual <= product.stockMinimo) {
    return "STOCK_BAJO";
  }
  return "DISPONIBLE";
}

const ESTILO_ETIQUETA: Record<Disponibilidad, string> = {
  TODOS: "",
  DISPONIBLE: "bg-success text-on-success shadow-sm",
  STOCK_BAJO: "bg-tertiary text-on-tertiary shadow-sm",
  AGOTADO: "bg-error text-on-error shadow-sm",
};

const TEXTO_ETIQUETA: Record<Disponibilidad, string> = {
  TODOS: "",
  DISPONIBLE: "Disponible",
  STOCK_BAJO: "Stock bajo",
  AGOTADO: "Agotado",
};

export default function ProductList() {
  const { productos, addToCart, cart } = usePosStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [disponibilidad, setDisponibilidad] = useState<Disponibilidad>("TODOS");
  const [orden, setOrden] = useState<Orden>("NOMBRE");

  const hayFiltros = searchTerm !== "" || disponibilidad !== "TODOS" || orden !== "NOMBRE";

  const limpiarFiltros = () => {
    setSearchTerm("");
    setDisponibilidad("TODOS");
    setOrden("NOMBRE");
  };

  const filtered = useMemo(() => {
    const busqueda = searchTerm.trim().toLowerCase();

    const resultado = productos.filter((product) => {
      if (busqueda) {
        const coincide =
          product.nombre.toLowerCase().includes(busqueda) ||
          (product.sku?.toLowerCase().includes(busqueda) ?? false);
        if (!coincide) return false;
      }
      if (disponibilidad !== "TODOS" && estadoDeVenta(product) !== disponibilidad) {
        return false;
      }
      return true;
    });

    return resultado.sort((a, b) => {
      switch (orden) {
        case "PRECIO_ASC":
          return a.precioUnitario - b.precioUnitario;
        case "PRECIO_DESC":
          return b.precioUnitario - a.precioUnitario;
        case "STOCK":
          return b.stockActual - a.stockActual;
        default:
          return a.nombre.localeCompare(b.nombre, "es");
      }
    });
  }, [productos, searchTerm, disponibilidad, orden]);

  if (productos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[40vh] opacity-60">
        <PackageOpen className="w-16 h-16 mb-4 text-outline" />
        <p className="text-on-surface-variant font-medium">No hay productos disponibles</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filtros */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
            <input
              type="search"
              placeholder="Buscar por nombre o código..."
              aria-label="Buscar producto por nombre o código"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface"
            />
          </div>
          <select
            value={orden}
            onChange={(e) => setOrden(e.target.value as Orden)}
            aria-label="Ordenar productos"
            className="text-sm p-2 rounded-lg border border-outline-variant bg-surface outline-none focus:border-primary transition-colors"
          >
            <option value="NOMBRE">Nombre (A-Z)</option>
            <option value="PRECIO_ASC">Precio: menor a mayor</option>
            <option value="PRECIO_DESC">Precio: mayor a menor</option>
            <option value="STOCK">Mayor stock</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {FILTROS.map(({ valor, etiqueta, activo: estiloActivo, inactivo: estiloInactivo }) => {
            const activo = disponibilidad === valor;
            const cantidad =
              valor === "TODOS"
                ? productos.length
                : productos.filter((p) => estadoDeVenta(p) === valor).length;

            return (
              <button
                key={valor}
                type="button"
                onClick={() => setDisponibilidad(valor)}
                aria-pressed={activo}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  activo ? `${estiloActivo} shadow-sm` : estiloInactivo
                }`}
              >
                {etiqueta}
                <span className={`ml-1.5 ${activo ? "opacity-80" : "opacity-70"}`}>{cantidad}</span>
              </button>
            );
          })}

          {hayFiltros && (
            <button
              type="button"
              onClick={limpiarFiltros}
              className="ml-auto flex items-center gap-1 text-xs font-medium text-on-surface-variant hover:text-primary transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Grid de productos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {filtered.map((product) => {
          const cartItem = cart.find((item) => item.productoId === product.id);
          const inCartQuantity = cartItem?.cantidad || 0;
          const availableStock = product.stockActual - inCartQuantity;
          const estado = estadoDeVenta(product);
          // No se puede añadir si no queda stock libre, aunque el producto no
          // esté agotado: el resto ya está reservado en el carrito.
          const sinDisponibles = availableStock <= 0;

          return (
            <button
              key={product.id}
              type="button"
              onClick={() => !sinDisponibles && addToCart(product)}
              disabled={sinDisponibles}
              aria-label={`Añadir ${product.nombre} al pedido. Precio $${product.precioUnitario.toFixed(2)}. Quedan ${availableStock}`}
              className={`relative group overflow-hidden bg-surface-container-lowest rounded-2xl border-2 flex flex-col text-left transition-all duration-200
                ${sinDisponibles
                  ? "border-error/20 opacity-60 cursor-not-allowed"
                  : "border-outline-variant/70 hover:border-primary hover:shadow-lg hover:-translate-y-1 active:scale-[0.98] cursor-pointer"}`}
            >
              {/* Imagen: contiene las etiquetas flotantes, así overflow-hidden
                  evita que se salgan de la esquina redondeada de la tarjeta. */}
              <div className="relative aspect-square bg-gradient-to-br from-surface-container to-surface-container-high flex items-center justify-center overflow-hidden">
                {/* Estado de inventario (HU008-CA1) */}
                <div
                  className={`absolute top-2 left-2 z-10 max-w-[calc(100%-2rem)] truncate px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${ESTILO_ETIQUETA[estado]}`}
                >
                  {TEXTO_ETIQUETA[estado]}
                </div>

                {/* Cantidad en el carrito: círculo compacto para que nunca choque
                    con la etiqueta de estado, incluso en tarjetas angostas. */}
                {inCartQuantity > 0 && (
                  <div
                    className="absolute top-2 right-2 z-10 w-6 h-6 flex items-center justify-center rounded-full bg-secondary text-on-secondary text-[11px] font-black shadow-sm"
                    title={`${inCartQuantity} en el pedido`}
                  >
                    {inCartQuantity}
                  </div>
                )}

                {product.imagenUrl ? (
                  <img src={product.imagenUrl} alt={product.nombre} className="w-full h-full object-cover" />
                ) : (
                  <CoffeeCupIcon className="w-14 h-14 text-tertiary opacity-60" />
                )}
              </div>

              <div className="flex-1 flex flex-col p-3">
                <span className="text-[11px] font-bold text-secondary mb-1 uppercase tracking-wider truncate">
                  {product.categoria}
                </span>
                <h3 className="font-bold text-on-surface text-sm leading-tight mb-2 line-clamp-2">
                  {product.nombre}
                </h3>
                {/* El stock va ARRIBA del precio, en su propia fila: al lado
                    del precio, cantidades de más de tres cifras empujaban el
                    precio y se salían de la tarjeta. */}
                <div className="mt-auto flex flex-col items-start gap-1">
                  <span
                    className={`text-[11px] px-2 py-1 rounded-full font-bold whitespace-nowrap ${
                      sinDisponibles
                        ? "bg-error text-on-error"
                        : estado === "STOCK_BAJO"
                          ? "bg-tertiary text-on-tertiary"
                          : "bg-surface-container-high text-on-surface-variant"
                    }`}
                  >
                    {sinDisponibles ? "Sin stock" : `Quedan ${availableStock}`}
                  </span>
                  <span className="font-display font-black text-primary text-base">
                    ${product.precioUnitario.toFixed(2)}
                  </span>
                </div>

                {/* Acción de agregar: en el flujo normal de la tarjeta, nunca
                    flotando fuera de ella. */}
                {!sinDisponibles && (
                  <div className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-primary/5 group-hover:bg-primary group-hover:text-on-primary text-primary py-1.5 text-xs font-bold transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                    Agregar
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 space-y-3">
          <p className="text-on-surface-variant font-medium">
            No se encontraron productos con los filtros aplicados
          </p>
          <button
            type="button"
            onClick={limpiarFiltros}
            className="text-sm font-semibold text-primary hover:underline"
          >
            Limpiar filtros
          </button>
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
