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
      EXPORT: "inventario/pos/movimientos/exportar",
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
      EXPORT: "inventario/finca/movimientos/exportar",
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
    }
  }
} as const;
