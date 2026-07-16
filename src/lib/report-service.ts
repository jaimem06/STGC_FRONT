import { createInstance } from "./axios-config";
import { ENDPOINTS } from "./endpoints";

// ============================================
// TIPOS (espejo de los modelos del report-service)
// ============================================

/** Resumen general para tarjetas del dashboard de reportes. */
export interface DashboardReport {
  total_productos: number;
  stock_bajo: number;
  productos_agotados: number;
  total_movimientos: number;
  total_ventas: number;
}

/** HU017 - Detalle de ventas (una fila por línea de venta). */
export interface VentaReport {
  venta_id: string;
  fecha: string;
  empleado: string;
  producto: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  total: number;
}

/** HU026 - Stock actual por ítem de inventario. */
export interface StockReport {
  item_id: string;
  sku: string;
  nombre: string;
  tipo: string;
  cantidad: number;
  stock_minimo: number;
  unidad_medida: string;
  estado: string;
}

/** HU027 - Movimiento cronológico de un producto. */
export interface MovimientoReport {
  movimiento_id: string;
  item_id: string;
  producto: string;
  tipo_movimiento: string;
  cantidad: number;
  motivo: string;
  usuario_id: string | null;
  fecha: string;
}

/** Ventas agregadas por período (día, semana o mes). */
export interface VentaPeriodoReport {
  periodo: string;
  total_ventas: number;
  numero_ventas: number;
  total_productos_vendidos: number;
}

/** Ventas agregadas por producto. */
export interface VentaProductoReport {
  producto_id: string;
  producto_nombre: string;
  total_vendido: number;
  total_ingresos: number;
  numero_ventas: number;
}

/** Ventas agregadas por empleado. */
export interface VentaEmpleadoReport {
  empleado_id: string | null;
  empleado_nombre: string;
  total_ventas: number;
  numero_ventas: number;
  total_productos_vendidos: number;
}

/** Detalle de ventas de un empleado específico. */
export interface VentaEmpleadoDetalleReport {
  venta_id: string;
  fecha: string;
  producto: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  total: number;
}

/** Semana disponible con ventas (formato flexible que devuelve el backend). */
export interface SemanaDisponible {
  inicio: string;
  fin: string;
  numero_semana: number;
  año: string;
  label: string;
}

// ============================================
// FILTROS
// ============================================

export interface ReportFilter {
  fecha_inicio?: string;
  fecha_fin?: string;
  producto_id?: string;
  empleado_id?: string;
  tipo?: string;
}

export interface SalesReportFilter {
  fecha_inicio?: string;
  fecha_fin?: string;
  producto_id?: string;
  empleado_id?: string;
  periodo?: string;
}

/** Elimina claves vacías/undefined para no ensuciar el query string. */
const clean = (params?: ReportFilter | SalesReportFilter) => {
  if (!params) return undefined;
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null && value !== ""
  );
  return entries.length ? Object.fromEntries(entries) : undefined;
};

const reportInstance = createInstance(ENDPOINTS.REPORT.BASE_URL);
const R = ENDPOINTS.REPORT;

export const reportApi = {
  // Resumen
  getDashboard: () => reportInstance.get<DashboardReport>(R.DASHBOARD),

  // HU026 - Stock actual
  getStock: (filter?: ReportFilter) =>
    reportInstance.get<StockReport[]>(R.STOCK, { params: clean(filter) }),

  // HU027 - Movimientos
  getMovements: (filter?: ReportFilter) =>
    reportInstance.get<MovimientoReport[]>(R.MOVEMENTS, { params: clean(filter) }),

  // HU017 - Ventas (detalle)
  getSales: (filter?: ReportFilter) =>
    reportInstance.get<VentaReport[]>(R.SALES.BASE, { params: clean(filter) }),

  // HU017 - Ventas por período
  getSalesByDay: (filter?: SalesReportFilter) =>
    reportInstance.get<VentaPeriodoReport[]>(R.SALES.BY_DAY, { params: clean(filter) }),
  getSalesByWeek: (filter?: SalesReportFilter) =>
    reportInstance.get<VentaPeriodoReport[]>(R.SALES.BY_WEEK, { params: clean(filter) }),
  getSalesByMonth: (filter?: SalesReportFilter) =>
    reportInstance.get<VentaPeriodoReport[]>(R.SALES.BY_MONTH, { params: clean(filter) }),

  // HU017 - Ventas por producto / empleado
  getSalesByProduct: (filter?: SalesReportFilter) =>
    reportInstance.get<VentaProductoReport[]>(R.SALES.BY_PRODUCT, { params: clean(filter) }),
  getSalesByEmployee: (filter?: SalesReportFilter) =>
    reportInstance.get<VentaEmpleadoReport[]>(R.SALES.BY_EMPLOYEE, { params: clean(filter) }),
  getSalesByEmployeeId: (empleadoId: string, filter?: SalesReportFilter) =>
    reportInstance.get<VentaEmpleadoDetalleReport[]>(R.SALES.BY_EMPLOYEE_ID(empleadoId), {
      params: clean(filter),
    }),

  // Semanas con ventas
  getAvailableWeeks: () => reportInstance.get<SemanaDisponible[]>(R.SALES.WEEKS),
};

// ============================================
// EXPORTACIONES
// ============================================
//
// El backend hace match case-insensitive entre cada encabezado y las claves
// de cada objeto de `data`. Por eso construimos las filas con claves iguales a
// los encabezados legibles que queremos ver en el archivo final.

type ExportRow = Record<string, string | number>;

/**
 * Descarga un CSV generado por el report-service a partir de los datos que se
 * están mostrando en pantalla.
 */
export const exportToCsv = async (
  title: string,
  rows: ExportRow[],
  filename?: string
): Promise<void> => {
  if (!rows.length) throw new Error("No hay datos para exportar");
  const headers = Object.keys(rows[0]);

  const response = await reportInstance.post(
    R.EXPORT.CSV_FROM_DATA,
    { title, headers, data: rows, filename },
    { responseType: "blob" }
  );

  const url = window.URL.createObjectURL(new Blob([response.data], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute(
    "download",
    filename || `${title.replace(/\s+/g, "_").toLowerCase()}_${new Date().toISOString().split("T")[0]}.csv`
  );
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

/**
 * Genera el reporte imprimible (HTML con botón "Imprimir / Guardar PDF") en el
 * report-service y lo abre en una nueva pestaña para que el usuario lo imprima
 * o lo guarde como PDF desde el navegador.
 */
export const exportToPdf = async (title: string, rows: ExportRow[]): Promise<void> => {
  if (!rows.length) throw new Error("No hay datos para exportar");
  const headers = Object.keys(rows[0]);

  const response = await reportInstance.post<string>(
    R.EXPORT.PDF_FROM_DATA,
    { title, headers, data: rows },
    { responseType: "text" }
  );

  const blob = new Blob([response.data], { type: "text/html" });
  const url = window.URL.createObjectURL(blob);
  const tab = window.open(url, "_blank");
  if (!tab) {
    // Popup bloqueado: liberamos la URL y avisamos vía excepción.
    window.URL.revokeObjectURL(url);
    throw new Error("El navegador bloqueó la ventana emergente. Habilita los pop-ups para exportar a PDF.");
  }
};
