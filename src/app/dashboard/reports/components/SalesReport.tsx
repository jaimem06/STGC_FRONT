"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, ChevronRight } from "lucide-react";
import { useReportStore, Periodo } from "@/store/reportStore";
import {
  reportApi,
  VentaReport,
  VentaEmpleadoReport,
  VentaEmpleadoDetalleReport,
  exportToCsv,
  exportToPdf,
} from "@/lib/report-service";
import { toast } from "@/lib/notifications";
import DataTable, { Column } from "./DataTable";
import ReportToolbar from "./ReportToolbar";
import { money, num, formatDateTime, formatDate, normalize, withinRange, toIsoStart, toIsoEnd } from "../utils";

type SubView = "detalle" | "periodo" | "producto" | "empleado";

const SUB_VIEWS: { key: SubView; label: string }[] = [
  { key: "detalle", label: "Detalle" },
  { key: "periodo", label: "Por período" },
  { key: "producto", label: "Por producto" },
  { key: "empleado", label: "Por empleado" },
];

const PERIODOS: { key: Periodo; label: string }[] = [
  { key: "dia", label: "Día" },
  { key: "semana", label: "Semana" },
  { key: "mes", label: "Mes" },
];

export default function SalesReport() {
  const {
    sales,
    byPeriod,
    byProduct,
    byEmployee,
    loadingSales,
    loadingAnalytics,
    fetchSales,
    fetchAnalytics,
  } = useReportStore();

  const [subView, setSubView] = useState<SubView>("detalle");
  const [periodo, setPeriodo] = useState<Periodo>("dia");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // Drill-down: detalle de ventas de un empleado.
  const [selectedEmployee, setSelectedEmployee] = useState<VentaEmpleadoReport | null>(null);
  const [employeeDetail, setEmployeeDetail] = useState<VentaEmpleadoDetalleReport[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchSales().catch(() => toast.error("No se pudo cargar el reporte de ventas."));
  }, [fetchSales]);

  // El backend honra fecha_inicio/fecha_fin en las vistas analíticas.
  const loadAnalytics = useCallback(() => {
    fetchAnalytics(periodo, {
      fecha_inicio: toIsoStart(from),
      fecha_fin: toIsoEnd(to),
    }).catch(() => toast.error("No se pudieron cargar las analíticas de ventas."));
  }, [fetchAnalytics, periodo, from, to]);

  useEffect(() => {
    if (subView !== "detalle") loadAnalytics();
  }, [subView, loadAnalytics]);

  // El backend ignora los filtros de fecha en /reports/sales, por eso el
  // detalle se filtra en el cliente para que el rango sea funcional.
  const filteredSales = useMemo(() => {
    const q = normalize(search);
    return sales.filter((s) => {
      const matchesSearch = !q || normalize(`${s.producto} ${s.empleado}`).includes(q);
      const matchesDate = withinRange(s.fecha, from, to);
      return matchesSearch && matchesDate;
    });
  }, [sales, search, from, to]);

  const openEmployeeDetail = async (emp: VentaEmpleadoReport) => {
    if (!emp.empleado_id) {
      toast.info("Este empleado no tiene un identificador asociado.");
      return;
    }
    setSelectedEmployee(emp);
    setLoadingDetail(true);
    try {
      const res = await reportApi.getSalesByEmployeeId(emp.empleado_id, {
        fecha_inicio: toIsoStart(from),
        fecha_fin: toIsoEnd(to),
      });
      setEmployeeDetail(res.data);
    } catch {
      setEmployeeDetail([]);
      toast.error("No se pudo cargar el detalle del empleado.");
    } finally {
      setLoadingDetail(false);
    }
  };

  // ---- Definición de columnas por sub-vista ----
  const detalleColumns: Column<VentaReport>[] = [
    { key: "fecha", header: "Fecha", render: (r) => <span className="text-on-surface-variant whitespace-nowrap">{formatDateTime(r.fecha)}</span> },
    { key: "producto", header: "Producto", primary: true, render: (r) => <span className="font-semibold">{r.producto}</span> },
    { key: "empleado", header: "Empleado", render: (r) => r.empleado },
    { key: "cantidad", header: "Cant.", align: "right", render: (r) => num(r.cantidad) },
    { key: "precio_unitario", header: "P. Unit.", align: "right", render: (r) => money(r.precio_unitario) },
    { key: "subtotal", header: "Subtotal", align: "right", render: (r) => money(r.subtotal) },
    { key: "total", header: "Total", align: "right", render: (r) => <span className="font-bold text-primary">{money(r.total)}</span> },
  ];

  const periodoColumns: Column<(typeof byPeriod)[number]>[] = [
    { key: "periodo", header: "Período", primary: true, render: (r) => <span className="font-semibold">{formatDate(r.periodo)}</span> },
    { key: "numero_ventas", header: "N.º ventas", align: "right", render: (r) => num(r.numero_ventas) },
    { key: "total_productos_vendidos", header: "Productos", align: "right", render: (r) => num(r.total_productos_vendidos) },
    { key: "total_ventas", header: "Total", align: "right", render: (r) => <span className="font-bold text-primary">{money(r.total_ventas)}</span> },
  ];

  const productoColumns: Column<(typeof byProduct)[number]>[] = [
    { key: "producto_nombre", header: "Producto", primary: true, render: (r) => <span className="font-semibold">{r.producto_nombre}</span> },
    { key: "total_vendido", header: "Vendido", align: "right", render: (r) => num(r.total_vendido) },
    { key: "numero_ventas", header: "N.º ventas", align: "right", render: (r) => num(r.numero_ventas) },
    { key: "total_ingresos", header: "Ingresos", align: "right", render: (r) => <span className="font-bold text-primary">{money(r.total_ingresos)}</span> },
  ];

  const empleadoColumns: Column<VentaEmpleadoReport>[] = [
    { key: "empleado_nombre", header: "Empleado", primary: true, render: (r) => <span className="font-semibold">{r.empleado_nombre}</span> },
    { key: "numero_ventas", header: "N.º ventas", align: "right", render: (r) => num(r.numero_ventas) },
    { key: "total_productos_vendidos", header: "Productos", align: "right", render: (r) => num(r.total_productos_vendidos) },
    { key: "total_ventas", header: "Total", align: "right", render: (r) => <span className="font-bold text-primary">{money(r.total_ventas)}</span> },
    {
      key: "accion",
      header: "",
      align: "center",
      hideOnMobile: false,
      render: (r) =>
        r.empleado_id ? (
          <button
            onClick={() => openEmployeeDetail(r)}
            className="inline-flex items-center gap-1 text-xs font-bold text-secondary hover:text-primary transition-colors"
          >
            Ver <ChevronRight size={14} />
          </button>
        ) : (
          <span className="text-xs text-outline">—</span>
        ),
    },
  ];

  // ---- Constructores de filas para exportación ----
  const buildExport = (): { title: string; rows: Record<string, string | number>[] } => {
    switch (subView) {
      case "periodo":
        return {
          title: `Ventas por ${periodo}`,
          rows: byPeriod.map((r) => ({
            Período: formatDate(r.periodo),
            "N.º ventas": r.numero_ventas,
            Productos: r.total_productos_vendidos,
            Total: r.total_ventas,
          })),
        };
      case "producto":
        return {
          title: "Ventas por Producto",
          rows: byProduct.map((r) => ({
            Producto: r.producto_nombre,
            "Total vendido": r.total_vendido,
            "N.º ventas": r.numero_ventas,
            "Total ingresos": r.total_ingresos,
          })),
        };
      case "empleado":
        return {
          title: "Ventas por Empleado",
          rows: byEmployee.map((r) => ({
            Empleado: r.empleado_nombre,
            "N.º ventas": r.numero_ventas,
            "Productos vendidos": r.total_productos_vendidos,
            "Total ventas": r.total_ventas,
          })),
        };
      default:
        return {
          title: "Reporte de Ventas",
          rows: filteredSales.map((r) => ({
            Fecha: formatDateTime(r.fecha),
            Producto: r.producto,
            Empleado: r.empleado,
            Cantidad: r.cantidad,
            "Precio unitario": r.precio_unitario,
            Subtotal: r.subtotal,
            Total: r.total,
          })),
        };
    }
  };

  const currentRows =
    subView === "detalle"
      ? filteredSales.length
      : subView === "periodo"
      ? byPeriod.length
      : subView === "producto"
      ? byProduct.length
      : byEmployee.length;

  const isLoading = subView === "detalle" ? loadingSales : loadingAnalytics;

  return (
    <div className="animate-fade-in">
      {/* Sub-navegación */}
      <div className="flex gap-1 p-1 mb-4 bg-surface-container rounded-2xl w-full sm:w-fit overflow-x-auto no-scrollbar">
        {SUB_VIEWS.map((v) => (
          <button
            key={v.key}
            onClick={() => setSubView(v.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              subView === v.key
                ? "bg-surface-container-lowest text-primary shadow-sm"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <ReportToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar producto o empleado..."
        dateRange={{
          from,
          to,
          onChange: (f, t) => {
            setFrom(f);
            setTo(t);
          },
        }}
        onExportCsv={() => {
          const { title, rows } = buildExport();
          return exportToCsv(title, rows);
        }}
        onExportPdf={() => {
          const { title, rows } = buildExport();
          return exportToPdf(title, rows);
        }}
        disabled={currentRows === 0}
      />

      {/* Selector de período (sólo en la vista "Por período") */}
      {subView === "periodo" && (
        <div className="flex gap-2 mb-4">
          {PERIODOS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriodo(p.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                periodo === p.key
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {subView === "detalle" && (
        <DataTable columns={detalleColumns} rows={filteredSales} rowKey={(r, i) => `${r.venta_id}-${i}`} loading={isLoading} emptyMessage="No hay ventas que coincidan con los filtros." resetKey={`${search}|${from}|${to}`} />
      )}
      {subView === "periodo" && (
        <DataTable columns={periodoColumns} rows={byPeriod} rowKey={(r, i) => `${r.periodo}-${i}`} loading={isLoading} emptyMessage="No hay ventas registradas en este período." resetKey={`${periodo}|${from}|${to}`} />
      )}
      {subView === "producto" && (
        <DataTable columns={productoColumns} rows={byProduct} rowKey={(r, i) => `${r.producto_id}-${i}`} loading={isLoading} emptyMessage="No hay ventas por producto para mostrar." resetKey={`${from}|${to}`} />
      )}
      {subView === "empleado" && (
        <DataTable columns={empleadoColumns} rows={byEmployee} rowKey={(r, i) => `${r.empleado_nombre}-${i}`} loading={isLoading} emptyMessage="No hay ventas por empleado para mostrar." resetKey={`${from}|${to}`} />
      )}

      {/* Drill-down: detalle del empleado seleccionado (portalizado como los
          modales globales, con el mismo difuminado que el Dialog de inventario) */}
      {selectedEmployee &&
        createPortal(
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setSelectedEmployee(null)} />
          <div className="relative z-[101] bg-surface w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-[0_12px_48px_rgba(31,27,20,0.28)] ring-1 ring-black/[0.04] max-h-[88vh] flex flex-col animate-slide-up sm:animate-in sm:fade-in sm:zoom-in-95 sm:duration-200">
            <div className="flex items-start justify-between p-5 border-b border-outline-variant/20">
              <div>
                <h3 className="font-headline text-lg font-bold text-primary">{selectedEmployee.empleado_nombre}</h3>
                <p className="text-sm text-on-surface-variant">
                  {num(selectedEmployee.numero_ventas)} ventas · {money(selectedEmployee.total_ventas)}
                </p>
              </div>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 overflow-auto">
              <DataTable
                columns={[
                  { key: "fecha", header: "Fecha", render: (r: VentaEmpleadoDetalleReport) => <span className="whitespace-nowrap">{formatDateTime(r.fecha)}</span> },
                  { key: "producto", header: "Producto", primary: true, render: (r: VentaEmpleadoDetalleReport) => <span className="font-semibold">{r.producto}</span> },
                  { key: "cantidad", header: "Cant.", align: "right", render: (r: VentaEmpleadoDetalleReport) => num(r.cantidad) },
                  { key: "subtotal", header: "Subtotal", align: "right", render: (r: VentaEmpleadoDetalleReport) => money(r.subtotal) },
                  { key: "total", header: "Total", align: "right", render: (r: VentaEmpleadoDetalleReport) => <span className="font-bold text-primary">{money(r.total)}</span> },
                ]}
                rows={employeeDetail}
                rowKey={(r, i) => `${r.venta_id}-${i}`}
                loading={loadingDetail}
                pageSize={8}
                emptyMessage="Sin ventas en el rango seleccionado."
              />
            </div>
          </div>
        </div>,
          document.body
        )}
    </div>
  );
}
