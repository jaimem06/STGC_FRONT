"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inventoryApi } from "@/lib/inventory-service";
import { useInventoryStore } from "@/store/inventoryStore";
import {
  Package, Plus, ArrowUpRight, Tag, Layers,
  AlertTriangle, ClipboardList, BarChart3,
  Edit, History, Archive, ArchiveRestore, Activity, DollarSign,
  RefreshCw, EyeOff, Eye, MoreVertical
} from "lucide-react";
import {
  CreateInventarioItemSchema, CreateInventarioItemInput,
  UpdateInventarioItemSchema, UpdateInventarioItemInput,
  UpdateEstadoSchema, UpdateEstadoInput,
  CreateMovimientoInventarioSchema, CreateMovimientoInventarioInput,
  InventarioItem, TipoElementoEnum, EstadoInventarioEnum, UnidadMedidaEnum,
  EstadoInventario,
} from "@/lib/schemas";
import LoadingSpinner from "@/components/LoadingSpinner";
import Table from "@/components/Table";
import Input from "@/components/Input";
import Select from "@/components/Select";
import Dialog from "@/components/Dialog";
import Confirm from "@/components/Confirm";
import Search from "@/components/Search";
import { toast } from "@/lib/notifications";
import { buildStockAlertMessage } from "@/lib/stock-alerts";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/DropdownMenu";
import ProductFormFields from "./components/ProductFormFields";
import PriceHistoryModal from "./components/PriceHistoryModal";
import StatusHistoryModal from "./components/StatusHistoryModal";

const statusStyles: Record<string, string> = {
  DISPONIBLE: "bg-green-50 text-green-700 border-green-200/50",
  AGOTADO: "bg-error-container/20 text-error border-error/20",
  STOCK_BAJO: "bg-amber-50 text-amber-700 border-amber-200/50",
  INACTIVO: "bg-surface-container text-on-surface-variant border-outline-variant/30",
  EN_TRANSITO: "bg-blue-50 text-blue-700 border-blue-200/50",
  BLOQUEADO: "bg-red-50 text-red-700 border-red-200/50",
  CADUCADO: "bg-purple-50 text-purple-700 border-purple-200/50",
};

const typeIcons = {
  INSUMO: Tag,
  PRODUCTO: Package,
  CAFE_PROCESADO: Layers,
};

/** HU025: estados que el usuario puede seleccionar según la matemática del inventario. */
function estadosPermitidos(item: InventarioItem): EstadoInventario[] {
  const caducado = !!item.fecha_caducidad && new Date(item.fecha_caducidad) <= new Date();
  const permitidos: EstadoInventario[] = ["INACTIVO", "EN_TRANSITO", "BLOQUEADO"];
  if (item.cantidad > item.stock_minimo && !caducado) permitidos.push("DISPONIBLE");
  if (item.cantidad === 0) permitidos.push("AGOTADO");
  if (item.cantidad > 0 && item.cantidad <= item.stock_minimo) permitidos.push("STOCK_BAJO");
  if (caducado) permitidos.push("CADUCADO");
  return permitidos;
}

interface ConfirmState {
  open: boolean;
  title: string;
  description: string;
  confirmText: string;
  variant: "danger" | "warning" | "success";
  action: () => void;
}

export default function InventoryPage() {
  const router = useRouter();
  const { items, deletedItems, loading, fetchItems, fetchDeleted } = useInventoryStore();
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [showDeleted, setShowDeleted] = useState(false);
  // HU028: filtro "solo alertas" (stock bajo / agotado / caducado). Se puede
  // activar desde la notificación "Revisar" o desde ?alertas=1 (redirección del dashboard).
  const [alertFilter, setAlertFilter] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isPriceHistoryOpen, setIsPriceHistoryOpen] = useState(false);
  const [isStatusHistoryOpen, setIsStatusHistoryOpen] = useState(false);

  const [selectedItem, setSelectedItem] = useState<InventarioItem | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [movements, setMovements] = useState<any[]>([]);
  const [historyDates, setHistoryDates] = useState({ start: "", end: "" });

  const [confirmState, setConfirmState] = useState<ConfirmState>({
    open: false, title: "", description: "", confirmText: "CONTINUAR", variant: "danger", action: () => {},
  });
  const closeConfirm = () => setConfirmState((s) => ({ ...s, open: false }));

  const { register: registerCreate, handleSubmit: handleSubmitCreate, reset: resetCreate, setValue: setCreateValue, watch: watchCreate, formState: { errors: errorsCreate } } = useForm<CreateInventarioItemInput>({
    resolver: zodResolver(CreateInventarioItemSchema),
    defaultValues: { estado: "DISPONIBLE", tipo: "PRODUCTO", unidad_medida: "LIBRAS", modulo: "CAFETERIA", stock_minimo: 0, cantidad_inicial: 0 }
  });

  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, setValue: setEditValue, watch: watchEdit, formState: { errors: errorsEdit } } = useForm<UpdateInventarioItemInput>({
    resolver: zodResolver(UpdateInventarioItemSchema)
  });

  const { handleSubmit: handleSubmitStatus, setValue: setStatusValue, watch: watchStatus, register: registerStatus, reset: resetStatus, formState: { errors: errorsStatus } } = useForm<UpdateEstadoInput>({
    resolver: zodResolver(UpdateEstadoSchema)
  });

  const { register: registerMove, handleSubmit: handleSubmitMove, reset: resetMove, setValue: setMoveValue, watch: watchMove, formState: { errors: errorsMove } } = useForm<CreateMovimientoInventarioInput>({
    resolver: zodResolver(CreateMovimientoInventarioSchema),
    defaultValues: { tipo: "ENTRADA", cantidad: 0, motivo: "Entrada de inventario", numero_factura: "" }
  });

  const moveType = watchMove("tipo");
  const moveCantidad = watchMove("cantidad");
  const [fac1, setFac1] = useState("");
  const [fac2, setFac2] = useState("");
  const [fac3, setFac3] = useState("");

  useEffect(() => {
    if (fac1 || fac2 || fac3) {
      setMoveValue("numero_factura", `${fac1}-${fac2}-${fac3}`);
    } else {
      setMoveValue("numero_factura", "");
    }
  }, [fac1, fac2, fac3, setMoveValue]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleError = (err: any, context: string) => {
    console.error(`Error en ${context}:`, err);
    const status = err.response?.status;
    const backendMessage = err.response?.data?.message || err.response?.data?.detail;

    if (status === 409) {
      toast.error(backendMessage || "Ya existe un registro con ese nombre. Use uno distinto.");
    } else if (status === 422) {
      toast.error(backendMessage || "La operación no es válida según las reglas de negocio.");
    } else if (status === 401) {
      toast.error("Su sesión ha expirado.");
    } else if (status === 400) {
      toast.error(backendMessage || "Solicitud incorrecta. Verifique los datos.");
    } else if (backendMessage) {
      toast.error(backendMessage);
    } else {
      toast.error(`Error: ${context}. Intente de nuevo.`);
    }
  };

  const refreshList = useCallback(async () => {
    try {
      if (showDeleted) await fetchDeleted();
      else await fetchItems();
    } catch (err) {
      handleError(err, "Carga de Inventario");
    }
  }, [showDeleted, fetchItems, fetchDeleted]);

  useEffect(() => { refreshList(); }, [refreshList]);

  // Activa el filtro de alertas si se llega desde el dashboard (?alertas=1).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("alertas") === "1") {
      setAlertFilter(true);
    }
  }, []);

  // HU028: notificación proactiva de stock bajo al montar. "Revisar" filtra la tabla.
  useEffect(() => {
    inventoryApi.listAlertasStock()
      .then((res) => {
        const msg = buildStockAlertMessage(res.data);
        if (msg) {
          toast.warning(msg, undefined, "Revisar", "inventory-alert", () => setAlertFilter(true));
        }
      })
      .catch(() => {});
  }, []);

  // HU028: métricas contadas por `estado` (misma fuente que el filtro de la tabla
  // y que get_stats del backend), para que las tarjetas coincidan con lo filtrado.
  const stats = useMemo(() => {
    const totalItems = items.length;
    const lowStock = items.filter(i => i.estado === "STOCK_BAJO").length;
    const outOfStock = items.filter(i => i.estado === "AGOTADO").length;
    return { totalItems, lowStock, outOfStock };
  }, [items]);

  const handleCreateItem = async (data: CreateInventarioItemInput) => {
    const cleanData = { ...data, fecha_caducidad: data.fecha_caducidad === "" ? null : data.fecha_caducidad };
    setIsActionLoading(true);
    try {
      await inventoryApi.createItem(cleanData);
      toast.success("Producto/insumo registrado exitosamente.");
      setIsCreateModalOpen(false);
      resetCreate();
      refreshList();
    } catch (err) {
      handleError(err, "Registro de Producto");
    } finally {
      setIsActionLoading(false);
    }
  };

  const openEditModal = (item: InventarioItem) => {
    setSelectedItem(item);
    // HU023: rehidratar el formulario limpio con reset (no setValue en cadena).
    resetEdit({
      nombre: item.nombre,
      precio: item.precio,
      stock_minimo: item.stock_minimo,
      unidad_medida: item.unidad_medida,
      descripcion: item.descripcion || "",
      fecha_caducidad: item.fecha_caducidad ? item.fecha_caducidad.split("T")[0] : "",
      motivo: "",
    });
    setIsEditModalOpen(true);
  };

  const doEditItem = async (data: UpdateInventarioItemInput) => {
    if (!selectedItem) return;
    const cleanData = { ...data, fecha_caducidad: data.fecha_caducidad === "" ? null : data.fecha_caducidad };
    setIsActionLoading(true);
    try {
      await inventoryApi.updateItem(selectedItem.id, cleanData);
      toast.success("Producto/insumo actualizado exitosamente.");
      setIsEditModalOpen(false);
      refreshList();
    } catch (err) {
      handleError(err, "Actualización de Producto");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleEditItem = (data: UpdateInventarioItemInput) => {
    if (!selectedItem) return;
    const precioCambio = data.precio !== undefined && data.precio !== selectedItem.precio;
    // HU019: exigir motivo cuando el precio cambia.
    if (precioCambio && !data.motivo?.trim()) {
      toast.error("Debe indicar el motivo del cambio de precio.");
      return;
    }
    // HU023: confirmación previa a guardar.
    const cambios: string[] = [];
    if (data.nombre !== selectedItem.nombre) cambios.push("Nombre");
    if (precioCambio) cambios.push("Precio");
    if (data.stock_minimo !== selectedItem.stock_minimo) cambios.push("Stock mínimo");
    if (data.descripcion !== (selectedItem.descripcion || "")) cambios.push("Descripción");
    setConfirmState({
      open: true,
      title: "Confirmar cambios",
      description: cambios.length ? `Vas a modificar: ${cambios.join(", ")}. ¿Continuar?` : "¿Guardar los cambios de este ítem?",
      confirmText: "GUARDAR",
      variant: "warning",
      action: () => { closeConfirm(); doEditItem(data); },
    });
  };

  const openStatusModal = (item: InventarioItem) => {
    setSelectedItem(item);
    resetStatus({ estado: item.estado, motivo: "" });
    setIsStatusModalOpen(true);
  };

  const doUpdateStatus = async (data: UpdateEstadoInput) => {
    if (!selectedItem) return;
    setIsActionLoading(true);
    try {
      await inventoryApi.updateStatus(selectedItem.id, data);
      toast.success("Estado actualizado.");
      setIsStatusModalOpen(false);
      refreshList();
    } catch (err) {
      handleError(err, "Cambio de Estado");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUpdateStatus = (data: UpdateEstadoInput) => {
    setConfirmState({
      open: true,
      title: "Confirmar cambio de estado",
      description: `Vas a cambiar el estado a ${data.estado.replace("_", " ")}. Motivo: ${data.motivo}. ¿Proceder?`,
      confirmText: "CONFIRMAR",
      variant: "warning",
      action: () => { closeConfirm(); doUpdateStatus(data); },
    });
  };

  const doDeleteItem = async (id: string) => {
    setIsActionLoading(true);
    try {
      await inventoryApi.deleteItem(id);
      toast.success("Producto dado de baja.");
      refreshList();
    } catch (err) {
      handleError(err, "Baja de producto");
    } finally {
      setIsActionLoading(false);
    }
  };

  // HU024: confirmación con Radix (no window.confirm).
  const handleDeleteItem = (item: InventarioItem) => {
    setConfirmState({
      open: true,
      title: "Dar de baja producto",
      description: `El producto "${item.nombre}" se ocultará del inventario activo. Podrás restaurarlo desde "Ver de baja".`,
      confirmText: "DAR DE BAJA",
      variant: "danger",
      action: () => { closeConfirm(); doDeleteItem(item.id); },
    });
  };

  const doRestoreItem = async (id: string) => {
    setIsActionLoading(true);
    try {
      await inventoryApi.restoreItem(id);
      toast.success("Producto restaurado.");
      fetchDeleted().catch(() => {});
    } catch (err) {
      handleError(err, "Restauración");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRestoreItem = (item: InventarioItem) => {
    setConfirmState({
      open: true,
      title: "Restaurar producto",
      description: `"${item.nombre}" volverá al inventario activo con su estado recalculado.`,
      confirmText: "RESTAURAR",
      variant: "success",
      action: () => { closeConfirm(); doRestoreItem(item.id); },
    });
  };

  const generateInvoiceNumber = () => {
    setFac1(Math.floor(Math.random() * 999).toString().padStart(3, "0"));
    setFac2(Math.floor(Math.random() * 999).toString().padStart(3, "0"));
    setFac3(Math.floor(Math.random() * 999999999).toString().padStart(9, "0"));
  };

  const openMovementModal = (item: InventarioItem) => {
    setSelectedItem(item);
    setFac1("");
    setFac2("");
    setFac3("");
    resetMove({ item_id: item.id, tipo: "ENTRADA", cantidad: 0, motivo: "Entrada de inventario", numero_factura: "" });
    setIsMovementModalOpen(true);
  };

  // HU021: los movimientos van al Inventory Service (no a Billing).
  const handleCreateMovement = async (data: CreateMovimientoInventarioInput) => {
    setIsActionLoading(true);
    try {
      await inventoryApi.createMovement(data);
      toast.success(`${data.tipo === "ENTRADA" ? "Entrada" : "Salida"} registrada correctamente.`);
      setIsMovementModalOpen(false);
      resetMove();
      refreshList();
    } catch (err) {
      handleError(err, `Registro de ${data.tipo === "ENTRADA" ? "Entrada" : "Salida"}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const fetchHistory = useCallback(async () => {
    if (!selectedItem) return;
    try {
      const res = await inventoryApi.listMovements(selectedItem.id, historyDates.start, historyDates.end);
      setMovements(res.data);
    } catch {
      toast.error("Error al obtener historial.");
    }
  }, [selectedItem, historyDates]);

  useEffect(() => { if (isHistoryModalOpen && selectedItem) fetchHistory(); }, [isHistoryModalOpen, selectedItem, historyDates, fetchHistory]);

  const sourceItems = showDeleted ? deletedItems : items;
  /** Un ítem está "en alerta" si está agotado, bajo mínimo o caducado. */
  const isAlerta = (i: InventarioItem) => {
    const caducado = !!i.fecha_caducidad && new Date(i.fecha_caducidad) <= new Date();
    return i.cantidad <= (i.stock_minimo ?? 0) || caducado;
  };
  const filteredItems = useMemo(() => {
    return sourceItems.filter(i => {
      const matchesSearch = search === "" || i.nombre.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === "ALL" || i.tipo === filterType;
      const matchesStatus = filterStatus === "ALL" || i.estado === filterStatus;
      const matchesAlert = !alertFilter || isAlerta(i);
      return matchesSearch && matchesType && matchesStatus && matchesAlert;
    });
  }, [sourceItems, search, filterType, filterStatus, alertFilter]);

  const columns = [
    {
      header: "Producto",
      accessor: (item: InventarioItem) => {
        const Icon = typeIcons[item.tipo];
        return (
          <div className="flex items-center gap-3 py-1">
            <div className="w-9 h-9 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10"><Icon size={18} className="text-primary" /></div>
            <div className="flex flex-col">
              <p className="font-headline text-xs font-bold text-primary leading-tight">{item.nombre}</p>
              <p className="font-body text-[10px] text-outline font-medium">{item.sku}</p>
            </div>
          </div>
        );
      },
    },
    {
      header: "Stock",
      accessor: (item: InventarioItem) => (
        <div className="flex flex-col">
          <span className={`text-xs font-black ${item.cantidad <= (item.stock_minimo ?? 0) ? "text-error" : "text-primary"}`}>{item.cantidad.toLocaleString()}</span>
          <span className="text-[9px] font-bold text-outline uppercase">{item.unidad_medida}</span>
        </div>
      ),
    },
    {
      header: "Estado",
      accessor: (item: InventarioItem) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-widest ${statusStyles[item.estado]}`}>{item.estado.replace("_", " ")}</span>
      ),
    },
    {
      header: "Acciones",
      align: "right" as const,
      accessor: (item: InventarioItem) => (
        showDeleted ? (
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => handleRestoreItem(item)} className="flex items-center gap-1.5 px-3 py-1.5 text-secondary bg-secondary/5 hover:bg-secondary/10 rounded-lg text-[10px] font-black uppercase tracking-widest" title="Restaurar"><ArchiveRestore size={15} /> Restaurar</button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => openMovementModal(item)} className="flex items-center gap-1.5 px-3 py-1.5 text-white bg-primary hover:bg-primary-container rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm" title="Nuevo Movimiento">
              <ArrowUpRight size={14} /> Mover
            </button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 text-outline hover:bg-surface-container rounded-lg transition-colors outline-none focus:ring-2 focus:ring-primary/20" title="Más opciones">
                  <MoreVertical size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => openEditModal(item)}>
                  <Edit size={14} className="mr-2 opacity-70" /> Editar información
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openStatusModal(item)}>
                  <Activity size={14} className="mr-2 opacity-70" /> Cambiar estado
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { setSelectedItem(item); setIsHistoryModalOpen(true); setHistoryDates({ start: "", end: "" }); }}>
                  <History size={14} className="mr-2 opacity-70" /> Movimientos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSelectedItem(item); setIsPriceHistoryOpen(true); }}>
                  <DollarSign size={14} className="mr-2 opacity-70" /> Bitácora de precios
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSelectedItem(item); setIsStatusHistoryOpen(true); }}>
                  <Layers size={14} className="mr-2 opacity-70" /> Bitácora de estados
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="danger" onClick={() => handleDeleteItem(item)}>
                  <Archive size={14} className="mr-2 opacity-70" /> Dar de baja
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      ),
    },
  ];

  if (loading && items.length === 0 && !showDeleted) return <LoadingSpinner size={52} fullPage />;

  const statusModalOptions = selectedItem
    ? EstadoInventarioEnum.options
        .filter((s) => estadosPermitidos(selectedItem).includes(s) || s === selectedItem.estado)
        .map((s) => ({ value: s, label: s.replace("_", " ") }))
    : [];

  return (
    <div className="max-w-[1400px] mx-auto space-y-4 animate-fade-in-up px-2 md:px-0">
      {isActionLoading && <LoadingSpinner fullPage message="Procesando..." />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl font-black tracking-tighter uppercase text-primary">Inventario Cafetería</h1>
          <p className="font-body text-[11px] text-outline uppercase tracking-[0.2em] font-bold">POS Management</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowDeleted((v) => !v)} className={`flex items-center gap-2 h-11 px-5 rounded-xl font-bold text-[11px] border transition-all shadow-sm ${showDeleted ? "bg-primary text-white border-transparent" : "bg-white text-primary border-outline-variant/30 hover:bg-surface-container"}`}>
            {showDeleted ? <Eye size={18} /> : <EyeOff size={18} />} {showDeleted ? "VER TODOS" : "VER DE BAJA"}
          </button>
          <button onClick={() => router.push("/dashboard/reports?tab=movimientos")} className="flex items-center gap-2 h-11 px-5 bg-white text-primary rounded-xl font-bold text-[11px] border border-outline-variant/30 hover:bg-surface-container transition-all shadow-sm"><BarChart3 size={18} /> VER REPORTES</button>
          <button onClick={() => { resetCreate(); setIsCreateModalOpen(true); }} className="flex items-center gap-2 h-11 px-5 bg-primary text-white rounded-xl font-bold text-[11px] hover:bg-primary-container shadow-lg shadow-primary/20"><Plus size={18} /> NUEVO PRODUCTO</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="flex items-center justify-between p-5 rounded-[28px] bg-white border border-outline-variant/20 shadow-sm">
          <div className="flex items-center gap-4"><div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"><ClipboardList size={24} /></div><div><p className="text-[10px] font-black text-primary/70 uppercase">Catálogo</p></div></div>
          <span className="font-headline text-4xl font-black text-primary tracking-tighter">{stats.totalItems}</span>
        </div>
        <div className="flex items-center justify-between p-5 rounded-[28px] bg-amber-50 border border-amber-200/50 shadow-sm">
          <div className="flex items-center gap-4"><div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-700"><AlertTriangle size={24} /></div><div><p className="text-[10px] font-black text-amber-700/70 uppercase">Stock Bajo</p></div></div>
          <span className="font-headline text-4xl font-black text-amber-700 tracking-tighter">{stats.lowStock}</span>
        </div>
        <div className="flex items-center justify-between p-5 rounded-[28px] bg-error-container/20 border border-error/10 shadow-sm">
          <div className="flex items-center gap-4"><div className="w-12 h-12 bg-error/10 rounded-2xl flex items-center justify-center text-error"><BarChart3 size={24} /></div><div><p className="text-[10px] font-black text-error/70 uppercase">Agotados</p></div></div>
          <span className="font-headline text-4xl font-black text-error tracking-tighter">{stats.outOfStock}</span>
        </div>
      </div>

      {/* Barra de filtros compacta (encima de la tabla) */}
      <div className="bg-white p-3 rounded-2xl border border-outline-variant/20 shadow-sm flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]"><Search value={search} onChange={setSearch} placeholder="Buscar..." /></div>
        <Select className="w-full sm:w-48" label="Categoría" value={filterType} onValueChange={setFilterType} options={[{ value: "ALL", label: "Todas" }, ...TipoElementoEnum.options.map(t => ({ value: t, label: t.replace("_", " ") }))]} />
        <Select className="w-full sm:w-48" label="Estado" value={filterStatus} onValueChange={setFilterStatus} options={[{ value: "ALL", label: "Todos" }, ...EstadoInventarioEnum.options.map(s => ({ value: s, label: s.replace("_", " ") }))]} />
        {alertFilter && (
          <button
            onClick={() => setAlertFilter(false)}
            className="h-[38px] flex items-center gap-2 px-3 rounded-xl text-[10px] font-black text-amber-700 uppercase tracking-widest bg-amber-50 border border-amber-200/60 hover:bg-amber-100 transition-colors whitespace-nowrap"
          >
            <AlertTriangle size={14} /> Solo alertas <span className="text-amber-600">✕</span>
          </button>
        )}
        {showDeleted && (
          <span className="h-[38px] flex items-center px-3 rounded-xl text-[10px] font-bold text-outline uppercase tracking-widest bg-surface-container whitespace-nowrap">
            Productos de baja
          </span>
        )}
      </div>

      {/* Tabla a todo el ancho */}
      <div className="bg-white rounded-[28px] border border-outline-variant/20 overflow-hidden shadow-sm min-h-[400px]"><Table data={filteredItems} columns={columns} rowKey={(i) => i.id} pageSize={10} /></div>

      {/* Crear */}
      <Dialog isOpen={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} title="Crear Producto/Insumo">
        <form onSubmit={handleSubmitCreate(handleCreateItem)} className="space-y-4 pt-2">
          <ProductFormFields register={registerCreate} errors={errorsCreate} watch={watchCreate} setValue={setCreateValue} />
          <button type="submit" className="w-full h-12 bg-primary text-white rounded-xl font-bold uppercase tracking-widest shadow-lg">GUARDAR</button>
        </form>
      </Dialog>

      {/* Editar */}
      <Dialog isOpen={isEditModalOpen} onOpenChange={setIsEditModalOpen} title="Editar Producto/Insumo">
        <form onSubmit={handleSubmitEdit(handleEditItem)} className="space-y-4 pt-2">
          <ProductFormFields register={registerEdit} errors={errorsEdit} watch={watchEdit} setValue={setEditValue} isEdit />
          {selectedItem && watchEdit("precio") !== selectedItem.precio && (
            <Input label="Motivo del cambio de precio" required {...registerEdit("motivo")} error={errorsEdit.motivo?.message} placeholder="Ej. Ajuste por proveedor" />
          )}
          <button type="submit" className="w-full h-12 bg-tertiary text-white rounded-xl font-bold uppercase shadow-lg">ACTUALIZAR</button>
        </form>
      </Dialog>

      {/* Estado */}
      <Dialog isOpen={isStatusModalOpen} onOpenChange={setIsStatusModalOpen} title="Actualizar Disponibilidad">
        <form onSubmit={handleSubmitStatus(handleUpdateStatus)} className="space-y-4 pt-2">
          <Select label="Nuevo Estado" required value={watchStatus("estado") || ""} options={statusModalOptions} onValueChange={(val) => setStatusValue("estado", val as EstadoInventario)} />
          <p className="text-[10px] font-bold text-outline">Solo se muestran los estados compatibles con el stock actual ({selectedItem?.cantidad ?? 0}).</p>
          <Input label="Motivo" required {...registerStatus("motivo")} error={errorsStatus.motivo?.message} placeholder="Justificación del cambio" />
          <button type="submit" className="w-full h-12 bg-primary text-white rounded-xl font-bold uppercase shadow-lg">GUARDAR</button>
        </form>
      </Dialog>

      {/* Movimiento */}
      <Dialog isOpen={isMovementModalOpen} onOpenChange={setIsMovementModalOpen} title="Movimiento de Stock">
        <form onSubmit={handleSubmitMove(handleCreateMovement)} className="space-y-4 pt-2">
          <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/20 flex justify-between items-center">
            <div className="flex gap-3 items-center">
              <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-primary border border-outline-variant/10"><Package size={20} /></div>
              <div>
                <p className="text-[10px] font-black text-outline uppercase tracking-widest">{selectedItem?.sku}</p>
                <p className="text-sm font-bold text-on-surface">{selectedItem?.nombre}</p>
              </div>
            </div>
            <div className="text-right bg-white p-2 rounded-lg border border-outline-variant/10 shadow-sm">
              <p className="text-[9px] font-black text-outline uppercase tracking-widest">Fecha</p>
              <p className="text-xs font-bold text-primary">{new Date().toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" })}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex p-1 bg-surface-container-high rounded-xl">
              <button type="button" onClick={() => { setMoveValue("tipo", "ENTRADA"); setMoveValue("motivo", "Entrada de inventario"); setFac1(""); setFac2(""); setFac3(""); setMoveValue("numero_factura", ""); }} className={`flex-1 py-3 rounded-lg font-black text-xs transition-all ${moveType === "ENTRADA" ? "bg-green-600 text-white shadow-md" : "text-outline hover:bg-white/50"}`}>ENTRADA</button>
              <button type="button" onClick={() => { setMoveValue("tipo", "SALIDA"); setMoveValue("motivo", "Salida de inventario"); setFac1(""); setFac2(""); setFac3(""); setMoveValue("numero_factura", ""); }} className={`flex-1 py-3 rounded-lg font-black text-xs transition-all ${moveType === "SALIDA" ? "bg-error text-white shadow-md" : "text-outline hover:bg-white/50"}`}>SALIDA</button>
            </div>
            <Input label="Cantidad" type="number" step="0.01" required {...registerMove("cantidad", { valueAsNumber: true })} error={errorsMove.cantidad?.message} />
            <div className="flex flex-col justify-center">
              <span className="block font-label text-[9px] font-bold uppercase tracking-widest text-outline ml-1 mb-1">Unidad</span>
              <div className="px-4 py-2 bg-surface-container rounded-xl text-xs font-bold text-primary">{selectedItem?.unidad_medida}</div>
            </div>
            <div className="col-span-2">
              <label className="block font-label text-[9px] font-bold uppercase tracking-widest text-outline ml-1 mb-1">
                Número de Factura / Doc <span className="text-error">*</span>
              </label>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <input 
                  placeholder="001" 
                  maxLength={3}
                  value={fac1}
                  onChange={(e) => setFac1(e.target.value.replace(/\D/g, ""))}
                  className="w-12 sm:w-14 px-1 sm:px-2 py-2 text-center bg-white border border-outline-variant/30 rounded-xl outline-none transition-all font-body text-xs shadow-sm focus:border-primary focus:ring-1 focus:ring-primary/30"
                />
                <span className="text-outline font-bold">-</span>
                <input 
                  placeholder="012" 
                  maxLength={3}
                  value={fac2}
                  onChange={(e) => setFac2(e.target.value.replace(/\D/g, ""))}
                  className="w-12 sm:w-14 px-1 sm:px-2 py-2 text-center bg-white border border-outline-variant/30 rounded-xl outline-none transition-all font-body text-xs shadow-sm focus:border-primary focus:ring-1 focus:ring-primary/30"
                />
                <span className="text-outline font-bold">-</span>
                <input 
                  placeholder="023384486" 
                  maxLength={9}
                  value={fac3}
                  onChange={(e) => setFac3(e.target.value.replace(/\D/g, ""))}
                  className="flex-1 min-w-[100px] px-2 sm:px-3 py-2 bg-white border border-outline-variant/30 rounded-xl outline-none transition-all font-body text-xs tracking-[0.1em] shadow-sm focus:border-primary focus:ring-1 focus:ring-primary/30"
                />
                {moveType === "SALIDA" && (
                  <button type="button" onClick={generateInvoiceNumber} className="shrink-0 flex items-center gap-1.5 p-2 px-3 text-primary bg-primary/5 hover:bg-primary/10 border border-primary/10 rounded-lg transition-all" title="Generar código automático">
                    <RefreshCw size={14} strokeWidth={2.5} />
                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline-block">Generar</span>
                  </button>
                )}
              </div>
              {errorsMove.numero_factura && <p className="text-error text-xs mt-1 ml-1">{errorsMove.numero_factura.message}</p>}
            </div>
            <div className="col-span-2">
              <Input label="Motivo" required {...registerMove("motivo")} error={errorsMove.motivo?.message} />
            </div>
          </div>
          {selectedItem && moveCantidad > 0 && (
            <div className="p-3 bg-surface-container rounded-xl flex justify-between items-center">
              <span className="text-[10px] font-black text-outline uppercase tracking-widest">Total estimado</span>
              <span className="text-sm font-black text-primary">${(moveCantidad * selectedItem.precio).toFixed(2)}</span>
            </div>
          )}
          <button type="submit" className={`w-full h-12 text-white rounded-xl font-bold uppercase shadow-lg transition-all disabled:opacity-50 ${moveType === "ENTRADA" ? "bg-green-600 shadow-green-200" : "bg-error shadow-error/20"}`} disabled={isActionLoading}>
            {isActionLoading ? "Procesando..." : `Confirmar ${moveType}`}
          </button>
        </form>
      </Dialog>

      {/* Historial de movimientos */}
      <Dialog isOpen={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen} title="Historial de Movimientos">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Input label="Desde" type="date" value={historyDates.start} onChange={(e) => setHistoryDates(prev => ({ ...prev, start: e.target.value }))} />
            <Input label="Hasta" type="date" value={historyDates.end} onChange={(e) => setHistoryDates(prev => ({ ...prev, end: e.target.value }))} />
          </div>
          <div className="max-h-[300px] overflow-y-auto border border-outline-variant/20 rounded-2xl">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-surface-container-high"><tr className="border-b border-outline-variant/20"><th className="px-4 py-3 text-[10px] font-black uppercase">Fecha</th><th className="px-4 py-3 text-[10px] font-black uppercase text-center">Tipo</th><th className="px-4 py-3 text-[10px] font-black uppercase text-right">Cantidad</th></tr></thead>
              <tbody>{movements.map((m) => (<tr key={m.id} className="border-b border-outline-variant/10 hover:bg-surface-container transition-colors"><td className="px-4 py-4 text-[11px] font-medium text-outline">{new Date(m.fecha).toLocaleString()}</td><td className="px-4 py-4 text-center"><div className={`inline-flex items-center gap-2 font-black text-[10px] px-2 py-1 rounded-lg ${m.tipo === "ENTRADA" ? "bg-green-50 text-green-600" : "bg-red-50 text-error"}`}>{m.tipo}</div><p className="text-[9px] text-outline mt-1 italic">{m.motivo}</p>{m.numero_factura && <p className="text-[9px] text-primary font-bold mt-1">Factura: {m.numero_factura}</p>}</td><td className="px-4 py-4 text-xs font-black text-primary text-right">{m.cantidad.toLocaleString()}</td></tr>))}</tbody>
            </table>
            {movements.length === 0 && <div className="p-10 text-center text-[10px] font-bold text-outline uppercase tracking-widest">Sin registros encontrados</div>}
          </div>
        </div>
      </Dialog>

      <PriceHistoryModal isOpen={isPriceHistoryOpen} onOpenChange={setIsPriceHistoryOpen} item={selectedItem} />
      <StatusHistoryModal isOpen={isStatusHistoryOpen} onOpenChange={setIsStatusHistoryOpen} item={selectedItem} />

      <Confirm
        open={confirmState.open}
        onOpenChange={(o) => setConfirmState((s) => ({ ...s, open: o }))}
        title={confirmState.title}
        description={confirmState.description}
        confirmText={confirmState.confirmText}
        variant={confirmState.variant}
        onConfirm={confirmState.action}
      />
    </div>
  );
}
