"use client";

import { ReactNode, useMemo, useState } from "react";
import { Inbox, ChevronLeft, ChevronRight } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

export interface Column<T> {
  /** Clave única de la columna (usada como key de React). */
  key: string;
  /** Título mostrado en la cabecera. */
  header: string;
  /** Render del valor de la celda. */
  render: (row: T) => ReactNode;
  /** Alineación del contenido. */
  align?: "left" | "right" | "center";
  /** En móvil, resáltalo como valor principal de la tarjeta. */
  primary?: boolean;
  /** Oculta la columna en la vista de tarjetas (móvil). */
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  loading?: boolean;
  emptyMessage?: string;
  /** Filas por página. Si es 0 o negativo, se desactiva la paginación. */
  pageSize?: number;
  /**
   * Firma de los filtros activos. Cuando cambia, la tabla vuelve a la página 1
   * para evitar quedar en una página vacía tras filtrar.
   */
  resetKey?: string;
}

const PAGE_SIZES = [10, 25, 50];

const alignClass = (align?: "left" | "right" | "center") =>
  align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  emptyMessage = "No hay datos para mostrar.",
  pageSize = 10,
  resetKey = "",
}: DataTableProps<T>) {
  const paginated = pageSize > 0;
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(pageSize > 0 ? pageSize : PAGE_SIZES[0]);

  // Reinicio de página al cambiar filtros o tamaño, ajustando el estado durante
  // el render (patrón recomendado por React en vez de un efecto con setState).
  const signature = `${resetKey}::${size}`;
  const [prevSignature, setPrevSignature] = useState(signature);
  if (signature !== prevSignature) {
    setPrevSignature(signature);
    setPage(1);
  }

  const totalPages = paginated ? Math.max(1, Math.ceil(rows.length / size)) : 1;
  // Página efectiva acotada al rango válido (evita quedar en una página vacía
  // cuando los datos se reducen, sin necesidad de un efecto).
  const safePage = Math.min(Math.max(1, page), totalPages);

  const visibleRows = useMemo(() => {
    if (!paginated) return rows;
    const start = (safePage - 1) * size;
    return rows.slice(start, start + size);
  }, [rows, paginated, safePage, size]);

  if (loading) {
    return (
      <div className="min-h-[42vh] flex items-center justify-center">
        <LoadingSpinner size={56} message="Cargando reporte" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="min-h-[42vh] flex flex-col items-center justify-center text-center gap-3 border border-dashed border-outline-variant/50 rounded-2xl bg-surface/40 p-8">
        <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-outline">
          <Inbox size={26} />
        </div>
        <p className="font-body text-sm font-medium text-on-surface-variant max-w-xs">{emptyMessage}</p>
      </div>
    );
  }

  const primaryCol = columns.find((c) => c.primary) ?? columns[0];
  const rangeStart = paginated ? (safePage - 1) * size + 1 : 1;
  const rangeEnd = paginated ? Math.min(safePage * size, rows.length) : rows.length;

  return (
    <div className="flex flex-col">
      {/* Vista de escritorio: tabla con scroll horizontal */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-outline-variant/25 shadow-[0_1px_3px_rgba(31,27,20,0.06)]">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="bg-surface-container-high/80 backdrop-blur">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-2.5 font-label text-[11px] font-bold uppercase tracking-wider text-on-surface-variant whitespace-nowrap ${alignClass(
                    col.align
                  )}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, idx) => (
              <tr
                key={rowKey(row, idx)}
                className={`border-t border-outline-variant/15 transition-colors hover:bg-surface-container/60 ${
                  idx % 2 === 0 ? "bg-surface-container-lowest" : "bg-surface/30"
                }`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-2.5 text-on-surface align-middle ${alignClass(col.align)}`}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista móvil: tarjetas */}
      <div className="md:hidden space-y-2.5">
        {visibleRows.map((row, idx) => (
          <div
            key={rowKey(row, idx)}
            className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-3.5 shadow-[0_1px_3px_rgba(31,27,20,0.06)]"
          >
            <div className="font-headline text-base font-bold text-primary mb-2">
              {primaryCol.render(row)}
            </div>
            <dl className="space-y-1.5">
              {columns
                .filter((c) => c.key !== primaryCol.key && !c.hideOnMobile)
                .map((col) => (
                  <div key={col.key} className="flex items-center justify-between gap-3">
                    <dt className="font-label text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                      {col.header}
                    </dt>
                    <dd className="text-sm text-on-surface text-right">{col.render(row)}</dd>
                  </div>
                ))}
            </dl>
          </div>
        ))}
      </div>

      {/* Paginado */}
      {paginated && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
            <span className="font-medium">
              {rangeStart}–{rangeEnd} de {rows.length}
            </span>
            <span className="hidden sm:inline text-outline">·</span>
            <label className="hidden sm:flex items-center gap-1.5">
              <span>Mostrar</span>
              <select
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="py-1 px-2 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-xs text-on-surface focus:border-primary focus:outline-none"
              >
                {Array.from(new Set([size, ...PAGE_SIZES]))
                  .sort((a, b) => a - b)
                  .map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
              </select>
            </label>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                onClick={() => setPage(Math.max(1, safePage - 1))}
                disabled={safePage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container disabled:opacity-40 disabled:hover:bg-transparent transition-colors active:scale-95"
                aria-label="Página anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-1.5 text-xs font-bold text-on-surface tabular-nums">
                {safePage} / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, safePage + 1))}
                disabled={safePage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container disabled:opacity-40 disabled:hover:bg-transparent transition-colors active:scale-95"
                aria-label="Página siguiente"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
