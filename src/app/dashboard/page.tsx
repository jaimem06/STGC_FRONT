"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useInventoryStore } from "@/store/inventoryStore";
import { usePosStore } from "@/store/posStore";
import { useReportStore } from "@/store/reportStore";
import { toast } from "@/lib/notifications";
import { buildStockAlertMessage } from "@/lib/stock-alerts";
import { getDashboardConfig, tieneWidget } from "@/lib/dashboard-config";
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
  Wallet,
  Receipt,
  ShoppingCart,
  ChefHat,
  Store,
} from "lucide-react";

interface KpiCard {
  name: string;
  value: string;
  icon: typeof Package;
  color: string;
  bg: string;
}

const money = (value: number | null | undefined) =>
  `$${(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { stats, alertas, fetchDashboard } = useInventoryStore();
  const { turno, resumenCaja, isRegisterOpen, fetchResumenCaja } = usePosStore();
  const { dashboard: reporteVentas, fetchDashboard: fetchReporteVentas } = useReportStore();
  const router = useRouter();

  const config = useMemo(() => getDashboardConfig(user?.role?.name), [user?.role?.name]);

  const necesitaInventario =
    tieneWidget(config, "inventory-kpis") ||
    tieneWidget(config, "inventory-value") ||
    tieneWidget(config, "inventory-donut") ||
    tieneWidget(config, "inventory-alerts") ||
    tieneWidget(config, "menu-disponibilidad");
  const necesitaAlertas = tieneWidget(config, "inventory-alerts");
  const necesitaCaja = tieneWidget(config, "caja-turno");
  const necesitaVentas = tieneWidget(config, "sales-global");

  // Solo se piden los datos de los bloques que este rol tiene permitido ver.
  useEffect(() => {
    if (!necesitaInventario) return;
    fetchDashboard()
      .then(() => {
        // La notificación de reposición es exclusiva de quien gestiona el
        // inventario: un cajero o cocina no deben recibirla.
        if (!necesitaAlertas) return;
        const message = buildStockAlertMessage(useInventoryStore.getState().alertas);
        if (message) {
          toast.warning(message, undefined, "Revisar", "low-stock-alert", () =>
            router.push("/dashboard/inventory?alertas=1")
          );
        }
      })
      .catch(() => toast.error("No se pudieron cargar las métricas de inventario."));
  }, [necesitaInventario, necesitaAlertas, fetchDashboard, router]);

  useEffect(() => {
    if (necesitaCaja) fetchResumenCaja();
  }, [necesitaCaja, fetchResumenCaja]);

  useEffect(() => {
    if (necesitaVentas) {
      fetchReporteVentas().catch(() => toast.error("No se pudieron cargar las ventas acumuladas."));
    }
  }, [necesitaVentas, fetchReporteVentas]);

  // ── Métricas de inventario ──────────────────────────────────────────────
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

  // ── Tarjetas KPI: cada rol arma las suyas ───────────────────────────────
  const cards: KpiCard[] = [];
  if (tieneWidget(config, "sales-global")) {
    cards.push({
      name: "Ventas Acumuladas",
      value: reporteVentas ? money(reporteVentas.total_ventas) : "—",
      icon: DollarSign,
      color: "text-secondary",
      bg: "bg-secondary/10",
    });
  }
  if (tieneWidget(config, "inventory-kpis")) {
    cards.push(
      { name: "Productos", value: stats ? stats.total_items.toLocaleString() : "—", icon: Package, color: "text-primary", bg: "bg-primary/10" },
      { name: "Stock Bajo", value: stats ? stats.stock_bajo.toLocaleString() : "—", icon: AlertTriangle, color: "text-tertiary", bg: "bg-tertiary/10" },
      { name: "Agotados", value: stats ? stats.agotados.toLocaleString() : "—", icon: XCircle, color: "text-error", bg: "bg-error/10" },
      { name: "Lotes de Café", value: stats ? stats.num_lotes.toLocaleString() : "—", icon: Layers, color: "text-primary-container", bg: "bg-primary-container/10" },
    );
  }
  if (tieneWidget(config, "inventory-value")) {
    cards.push({
      name: "Valor Inventario",
      value: stats ? money(stats.valor_total) : "—",
      icon: DollarSign,
      color: "text-secondary",
      bg: "bg-secondary/10",
    });
  }
  if (tieneWidget(config, "caja-turno")) {
    cards.push(
      { name: "Estado de Caja", value: isRegisterOpen ? "Abierta" : "Cerrada", icon: Store, color: isRegisterOpen ? "text-secondary" : "text-outline", bg: isRegisterOpen ? "bg-secondary/10" : "bg-surface-container-high" },
      { name: "Monto de Apertura", value: isRegisterOpen ? money(resumenCaja?.montoApertura ?? turno?.montoApertura) : "—", icon: Wallet, color: "text-primary", bg: "bg-primary/10" },
      { name: "Cobrado en el Turno", value: isRegisterOpen ? money(resumenCaja?.montoVentasTotal) : "—", icon: Receipt, color: "text-secondary", bg: "bg-secondary/10" },
      { name: "Cierre Esperado", value: isRegisterOpen ? money(resumenCaja?.montoCierreEsperado) : "—", icon: ShoppingCart, color: "text-tertiary", bg: "bg-tertiary/10" },
    );
  }
  if (tieneWidget(config, "menu-disponibilidad")) {
    cards.push(
      { name: "Productos del Menú", value: stats ? stats.total_items.toLocaleString() : "—", icon: Package, color: "text-primary", bg: "bg-primary/10" },
      { name: "Disponibles", value: stats ? stats.disponibles.toLocaleString() : "—", icon: CheckCircle2, color: "text-secondary", bg: "bg-secondary/10" },
      { name: "Por Agotarse", value: stats ? stats.stock_bajo.toLocaleString() : "—", icon: TrendingDown, color: "text-tertiary", bg: "bg-tertiary/10" },
      { name: "Agotados", value: stats ? stats.agotados.toLocaleString() : "—", icon: XCircle, color: "text-error", bg: "bg-error/10" },
    );
  }

  // Cocina solo ve lo que no puede preparar (agotado o caducado); sin cifras
  // económicas ni enlaces al módulo de inventario.
  const noDisponibles = useMemo(
    () => alertas.filter((a) => a.cantidad_actual <= 0 || a.mensaje === "Producto Caducado"),
    [alertas]
  );

  const nombreUsuario = user?.first_name || user?.email?.split("@")[0] || "Usuario";

  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <p className="font-label text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.12em]">
            {config.titulo}
          </p>
          <h1 className="font-headline text-2xl font-extrabold text-primary tracking-tight">
            Bienvenido, <span className="text-secondary">{nombreUsuario}</span>
          </h1>
          <p className="font-body text-sm text-on-surface-variant mt-0.5">
            {config.subtitulo} <span className="font-semibold text-primary">STGC Tierra Fértil</span>.
          </p>
        </div>
        <div className="px-4 py-2 bg-surface border border-outline-variant/30 rounded-xl flex items-center gap-2 shadow-sm self-start md:self-auto">
          <Clock size={16} className="text-secondary" />
          <span className="font-label text-xs font-bold text-primary">{new Date().toLocaleDateString()}</span>
        </div>
      </header>

      {/* KPIs compactos, propios de cada rol */}
      {cards.length > 0 && (
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
      )}

      {/* Caja del cajero: desglose de lo cobrado y acceso directo al POS */}
      {tieneWidget(config, "caja-turno") && (
        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/15 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-headline text-base font-bold text-primary">Mi turno de caja</h3>
            <button
              onClick={() => router.push("/dashboard/pos")}
              className="flex items-center gap-1 text-xs font-bold text-secondary hover:text-primary transition-colors"
            >
              Ir al punto de venta <ArrowUpRight size={14} />
            </button>
          </div>

          {!isRegisterOpen ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-3 border-2 border-dashed border-surface-container-high rounded-2xl bg-surface/40">
              <Store size={36} className="text-outline" />
              <p className="font-body text-sm font-medium text-on-surface-variant max-w-xs">
                No tienes un turno de caja abierto. Ábrelo desde el punto de venta para empezar a registrar ventas.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Cobros del turno por método de pago
                </p>
                {resumenCaja && Object.keys(resumenCaja.desglose ?? {}).length > 0 ? (
                  Object.entries(resumenCaja.desglose).map(([metodo, monto]) => (
                    <div key={metodo} className="flex items-center justify-between text-sm px-3 py-2 rounded-xl bg-surface/60">
                      <span className="text-on-surface-variant">{metodo.replace(/_/g, " ").toLowerCase()}</span>
                      <span className="font-bold text-on-surface tabular-nums">{money(monto)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-on-surface-variant italic px-3 py-2">Aún no has registrado cobros en este turno.</p>
                )}
              </div>

              <div className="rounded-2xl bg-primary/5 p-4 flex flex-col justify-center gap-2">
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Apertura</span>
                  <span className="font-bold tabular-nums">{money(resumenCaja?.montoApertura ?? turno?.montoApertura)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Cobrado ({resumenCaja?.totalTransacciones ?? 0})</span>
                  <span className="font-bold tabular-nums">{money(resumenCaja?.montoVentasTotal)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-outline-variant/40 pt-2">
                  <span className="font-bold text-on-surface">Debe cerrar con</span>
                  <span className="font-black text-primary tabular-nums">{money(resumenCaja?.montoCierreEsperado)}</span>
                </div>
                <p className="text-[11px] text-outline leading-snug">
                  Incluye todos los métodos de cobro registrados (efectivo, tarjetas, transferencias y billeteras).
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Disponibilidad del menú para cocina: sin cifras económicas */}
      {tieneWidget(config, "menu-disponibilidad") && (
        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/15 shadow-sm flex flex-col">
          <div className="flex items-center gap-2.5 mb-4">
            <ChefHat size={18} className="text-primary" />
            <h3 className="font-headline text-base font-bold text-primary">Productos que no se pueden preparar</h3>
            {noDisponibles.length > 0 && (
              <span className="text-[11px] font-black text-on-error bg-error rounded-full min-w-[22px] h-5 px-1.5 flex items-center justify-center">
                {noDisponibles.length}
              </span>
            )}
          </div>
          <div className="space-y-2 max-h-[320px] overflow-y-auto custom-scrollbar pr-1 -mr-1">
            {noDisponibles.length === 0 ? (
              <div className="min-h-[180px] flex items-center justify-center border-2 border-dashed border-surface-container-high rounded-2xl bg-surface/40">
                <div className="text-center space-y-2 opacity-60">
                  <CheckCircle2 size={36} className="mx-auto text-secondary" />
                  <p className="font-body text-sm font-medium text-on-surface-variant">Todo el menú está disponible.</p>
                </div>
              </div>
            ) : (
              noDisponibles.map((a) => (
                <div key={a.item_id} className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border bg-error-container/20 border-error/20">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-error/10 text-error">
                      <XCircle size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-primary truncate">{a.nombre}</p>
                      <p className="text-[10px] text-outline uppercase tracking-wider font-bold truncate">{a.mensaje}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Gráficas + alertas de inventario */}
      {(tieneWidget(config, "inventory-donut") || tieneWidget(config, "inventory-alerts")) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {tieneWidget(config, "inventory-donut") && (
            <div className={`bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/15 shadow-sm flex flex-col ${tieneWidget(config, "inventory-alerts") ? "" : "lg:col-span-3"}`}>
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
          )}

          {tieneWidget(config, "inventory-alerts") && (
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
          )}
        </div>
      )}

      {/* Rol sin bloques asignados */}
      {config.widgets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3 border-2 border-dashed border-surface-container-high rounded-3xl bg-surface/40">
          <Package size={40} className="text-outline" />
          <p className="font-body text-sm font-medium text-on-surface-variant max-w-sm">{config.subtitulo}</p>
        </div>
      )}
    </div>
  );
}
