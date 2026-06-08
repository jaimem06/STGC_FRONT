import axios from "axios";
import { ENDPOINTS } from "./endpoints";

const api = axios.create({
  baseURL: ENDPOINTS.POS_SERVICE.BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const posService = {
  getProductos: async () => {
    const res = await api.get(ENDPOINTS.POS_SERVICE.PRODUCTOS);
    return res.data;
  },

  getEstadoCaja: async () => {
    const res = await api.get(ENDPOINTS.POS_SERVICE.CAJA.ESTADO);
    return res.data;
  },

  abrirTurno: async (montoApertura: number) => {
    const res = await api.post(ENDPOINTS.POS_SERVICE.CAJA.APERTURA, { montoApertura });
    return res.data;
  },

  cerrarCaja: async (montoCierreFisico: number) => {
    const res = await api.post(ENDPOINTS.POS_SERVICE.CAJA.CIERRE, { montoCierreFisico });
    return res.data;
  },

  crearPedido: async (data: {
    cliente_nombre?: string;
    cliente_cedula?: string;
    items: Array<{
      productoId: string;
      nombre: string;
      cantidad: number;
      precioUnitario: number;
    }>;
  }) => {
    const res = await api.post(ENDPOINTS.POS_SERVICE.PEDIDOS.BASE, data);
    return res.data;
  },

  actualizarPedido: async (id: string, data: { cliente_nombre?: string; cliente_cedula?: string }) => {
    const res = await api.put(ENDPOINTS.POS_SERVICE.PEDIDOS.BY_ID(id), data);
    return res.data;
  },

  anularPedido: async (id: string) => {
    const res = await api.patch(ENDPOINTS.POS_SERVICE.PEDIDOS.ANULAR(id));
    return res.data;
  },

  pagarPedido: async (id: string, data: { metodoPago: string; montoRecibido: number }) => {
    const res = await api.post(ENDPOINTS.POS_SERVICE.PEDIDOS.PAGAR(id), data);
    return res.data;
  },

  getComprobanteUrl: (id: string) => {
    return `${ENDPOINTS.POS_SERVICE.BASE_URL}/${ENDPOINTS.POS_SERVICE.PEDIDOS.COMPROBANTE(id)}`;
  }
};
