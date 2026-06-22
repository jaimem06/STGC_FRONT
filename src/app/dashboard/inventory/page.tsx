"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inventoryApi } from "@/lib/inventory-service";
import {
  Package, Plus, ArrowUpRight, ArrowDownLeft, Tag, Layers, Info,
  AlertTriangle, ClipboardList, Filter, BarChart3, Calendar,
  DollarSign, Edit, Trash2, History, CheckCircle2, XCircle,
  Download, Activity, FileSpreadsheet
} from "lucide-react";
import {
  CreateInventarioItemSchema, CreateInventarioItemInput,
  UpdateInventarioItemSchema, UpdateInventarioItemInput,
  UpdateEstadoSchema, UpdateEstadoInput,
  InventarioItem, MovimientoStockSchema, MovimientoStockInput,
  TipoElementoEnum, EstadoInventarioEnum, UnidadMedidaEnum,
  EstadoInventario, ModuloInventarioEnum, CalidadCafeEnum, FaseCafeEnum
} from "@/lib/schemas";
import LoadingSpinner from "@/components/LoadingSpinner";
import Table from "@/components/Table";
import Input from "@/components/Input";
import Select from "@/components/Select";
import Dialog from "@/components/Dialog";
import Search from "@/components/Search";
import { toast } from "@/lib/notifications";

const statusStyles = {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ProductFormFields = ({ register, errors, watch, setValue, isEdit = false }: any) => (
  <div className="grid grid-cols-2 gap-4">
    <div className="col-span-2">
      <Input label="Nombre" required {...register("nombre")} error={errors.nombre?.message} />
    </div>
    {!isEdit && (
      <Input label="SKU" required {...register("sku")} error={errors.sku?.message} />
    )}
    <Input label="Precio" type="number" step="0.01" required {...register("precio", { valueAsNumber: true })} error={errors.precio?.message} />
    <Input label="Mínimo" type="number" step="1" required {...register("stock_minimo", { valueAsNumber: true })} error={errors.stock_minimo?.message} />
    {!isEdit && (
      <Select label="Categoría" required value={watch("tipo") || ""} options={TipoElementoEnum.options.map(t => ({ value: t, label: t.replace("_", " ") }))} onValueChange={(val) => setValue("tipo", val)} error={errors.tipo?.message} />
    )}
    <Select label="Unidad" required value={watch("unidad_medida") || ""} options={UnidadMedidaEnum.options.map(u => ({ value: u, label: u }))} onValueChange={(val) => setValue("unidad_medida", val)} error={errors.unidad_medida?.message} />
    <Select label="Estado" required value={watch("estado") || (isEdit ? "" : "DISPONIBLE")} options={EstadoInventarioEnum.options.map(e => ({ value: e, label: e.replace("_", " ") }))} onValueChange={(val) => setValue("estado", val)} error={errors.estado?.message} />
    <div className="col-span-2">
      <Input label="Fecha Caducidad" type="date" {...register("fecha_caducidad")} error={errors.fecha_caducidad?.message} />
    </div>
    <div className="col-span-2">
      <label className="block font-label text-[9px] font-bold uppercase tracking-widest text-outline ml-1 mb-1">Descripción <span className="text-error">*</span></label>
      <div className="relative">
        <textarea className={`w-full bg-white border rounded-xl outline-none transition-all font-label text-sm font-bold shadow-sm placeholder:font-medium placeholder:text-outline/50 focus:ring-2 p-3 resize-none ${errors.descripcion ? "border-error focus:border-error focus:ring-error/10" : "border-outline-variant/20 focus:border-primary/30 focus:ring-primary/10"}`} rows={3} placeholder="Descripción del producto..." {...register("descripcion")} />
        <div className="flex justify-between items-center mt-1">
          {errors.descripcion ? <p className="text-[9px] font-bold text-error ml-1">{errors.descripcion.message}</p> : <span />}
          <span className="text-[9px] font-bold text-outline mr-1">{(watch("descripcion") || "").length}/250</span>
        </div>
      </div>
    </div>
  </div>
);

export default function InventoryPage() {
  const [items, setItems] = useState<InventarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const [selectedItem, setSelectedItem] = useState<InventarioItem | null>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [historyDates, setHistoryDates] = useState({ start: "", end: "" });

  const { register: registerCreate, handleSubmit: handleSubmitCreate, reset: resetCreate, setValue: setCreateValue, watch: watchCreate, formState: { errors: errorsCreate } } = useForm<CreateInventarioItemInput>({
    resolver: zodResolver(CreateInventarioItemSchema),
    defaultValues: { estado: "DISPONIBLE", tipo: "PRODUCTO", unidad_medida: "LIBRAS", modulo: "CAFETERIA", stock_minimo: 0 }
  });

  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, setValue: setEditValue, watch: watchEdit, formState: { errors: errorsEdit } } = useForm<UpdateInventarioItemInput>({
    resolver: zodResolver(UpdateInventarioItemSchema)
  });

  const { register: registerStatus, handleSubmit: handleSubmitStatus, setValue: setStatusValue, watch: watchStatus } = useForm<UpdateEstadoInput>({
    resolver: zodResolver(UpdateEstadoSchema)
  });

  const { register: registerMove, handleSubmit: handleSubmitMove, reset: resetMove, setValue: setMoveValue, watch: watchMove, formState: { errors: errorsMove } } = useForm<MovimientoStockInput>({
    resolver: zodResolver(MovimientoStockSchema),
    defaultValues: { tipo: "ENTRADA" }
  });

  const selectedType = watchCreate("tipo");
  const selectedUnit = watchCreate("unidad_medida");
  const moveType = watchMove("tipo");

  const handleError = (err: any, context: string) => {
    console.error(`Error en ${context}:`, err);
    const status = err.response?.status;
    const backendMessage = err.response?.data?.message || err.response?.data?.detail;

    if (status === 409) {
      toast.error("El SKU ingresado ya existe. Use un código único.");
    } else if (status === 422) {
      toast.error("Datos inválidos. Verifique el formato de fechas y campos.");
    } else if (status === 401) {
      toast.error("Su sesión ha expirado.");
    } else if (status === 400) {
      toast.error(backendMessage || "Solicitud incorrecta. Verifique el stock.");
    } else if (backendMessage) {
      toast.error(backendMessage);
    } else {
      toast.error(`Error: ${context}. Intente de nuevo.`);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inventoryApi.listItems();
      setItems(res.data);
    } catch (err: any) {
      handleError(err, "Carga de Inventario");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const stats = useMemo(() => {
    const totalItems = items.length;
    const lowStock = items.filter(i => i.estado === "STOCK_BAJO").length;
    const outOfStock = items.filter(i => i.estado === "AGOTADO").length;
    return { totalItems, lowStock, outOfStock };
  }, [items]);

  const handleCreateItem = async (data: CreateInventarioItemInput) => {
    const cleanData = {
      ...data,
      fecha_caducidad: data.fecha_caducidad === "" ? null : data.fecha_caducidad,
    };
    setIsActionLoading(true);
    try {
      await inventoryApi.createItem(cleanData);
      toast.success("Producto/insumo registrado exitosamente");
      setIsCreateModalOpen(false);
      resetCreate();
      fetchData();
    } catch (err: any) {
      handleError(err, "Registro de Producto");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleEditItem = async (data: UpdateInventarioItemInput) => {
    if (!selectedItem) return;
    const cleanData = {
      ...data,
      fecha_caducidad: data.fecha_caducidad === "" ? null : data.fecha_caducidad,
    };
    setIsActionLoading(true);
    try {
      await inventoryApi.updateItem(selectedItem.id, cleanData);
      toast.success("Actualización exitosa");
      setIsEditModalOpen(false);
      fetchData();
    } catch (err: any) {
      handleError(err, "Actualización de Producto");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUpdateStatus = async (data: UpdateEstadoInput) => {
    if (!selectedItem) return;
    setIsActionLoading(true);
    try {
      await inventoryApi.updateStatus(selectedItem.id, data);
      toast.success("Estado actualizado");
      setIsStatusModalOpen(false);
      fetchData();
    } catch (err: any) {
      handleError(err, "Cambio de Estado");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("¿Eliminar producto?")) return;
    setIsActionLoading(true);
    try {
      await inventoryApi.deleteItem(id);
      toast.success("Eliminado");
      fetchData();
    } catch (err: any) {
      handleError(err, "Eliminación");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCreateMovement = async (data: MovimientoStockInput) => {
    setIsActionLoading(true);
    try {
      await inventoryApi.createMovement(data);
      toast.success("Movimiento registrado");
      setIsMovementModalOpen(false);
      resetMove();
      fetchData();
    } catch (err: any) {
      handleError(err, "Registro de Movimiento");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleExportGeneralReport = async () => {
    setIsActionLoading(true);
    try {
      await inventoryApi.exportGeneralMovements();
      toast.success("Reporte generado con éxito");
    } catch (err: any) {
      handleError(err, "Exportación");
    } finally {
      setIsActionLoading(false);
    }
  };

  const fetchHistory = async () => {
    if (!selectedItem) return;
    try {
      const res = await inventoryApi.listMovements(selectedItem.id, historyDates.start, historyDates.end);
      setMovements(res.data);
    } catch (err: any) {
      toast.error("Error al obtener historial");
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(i => {
      const matchesSearch = search === "" || i.nombre.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === "ALL" || i.tipo === filterType;
      const matchesStatus = filterStatus === "ALL" || i.estado === filterStatus;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [items, search, filterType, filterStatus]);

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
          <span className={`text-xs font-black ${item.cantidad <= (item.stock_minimo ?? 0) ? 'text-error' : 'text-primary'}`}>{item.cantidad.toLocaleString()}</span>
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
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => { setSelectedItem(item); setMoveValue("item_id", item.id); setIsMovementModalOpen(true); }} className="p-1.5 text-secondary hover:bg-secondary/10 rounded-lg" title="Movimiento"><ArrowUpRight size={16} /></button>
          <button onClick={() => { setSelectedItem(item); setStatusValue("estado", item.estado); setIsStatusModalOpen(true); }} className="p-1.5 text-amber-600 hover:bg-amber-600/10 rounded-lg" title="Estado"><Activity size={16} /></button>
          <button onClick={() => { setSelectedItem(item); setEditValue("nombre", item.nombre); setEditValue("precio", item.precio); setEditValue("stock_minimo", item.stock_minimo); setEditValue("unidad_medida", item.unidad_medida); setEditValue("estado", item.estado); setEditValue("descripcion", item.descripcion || ""); setEditValue("fecha_caducidad", item.fecha_caducidad ? new Date(item.fecha_caducidad).toISOString().split('T')[0] : ""); setIsEditModalOpen(true); }} className="p-1.5 text-tertiary hover:bg-tertiary/10 rounded-lg" title="Editar"><Edit size={16} /></button>
          <button onClick={() => { setSelectedItem(item); setIsHistoryModalOpen(true); setHistoryDates({ start: "", end: "" }); }} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg" title="Historial"><History size={16} /></button>
          <button onClick={() => handleDeleteItem(item.id)} className="p-1.5 text-error hover:bg-error/10 rounded-lg" title="Eliminar"><Trash2 size={16} /></button>
        </div>
      ),
    },
  ];

  useEffect(() => { if (isHistoryModalOpen && selectedItem) fetchHistory(); }, [isHistoryModalOpen, selectedItem, historyDates]);

  if (loading && items.length === 0) return <LoadingSpinner size={52} fullPage />;

  return (
    <div className="max-w-[1400px] mx-auto space-y-4 animate-fade-in-up px-2 md:px-0">
      {isActionLoading && <LoadingSpinner fullPage message="Procesando..." />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl font-black tracking-tighter uppercase text-primary">Inventario Cafetería</h1>
          <p className="font-body text-[11px] text-outline uppercase tracking-[0.2em] font-bold">POS Management</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExportGeneralReport} className="flex items-center gap-2 h-11 px-5 bg-white text-primary rounded-xl font-bold text-[11px] border border-outline-variant/30 hover:bg-surface-container transition-all shadow-sm"><FileSpreadsheet size={18} /> EXPORTAR CSV</button>
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

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <div className="xl:col-span-1 bg-white p-5 rounded-[28px] border border-outline-variant/30 shadow-sm space-y-4">
          <Search value={search} onChange={setSearch} placeholder="Buscar..." />
          <div className="space-y-3">
            <Select label="Categoría" value={filterType} onValueChange={setFilterType} options={[{ value: "ALL", label: "Todas" }, ...TipoElementoEnum.options.map(t => ({ value: t, label: t.replace("_", " ") }))]} />
            <Select label="Estado" value={filterStatus} onValueChange={setFilterStatus} options={[{ value: "ALL", label: "Todos" }, ...EstadoInventarioEnum.options.map(s => ({ value: s, label: s.replace("_", " ") }))]} />
          </div>
        </div>
        <div className="xl:col-span-3 bg-white rounded-[28px] border border-outline-variant/20 overflow-hidden shadow-sm min-h-[400px]"><Table data={filteredItems} columns={columns} rowKey={(i) => i.id} pageSize={10} /></div>
      </div>

      {/* Modales actualizados */}
      <Dialog isOpen={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} title="Crear Producto">
        <form onSubmit={handleSubmitCreate(handleCreateItem)} className="space-y-4 pt-2">
          <ProductFormFields register={registerCreate} errors={errorsCreate} watch={watchCreate} setValue={setCreateValue} />
          <button type="submit" className="w-full h-12 bg-primary text-white rounded-xl font-bold uppercase tracking-widest shadow-lg">GUARDAR</button>
        </form>
      </Dialog>

      <Dialog isOpen={isEditModalOpen} onOpenChange={setIsEditModalOpen} title="Editar Producto">
        <form onSubmit={handleSubmitEdit(handleEditItem)} className="space-y-4 pt-2">
          <ProductFormFields register={registerEdit} errors={errorsEdit} watch={watchEdit} setValue={setEditValue} isEdit />
          <button type="submit" className="w-full h-12 bg-tertiary text-white rounded-xl font-bold uppercase shadow-lg">ACTUALIZAR</button>
        </form>
      </Dialog>

      <Dialog isOpen={isStatusModalOpen} onOpenChange={setIsStatusModalOpen} title="Actualizar Disponibilidad"><form onSubmit={handleSubmitStatus(handleUpdateStatus)} className="space-y-6 pt-2"><Select label="Nuevo Estado" required value={watchStatus("estado") || ""} options={EstadoInventarioEnum.options.map(s => ({ value: s, label: s.replace("_", " ") }))} onValueChange={(val) => setStatusValue("estado", val as EstadoInventario)} /><button type="submit" className="w-full h-12 bg-primary text-white rounded-xl font-bold uppercase shadow-lg">GUARDAR</button></form></Dialog>

      <Dialog isOpen={isMovementModalOpen} onOpenChange={setIsMovementModalOpen} title="Entrada / Salida de Stock"><form onSubmit={handleSubmitMove(handleCreateMovement)} className="space-y-6 pt-2"><div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 flex items-center justify-between"><div><span className="text-[10px] font-black text-primary/60 uppercase">Existencia</span><p className="text-2xl font-black text-primary leading-none mt-1">{selectedItem?.cantidad ?? 0} <span className="text-xs text-outline">{selectedItem?.unidad_medida}</span></p></div><div className={`px-4 py-1.5 rounded-full text-[10px] font-black border ${(selectedItem?.cantidad ?? 0) <= (selectedItem?.stock_minimo || 0) ? 'bg-error-container/20 text-error border-error' : 'bg-green-50 text-green-700 border-green-200'}`}>{(selectedItem?.cantidad ?? 0) <= (selectedItem?.stock_minimo || 0) ? 'REABASTECER' : 'SUFICIENTE'}</div></div><div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 flex p-1 bg-surface-container-high rounded-xl"><button type="button" onClick={() => setMoveValue("tipo", "ENTRADA")} className={`flex-1 py-3 rounded-lg font-black text-xs transition-all ${moveType === "ENTRADA" ? "bg-green-600 text-white shadow-md" : "text-outline hover:bg-white/50"}`}>ENTRADA</button><button type="button" onClick={() => setMoveValue("tipo", "SALIDA")} className={`flex-1 py-3 rounded-lg font-black text-xs transition-all ${moveType === "SALIDA" ? "bg-error text-white shadow-md" : "text-outline hover:bg-white/50"}`}>SALIDA</button></div><Input label="Cantidad" type="number" step="0.01" required {...registerMove("cantidad", { valueAsNumber: true })} error={errorsMove.cantidad?.message} /><Input label="Motivo" required placeholder="Ej: Compra, Venta, Merma..." {...registerMove("motivo")} error={errorsMove.motivo?.message} /></div><button type="submit" className={`w-full h-12 rounded-xl font-bold text-white shadow-lg transition-all ${moveType === "ENTRADA" ? "bg-green-600 shadow-green-200" : "bg-error shadow-error/20"}`}>CONFIRMAR {moveType}</button></form></Dialog>

      <Dialog isOpen={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen} title="Historial de Movimientos"><div className="space-y-4"><div className="grid grid-cols-2 gap-2"><Input label="Desde" type="date" value={historyDates.start} onChange={(e) => setHistoryDates(prev => ({ ...prev, start: e.target.value }))} /><Input label="Hasta" type="date" value={historyDates.end} onChange={(e) => setHistoryDates(prev => ({ ...prev, end: e.target.value }))} /></div><div className="max-h-[300px] overflow-y-auto border border-outline-variant/20 rounded-2xl"><table className="w-full text-left"><thead className="sticky top-0 bg-surface-container-high"><tr className="border-b border-outline-variant/20"><th className="px-4 py-3 text-[10px] font-black uppercase">Fecha</th><th className="px-4 py-3 text-[10px] font-black uppercase text-center">Tipo</th><th className="px-4 py-3 text-[10px] font-black uppercase text-right">Cantidad</th></tr></thead><tbody>{movements.map((m) => (<tr key={m.id} className="border-b border-outline-variant/10 hover:bg-surface-container transition-colors"><td className="px-4 py-4 text-[11px] font-medium text-outline">{new Date(m.fecha).toLocaleString()}</td><td className="px-4 py-4 text-center"><div className={`inline-flex items-center gap-2 font-black text-[10px] px-2 py-1 rounded-lg ${m.tipo === 'ENTRADA' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-error'}`}>{m.tipo}</div><p className="text-[9px] text-outline mt-1 italic">{m.motivo}</p></td><td className="px-4 py-4 text-xs font-black text-primary text-right">{m.cantidad.toLocaleString()}</td></tr>))}</tbody></table>{movements.length === 0 && <div className="p-10 text-center text-[10px] font-bold text-outline uppercase tracking-widest">Sin registros encontrados</div>}</div></div></Dialog>
    </div>
  );
}
