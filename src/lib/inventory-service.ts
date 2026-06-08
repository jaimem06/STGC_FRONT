import { createInstance } from "./axios-config";
import { ENDPOINTS } from "./endpoints";
import { 
  CreateInventarioItemInput, 
  UpdateInventarioItemInput,
  UpdateEstadoInput,
  InventarioItem, 
  MovimientoStockInput
} from "./schemas";

export const inventoryInstance = createInstance(ENDPOINTS.INVENTORY.BASE_URL);

export const inventoryApi = {
  // Gestión de Inventario (Cafetería / POS)
  listItems: () => {
    return inventoryInstance.get<InventarioItem[]>("inventario/pos");
  },
  createItem: (data: CreateInventarioItemInput) => {
    return inventoryInstance.post<InventarioItem>("inventario/pos/nuevo", data);
  },
  updateItem: (id: string, data: UpdateInventarioItemInput) => {
    return inventoryInstance.put<InventarioItem>(`inventario/pos/${id}`, data);
  },
  updateStatus: (id: string, data: UpdateEstadoInput) => {
    return inventoryInstance.patch<InventarioItem>(`inventario/pos/${id}/estado`, data);
  },
  deleteItem: (id: string) => {
    return inventoryInstance.delete(`inventario/pos/${id}`);
  },
  getItem: (id: string) => {
    return inventoryInstance.get<InventarioItem>(`inventario/pos/${id}`);
  },
  
  // Movimientos y Reportes
  createMovement: (data: MovimientoStockInput) => {
    return inventoryInstance.post("inventario/pos/movimientos", data);
  },
  listMovements: (id: string, start?: string, end?: string) => {
    let url = `inventario/pos/${id}/movimientos`;
    const params = new URLSearchParams();
    if (start) params.append("start_date", start);
    if (end) params.append("end_date", end);
    const query = params.toString();
    if (query) url += `?${query}`;
    return inventoryInstance.get<any[]>(url);
  },
  // Re-implementación robusta para exportar con autenticación
  exportGeneralMovements: async () => {
    try {
      const response = await inventoryInstance.get("inventario/pos/movimientos/exportar", {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_movimientos_pos_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error al exportar:", error);
      throw error;
    }
  }
};
