/**
 * Configuración de Control de Acceso Basado en Roles (RBAC)
 * Define los roles y sus rutas permitidas dentro de la aplicación basándose en los datos reales de la BD.
 */

export const ROLES = {
  // Roles Principales solicitados
  ADMIN: "ADMIN",
  GERENTE_GENERAL: "GERENTE_GENERAL",
  GERENTE_OPERACIONES: "GERENTE_OPERACIONES",
  CAJERO_MESERO: "CAJERO_MESERO",
  GESTOR_INVENTARIO: "GESTOR_INVENTARIO",
  PERSONAL_COCINA: "PERSONAL_COCINA",
} as const;

/**
 * Normaliza el nombre del rol para asegurar consistencia.
 */
export function normalizeRole(roleName: string | undefined): string {
  if (!roleName) return "";
  const normalized = roleName
    .toUpperCase()
    .trim()
    .replace(/\s+/g, "_")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return normalized;
}

const FULL_ACCESS = [
  "/dashboard",
  "/dashboard/inventory",
  "/dashboard/traceability",
  "/dashboard/users",
  "/dashboard/roles",
  "/dashboard/settings",
  "/dashboard/pos",
  "/dashboard/reports",
];

// Mapeo de permisos por rol exacto de la base de datos
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [ROLES.ADMIN]: FULL_ACCESS,
  [ROLES.GERENTE_GENERAL]: FULL_ACCESS,
  [ROLES.GERENTE_OPERACIONES]: FULL_ACCESS,

  [ROLES.GESTOR_INVENTARIO]: ["/dashboard", "/dashboard/inventory", "/dashboard/reports"],
  [ROLES.CAJERO_MESERO]: ["/dashboard", "/dashboard/pos"],
  [ROLES.PERSONAL_COCINA]: ["/dashboard", "/dashboard/pos"],
};

/**
 * Verifica si un rol tiene permiso para acceder a una ruta específica.
 */
export function canAccess(roleName: string | undefined, path: string): boolean {
  if (!roleName) return false;
  
  const normalizedRole = normalizeRole(roleName);
  
  // El administrador (ADMIN) siempre tiene acceso total
  if (normalizedRole === ROLES.ADMIN) return true;

  const allowedPaths = ROLE_PERMISSIONS[normalizedRole];
  if (!allowedPaths) return false;

  return allowedPaths.some(allowedPath => {
    // La raíz "/dashboard" (que todos los roles tienen) solo concede el propio
    // dashboard, nunca actúa como comodín para las subrutas /dashboard/*.
    if (allowedPath === "/dashboard") return path === "/dashboard";
    // Las secciones sí incluyen sus subrutas (p. ej. /dashboard/inventory/123).
    return path === allowedPath || path.startsWith(`${allowedPath}/`);
  });
}

/**
 * Retorna la página de destino predeterminada para un rol dado.
 */
export function getDefaultRoute(roleName: string | undefined): string {
  if (!roleName) return "/login";
  
  const normalizedRole = normalizeRole(roleName);
  
  if (normalizedRole === ROLES.ADMIN || normalizedRole === ROLES.GERENTE_GENERAL || normalizedRole === ROLES.GERENTE_OPERACIONES) {
    return "/dashboard";
  }
  
  if (normalizedRole === ROLES.CAJERO_MESERO || normalizedRole === ROLES.PERSONAL_COCINA) {
    return "/dashboard/pos";
  }

  if (normalizedRole === ROLES.GESTOR_INVENTARIO) return "/dashboard/inventory";

  // Fallback: primera ruta permitida o login
  const firstAllowed = ROLE_PERMISSIONS[normalizedRole]?.[0];
  return firstAllowed || "/login";
}
