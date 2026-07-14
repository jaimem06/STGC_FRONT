"use client";

import { useEffect, useState } from "react";
import Dialog from "@/components/Dialog";
import { inventoryApi } from "@/lib/inventory-service";
import { HistorialPrecio, InventarioItem } from "@/lib/schemas";
import { toast } from "@/lib/notifications";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventarioItem | null;
}

/** HU019: Bitácora histórica de precios de un producto. */
export default function PriceHistoryModal({ isOpen, onOpenChange, item }: Props) {
  const [history, setHistory] = useState<HistorialPrecio[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !item) return;
    setLoading(true);
    inventoryApi
      .listPriceHistory(item.id)
      .then((res) => setHistory(res.data))
      .catch(() => toast.error("No se pudo cargar el historial de precios."))
      .finally(() => setLoading(false));
  }, [isOpen, item]);

  const variacion = (ant: number, nuevo: number) =>
    ant === 0 ? 0 : ((nuevo - ant) / ant) * 100;

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange} title="Bitácora de Precios">
      <div className="space-y-3">
        <p className="text-[11px] font-bold text-outline uppercase tracking-widest">{item?.nombre}</p>
        <div className="max-h-[340px] overflow-y-auto border border-outline-variant/20 rounded-2xl divide-y divide-outline-variant/10">
          {loading && <div className="p-8 text-center text-[10px] font-bold text-outline uppercase">Cargando...</div>}
          {!loading && history.length === 0 && (
            <div className="p-10 text-center text-[10px] font-bold text-outline uppercase tracking-widest">Sin cambios de precio registrados</div>
          )}
          {history.map((h) => {
            const pct = variacion(h.precio_anterior, h.precio_nuevo);
            const subio = pct >= 0;
            return (
              <div key={h.id} className="p-4 flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <span className="text-[11px] font-medium text-outline">{new Date(h.fecha_cambio).toLocaleString()}</span>
                  <span className="text-xs font-bold text-primary">
                    ${h.precio_anterior.toFixed(2)} → ${h.precio_nuevo.toFixed(2)}
                  </span>
                  {h.motivo && <span className="text-[9px] text-outline italic mt-0.5">{h.motivo}</span>}
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${subio ? "bg-green-50 text-green-600" : "bg-red-50 text-error"}`}>
                  {subio ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {pct.toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Dialog>
  );
}
