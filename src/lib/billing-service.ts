import { createInstance } from "./axios-config";
import { ENDPOINTS } from "./endpoints";
import { CreateMovimientoFacturaInput } from "./schemas";

export const billingInstance = createInstance(ENDPOINTS.BILLING.BASE_URL);

const BILLING = ENDPOINTS.BILLING;

/** Respuesta de emisión de comprobante del billing-service. */
export interface Comprobante {
  message: string;
  numero_comprobante: string;
  estado_factura: string;
  pdf_url: string;
  creado: boolean;
}

export const billingApi = {
  createMovimientoFactura: async (data: CreateMovimientoFacturaInput) => {
    return billingInstance.post(BILLING.MOVIMIENTO, data);
  },

  /**
   * HU012 - Emite (o recupera, si ya existe) la factura de un pedido pagado.
   * El billing-service lee el pedido pagado directamente de la BD compartida.
   */
  emitirComprobante: async (pedidoId: string): Promise<Comprobante> => {
    const res = await billingInstance.post<Comprobante>(BILLING.COMPROBANTES.EMITIR(pedidoId));
    return res.data;
  },

  /** Descarga el PDF de la factura como Blob (con autenticación). */
  descargarComprobantePdf: async (pedidoId: string): Promise<Blob> => {
    const res = await billingInstance.get(BILLING.COMPROBANTES.PDF(pedidoId), {
      responseType: "blob",
    });
    return res.data as Blob;
  },
};

/**
 * Descarga el PDF de la factura y devuelve una URL temporal de blob lista para
 * mostrarse en un visor embebido (iframe) o enlazarse a una descarga. Quien la
 * consume debe revocarla con URL.revokeObjectURL cuando deje de usarla.
 * (Se evita window.open: tras un await largo el navegador bloquea el popup.)
 */
export const crearUrlFacturaPdf = async (pedidoId: string): Promise<string> => {
  const blob = await billingApi.descargarComprobantePdf(pedidoId);
  return window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
};

/** Fuerza la descarga local de una URL de blob ya creada (sin popups). */
export const descargarBlobComoArchivo = (url: string, filename: string): void => {
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

/**
 * Extrae el motivo devuelto por el billing-service desde un error de axios.
 * Cuando la petición usó responseType "blob" (descarga de PDF), el cuerpo del
 * error llega como Blob y hay que leerlo antes de poder interpretar el JSON.
 */
export const extraerMotivoBilling = async (error: unknown): Promise<string | undefined> => {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (!data) return undefined;
  if (typeof data === "string") {
    try {
      return JSON.parse(data).message;
    } catch {
      return undefined;
    }
  }
  if (data instanceof Blob) {
    try {
      return JSON.parse(await data.text()).message;
    } catch {
      return undefined;
    }
  }
  return (data as { message?: string }).message;
};
