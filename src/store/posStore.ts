import { create } from "zustand";
import { posService } from "@/lib/pos-service";
import { toast } from "@/lib/notifications";

export interface Product {
  id: string;
  nombre: string;
  precioUnitario: number;
  stockActual: number;
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
  isRegisterOpen: boolean;
  loading: boolean;
  fetchProductos: () => Promise<void>;
  fetchPedidosActivos: () => Promise<void>;
  addToCart: (producto: Product) => void;
  removeFromCart: (productoId: string) => void;
  updateQuantity: (productoId: string, cantidad: number) => void;
  clearCart: () => void;
  setCliente: (nombre: string, apellido: string, cedula: string) => void;
  guardarPedido: () => Promise<boolean>;
  cancelPedidoEnCobro: () => Promise<void>;
  loadPedidoForCheckout: (pedido: Pedido) => void;
  checkout: (pagos: PagoInput[]) => Promise<{ success: boolean; pedidoId?: string }>;
  abrirCaja: (monto: number) => Promise<boolean>;
  cerrarCaja: (monto: number) => Promise<CierreResult | null>;
}

export const usePosStore = create<PosState>((set, get) => ({
  productos: [],
  cart: [],
  pedidosActivos: [],
  pedidoEnCobro: null,
  clienteNombre: "Consumidor Final",
  clienteApellido: "",
  clienteCedula: "9999999999",
  isRegisterOpen: false,
  loading: false,

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
        nombre: p.nombre,
        precioUnitario: p.precio,
        stockActual: p.stock,
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

  clearCart: () => set({ cart: [], clienteNombre: "Consumidor Final", clienteApellido: "", clienteCedula: "9999999999" }),

  cancelPedidoEnCobro: async () => {
    const { pedidoEnCobro } = get();
    if (!pedidoEnCobro) return;
    try {
      await posService.anularPedido(pedidoEnCobro);
      toast.success("Pedido cancelado");
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Error al cancelar pedido");
    }
    set({ cart: [], pedidoEnCobro: null, clienteNombre: "Consumidor Final", clienteApellido: "", clienteCedula: "9999999999" });
    await get().fetchPedidosActivos();
  },

  setCliente: (nombre, apellido, cedula) => set({ clienteNombre: nombre, clienteApellido: apellido, clienteCedula: cedula }),

  guardarPedido: async () => {
    const { cart, clienteNombre, clienteApellido, clienteCedula, clearCart, fetchPedidosActivos } = get();
    if (cart.length === 0) return false;

    set({ loading: true });
    try {
      await posService.crearPedido({
        cliente_nombre: clienteNombre,
        cliente_apellido: clienteApellido,
        cliente_cedula: clienteCedula,
        items: cart
      });
      toast.success("Pedido guardado en edición");
      clearCart();
      await fetchPedidosActivos();
      set({ loading: false });
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
    set({
      cart,
      pedidoEnCobro: pedido.id,
      clienteNombre: pedido.cliente_nombre || "Consumidor Final",
      clienteApellido: pedido.cliente_apellido || "",
      clienteCedula: pedido.cliente_cedula || "9999999999"
    });
  },

  checkout: async (pagos) => {
    const { cart, pedidoEnCobro, clienteNombre, clienteApellido, clienteCedula, clearCart, fetchProductos } = get();
    if (cart.length === 0) return { success: false };
    if (pagos.length === 0) {
      toast.error("Debe registrar al menos un método de pago para continuar");
      return { success: false };
    }

    set({ loading: true });
    let pedidoId = pedidoEnCobro ?? "";
    try {
      if (pedidoEnCobro) {
        await posService.actualizarPedido(pedidoEnCobro, {
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
        const nuevo = await posService.crearPedido({
          cliente_nombre: clienteNombre,
          cliente_apellido: clienteApellido,
          cliente_cedula: clienteCedula,
          items: cart
        });
        pedidoId = nuevo.id;
      }
      await posService.pagarPedido(pedidoId, { pagos });

      toast.success("Pago procesado con éxito");
      clearCart();
      set({ pedidoEnCobro: null });
      await fetchProductos();
      set({ loading: false });
      return { success: true, pedidoId };
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
        toast.info(`Caja cerrada con descuadre. Diferencia: $${res.turno.diferencia}`);
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
