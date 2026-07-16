"use client";

import { useEffect, useMemo, useState } from "react";
import { useInventoryStore } from "@/store/inventoryStore";
import { InventarioItem, TipoElementoEnum } from "@/lib/schemas";
import { exportToCsv, exportToPdf } from "@/lib/report-service";
import { toast } from "@/lib/notifications";
import DataTable, { Column } from "./DataTable";
import ReportToolbar from "./ReportToolbar";
import { num, normalize } from "../utils";

/** Etiquetas legibles para cada tipo de elemento. */
const TIPO_LABELS: Record<string, string> = {
  PRODUCTO: "Producto",
  INSUMO: "Insumo",
  CAFE_PROCESADO: "Café Procesado",
};

const tipoLabel = (tipo: string) => TIPO_LABELS[tipo] ?? tipo.toLowerCase().replace(/_/g, " ");

/** "STOCK_BAJO" -> "Stock bajo", "LIBRAS" -> "Libras". */
const prettyLabel = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1).toLowerCase().replace(/_/g, " ");

/** Estilo del badge de estado según cantidad vs stock mínimo. */
const stockTone = (item: InventarioItem) => {
  if (item.cantidad <= 0) return "bg-error/15 text-error";
  if (item.cantidad <= item.stock_minimo) return "bg-tertiary/15 text-tertiary";
  return "bg-success/15 text-success";
};

export default function StockReport() {
  // El reporte de stock se alimenta del inventory-service (fuente real, con todos
  // los tipos: Producto, Insumo y Café Procesado), no de la copia del report-service.
  const { items, loading, fetchItems } = useInventoryStore();
  const [search, setSearch] = useState("");
  const [tipo, setTipo] = useState("");
  const [estado, setEstado] = useState("");
  const [unidad, setUnidad] = useState("");

  useEffect(() => {
    fetchItems().catch(() => toast.error("No se pudo cargar el reporte de stock."));
  }, [fetchItems]);

  // Opciones de estado y unidad presentes en los datos (evita filtros vacíos).
  const estados = useMemo(
    () => Array.from(new Set(items.map((i) => i.estado).filter(Boolean))).sort(),
    [items]
  );
  const unidades = useMemo(
    () => Array.from(new Set(items.map((i) => i.unidad_medida).filter(Boolean))).sort(),
    [items]
  );

  const filtered = useMemo(() => {
    const q = normalize(search);
    return items.filter((s) => {
      const matchesSearch = !q || normalize(`${s.nombre} ${s.sku}`).includes(q);
      const matchesTipo = !tipo || s.tipo === tipo;
      const matchesEstado = !estado || s.estado === estado;
      const matchesUnidad = !unidad || s.unidad_medida === unidad;
      return matchesSearch && matchesTipo && matchesEstado && matchesUnidad;
    });
  }, [items, search, tipo, estado, unidad]);

  const columns: Column<InventarioItem>[] = [
    { key: "sku", header: "SKU", render: (r) => <span className="font-mono text-xs text-on-surface-variant">{r.sku}</span> },
    { key: "nombre", header: "Producto", primary: true, render: (r) => <span className="font-semibold">{r.nombre}</span> },
    { key: "tipo", header: "Tipo", render: (r) => <span>{tipoLabel(r.tipo)}</span> },
    { key: "cantidad", header: "Cantidad", align: "right", render: (r) => <span className="font-bold">{num(r.cantidad)}</span> },
    { key: "stock_minimo", header: "Stock mín.", align: "right", render: (r) => num(r.stock_minimo) },
    { key: "unidad_medida", header: "Unidad", render: (r) => <span className="text-on-surface-variant">{r.unidad_medida}</span> },
    {
      key: "estado",
      header: "Estado",
      align: "center",
      render: (r) => (
        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${stockTone(r)}`}>
          {r.estado.toLowerCase().replace(/_/g, " ")}
        </span>
      ),
    },
  ];

  const buildRows = () =>
    filtered.map((r) => ({
      SKU: r.sku,
      Producto: r.nombre,
      Tipo: tipoLabel(r.tipo),
      Cantidad: r.cantidad,
      "Stock mínimo": r.stock_minimo,
      Unidad: r.unidad_medida,
      Estado: r.estado,
    }));

  return (
    <div className="animate-fade-in">
      <ReportToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nombre o SKU..."
        onExportCsv={() => exportToCsv("Reporte de Stock", buildRows())}
        onExportPdf={() => exportToPdf("Reporte de Stock", buildRows())}
        disabled={filtered.length === 0}
      />

      {/* Filtros: tipo (chips fijos) + estado + unidad */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          onClick={() => setTipo("")}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            !tipo ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          Todos
        </button>
        {TipoElementoEnum.options.map((t) => (
          <button
            key={t}
            onClick={() => setTipo(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              tipo === t ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {TIPO_LABELS[t] ?? t}
          </button>
        ))}

        <span className="hidden sm:block w-px h-6 bg-outline-variant/40 mx-1" />

        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className="py-1.5 px-3 rounded-full bg-surface-container-lowest border border-outline-variant/40 text-xs font-bold text-on-surface focus:border-primary focus:outline-none transition-colors"
          aria-label="Filtrar por estado"
        >
          <option value="">Todos los estados</option>
          {estados.map((e) => (
            <option key={e} value={e}>
              {prettyLabel(e)}
            </option>
          ))}
        </select>

        <select
          value={unidad}
          onChange={(e) => setUnidad(e.target.value)}
          className="py-1.5 px-3 rounded-full bg-surface-container-lowest border border-outline-variant/40 text-xs font-bold text-on-surface focus:border-primary focus:outline-none transition-colors"
          aria-label="Filtrar por unidad"
        >
          <option value="">Todas las unidades</option>
          {unidades.map((u) => (
            <option key={u} value={u}>
              {prettyLabel(u)}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(r, i) => `${r.id}-${i}`}
        loading={loading}
        emptyMessage="No hay ítems que coincidan con los filtros."
        resetKey={`${search}|${tipo}|${estado}|${unidad}`}
      />
    </div>
  );
}
