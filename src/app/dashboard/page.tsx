"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useInventoryStore } from "@/store/inventoryStore";
import { toast } from "@/lib/notifications";
import { buildStockAlertMessage } from "@/lib/stock-alerts";
import InventoryDonut, { DonutSegment } from "./components/InventoryDonut";
import {
  Package,
  AlertTriangle,
  DollarSign,
  Layers,
  Clock,
  ArrowUpRight,
  TrendingDown,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { stats, alertas, fetchDashboard } = useInventoryStore();
  const router = useRouter();

  useEffect(() => {
    fetchDashboard()
      .then(() => {
        // Mismo mensaje categorizado que la pantalla de inventario, con la misma
        // fuente de datos (alertas del inventory-service).
        const current = useInventoryStore.getState().alertas;
        const message = buildStockAlertMessage(current);
        if (message) {
          toast.warning(message, undefined, "Revisar", "low-stock-alert", () =>
            router.push("/dashboard/inventory?alertas=1")
          );
        }
      })
      .catch(() => toast.error("No se pudieron cargar las métricas de inventario."));
  }, [fetchDashboard, router]);

  const cards = [
    { name: "Productos", value: stats ? stats.total_items.toLocaleString() : "—", icon: Package, color: "text-primary", bg: "bg-primary/10" },
    { name: "Stock Bajo", value: stats ? stats.stock_bajo.toLocaleString() : "—", icon: AlertTriangle, color: "text-tertiary", bg: "bg-tertiary/10" },
    { name: "Valor Inventario", value: stats ? `$${stats.valor_total.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—", icon: DollarSign, color: "text-secondary", bg: "bg-secondary/10" },
    { name: "Lotes de Café", value: stats ? stats.num_lotes.toLocaleString() : "—", icon: Layers, color: "text-primary-container", bg: "bg-primary-container/10" },
  ];

  // Distribución de estados para la dona. "Otros" absorbe estados no categorizados
  // (inactivos, en tránsito, etc.) para que la suma cuadre con el total.
  const disponibles = stats?.disponibles ?? 0;
  const stockBajo = stats?.stock_bajo ?? 0;
  const agotados = stats?.agotados ?? 0;
  const totalItems = stats?.total_items ?? 0;
  const otros = Math.max(0, totalItems - disponibles - stockBajo - agotados);

  const segments: DonutSegment[] = [
    { label: "Disponibles", value: disponibles, color: "var(--color-secondary)" },
    { label: "Stock bajo", value: stockBajo, color: "var(--color-tertiary)" },
    { label: "Agotados", value: agotados, color: "var(--color-error)" },
    { label: "Otros", value: otros, color: "var(--color-outline-variant)" },
  ];
  const segmentTotal = segments.reduce((acc, s) => acc + s.value, 0) || 1;

  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="font-headline text-2xl font-extrabold text-primary tracking-tight">
            Bienvenido, <span className="text-secondary">{user?.email?.split("@")[0] || "Administrador"}</span>
          </h1>
          <p className="font-body text-sm text-on-surface-variant mt-0.5">
            Resumen del inventario en <span className="font-semibold text-primary">STGC Tierra Fértil</span>.
          </p>
        </div>
        <div className="px-4 py-2 bg-surface border border-outline-variant/30 rounded-xl flex items-center gap-2 shadow-sm self-start md:self-auto">
          <Clock size={16} className="text-secondary" />
          <span className="font-label text-xs font-bold text-primary">{new Date().toLocaleDateString()}</span>
        </div>
      </header>

      {/* KPIs compactos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => (
          <div
            key={card.name}
            className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/15 shadow-sm hover:shadow-md transition-all duration-300 group flex items-center gap-3.5 animate-fade-in-up"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className={`${card.bg} ${card.color} p-2.5 rounded-xl transition-transform duration-300 group-hover:scale-110 shrink-0`}>
              <card.icon size={22} />
            </div>
            <div className="min-w-0">
              <p className="font-label text-[10px] font-bold text-on-surface-variant uppercase tracking-wider truncate">{card.name}</p>
              <h3 className="font-headline text-xl font-extrabold text-primary leading-tight truncate">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficas + alertas, altura acotada para no alargar la pantalla */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Distribución de estados: dona + barras */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/15 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-headline text-base font-bold text-primary">Distribución de Estados</h3>
            <Layers size={18} className="text-outline" />
          </div>
          <div className="flex flex-col items-center gap-5 flex-1 justify-center">
            <InventoryDonut
              segments={segments}
              centerValue={stats ? totalItems.toLocaleString() : "—"}
              centerLabel="Ítems"
            />
            <div className="w-full space-y-2.5">
              {segments.map((seg) => {
                const pct = Math.round((seg.value / segmentTotal) * 100);
                return (
                  <div key={seg.label} className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                    <span className="text-xs font-semibold text-on-surface flex-1 min-w-0 truncate">{seg.label}</span>
                    <div className="w-16 h-1.5 rounded-full bg-surface-container-high overflow-hidden shrink-0">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: seg.color }} />
                    </div>
                    <span className="text-xs font-black text-primary tabular-nums w-9 text-right shrink-0">{seg.value.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Alertas de stock: compactas, con scroll interno */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/15 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <h3 className="font-headline text-base font-bold text-primary">Alertas de Stock</h3>
              {alertas.length > 0 && (
                <span className="text-[11px] font-black text-on-error bg-error rounded-full min-w-[22px] h-5 px-1.5 flex items-center justify-center">
                  {alertas.length}
                </span>
              )}
            </div>
            <button
              onClick={() => router.push("/dashboard/inventory?alertas=1")}
              className="flex items-center gap-1 text-xs font-bold text-secondary hover:text-primary transition-colors"
            >
              Ir al inventario <ArrowUpRight size={14} />
            </button>
          </div>

          {/* Mini-resumen de salud */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/10">
              <CheckCircle2 size={16} className="text-secondary shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-black text-secondary leading-none">{disponibles.toLocaleString()}</p>
                <p className="text-[9px] font-bold uppercase tracking-wide text-on-surface-variant mt-0.5">Disponibles</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-tertiary/10">
              <TrendingDown size={16} className="text-tertiary shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-black text-tertiary leading-none">{stockBajo.toLocaleString()}</p>
                <p className="text-[9px] font-bold uppercase tracking-wide text-on-surface-variant mt-0.5">Stock bajo</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-error/10">
              <XCircle size={16} className="text-error shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-black text-error leading-none">{agotados.toLocaleString()}</p>
                <p className="text-[9px] font-bold uppercase tracking-wide text-on-surface-variant mt-0.5">Agotados</p>
              </div>
            </div>
          </div>

          {/* Lista acotada: máx. altura fija + scroll interno → nunca alarga la página */}
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 max-h-[260px] pr-1 -mr-1">
            {alertas.length === 0 ? (
              <div className="h-full min-h-[200px] flex items-center justify-center border-2 border-dashed border-surface-container-high rounded-2xl bg-surface/40">
                <div className="text-center space-y-2 opacity-60">
                  <CheckCircle2 size={36} className="mx-auto text-secondary" />
                  <p className="font-body text-sm font-medium text-on-surface-variant">Todo el inventario está en niveles saludables.</p>
                </div>
              </div>
            ) : (
              alertas.map((a) => {
                const critico = a.cantidad_actual <= 0 || a.mensaje === "Producto Caducado";
                return (
                  <div
                    key={a.item_id}
                    className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border ${critico ? "bg-error-container/20 border-error/20" : "bg-tertiary/5 border-tertiary/20"}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${critico ? "bg-error/10 text-error" : "bg-tertiary/15 text-tertiary"}`}>
                        <TrendingDown size={15} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-primary truncate">{a.nombre}</p>
                        <p className="text-[10px] text-outline uppercase tracking-wider font-bold truncate">{a.mensaje}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-black tabular-nums ${critico ? "text-error" : "text-tertiary"}`}>{a.cantidad_actual.toLocaleString()}</p>
                      <p className="text-[9px] text-outline font-bold uppercase">mín {a.stock_minimo.toLocaleString()}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
