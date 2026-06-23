import { createInstance } from "./axios-config";
import { ENDPOINTS } from "./endpoints";
import { CreateMovimientoFacturaInput } from "./schemas";

export const billingInstance = createInstance(ENDPOINTS.BILLING.BASE_URL);

export const billingApi = {
  createMovimientoFactura: async (data: CreateMovimientoFacturaInput) => {
    return billingInstance.post("billing/facturas/movimiento", data);
  },
};
