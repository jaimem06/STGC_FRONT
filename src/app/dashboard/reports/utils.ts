/** Formatea un número como moneda en dólares (USD). */
export const money = (value: number | null | undefined) =>
  `$${(typeof value === "number" ? value : 0).toLocaleString("es-EC", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/** Formatea un número entero/decimal con separadores de miles. */
export const num = (value: number | null | undefined) =>
  (typeof value === "number" ? value : 0).toLocaleString("es-EC", {
    maximumFractionDigits: 2,
  });

/** Formatea una fecha ISO a "dd/mm/aaaa hh:mm". */
export const formatDateTime = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("es-EC", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/** Formatea una fecha ISO (o etiqueta de período) a "dd/mm/aaaa" sin hora. */
export const formatDate = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/** Convierte "cadena.to_datetime" a límites de día para el filtro (inicio/fin). */
export const toIsoStart = (dateStr: string) =>
  dateStr ? new Date(`${dateStr}T00:00:00`).toISOString() : undefined;
export const toIsoEnd = (dateStr: string) =>
  dateStr ? new Date(`${dateStr}T23:59:59`).toISOString() : undefined;

/** Filtra una fecha ISO contra un rango [from, to] (ambos opcionales, formato yyyy-mm-dd). */
export const withinRange = (iso: string, from: string, to: string) => {
  if (!from && !to) return true;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return true;
  if (from && t < new Date(`${from}T00:00:00`).getTime()) return false;
  if (to && t > new Date(`${to}T23:59:59`).getTime()) return false;
  return true;
};

/** Normaliza texto para búsquedas (minúsculas, sin acentos). */
export const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
