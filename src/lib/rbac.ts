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
  console.log(`RBAC DEBUG - normalizeRole("${roleName}") -> "${normalized}")`);
  // Mensaje traducido
  console.log(`RBAC DEPURACIÓN - normalizeRole("${roleName}") -> "${normalized}")`);
  return normalized;
}

const FULL_ACCESS = [
  "/dashboard",
  "/dashboard/inventory",
  "/dashboard/traceability",
  "/dashboard/users",
  "/dashboard/roles",
  "/dashboard/settings",
];

const OPERACIONES_ACCESS = [
  "/dashboard/users",
];

// Mapeo de permisos por rol exacto de la base de datos
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [ROLES.ADMIN]: FULL_ACCESS,
  [ROLES.GERENTE_GENERAL]: FULL_ACCESS,
  [ROLES.GERENTE_OPERACIONES]: OPERACIONES_ACCESS,
  
  // Por ahora, otros roles tienen acceso básico al dashboard si fuera necesario
  [ROLES.GESTOR_INVENTARIO]: ["/dashboard", "/dashboard/inventory"],
  [ROLES.GESTOR_CALIDAD]: ["/dashboard", "/dashboard/traceability"],
};

/**
 * Verifica si un rol tiene permiso para acceder a una ruta específica.
 */
export function canAccess(roleName: string | undefined, path: string): boolean {
  if (!roleName) {
    console.log(`RBAC DEPURACIÓN - canAccess: No se proporcionó rol para la ruta "${path}". Acceso denegado.`);
    return false;
  }
  
  const normalizedRole = normalizeRole(roleName);
  
  // El administrador (ADMIN) siempre tiene acceso total
  if (normalizedRole === ROLES.ADMIN) {
    console.log(`RBAC DEPURACIÓN - canAccess: ADMIN detectado. Acceso concedido a "${path}".`);
    return true;
  }

  const allowedPaths = ROLE_PERMISSIONS[normalizedRole];
  if (!allowedPaths) {
    console.log(`RBAC DEPURACIÓN - canAccess: No se encontraron permisos para el rol "${normalizedRole}". Acceso denegado.`);
    return false;
  }
  
  const hasAccess = allowedPaths.some(allowedPath => 
    path === allowedPath || path.startsWith(`${allowedPath}/`)
  );

  console.log(`RBAC DEPURACIÓN - canAccess: El rol "${normalizedRole}" ${hasAccess ? "TIENE" : "NO TIENE"} acceso a "${path}".`);
  return hasAccess;
}

/**
 * Retorna la página de destino predeterminada para un rol dado.
 */
export function getDefaultRoute(roleName: string | undefined): string {
  console.log(`RBAC DEPURACIÓN - getDefaultRoute llamado para el rol: "${roleName}"`);
  if (!roleName) return "/login";
  
  const normalizedRole = normalizeRole(roleName);
  
  if (normalizedRole === ROLES.GERENTE_OPERACIONES) {
    console.log("RBAC DEPURACIÓN - getDefaultRoute: Rol de operaciones detectado -> /dashboard/users");
    return "/dashboard/users";
  }
  
  if (normalizedRole === ROLES.ADMIN || normalizedRole === ROLES.GERENTE_GENERAL) {
    console.log("RBAC DEPURACIÓN - getDefaultRoute: Rol de administración/gerencia detectado -> /dashboard");
    return "/dashboard";
  }

  // Fallback: primera ruta permitida o login
  const firstAllowed = ROLE_PERMISSIONS[normalizedRole]?.[0];
  console.log(`RBAC DEPURACIÓN - getDefaultRoute fallback: "${firstAllowed || "/login"}"`);
  return firstAllowed || "/login";
}
