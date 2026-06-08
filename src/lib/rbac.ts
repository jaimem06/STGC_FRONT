/**
 * Configuración de Control de Acceso Basado en Roles (RBAC)
 * Define los roles y sus rutas permitidas dentro de la aplicación basándose en los datos reales de la BD.
 */

export const ROLES = {
  // Roles Principales solicitados
  ADMIN: "ADMIN",
  GERENTE_GENERAL: "GERENTE_GENERAL",
  GERENTE_OPERACIONES: "GERENTE_OPERACIONES",
  
  // Otros roles detectados en la BD
  TECNICO_SEMBRADO: "TECNICO_SEMBRADO",
  CONTROLADOR_DESPACHO: "CONTROLADOR_DESPACHO",
  TECNICO_ALMACENAMIENTO: "TECNICO_ALMACENAMIENTO",
  CAPATAZ: "CAPATAZ",
  CAJERO_MESERO: "CAJERO_MESERO",
  CLASIFICADOR: "CLASIFICADOR",
  GESTOR_INVENTARIO: "GESTOR_INVENTARIO",
  RECOLECTOR: "RECOLECTOR",
  PERSONAL_COCINA: "PERSONAL_COCINA",
  ENCARGADO_SECADO: "ENCARGADO_SECADO",
  GESTOR_CALIDAD: "GESTOR_CALIDAD",
  TECNICO_DESPULPADO: "TECNICO_DESPULPADO",
  SEMBRADOR: "SEMBRADOR",
  TOSTADOR: "TOSTADOR",
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
];

const OPERACIONES_ACCESS = [
  "/dashboard/users",
  "/dashboard/pos",
];

// Mapeo de permisos por rol exacto de la base de datos
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [ROLES.ADMIN]: FULL_ACCESS,
  [ROLES.GERENTE_GENERAL]: FULL_ACCESS,
  [ROLES.GERENTE_OPERACIONES]: OPERACIONES_ACCESS,
  
  // Habilitamos acceso a gestión de roles para el CAPATAZ
  [ROLES.CAPATAZ]: ["/dashboard", "/dashboard/roles"],
  
  [ROLES.GESTOR_INVENTARIO]: ["/dashboard", "/dashboard/inventory"],
  [ROLES.GESTOR_CALIDAD]: ["/dashboard", "/dashboard/traceability"],
  [ROLES.CAJERO_MESERO]: ["/dashboard", "/dashboard/pos"],
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
  
  return allowedPaths.some(allowedPath => 
    path === allowedPath || path.startsWith(`${allowedPath}/`)
  );
}

/**
 * Retorna la página de destino predeterminada para un rol dado.
 */
export function getDefaultRoute(roleName: string | undefined): string {
  if (!roleName) return "/login";
  
  const normalizedRole = normalizeRole(roleName);
  
  if (normalizedRole === ROLES.GERENTE_OPERACIONES) return "/dashboard/users";
  
  if (normalizedRole === ROLES.ADMIN || normalizedRole === ROLES.GERENTE_GENERAL) return "/dashboard";
  
  if (normalizedRole === ROLES.CAPATAZ) return "/dashboard/roles";
  
  if (normalizedRole === ROLES.CAJERO_MESERO) return "/dashboard/pos";

  // Fallback: primera ruta permitida o login
  const firstAllowed = ROLE_PERMISSIONS[normalizedRole]?.[0];
  return firstAllowed || "/login";
}
