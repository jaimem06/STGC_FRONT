"use client";

import { useEffect, useState } from "react";
import Dialog from "@/components/Dialog";
import { inventoryApi } from "@/lib/inventory-service";
import { HistorialEstado, InventarioItem } from "@/lib/schemas";
import { toast } from "@/lib/notifications";
import { ArrowRight } from "lucide-react";

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventarioItem | null;
}

/** HU025: Línea de tiempo de cambios de estado de un producto. */
export default function StatusHistoryModal({ isOpen, onOpenChange, item }: Props) {
  const [history, setHistory] = useState<HistorialEstado[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !item) return;
    setLoading(true);
    inventoryApi
      .listStatusHistory(item.id)
      .then((res) => setHistory(res.data))
      .catch(() => toast.error("No se pudo cargar el historial de estados."))
      .finally(() => setLoading(false));
  }, [isOpen, item]);

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange} title="Historial de Estados">
      <div className="space-y-3">
        <p className="text-[11px] font-bold text-outline uppercase tracking-widest">{item?.nombre}</p>
        <div className="max-h-[340px] overflow-y-auto border border-outline-variant/20 rounded-2xl divide-y divide-outline-variant/10">
          {loading && <div className="p-8 text-center text-[10px] font-bold text-outline uppercase">Cargando...</div>}
          {!loading && history.length === 0 && (
            <div className="p-10 text-center text-[10px] font-bold text-outline uppercase tracking-widest">Sin cambios de estado registrados</div>
          )}
          {history.map((h) => (
            <div key={h.id} className="p-4 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-xs font-black text-primary">
                <span className="uppercase">{h.estado_anterior.replace("_", " ")}</span>
                <ArrowRight size={13} className="text-outline" />
                <span className="uppercase">{h.estado_nuevo.replace("_", " ")}</span>
              </div>
              <span className="text-[11px] font-medium text-outline">{new Date(h.fecha).toLocaleString()}</span>
              {h.motivo && <span className="text-[9px] text-outline italic">{h.motivo}</span>}
              {h.usuario_id && <span className="text-[9px] text-primary font-bold">Por: {h.usuario_id}</span>}
            </div>
          ))}
        </div>
      </div>
    </Dialog>
  );
}
