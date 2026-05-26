import { createInstance } from "./axios-config";
import { ENDPOINTS } from "./endpoints";
import { 
  CreateInventarioItemInput, 
  FaseCafe, 
  InventarioItem, 
  LoteCafe, 
  MovimientoStockInput 
} from "./schemas";

export const inventoryInstance = createInstance(ENDPOINTS.INVENTORY.BASE_URL);

export const inventoryApi = {
  // Inventario
  listItems: () => inventoryInstance.get<InventarioItem[]>(ENDPOINTS.INVENTORY.ITEMS),
  createItem: (data: CreateInventarioItemInput) => inventoryInstance.post<InventarioItem>(ENDPOINTS.INVENTORY.ITEMS, data),
  getItem: (id: string) => inventoryInstance.get<InventarioItem>(ENDPOINTS.INVENTORY.ITEM_BY_ID(id)),
  createMovement: (data: MovimientoStockInput) => inventoryInstance.post(ENDPOINTS.INVENTORY.MOVEMENTS, data),

  // Trazabilidad
  listLots: () => inventoryInstance.get<LoteCafe[]>(ENDPOINTS.INVENTORY.TRACEABILITY.LOTS),
  getTraceabilityHistory: (codigo: string) => inventoryInstance.get<LoteCafe[]>(ENDPOINTS.INVENTORY.TRACEABILITY.HISTORY(codigo)),
  transitionLotPhase: (id: string, fase: FaseCafe) => inventoryInstance.post<LoteCafe>(ENDPOINTS.INVENTORY.TRACEABILITY.TRANSITION(id), JSON.stringify(fase)),
};
