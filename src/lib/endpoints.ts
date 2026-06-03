const normalizeBaseUrl = (value: string | undefined, fallback: string) => {
  const baseUrl = value?.trim() || fallback;
  return `${baseUrl.replace(/\/$/, "")}/`;
};

export const ENDPOINTS = {
  AUTH: {
    BASE_URL: normalizeBaseUrl(
      process.env.NEXT_PUBLIC_AUTH_SERVICE_URL,
      "https://auth-service-w3lo.onrender.com/api"
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
      "https://inventory-service-rv4j.onrender.com"
    ),
    ITEMS: "inventario",
    ITEM_BY_ID: (id: string) => `inventario/${id}`,
    MOVEMENTS: "inventario/movimientos",
    TRACEABILITY: {
      LOTS: "trazabilidad/lotes",
      HISTORY: (codigo: string) => `trazabilidad/historial/${codigo}`,
      TRANSITION: (id: string) => `trazabilidad/lotes/${id}/transicion`,
    },
  },
} as const;
