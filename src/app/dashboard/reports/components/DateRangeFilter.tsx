"use client";

import { X } from "lucide-react";

interface DateRangeFilterProps {
  from: string;
  to: string;
  /** Actualiza ambos límites a la vez (yyyy-mm-dd, cadena vacía = sin límite). */
  onChange: (from: string, to: string) => void;
}

/** Devuelve una fecha local en formato yyyy-mm-dd (sin desfase de zona horaria). */
const fmt = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function DateRangeFilter({ from, to, onChange }: DateRangeFilterProps) {
  const today = new Date();
  const todayStr = fmt(today);

  const daysAgo = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1));
    return fmt(d);
  };
  const monthStart = () => fmt(new Date(today.getFullYear(), today.getMonth(), 1));

  const presets = [
    { key: "hoy", label: "Hoy", from: todayStr, to: todayStr },
    { key: "7", label: "7 días", from: daysAgo(7), to: todayStr },
    { key: "30", label: "30 días", from: daysAgo(30), to: todayStr },
    { key: "mes", label: "Este mes", from: monthStart(), to: todayStr },
  ];

  const hasRange = Boolean(from || to);
  const activePreset =
    presets.find((p) => p.from === from && p.to === to)?.key ?? (!hasRange ? "todo" : null);

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
      active
        ? "bg-primary text-on-primary shadow-sm"
        : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
    }`;

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-2 p-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/25">
      {/* Presets rápidos */}
      <span className="text-[11px] font-bold uppercase tracking-wider text-outline">Rango</span>
      {presets.map((p) => (
        <button key={p.key} type="button" onClick={() => onChange(p.from, p.to)} className={chip(activePreset === p.key)}>
          {p.label}
        </button>
      ))}
      <button type="button" onClick={() => onChange("", "")} className={chip(activePreset === "todo")}>
        Todo
      </button>

      {/* Separador visual entre presets y selección manual */}
      <span className="hidden sm:block w-px h-6 bg-outline-variant/40 mx-1" />

      {/* Selección manual (en la misma fila que los presets) */}
      <label className="flex items-center gap-1.5 text-xs font-medium text-on-surface-variant">
        <span className="shrink-0">Desde</span>
        <input
          type="date"
          value={from}
          max={to || todayStr}
          onChange={(e) => onChange(e.target.value, to)}
          className="min-w-0 w-[9.5rem] py-2 px-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-sm text-on-surface focus:border-primary focus:outline-none transition-colors"
        />
      </label>
      <label className="flex items-center gap-1.5 text-xs font-medium text-on-surface-variant">
        <span className="shrink-0">Hasta</span>
        <input
          type="date"
          value={to}
          min={from || undefined}
          max={todayStr}
          onChange={(e) => onChange(from, e.target.value)}
          className="min-w-0 w-[9.5rem] py-2 px-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-sm text-on-surface focus:border-primary focus:outline-none transition-colors"
        />
      </label>
      {hasRange && (
        <button
          type="button"
          onClick={() => onChange("", "")}
          className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container hover:text-error transition-colors"
        >
          <X size={14} /> Limpiar
        </button>
      )}
    </div>
  );
}
