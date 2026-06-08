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

interface PosState {
  productos: Product[];
  cart: CartItem[];
  clienteNombre: string;
  clienteCedula: string;
  isRegisterOpen: boolean;
  loading: boolean;
  fetchProductos: () => Promise<void>;
  addToCart: (producto: Product) => void;
  removeFromCart: (productoId: string) => void;
  updateQuantity: (productoId: string, cantidad: number) => void;
  clearCart: () => void;
  setCliente: (nombre: string, cedula: string) => void;
  checkout: (metodoPago: string, montoRecibido: number) => Promise<{ success: boolean; pedidoId?: string; vuelto?: number }>;
  abrirCaja: (monto: number) => Promise<boolean>;
  cerrarCaja: (monto: number) => Promise<boolean>;
}

export const usePosStore = create<PosState>((set, get) => ({
  productos: [],
  cart: [],
  clienteNombre: "Consumidor Final",
  clienteCedula: "9999999999",
  isRegisterOpen: false,
  loading: false,

  fetchProductos: async () => {
    set({ loading: true });
    try {
      // Check register state first
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

  clearCart: () => set({ cart: [], clienteNombre: "Consumidor Final", clienteCedula: "9999999999" }),

  setCliente: (nombre, cedula) => set({ clienteNombre: nombre, clienteCedula: cedula }),

  checkout: async (metodoPago, montoRecibido) => {
    const { cart, clienteNombre, clienteCedula, clearCart, fetchProductos } = get();
    if (cart.length === 0) return { success: false };

    set({ loading: true });
    try {
      // 1. Crear Pedido
      const pedido = await posService.crearPedido({
        cliente_nombre: clienteNombre,
        cliente_cedula: clienteCedula,
        items: cart
      });

      // 2. Pagar Pedido
      const pagoResult = await posService.pagarPedido(pedido.id, {
        metodoPago,
        montoRecibido
      });

      toast.success("Pago procesado con éxito");
      clearCart();
      await fetchProductos(); // refresh stock
      set({ loading: false });
      return { success: true, pedidoId: pedido.id, vuelto: pagoResult.vuelto };
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
      set({ isRegisterOpen: false, loading: false });
      if (res.estado === 'DESCUADRADO') {
        toast.warning(`Caja cerrada con descuadre. Diferencia: $${res.diferencia}`);
      } else {
        toast.success("Caja cerrada cuadradamente");
      }
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Error al cerrar caja");
      set({ loading: false });
      return false;
    }
  }
}));
