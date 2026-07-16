"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Package,
  AlertTriangle,
  XCircle,
  ArrowLeftRight,
  DollarSign,
  BarChart3,
  Boxes,
  ShoppingCart,
} from "lucide-react";
import { useReportStore } from "@/store/reportStore";
import { useInventoryStore } from "@/store/inventoryStore";
import { toast } from "@/lib/notifications";
import { money, num } from "./utils";
import SalesReport from "./components/SalesReport";
import StockReport from "./components/StockReport";
import MovementsReport from "./components/MovementsReport";

type Tab = "ventas" | "stock" | "movimientos";

const TABS: { key: Tab; label: string; icon: typeof BarChart3 }[] = [
  { key: "ventas", label: "Ventas", icon: ShoppingCart },
  { key: "stock", label: "Stock", icon: Boxes },
  { key: "movimientos", label: "Movimientos", icon: ArrowLeftRight },
];

export default function ReportsPage() {
  const { dashboard, loadingDashboard, fetchDashboard } = useReportStore();
  const { items, fetchItems } = useInventoryStore();
  // Pestaña inicial desde ?tab= (p. ej. redirección desde Inventario). La página
  // solo se renderiza en cliente (el layout la protege), así que leer la URL en el
  // inicializador no provoca desajustes de hidratación.
  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window === "undefined") return "ventas";
    const t = new URLSearchParams(window.location.search).get("tab");
    return t === "stock" || t === "movimientos" ? t : "ventas";
  });

  useEffect(() => {
    fetchDashboard().catch(() => toast.error("No se pudo cargar el resumen de reportes."));
    // Métricas de inventario desde el inventory-service (misma fuente que la
    // pantalla de Inventario) para que los conteos coincidan; el report-service
    // mantiene una copia que puede estar desincronizada.
    fetchItems().catch(() => {});
  }, [fetchDashboard, fetchItems]);

  // Conteos por `estado` (igual que la pantalla de inventario y el backend).
  const invStats = useMemo(() => {
    const totalItems = items.length;
    const lowStock = items.filter((i) => i.estado === "STOCK_BAJO").length;
    const outOfStock = items.filter((i) => i.estado === "AGOTADO").length;
    return { totalItems, lowStock, outOfStock };
  }, [items]);

  const hasInventory = items.length > 0;

  const cards = [
    { name: "Productos", value: hasInventory ? num(invStats.totalItems) : "—", icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
    { name: "Stock Bajo", value: hasInventory ? num(invStats.lowStock) : "—", icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
    { name: "Agotados", value: hasInventory ? num(invStats.outOfStock) : "—", icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
    { name: "Movimientos", value: dashboard ? num(dashboard.total_movimientos) : "—", icon: ArrowLeftRight, color: "text-purple-600", bg: "bg-purple-50" },
    { name: "Ventas Totales", value: dashboard ? money(dashboard.total_ventas) : "—", icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
  ];

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Encabezado */}
      <header className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-primary-container/20 flex items-center justify-center text-secondary shrink-0">
          <BarChart3 size={20} />
        </div>
        <div className="min-w-0">
          <h1 className="font-headline text-xl sm:text-2xl font-extrabold text-primary tracking-tight leading-none">
            Reportes
          </h1>
          <p className="font-body text-xs sm:text-sm text-on-surface-variant mt-0.5 truncate">
            Ventas, inventario y movimientos · exportación CSV y PDF
          </p>
        </div>
      </header>

      {/* Tarjetas resumen (compactas: icono + valor en línea) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {cards.map((card, index) => (
          <div
            key={card.name}
            className={`flex items-center gap-3 p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/15 shadow-[0_1px_3px_rgba(31,27,20,0.05)] hover:shadow-[0_3px_10px_rgba(31,27,20,0.09)] transition-all duration-300 animate-fade-in-up ${
              loadingDashboard ? "opacity-60 animate-pulse" : ""
            }`}
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className={`${card.bg} ${card.color} w-9 h-9 shrink-0 rounded-lg flex items-center justify-center`}>
              <card.icon size={18} />
            </div>
            <div className="min-w-0">
              <p className="font-label text-[9px] font-bold text-on-surface-variant uppercase tracking-wider truncate">
                {card.name}
              </p>
              <h3 className="font-headline text-base sm:text-lg font-extrabold text-primary leading-tight truncate">
                {card.value}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Contenedor de reportes */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-[0_2px_10px_rgba(31,27,20,0.06)] p-3 sm:p-5">
        {/* Tabs (centrados) */}
        <div className="flex gap-1 p-1 mb-4 bg-surface-container rounded-2xl w-full sm:w-fit sm:mx-auto overflow-x-auto no-scrollbar">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                  active
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                <t.icon size={16} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {tab === "ventas" && <SalesReport />}
        {tab === "stock" && <StockReport />}
        {tab === "movimientos" && <MovementsReport />}
      </div>
    </div>
  );
}
