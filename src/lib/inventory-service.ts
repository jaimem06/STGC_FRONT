import { createInstance } from "./axios-config";
import { ENDPOINTS } from "./endpoints";
import {
  CreateInventarioItemInput,
  UpdateInventarioItemInput,
  UpdateEstadoInput,
  InventarioItem,
  CreateMovimientoInventarioInput,
  HistorialPrecio,
  HistorialEstado,
  AlertaStock,
  StockStats,
  LoteCafe,
  FaseCafe,
} from "./schemas";

export const inventoryInstance = createInstance(ENDPOINTS.INVENTORY.BASE_URL);

const POS = ENDPOINTS.INVENTORY.POS;
const TRACE = ENDPOINTS.INVENTORY.TRACEABILITY;

export const inventoryApi = {
  // Gestión de Inventario (Cafetería / POS)
  listItems: () => {
    return inventoryInstance.get<InventarioItem[]>(POS.LIST);
  },
  createItem: (data: CreateInventarioItemInput) => {
    return inventoryInstance.post<InventarioItem>(POS.CREATE, data);
  },
  updateItem: (id: string, data: UpdateInventarioItemInput) => {
    return inventoryInstance.put<InventarioItem>(POS.BY_ID(id), data);
  },
  updateStatus: (id: string, data: UpdateEstadoInput) => {
    return inventoryInstance.patch<InventarioItem>(POS.STATUS(id), data);
  },
  deleteItem: (id: string) => {
    return inventoryInstance.delete(POS.BY_ID(id));
  },
  getItem: (id: string) => {
    return inventoryInstance.get<InventarioItem>(POS.BY_ID(id));
  },

  // HU024: papelera (baja / restauración)
  listDeleted: () => {
    return inventoryInstance.get<InventarioItem[]>(POS.DELETED);
  },
  restoreItem: (id: string) => {
    return inventoryInstance.patch<InventarioItem>(POS.RESTORE(id));
  },

  // HU028: analítica de inventario
  listAlertasStock: () => {
    return inventoryInstance.get<AlertaStock[]>(POS.ALERTAS_STOCK);
  },
  getStats: () => {
    return inventoryInstance.get<StockStats>(POS.STATS);
  },

  // HU019 / HU025: bitácoras
  listPriceHistory: (id: string) => {
    return inventoryInstance.get<HistorialPrecio[]>(POS.PRICE_HISTORY(id));
  },
  listStatusHistory: (id: string) => {
    return inventoryInstance.get<HistorialEstado[]>(POS.STATUS_HISTORY(id));
  },

  // HU021: movimientos contra el Inventory Service
  createMovement: (data: CreateMovimientoInventarioInput) => {
    return inventoryInstance.post(POS.MOVEMENTS, data);
  },
  listMovements: (id: string, start?: string, end?: string) => {
    let url = POS.ITEM_MOVEMENTS(id);
    const params = new URLSearchParams();
    if (start) params.append("start_date", start);
    if (end) params.append("end_date", end);
    const query = params.toString();
    if (query) url += `?${query}`;
    return inventoryInstance.get<unknown[]>(url);
  },
  // Gestión de Lotes y Trazabilidad (rutas del backend: /trazabilidad/...)
  listLots: () => {
    return inventoryInstance.get<LoteCafe[]>(TRACE.LOTS);
  },
  transitionLotPhase: (id: string, nextPhase: FaseCafe) => {
    return inventoryInstance.post<LoteCafe>(TRACE.TRANSITION(id), { fase: nextPhase });
  },
  getTraceabilityHistory: (code: string) => {
    return inventoryInstance.get<LoteCafe[]>(TRACE.HISTORY(code));
  },
};
