import { AlertaStock } from "./schemas";

/**
 * Construye el mismo mensaje categorizado de alertas de stock que usa la pantalla
 * de inventario, a partir de la lista de alertas del inventory-service.
 * Devuelve `null` cuando no hay alertas.
 */
export function buildStockAlertMessage(alertas: AlertaStock[]): string | null {
  if (!alertas.length) return null;

  const caducados = alertas.filter((a) => a.mensaje === "Producto Caducado").length;
  const agotados = alertas.filter((a) => a.mensaje === "Producto Agotado").length;
  const bajoStock = alertas.filter((a) => a.mensaje === "Stock por debajo del mínimo").length;

  const parts: string[] = [];
  if (caducados > 0) parts.push(`${caducados} caducado(s)`);
  if (agotados > 0) parts.push(`${agotados} agotado(s)`);
  if (bajoStock > 0) parts.push(`${bajoStock} con stock bajo`);

  // Fallback por si el backend usa otros textos de mensaje.
  if (parts.length === 0) parts.push(`${alertas.length} alerta(s)`);

  return `Tienes alertas: ${parts.join(", ")}.`;
}
