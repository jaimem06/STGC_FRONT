import { create } from "zustand";
import { inventoryApi } from "@/lib/inventory-service";
import { InventarioItem, StockStats, AlertaStock } from "@/lib/schemas";

interface InventoryState {
  items: InventarioItem[];
  deletedItems: InventarioItem[];
  stats: StockStats | null;
  alertas: AlertaStock[];
  loading: boolean;
  /** Carga el inventario activo. Propaga el error para que la vista lo maneje. */
  fetchItems: () => Promise<void>;
  /** Carga los ítems dados de baja (papelera). */
  fetchDeleted: () => Promise<void>;
  /** Carga métricas y alertas para el dashboard. */
  fetchDashboard: () => Promise<void>;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  items: [],
  deletedItems: [],
  stats: null,
  alertas: [],
  loading: false,

  fetchItems: async () => {
    set({ loading: true });
    try {
      const res = await inventoryApi.listItems();
      set({ items: res.data });
    } finally {
      set({ loading: false });
    }
  },

  fetchDeleted: async () => {
    const res = await inventoryApi.listDeleted();
    set({ deletedItems: res.data });
  },

  fetchDashboard: async () => {
    const [statsRes, alertasRes] = await Promise.all([
      inventoryApi.getStats(),
      inventoryApi.listAlertasStock(),
    ]);
    set({ stats: statsRes.data, alertas: alertasRes.data });
  },
}));
