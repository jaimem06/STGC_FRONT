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
 * Descarga el PDF de la factura y lo abre en una nueva pestaña. Devuelve la URL
 * temporal creada (para poder revocarla) o lanza si algo falla.
 */
export const abrirFacturaPdf = async (pedidoId: string): Promise<void> => {
  const blob = await billingApi.descargarComprobantePdf(pedidoId);
  const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
  const tab = window.open(url, "_blank");
  if (!tab) {
    // Popup bloqueado: forzamos una descarga como alternativa.
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `factura_${pedidoId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
  // Liberamos la URL tras un margen para que el navegador alcance a abrirla.
  setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
};
