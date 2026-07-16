import { create } from "zustand";
import {
  reportApi,
  DashboardReport,
  VentaReport,
  MovimientoReport,
  VentaPeriodoReport,
  VentaProductoReport,
  VentaEmpleadoReport,
  SalesReportFilter,
} from "@/lib/report-service";

/** Granularidad para el reporte de ventas agregadas por período. */
export type Periodo = "dia" | "semana" | "mes";

interface ReportState {
  dashboard: DashboardReport | null;
  sales: VentaReport[];
  movements: MovimientoReport[];
  byPeriod: VentaPeriodoReport[];
  byProduct: VentaProductoReport[];
  byEmployee: VentaEmpleadoReport[];

  loadingDashboard: boolean;
  loadingSales: boolean;
  loadingMovements: boolean;
  loadingAnalytics: boolean;

  fetchDashboard: () => Promise<void>;
  fetchSales: () => Promise<void>;
  fetchMovements: () => Promise<void>;
  /** Carga las tres vistas analíticas de ventas (por período, producto y empleado). */
  fetchAnalytics: (periodo: Periodo, filter?: SalesReportFilter) => Promise<void>;
}

export const useReportStore = create<ReportState>((set) => ({
  dashboard: null,
  sales: [],
  movements: [],
  byPeriod: [],
  byProduct: [],
  byEmployee: [],

  loadingDashboard: false,
  loadingSales: false,
  loadingMovements: false,
  loadingAnalytics: false,

  fetchDashboard: async () => {
    set({ loadingDashboard: true });
    try {
      const res = await reportApi.getDashboard();
      set({ dashboard: res.data });
    } finally {
      set({ loadingDashboard: false });
    }
  },

  fetchSales: async () => {
    set({ loadingSales: true });
    try {
      const res = await reportApi.getSales();
      set({ sales: res.data });
    } finally {
      set({ loadingSales: false });
    }
  },

  fetchMovements: async () => {
    set({ loadingMovements: true });
    try {
      const res = await reportApi.getMovements();
      set({ movements: res.data });
    } finally {
      set({ loadingMovements: false });
    }
  },

  fetchAnalytics: async (periodo, filter) => {
    set({ loadingAnalytics: true });
    try {
      const byPeriodCall =
        periodo === "mes"
          ? reportApi.getSalesByMonth(filter)
          : periodo === "semana"
          ? reportApi.getSalesByWeek(filter)
          : reportApi.getSalesByDay(filter);

      const [periodRes, productRes, employeeRes] = await Promise.all([
        byPeriodCall,
        reportApi.getSalesByProduct(filter),
        reportApi.getSalesByEmployee(filter),
      ]);
      set({
        byPeriod: periodRes.data,
        byProduct: productRes.data,
        byEmployee: employeeRes.data,
      });
    } finally {
      set({ loadingAnalytics: false });
    }
  },
}));
