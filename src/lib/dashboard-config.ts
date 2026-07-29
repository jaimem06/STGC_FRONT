/**
 * Composición del dashboard según el rol del usuario.
 *
 * No todos los perfiles deben ver la misma información: un cajero no necesita
 * (ni debe recibir) alertas de inventario, y quien gestiona el inventario no
 * tiene por qué conocer la valorización económica del stock ni las ventas.
 * Aquí se declara qué bloques ve cada rol; la página solo pide al backend los
 * datos de los bloques que realmente va a renderizar.
 */

import { ROLES, normalizeRole } from "./rbac";

export type DashboardWidget =
  /** Conteos operativos del inventario: ítems, stock bajo, agotados, lotes. */
  | "inventory-kpis"
  /** Valorización económica del inventario (dato sensible de gerencia). */
  | "inventory-value"
  /** Distribución de estados del inventario (dona). */
  | "inventory-donut"
  /** Listado de alertas de stock, con enlace al inventario. */
  | "inventory-alerts"
  /** Ventas acumuladas del negocio (dato de gerencia). */
  | "sales-global"
  /** Arqueo del turno de caja del propio usuario. */
  | "caja-turno"
  /** Disponibilidad del menú para cocina: qué no se puede preparar hoy. */
  | "menu-disponibilidad";

export interface DashboardConfig {
  /** Encabezado de la pantalla, orientado a la tarea del rol. */
  titulo: string;
  subtitulo: string;
  widgets: DashboardWidget[];
}

const GERENCIA: DashboardConfig = {
  titulo: "Panel de gerencia",
  subtitulo: "Ventas acumuladas, valorización y salud del inventario.",
  widgets: ["sales-global", "inventory-kpis", "inventory-value", "inventory-donut", "inventory-alerts"],
};

const CONFIGURACIONES: Record<string, DashboardConfig> = {
  [ROLES.ADMIN]: GERENCIA,
  [ROLES.GERENTE_GENERAL]: GERENCIA,
  [ROLES.GERENTE_OPERACIONES]: GERENCIA,

  // Operación del inventario: conteos, estados y alertas, sin cifras de
  // valorización ni de ventas.
  [ROLES.GESTOR_INVENTARIO]: {
    titulo: "Panel de inventario",
    subtitulo: "Existencias, estados y alertas de reposición.",
    widgets: ["inventory-kpis", "inventory-donut", "inventory-alerts"],
  },

  // El cajero solo ve su propia caja: nada de inventario ni de cifras globales.
  [ROLES.CAJERO_MESERO]: {
    titulo: "Mi caja",
    subtitulo: "Estado de tu turno y cobros registrados.",
    widgets: ["caja-turno"],
  },

  // Cocina necesita saber qué puede preparar; ninguna cifra económica.
  [ROLES.PERSONAL_COCINA]: {
    titulo: "Disponibilidad del menú",
    subtitulo: "Productos agotados o por agotarse en la cafetería.",
    widgets: ["menu-disponibilidad"],
  },
};

/** Dashboard mínimo para roles no contemplados en el mapa. */
const POR_DEFECTO: DashboardConfig = {
  titulo: "Inicio",
  subtitulo: "Usa el menú lateral para acceder a tus tareas.",
  widgets: [],
};

export function getDashboardConfig(roleName: string | undefined): DashboardConfig {
  return CONFIGURACIONES[normalizeRole(roleName)] ?? POR_DEFECTO;
}

/** True si el rol tiene permitido ver el bloque indicado. */
export function tieneWidget(config: DashboardConfig, widget: DashboardWidget): boolean {
  return config.widgets.includes(widget);
}
