"use client";

import { useState } from "react";
import { Search, FileDown, FileText, Loader2 } from "lucide-react";
import { toast } from "@/lib/notifications";
import DateRangeFilter from "./DateRangeFilter";

interface ReportToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  /** Rango de fechas opcional (se muestra sólo si se pasa). */
  dateRange?: {
    from: string;
    to: string;
    onChange: (from: string, to: string) => void;
  };
  /** Construye las filas a exportar (claves = encabezados legibles). */
  onExportCsv: () => Promise<void>;
  onExportPdf: () => Promise<void>;
  disabled?: boolean;
}

export default function ReportToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  dateRange,
  onExportCsv,
  onExportPdf,
  disabled = false,
}: ReportToolbarProps) {
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);

  const run = async (kind: "csv" | "pdf", fn: () => Promise<void>) => {
    setExporting(kind);
    try {
      await fn();
      toast.success(
        kind === "csv" ? "CSV generado correctamente." : "Reporte abierto en una nueva pestaña."
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo exportar el reporte.";
      toast.error("Error al exportar", message);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex flex-col gap-2.5 mb-4">
      {/* Fila 1: búsqueda + exportaciones */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
        <div className="relative flex-1 min-w-0">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-sm text-on-surface placeholder:text-outline focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
          <button
            onClick={() => run("csv", onExportCsv)}
            disabled={disabled || exporting !== null}
            className="justify-center px-4 py-2.5 rounded-xl border border-outline-variant/50 hover:bg-surface-container text-on-surface font-bold text-sm transition-all flex items-center gap-2 disabled:opacity-50 active:scale-[0.98]"
          >
            {exporting === "csv" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <FileDown size={16} className="text-secondary" />
            )}
            CSV
          </button>
          <button
            onClick={() => run("pdf", onExportPdf)}
            disabled={disabled || exporting !== null}
            className="justify-center px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-sm transition-all shadow-[0_2px_6px_rgba(68,42,34,0.18)] hover:shadow-[0_4px_12px_rgba(68,42,34,0.24)] flex items-center gap-2 disabled:opacity-50 active:scale-[0.98]"
          >
            {exporting === "pdf" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <FileText size={16} />
            )}
            PDF
          </button>
        </div>
      </div>

      {/* Fila 2: rango de fechas (opcional) */}
      {dateRange && (
        <DateRangeFilter from={dateRange.from} to={dateRange.to} onChange={dateRange.onChange} />
      )}
    </div>
  );
}
