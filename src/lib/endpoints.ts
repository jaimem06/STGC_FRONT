const normalizeBaseUrl = (value: string | undefined, fallback: string) => {
  const baseUrl = value?.trim() || fallback;
  return `${baseUrl.replace(/\/$/, "")}/`;
};

export const ENDPOINTS = {
  BILLING: {
    BASE_URL: normalizeBaseUrl(
      process.env.NEXT_PUBLIC_BILLING_SERVICE_URL,
      "http://localhost:3002/api/"
    ),
    MOVIMIENTO: "billing/facturas/movimiento",
    COMPROBANTES: {
      // Historial de facturas emitidas por el cajero autenticado.
      BASE: "billing/comprobantes",
      // Emite (o recupera/transiciona) la factura de un pedido. Sin pagar aún:
      // BORRADOR (formal=false, por defecto) o PENDIENTE (formal=true).
      EMITIR: (pedidoId: string) => `billing/comprobantes/${pedidoId}/emitir`,
      // Descarga el PDF de la factura bajo demanda.
      PDF: (pedidoId: string) => `billing/comprobantes/${pedidoId}/pdf`,
      // Anula o marca como reembolsada una factura ya emitida (con motivo, para auditoría).
      ANULAR: (pedidoId: string) => `billing/comprobantes/${pedidoId}/anular`,
      REEMBOLSAR: (pedidoId: string) => `billing/comprobantes/${pedidoId}/reembolsar`,
    },
  },
  AUTH: {
    BASE_URL: normalizeBaseUrl(
      process.env.NEXT_PUBLIC_AUTH_SERVICE_URL,
      process.env.NEXT_PUBLIC_AUTH_SERVICE_FALLBACK || ""
    ),
    LOGIN: "auth/login",
    ME: "auth/me",
    REGISTER: "auth/register",
    PASSWORD_RECOVERY: "auth/password-recovery",
    RESET_PASSWORD: "auth/reset-password",
    USERS: {
      BASE: "users/",
      BY_ID: (id: string) => `users/${id}`,
    },
    ROLES: {
      BASE: "roles/",
      BY_ID: (id: string) => `roles/${id}`,
    },
  },
  INVENTORY: {
    BASE_URL: normalizeBaseUrl(
      process.env.NEXT_PUBLIC_INVENTORY_SERVICE_URL,
      process.env.NEXT_PUBLIC_INVENTORY_SERVICE_FALLBACK || ""
    ),
    POS: {
      LIST: "inventario/pos",
      CREATE: "inventario/pos/nuevo",
      BY_ID: (id: string) => `inventario/pos/${id}`,
      STATUS: (id: string) => `inventario/pos/${id}/estado`,
      MOVEMENTS: "inventario/pos/movimientos",
      ITEM_MOVEMENTS: (id: string) => `inventario/pos/${id}/movimientos`,
      DELETED: "inventario/pos/eliminados",
      RESTORE: (id: string) => `inventario/pos/${id}/restaurar`,
      ALERTAS_STOCK: "inventario/pos/alertas-stock",
      STATS: "inventario/pos/stats",
      PRICE_HISTORY: (id: string) => `inventario/pos/${id}/historial-precios`,
      STATUS_HISTORY: (id: string) => `inventario/pos/${id}/historial-estados`,
    },
    FINCA: {
      LIST: "inventario/finca",
      CREATE: "inventario/finca/nuevo",
      BY_ID: (id: string) => `inventario/finca/${id}`,
      STATUS: (id: string) => `inventario/finca/${id}/estado`,
      MOVEMENTS: "inventario/finca/movimientos",
      ITEM_MOVEMENTS: (id: string) => `inventario/finca/${id}/movimientos`,
      DELETED: "inventario/finca/eliminados",
      RESTORE: (id: string) => `inventario/finca/${id}/restaurar`,
      ALERTAS_STOCK: "inventario/finca/alertas-stock",
      STATS: "inventario/finca/stats",
      PRICE_HISTORY: (id: string) => `inventario/finca/${id}/historial-precios`,
      STATUS_HISTORY: (id: string) => `inventario/finca/${id}/historial-estados`,
    },
    TRACEABILITY: {
      LOTS: "trazabilidad/lotes",
      HISTORY: (codigo: string) => `trazabilidad/historial/${codigo}`,
      TRANSITION: (id: string) => `trazabilidad/lotes/${id}/transicion`,
    },
  },
  POS_SERVICE: {
    BASE_URL: normalizeBaseUrl(
      process.env.NEXT_PUBLIC_POS_SERVICE_URL,
      process.env.NEXT_PUBLIC_POS_SERVICE_FALLBACK || ""
    ),
    PRODUCTOS: "productos",
    CAJA: {
      APERTURA: "caja/apertura",
      CIERRE: "caja/cierre",
      ESTADO: "caja/estado",
    },
    PEDIDOS: {
      BASE: "pedidos",
      BY_ID: (id: string) => `pedidos/${id}`,
      ANULAR: (id: string) => `pedidos/${id}/anular`,
      PAGAR: (id: string) => `pedidos/${id}/pagar`,
      COMPROBANTE: (id: string) => `pedidos/${id}/comprobante`,
    },
    CLIENTES: "clientes",
  },
  REPORT: {
    BASE_URL: normalizeBaseUrl(
      process.env.NEXT_PUBLIC_REPORT_SERVICE_URL,
      "https://report-service-nwpk.onrender.com"
    ),
    DASHBOARD: "reports/dashboard",
    STOCK: "reports/stock",
    MOVEMENTS: "reports/movements",
    SALES: {
      BASE: "reports/sales",
      BY_DAY: "reports/sales/by-day",
      BY_WEEK: "reports/sales/by-week",
      BY_MONTH: "reports/sales/by-month",
      BY_PRODUCT: "reports/sales/by-product",
      BY_EMPLOYEE: "reports/sales/by-employee",
      BY_EMPLOYEE_ID: (id: string) => `reports/sales/by-employee/${id}`,
      WEEKS: "reports/sales/weeks",
    },
    EXPORT: {
      CSV_FROM_DATA: "reports/export/csv/from-data",
      PDF_FROM_DATA: "reports/export/pdf/from-data",
    },
  }
} as const;
