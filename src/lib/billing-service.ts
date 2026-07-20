import { createInstance } from "./axios-config";
import { ENDPOINTS } from "./endpoints";
import { CreateMovimientoFacturaInput } from "./schemas";

export const billingInstance = createInstance(ENDPOINTS.BILLING.BASE_URL);

const BILLING = ENDPOINTS.BILLING;

/** Ciclo de vida de una factura: BORRADOR -> PENDIENTE -> PAGADA -> {ANULADA | REEMBOLSADA}. */
export type EstadoFactura = "BORRADOR" | "PENDIENTE" | "PAGADA" | "ANULADA" | "REEMBOLSADA";

/** Respuesta de emisión de comprobante del billing-service. */
export interface Comprobante {
  message: string;
  numero_comprobante: string;
  estado_factura: EstadoFactura;
  pdf_url: string;
  creado: boolean;
}

/** Un registro del historial de facturación del cajero autenticado. */
export interface ComprobanteResumen {
  numero_comprobante: string;
  pedido_id: string;
  estado_factura: EstadoFactura;
  cliente_nombre: string | null;
  cliente_apellido: string | null;
  cliente_cedula: string | null;
  fecha_pago: string | null;
  total: number | null;
  pdf_url: string;
  /** Motivo registrado al anular/reembolsar (auditoría); vacío en los demás estados. */
  motivo_estado: string | null;
  actualizado: string | null;
}

export interface ComprobantesListResponse {
  comprobantes: ComprobanteResumen[];
  total: number;
}

export const billingApi = {
  createMovimientoFactura: async (data: CreateMovimientoFacturaInput) => {
    return billingInstance.post(BILLING.MOVIMIENTO, data);
  },

  /** Historial de facturas emitidas por el cajero autenticado (propio, no de todos). */
  listarMisComprobantes: async (params: { q?: string; limit?: number; offset?: number } = {}): Promise<ComprobantesListResponse> => {
    const res = await billingInstance.get<ComprobantesListResponse>(BILLING.COMPROBANTES.BASE, { params });
    return res.data;
  },

  /**
   * HU012 - Emite (o recupera/transiciona) la factura de un pedido.
   * El billing-service lee el pedido directamente de la BD compartida y
   * decide el estado resultante según su estado real: PAGADO -> PAGADA;
   * si no, BORRADOR (preventa) o PENDIENTE si `formal` es true (factura
   * emitida formalmente, pago aún no registrado).
   */
  emitirComprobante: async (pedidoId: string, opts: { formal?: boolean } = {}): Promise<Comprobante> => {
    const res = await billingInstance.post<Comprobante>(
      BILLING.COMPROBANTES.EMITIR(pedidoId),
      undefined,
      { params: opts.formal ? { formal: true } : undefined }
    );
    return res.data;
  },

  /** Descarga el PDF de la factura como Blob (con autenticación). Solo disponible para facturas PAGADA/ANULADA/REEMBOLSADA. */
  descargarComprobantePdf: async (pedidoId: string): Promise<Blob> => {
    const res = await billingInstance.get(BILLING.COMPROBANTES.PDF(pedidoId), {
      responseType: "blob",
    });
    return res.data as Blob;
  },

  /** Anula una factura (cualquier estado no terminal). Requiere motivo para auditoría. */
  anularComprobante: async (pedidoId: string, motivo: string): Promise<Comprobante> => {
    const res = await billingInstance.post<Comprobante>(BILLING.COMPROBANTES.ANULAR(pedidoId), { motivo });
    return res.data;
  },

  /** Marca una factura PAGADA como reembolsada (el dinero se devolvió al cliente). Requiere motivo. */
  reembolsarComprobante: async (pedidoId: string, motivo: string): Promise<Comprobante> => {
    const res = await billingInstance.post<Comprobante>(BILLING.COMPROBANTES.REEMBOLSAR(pedidoId), { motivo });
    return res.data;
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
