"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useReportStore } from "@/store/reportStore";
import { MovimientoReport as MovRow, exportToCsv, exportToPdf } from "@/lib/report-service";
import { toast } from "@/lib/notifications";
import DataTable, { Column } from "./DataTable";
import ReportToolbar from "./ReportToolbar";
import { num, formatDateTime, normalize, withinRange } from "../utils";

/** Heurística: los movimientos de entrada suman stock; el resto lo reduce. */
const isEntrada = (tipo: string) => {
  const t = tipo.toUpperCase();
  return t.includes("ENTRADA") || t.includes("INGRESO") || t.includes("COMPRA") || t.includes("AJUSTE_POSITIVO");
};

export default function MovementsReport() {
  const { movements, loadingMovements, fetchMovements } = useReportStore();
  const [search, setSearch] = useState("");
  const [tipo, setTipo] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    fetchMovements().catch(() => toast.error("No se pudo cargar el reporte de movimientos."));
  }, [fetchMovements]);

  const tipos = useMemo(
    () => Array.from(new Set(movements.map((m) => m.tipo_movimiento).filter(Boolean))).sort(),
    [movements]
  );

  const filtered = useMemo(() => {
    const q = normalize(search);
    return movements.filter((m) => {
      const matchesSearch = !q || normalize(`${m.producto} ${m.motivo}`).includes(q);
      const matchesTipo = !tipo || m.tipo_movimiento === tipo;
      const matchesDate = withinRange(m.fecha, from, to);
      return matchesSearch && matchesTipo && matchesDate;
    });
  }, [movements, search, tipo, from, to]);

  const columns: Column<MovRow>[] = [
    { key: "fecha", header: "Fecha", render: (r) => <span className="text-on-surface-variant whitespace-nowrap">{formatDateTime(r.fecha)}</span> },
    { key: "producto", header: "Producto", primary: true, render: (r) => <span className="font-semibold">{r.producto}</span> },
    {
      key: "tipo",
      header: "Tipo",
      align: "center",
      render: (r) => {
        const entrada = isEntrada(r.tipo_movimiento);
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${
              entrada ? "bg-success/15 text-success" : "bg-error/15 text-error"
            }`}
          >
            {entrada ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
            {r.tipo_movimiento.toLowerCase().replace(/_/g, " ")}
          </span>
        );
      },
    },
    {
      key: "cantidad",
      header: "Cantidad",
      align: "right",
      render: (r) => (
        <span className={`font-bold ${isEntrada(r.tipo_movimiento) ? "text-success" : "text-error"}`}>
          {isEntrada(r.tipo_movimiento) ? "+" : "−"}
          {num(r.cantidad)}
        </span>
      ),
    },
    { key: "motivo", header: "Motivo", render: (r) => <span className="text-on-surface-variant">{r.motivo || "—"}</span> },
  ];

  const buildRows = () =>
    filtered.map((r) => ({
      Fecha: formatDateTime(r.fecha),
      Producto: r.producto,
      Tipo: r.tipo_movimiento,
      Cantidad: r.cantidad,
      Motivo: r.motivo || "—",
    }));

  return (
    <div className="animate-fade-in">
      <ReportToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por producto o motivo..."
        dateRange={{
          from,
          to,
          onChange: (f, t) => {
            setFrom(f);
            setTo(t);
          },
        }}
        onExportCsv={() => exportToCsv("Reporte de Movimientos", buildRows())}
        onExportPdf={() => exportToPdf("Reporte de Movimientos", buildRows())}
        disabled={filtered.length === 0}
      />

      {tipos.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setTipo("")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              !tipo ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            Todos
          </button>
          {tipos.map((t) => (
            <button
              key={t}
              onClick={() => setTipo(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${
                tipo === t ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {t.toLowerCase().replace(/_/g, " ")}
            </button>
          ))}
        </div>
      )}

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(r, i) => `${r.movimiento_id}-${i}`}
        loading={loadingMovements}
        emptyMessage="No hay movimientos que coincidan con los filtros."
        resetKey={`${search}|${tipo}|${from}|${to}`}
      />
    </div>
  );
}
