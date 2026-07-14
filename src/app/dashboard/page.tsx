"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useInventoryStore } from "@/store/inventoryStore";
import { toast } from "@/lib/notifications";
import {
  Package,
  AlertTriangle,
  DollarSign,
  Layers,
  Clock,
  ArrowUpRight,
  TrendingDown,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { stats, alertas, fetchDashboard } = useInventoryStore();

  useEffect(() => {
    fetchDashboard()
      .then(() => {
        // El toast usa el estado más reciente del store tras la carga.
        const current = useInventoryStore.getState().alertas;
        if (current.length > 0) {
          toast.warning(`Tienes ${current.length} producto(s) por debajo de su stock mínimo.`, undefined, "Revisar", "low-stock-alert");
        }
      })
      .catch(() => toast.error("No se pudieron cargar las métricas de inventario."));
  }, [fetchDashboard]);

  const cards = [
    { name: "Productos en Catálogo", value: stats ? stats.total_items.toLocaleString() : "—", icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
    { name: "Stock Bajo", value: stats ? stats.stock_bajo.toLocaleString() : "—", icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
    { name: "Valor de Inventario", value: stats ? `$${stats.valor_total.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—", icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
    { name: "Lotes de Café", value: stats ? stats.num_lotes.toLocaleString() : "—", icon: Layers, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-extrabold text-primary tracking-tight">
            Bienvenido, <span className="text-secondary">{user?.email?.split("@")[0] || "Administrador"}</span>
          </h1>
          <p className="font-body text-on-surface-variant mt-1">
            Resumen del inventario en <span className="font-semibold text-primary">STGC Tierra Fértil</span>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-surface border border-outline-variant/30 rounded-xl flex items-center gap-2 shadow-sm">
            <Clock size={16} className="text-secondary" />
            <span className="font-label text-xs font-bold text-primary">{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <div
            key={card.name}
            className="p-6 rounded-3xl bg-white border border-outline-variant/10 shadow-sm hover:shadow-md transition-all duration-300 group animate-fade-in-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between">
              <div className={`${card.bg} ${card.color} p-3 rounded-2xl transition-transform duration-300 group-hover:scale-110 shadow-sm`}>
                <card.icon size={24} />
              </div>
            </div>
            <div className="mt-4">
              <p className="font-label text-xs font-bold text-on-surface-variant uppercase tracking-wider">{card.name}</p>
              <h3 className="font-headline text-2xl font-extrabold text-primary mt-1">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Alertas de stock crítico */}
        <div className="lg:col-span-2 bg-white rounded-[32px] p-8 border border-outline-variant/10 shadow-sm min-h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-headline text-xl font-bold text-primary">Alertas de Stock</h3>
              <p className="text-sm text-on-surface-variant">Productos en o por debajo de su mínimo</p>
            </div>
            <AlertTriangle size={20} className="text-amber-500" />
          </div>
          <div className="flex-grow overflow-y-auto space-y-2">
            {alertas.length === 0 && (
              <div className="h-full flex items-center justify-center border-2 border-dashed border-surface-container rounded-3xl bg-surface/30">
                <div className="text-center space-y-2 opacity-50">
                  <Package size={40} className="mx-auto text-primary" />
                  <p className="font-body text-sm font-medium">Todo el inventario está en niveles saludables.</p>
                </div>
              </div>
            )}
            {alertas.map((a) => {
              const critico = a.cantidad_actual <= 0 || a.mensaje === "Producto Caducado";
              return (
                <div key={a.item_id} className={`flex items-center justify-between p-4 rounded-2xl border ${critico ? "bg-error-container/10 border-error/20" : "bg-amber-50 border-amber-200/50"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${critico ? "bg-error/10 text-error" : "bg-amber-100 text-amber-700"}`}>
                      <TrendingDown size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary">{a.nombre}</p>
                      <p className="text-[10px] text-outline uppercase tracking-widest font-bold">{a.mensaje}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-black ${critico ? "text-error" : "text-amber-700"}`}>{a.cantidad_actual.toLocaleString()}</p>
                    <p className="text-[9px] text-outline font-bold uppercase">min {a.stock_minimo.toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-primary p-8 rounded-[32px] text-on-primary shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 transition-transform duration-700 group-hover:scale-150" />
            <h3 className="font-headline text-xl font-bold relative z-10">Estado del Inventario</h3>
            <p className="text-sm text-on-primary/70 mt-2 relative z-10">
              {stats ? `${stats.disponibles} disponibles · ${stats.agotados} agotados` : "Cargando métricas..."}
            </p>
            <a href="/dashboard/inventory" className="mt-6 w-full bg-secondary text-on-secondary font-bold py-3 rounded-2xl shadow-lg hover:shadow-secondary/20 hover:-translate-y-1 transition-all active:scale-[0.98] relative z-10 flex items-center justify-center gap-2">
              Ir al Inventario <ArrowUpRight size={16} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
