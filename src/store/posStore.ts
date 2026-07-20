import { create } from "zustand";
import { posService } from "@/lib/pos-service";
import { billingApi, Comprobante } from "@/lib/billing-service";
import { toast } from "@/lib/notifications";

export interface Product {
  id: string;
  sku?: string;
  nombre: string;
  precioUnitario: number;
  stockActual: number;
  /** Umbral de stock del inventario: por debajo se marca como stock bajo. */
  stockMinimo?: number;
  /** Estado del inventario: DISPONIBLE | STOCK_BAJO | AGOTADO. */
  estado?: string;
  categoria: string;
  imagenUrl?: string;
}

export interface CartItem {
  productoId: string;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
}

export interface PagoInput {
  metodoPago: string;
  monto: number;
  referencia_pago?: string;
}

export interface PedidoItem {
  id: string;
  productoId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface PedidoPago {
  id: string;
  metodoPago: string;
  monto: number;
  referencia?: string;
}

export interface Pedido {
  id: string;
  cajero_id: string;
  cliente_nombre?: string;
  cliente_apellido?: string;
  cliente_cedula?: string;
  items: PedidoItem[];
  pagos: PedidoPago[];
  subtotal: number;
  iva: number;
  total: number;
  estado: string;
  numeracion_comprobante?: number;
  fechaCreacion: string;
}

interface CierreResult {
  turno: any;
  resumen: {
    totalTransacciones: number;
    montoVentasTotal: number;
    ventas_efectivo: number;
    desglose: Record<string, number>;
  };
}

interface PosState {
  productos: Product[];
  cart: CartItem[];
  pedidosActivos: Pedido[];
  pedidoEnCobro: string | null;
  clienteNombre: string;
  clienteApellido: string;
  clienteCedula: string;
  facturaConDatos: boolean;
  isRegisterOpen: boolean;
  loading: boolean;
  /** URL de blob del PDF de factura a mostrar en el cuerpo de la página (no en un modal). */
  facturaPdfUrl: string | null;
  facturaPdfNumero: string | null;
  mostrarFacturaPdf: (url: string, numero: string) => void;
  cerrarFacturaPdf: () => void;
  fetchProductos: () => Promise<void>;
  fetchPedidosActivos: () => Promise<void>;
  addToCart: (producto: Product) => void;
  removeFromCart: (productoId: string) => void;
  updateQuantity: (productoId: string, cantidad: number) => void;
  clearCart: () => void;
  setCliente: (nombre: string, apellido: string, cedula: string) => void;
  setFacturaConDatos: (conDatos: boolean) => void;
  guardarPedido: () => Promise<boolean>;
  cancelPedidoEnCobro: () => Promise<void>;
  loadPedidoForCheckout: (pedido: Pedido) => void;
  checkout: (pagos: PagoInput[]) => Promise<{ success: boolean; pedidoId?: string; comprobante?: Comprobante; facturaError?: string }>;
  abrirCaja: (monto: number) => Promise<boolean>;
  cerrarCaja: (monto: number) => Promise<CierreResult | null>;
}

/** Datos del cliente por defecto para ventas a consumidor final. */
export const CONSUMIDOR_FINAL = {
  nombre: "Consumidor Final",
  apellido: "",
  cedula: "9999999999",
} as const;

/** True si la cédula es la genérica de consumidor final (solo nueves). */
export const esCedulaConsumidorFinal = (cedula: string) =>
  cedula.trim() === "" || /^9+$/.test(cedula.trim());

/**
 * Valida los datos del cliente cuando la venta pide factura con datos.
 * Devuelve un mapa campo → mensaje (vacío si todo es válido).
 */
export function validarClienteFactura(nombre: string, apellido: string, cedula: string): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!nombre.trim()) errs.nombre = "Ingresa el nombre del cliente";
  if (!apellido.trim()) errs.apellido = "Ingresa el apellido del cliente";
  const ced = cedula.trim();
  if (!/^\d{10}$/.test(ced) && !/^\d{13}$/.test(ced)) {
    errs.cedula = "Cédula de 10 dígitos o RUC de 13 dígitos";
  } else if (esCedulaConsumidorFinal(ced)) {
    errs.cedula = "Usa una identificación real (no la de consumidor final)";
  }
  return errs;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Ajusta los montos de los pagos para que sumen EXACTAMENTE el total autoritativo
 * del backend. Si hay un solo pago, se fija al total; si hay varios, se corrige el
 * último por la diferencia. Absorbe descuadres de redondeo/sincronización.
 */
function reconciliarPagos(pagos: PagoInput[], totalBackend: number): PagoInput[] {
  if (pagos.length === 0) return pagos;
  const suma = round2(pagos.reduce((acc, p) => acc + (p.monto || 0), 0));
  const diff = round2(totalBackend - suma);
  if (diff === 0) return pagos;

  const ajustados = pagos.map((p) => ({ ...p }));
  if (ajustados.length === 1) {
    ajustados[0].monto = totalBackend;
  } else {
    const last = ajustados.length - 1;
    ajustados[last].monto = round2((ajustados[last].monto || 0) + diff);
  }
  return ajustados;
}

export const usePosStore = create<PosState>((set, get) => ({
  productos: [],
  cart: [],
  pedidosActivos: [],
  pedidoEnCobro: null,
  clienteNombre: CONSUMIDOR_FINAL.nombre,
  clienteApellido: CONSUMIDOR_FINAL.apellido,
  clienteCedula: CONSUMIDOR_FINAL.cedula,
  facturaConDatos: false,
  isRegisterOpen: false,
  loading: false,
  facturaPdfUrl: null,
  facturaPdfNumero: null,

  /**
   * Revoca la URL de blob anterior (si la había) antes de fijar la nueva: el
   * cajero puede ver varias facturas seguidas sin acumular URLs sin liberar.
   */
  mostrarFacturaPdf: (url, numero) => {
    const anterior = get().facturaPdfUrl;
    if (anterior) window.URL.revokeObjectURL(anterior);
    set({ facturaPdfUrl: url, facturaPdfNumero: numero });
  },

  cerrarFacturaPdf: () => {
    const anterior = get().facturaPdfUrl;
    if (anterior) window.URL.revokeObjectURL(anterior);
    set({ facturaPdfUrl: null, facturaPdfNumero: null });
  },

  fetchProductos: async () => {
    set({ loading: true });
    try {
      try {
        const estadoRes = await posService.getEstadoCaja();
        set({ isRegisterOpen: estadoRes.isRegisterOpen });
      } catch (e) {
        console.error("Error checking register state", e);
      }

      const data = await posService.getProductos();
      const mapped = data.map((p: any) => ({
        id: p.id,
        sku: p.sku,
        nombre: p.nombre,
        precioUnitario: p.precio,
        stockActual: p.stock,
        stockMinimo: p.stockMinimo,
        estado: p.estado,
        categoria: p.categoria || "CAFETERÍA",
        imagenUrl: p.imagenUrl
      }));
      set({ productos: mapped, loading: false });
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Error al cargar productos");
      set({ loading: false });
    }
  },

  fetchPedidosActivos: async () => {
    try {
      const pedidos = await posService.getPedidosActivos();
      set({ pedidosActivos: pedidos || [] });
    } catch (e) {
      console.error("Error fetching active orders", e);
    }
  },

  addToCart: (producto: Product) => {
    const { cart } = get();
    const existing = cart.find((item) => item.productoId === producto.id);

    if (existing) {
      if (existing.cantidad >= producto.stockActual) {
        toast.warning("Stock insuficiente");
        return;
      }
      set({
        cart: cart.map((item) =>
          item.productoId === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        ),
      });
    } else {
      if (producto.stockActual <= 0) {
        toast.warning("Sin stock");
        return;
      }
      set({
        cart: [...cart, { productoId: producto.id, nombre: producto.nombre, precioUnitario: producto.precioUnitario, cantidad: 1 }],
      });
    }
  },

  removeFromCart: (productoId: string) => {
    set({ cart: get().cart.filter((item) => item.productoId !== productoId) });
  },

  updateQuantity: (productoId: string, cantidad: number) => {
    if (cantidad <= 0) {
      get().removeFromCart(productoId);
      return;
    }
    const { productos } = get();
    const producto = productos.find((p) => p.id === productoId);
    if (producto && cantidad > producto.stockActual) {
      toast.warning("Stock insuficiente");
      return;
    }
    set({
      cart: get().cart.map((item) =>
        item.productoId === productoId ? { ...item, cantidad } : item
      ),
    });
  },

  clearCart: () => set({
    cart: [],
    clienteNombre: CONSUMIDOR_FINAL.nombre,
    clienteApellido: CONSUMIDOR_FINAL.apellido,
    clienteCedula: CONSUMIDOR_FINAL.cedula,
    facturaConDatos: false,
  }),

  cancelPedidoEnCobro: async () => {
    const { pedidoEnCobro } = get();
    if (!pedidoEnCobro) return;
    try {
      await posService.anularPedido(pedidoEnCobro);
      toast.success("Pedido cancelado");
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Error al cancelar pedido");
    }
    set({
      cart: [],
      pedidoEnCobro: null,
      clienteNombre: CONSUMIDOR_FINAL.nombre,
      clienteApellido: CONSUMIDOR_FINAL.apellido,
      clienteCedula: CONSUMIDOR_FINAL.cedula,
      facturaConDatos: false,
    });
    await get().fetchPedidosActivos();
  },

  setCliente: (nombre, apellido, cedula) => set({ clienteNombre: nombre, clienteApellido: apellido, clienteCedula: cedula }),

  setFacturaConDatos: (conDatos) => {
    if (conDatos) {
      // Se limpian los campos para que el cajero escriba los datos reales.
      set({ facturaConDatos: true, clienteNombre: "", clienteApellido: "", clienteCedula: "" });
    } else {
      set({
        facturaConDatos: false,
        clienteNombre: CONSUMIDOR_FINAL.nombre,
        clienteApellido: CONSUMIDOR_FINAL.apellido,
        clienteCedula: CONSUMIDOR_FINAL.cedula,
      });
    }
  },

  guardarPedido: async () => {
    const { cart, clienteNombre, clienteApellido, clienteCedula, clearCart, fetchPedidosActivos } = get();
    if (cart.length === 0) return false;

    set({ loading: true });
    try {
      const pedido = await posService.crearPedido({
        cliente_nombre: clienteNombre,
        cliente_apellido: clienteApellido,
        cliente_cedula: clienteCedula,
        items: cart
      });
      toast.success("Pedido guardado en edición");
      clearCart();
      await fetchPedidosActivos();
      set({ loading: false });
      // Best-effort: deja un registro BORRADOR de facturación (preventa/pedido
      // en mesa) para este pedido guardado. No bloquea el guardado si falla.
      billingApi.emitirComprobante(pedido.id).catch(() => {});
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Error al guardar pedido");
      set({ loading: false });
      return false;
    }
  },

  loadPedidoForCheckout: (pedido: Pedido) => {
    const cart: CartItem[] = pedido.items.map(i => ({
      productoId: i.productoId,
      nombre: i.nombre,
      precioUnitario: i.precioUnitario,
      cantidad: i.cantidad
    }));
    // El pedido guardado define el modo: cédula real → factura con datos.
    const conDatos = !esCedulaConsumidorFinal(pedido.cliente_cedula || "");
    set({
      cart,
      pedidoEnCobro: pedido.id,
      facturaConDatos: conDatos,
      clienteNombre: pedido.cliente_nombre || CONSUMIDOR_FINAL.nombre,
      clienteApellido: pedido.cliente_apellido || CONSUMIDOR_FINAL.apellido,
      clienteCedula: pedido.cliente_cedula || CONSUMIDOR_FINAL.cedula,
    });
  },

  checkout: async (pagos) => {
    const { cart, pedidoEnCobro, clienteNombre, clienteApellido, clienteCedula, facturaConDatos, clearCart, fetchProductos } = get();
    if (cart.length === 0) return { success: false };
    if (pagos.length === 0) {
      toast.error("Debe registrar al menos un método de pago para continuar");
      return { success: false };
    }
    // Respaldo de la validación de la UI: con factura con datos no se cobra
    // hasta tener cliente completo (evita el 422 del billing-service).
    if (facturaConDatos) {
      const errs = validarClienteFactura(clienteNombre, clienteApellido, clienteCedula);
      const primero = Object.values(errs)[0];
      if (primero) {
        toast.error("Completa los datos de facturación", primero);
        return { success: false };
      }
    }

    set({ loading: true });
    let pedidoId = pedidoEnCobro ?? "";
    try {
      // Sincronizamos el pedido con el carrito y tomamos el total AUTORITATIVO
      // que devuelve el backend (calculado sobre los items recién enviados). Así
      // el pago siempre cuadra con lo que el backend espera, evitando el error
      // "La suma de los pagos no coincide con el total" por redondeo/desincronización.
      let pedidoSync: Pedido;
      if (pedidoEnCobro) {
        pedidoSync = await posService.actualizarPedido(pedidoEnCobro, {
          cliente_nombre: clienteNombre,
          cliente_apellido: clienteApellido,
          cliente_cedula: clienteCedula,
          items: cart.map(i => ({
            productoId: i.productoId,
            nombre: i.nombre,
            cantidad: i.cantidad,
            precioUnitario: i.precioUnitario
          }))
        });
      } else {
        pedidoSync = await posService.crearPedido({
          cliente_nombre: clienteNombre,
          cliente_apellido: clienteApellido,
          cliente_cedula: clienteCedula,
          items: cart
        });
        pedidoId = pedidoSync.id;
      }

      const totalBackend = Math.round((pedidoSync?.total ?? 0) * 100) / 100;
      const pagosConciliados = reconciliarPagos(pagos, totalBackend);
      const pagoRes = await posService.pagarPedido(pedidoId, { pagos: pagosConciliados });
      if (pagoRes?.advertencias?.length) {
        toast.warning(
          "Pago registrado con advertencias de inventario",
          pagoRes.advertencias.join(" ")
        );
      }

      // HU012: emitir la factura en el billing-service (lee el pedido pagado de
      // la BD compartida). Es best-effort: si falla, el cobro ya está hecho y la
      // factura se puede reintentar desde el modal de éxito.
      let comprobante: Comprobante | undefined;
      let facturaError: string | undefined;
      try {
        comprobante = await billingApi.emitirComprobante(pedidoId);
      } catch (e: any) {
        // El cobro ya está hecho: guardamos el motivo exacto del rechazo para
        // mostrarlo en el modal de éxito, donde se puede reintentar.
        facturaError = e?.response?.data?.message
          || "No se pudo conectar con el servicio de facturación. Puedes reintentar desde este panel.";
        console.warn("No se pudo emitir la factura:", facturaError, e);
      }

      toast.success("Pago procesado con éxito");
      clearCart();
      set({ pedidoEnCobro: null });
      await fetchProductos();
      set({ loading: false });
      return { success: true, pedidoId, comprobante, facturaError };
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Error al procesar el pago");
      set({ loading: false });
      return { success: false };
    }
  },

  abrirCaja: async (monto) => {
    set({ loading: true });
    try {
      await posService.abrirTurno(monto);
      set({ isRegisterOpen: true, loading: false });
      toast.success("Caja abierta exitosamente");
      get().fetchProductos();
      get().fetchPedidosActivos();
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Error al abrir caja");
      set({ loading: false });
      return false;
    }
  },

  cerrarCaja: async (monto) => {
    set({ loading: true });
    try {
      const res = await posService.cerrarCaja(monto);
      set({ isRegisterOpen: false, pedidosActivos: [], loading: false });
      if (res.turno.estado === 'CERRADO_CON_DESCUADRE') {
        toast.info(`Caja cerrada con descuadre. Diferencia: $${round2(res.turno.diferencia).toFixed(2)}`);
      } else {
        toast.success("Caja cerrada exitosamente");
      }
      return res;
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Error al cerrar caja");
      set({ loading: false });
      return null;
    }
  }
}));
