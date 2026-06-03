"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inventoryApi } from "@/lib/inventory-service";
import { 
  Package, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Tag, 
  Layers, 
  Info,
  AlertTriangle,
  ClipboardList,
  Filter,
  BarChart3,
  Calendar,
  DollarSign
} from "lucide-react";
import { 
  CreateInventarioItemSchema, 
  CreateInventarioItemInput, 
  InventarioItem, 
  MovimientoStockSchema, 
  MovimientoStockInput,
  TipoElementoEnum,
  EstadoProductoEnum,
  UnidadMedidaEnum
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

export default function InventoryPage() {
  const [items, setItems] = useState<InventarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventarioItem | null>(null);

  const { 
    register: registerCreate, 
    handleSubmit: handleSubmitCreate, 
    reset: resetCreate, 
    setValue: setCreateValue,
    watch: watchCreate,
    formState: { errors: errorsCreate }
  } = useForm<CreateInventarioItemInput>({
    resolver: zodResolver(CreateInventarioItemSchema),
    defaultValues: {
      estado: "DISPONIBLE",
      tipo: "PRODUCTO",
      unidad_medida: "LIBRAS"
    }
  });

  const { 
    register: registerMove, 
    handleSubmit: handleSubmitMove, 
    reset: resetMove, 
    setValue: setMoveValue,
    watch: watchMove,
    formState: { errors: errorsMove }
  } = useForm<MovimientoStockInput>({
    resolver: zodResolver(MovimientoStockSchema),
    defaultValues: {
      tipo: "ENTRADA"
    }
  });

  const selectedType = watchCreate("tipo");
  const selectedStatus = watchCreate("estado");
  const selectedUnit = watchCreate("unidad_medida");
  
  const moveType = watchMove("tipo");

  const fetchData = useCallback(async () => {
    try {
      const res = await inventoryApi.listItems();
      setItems(res.data);
    } catch (err: any) {
      toast.error("Error al cargar el inventario");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = useMemo(() => {
    const totalItems = items.length;
    const lowStock = items.filter(i => i.estado === "STOCK_BAJO").length;
    const outOfStock = items.filter(i => i.estado === "AGOTADO").length;
    return { totalItems, lowStock, outOfStock };
  }, [items]);

  const handleCreateItem = async (data: CreateInventarioItemInput) => {
    setIsActionLoading(true);
    
    // Preparar los datos para el backend
    const cleanData = {
      ...data,
      descripcion: data.descripcion?.trim() === "" ? null : data.descripcion,
      fecha_caducidad: data.fecha_caducidad && data.fecha_caducidad.trim() !== "" 
        ? new Date(data.fecha_caducidad).toISOString() 
        : null,
    };

    try {
      await inventoryApi.createItem(cleanData as CreateInventarioItemInput);
      toast.success("Ítem creado exitosamente");
      setIsCreateModalOpen(false);
      resetCreate();
      fetchData();
    } catch (err: any) {
      const status = err.response?.status;
      const data = err.response?.data;
      
      let message = "Error al crear el ítem";
      
      if (status === 400) {
        message = data?.detail || data?.message || "Datos del ítem inválidos o SKU duplicado";
      } else if (status === 422) {
        message = data?.detail || data?.message || "Error de validación en los datos enviados";
      } else if (status === 500) {
        message = "Error interno al crear el ítem";
      } else if (data?.detail || data?.message) {
        message = data.detail || data.message;
      }
      
      toast.error(message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCreateMovement = async (data: MovimientoStockInput) => {
    setIsActionLoading(true);
    
    const cleanData = {
      ...data,
      id: crypto.randomUUID(),
      fecha: new Date().toISOString(),
      motivo: data.motivo.trim(),
      lote_id: data.lote_id || null,
    };

    try {
      await inventoryApi.createMovement(cleanData as MovimientoStockInput);
      toast.success("Movimiento registrado correctamente");
      setIsMovementModalOpen(false);
      resetMove();
      fetchData();
    } catch (err: any) {
      const status = err.response?.status;
      const data = err.response?.data;
      
      let message = "Error al registrar movimiento";
      
      if (status === 400) {
        message = data?.detail || data?.message || "Datos del movimiento inválidos o error de stock";
      } else if (status === 422) {
        message = data?.detail || data?.message || "Error de validación en el movimiento";
      } else if (status === 500) {
        message = "Error interno al procesar el movimiento";
      } else if (data?.detail || data?.message) {
        message = data.detail || data.message;
      }
      
      toast.error(message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(i => {
      const matchesSearch = 
        search === "" ||
        i.nombre.toLowerCase().includes(search.toLowerCase()) || 
        i.sku.toLowerCase().includes(search.toLowerCase());

      const matchesType = filterType === "ALL" || i.tipo === filterType;
      const matchesStatus = filterStatus === "ALL" || i.estado === filterStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [items, search, filterType, filterStatus]);

  const columns = [
    {
      header: "Ítem",
      accessor: (item: InventarioItem) => {
        const Icon = typeIcons[item.tipo];
        return (
          <div className="flex items-center gap-3 py-1">
            <div className="w-9 h-9 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
              <Icon size={18} className="text-primary" />
            </div>
            <div className="flex flex-col">
              <p className="font-headline text-xs font-bold text-primary leading-tight">
                {item.nombre}
              </p>
              <p className="font-body text-[10px] text-outline font-medium">{item.sku}</p>
            </div>
          </div>
        );
      },
    },
    {
      header: "Tipo",
      accessor: (item: InventarioItem) => (
        <span className="text-[10px] font-bold text-primary/70 uppercase tracking-tight">{item.tipo.replace("_", " ")}</span>
      ),
    },
    {
      header: "Stock",
      accessor: (item: InventarioItem) => (
        <div className="flex flex-col">
          <span className="text-xs font-black text-primary">{item.cantidad.toLocaleString()}</span>
          <span className="text-[9px] font-bold text-outline uppercase">{item.unidad_medida}</span>
        </div>
      ),
    },
    {
      header: "Precio",
      accessor: (item: InventarioItem) => (
        <span className="text-xs font-bold text-primary">${item.precio.toFixed(2)}</span>
      ),
    },
    {
      header: "Estado",
      accessor: (item: InventarioItem) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-widest ${statusStyles[item.estado]}`}>
          {item.estado.replace("_", " ")}
        </span>
      ),
    },
    {
      header: "Acciones",
      align: "right" as const,
      accessor: (item: InventarioItem) => (
        <div className="flex items-center justify-end gap-1">
          <button 
            onClick={() => {
              setSelectedItem(item);
              setMoveValue("item_id", item.id);
              setIsMovementModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-2 py-1 bg-secondary/10 text-secondary hover:bg-secondary/20 rounded-lg transition-all"
            title="Registrar Movimiento"
          >
            <ArrowUpRight size={14} />
            <span className="text-[10px] font-bold uppercase">Mov</span>
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <LoadingSpinner size={52} fullPage />;

  return (
    <div className="max-w-[1400px] mx-auto space-y-4 animate-fade-in-up px-2 md:px-0">
      {isActionLoading && <LoadingSpinner fullPage message="Procesando..." />}

      {/* Header & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        <div className="lg:col-span-1 bg-primary p-5 rounded-[28px] text-on-primary flex flex-col justify-between shadow-lg shadow-primary/20 relative overflow-hidden group min-h-[120px]">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10">
            <h1 className="font-headline text-2xl font-black tracking-tighter uppercase leading-none mb-1">Inventario</h1>
            <p className="font-body text-[10px] opacity-80 uppercase tracking-[0.2em] font-bold">Control de Existencias</p>
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="relative z-10 mt-3 h-9 bg-white text-primary rounded-xl font-headline font-bold text-[11px] flex items-center justify-center gap-2 hover:bg-surface-container-lowest active:scale-95 transition-all shadow-md"
          >
            <Plus size={16} /> NUEVO ÍTEM
          </button>
        </div>

        <div className="lg:col-span-3 bg-white p-4 rounded-[28px] border border-outline-variant/20 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shadow-sm min-h-[120px]">
          <div className="flex-1 flex items-center justify-between p-4 rounded-2xl bg-surface-container-high border border-primary/5 transition-all hover:shadow-md group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <ClipboardList size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-primary/70 uppercase tracking-widest">Total Ítems</p>
                <p className="text-[9px] font-bold text-outline uppercase tracking-tight">En catálogo</p>
              </div>
            </div>
            <span className="font-headline text-3xl font-black text-primary tracking-tighter">{stats.totalItems}</span>
          </div>

          <div className="flex-1 flex items-center justify-between p-4 rounded-2xl bg-amber-50 border border-amber-200/50 transition-all hover:shadow-md group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-700 group-hover:scale-110 transition-transform">
                <AlertTriangle size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-amber-700/70 uppercase tracking-widest">Stock Bajo</p>
                <p className="text-[9px] font-bold text-amber-600/60 uppercase tracking-tight">Requiere reabastecimiento</p>
              </div>
            </div>
            <span className="font-headline text-3xl font-black text-amber-700 tracking-tighter">{stats.lowStock}</span>
          </div>

          <div className="flex-1 flex items-center justify-between p-4 rounded-2xl bg-error-container/20 border border-error/10 transition-all hover:shadow-md group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-error/10 rounded-xl flex items-center justify-center text-error group-hover:scale-110 transition-transform">
                <BarChart3 size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-error/70 uppercase tracking-widest">Agotados</p>
                <p className="text-[9px] font-bold text-error/50 uppercase tracking-tight">Sin disponibilidad</p>
              </div>
            </div>
            <span className="font-headline text-3xl font-black text-error tracking-tighter">{stats.outOfStock}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 items-start">
        <div className="xl:col-span-1 space-y-4">
          <div className="bg-white p-5 rounded-[28px] border border-outline-variant/30 shadow-sm space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-headline text-[11px] font-black text-primary uppercase tracking-widest">Filtros Avanzados</h3>
              <Filter size={14} className="text-outline" />
            </div>
            
            <Search 
              value={search}
              onChange={setSearch}
              placeholder="Buscar por nombre o SKU..."
            />
            
            <div className="space-y-3">
               <Select
                label="Categoría"
                value={filterType}
                onValueChange={setFilterType}
                options={[
                  { value: "ALL", label: "Todas las categorías" },
                  ...TipoElementoEnum.options.map(t => ({ value: t, label: t.replace("_", " ") }))
                ]}
              />
              <Select
                label="Estado de Stock"
                value={filterStatus}
                onValueChange={setFilterStatus}
                options={[
                  { value: "ALL", label: "Todos los estados" },
                  ...EstadoProductoEnum.options.map(s => ({ value: s, label: s.replace("_", " ") }))
                ]}
              />
            </div>

            <div className="pt-2">
              <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/20">
                <div className="flex items-center gap-2 mb-2">
                  <Info size={14} className="text-primary" />
                  <span className="text-[10px] font-black text-primary uppercase">Resumen</span>
                </div>
                <p className="text-[10px] text-on-surface-variant leading-relaxed">
                  Mostrando <b>{filteredItems.length}</b> productos que coinciden con los criterios de búsqueda.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-3 bg-white rounded-[28px] border border-outline-variant/20 overflow-hidden shadow-sm min-h-[400px]">
          <div className="px-6 py-4 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-lowest/50">
            <h2 className="font-headline text-[11px] font-black text-primary uppercase tracking-widest">Catálogo de Inventario</h2>
          </div>
          <Table 
            data={filteredItems}
            columns={columns}
            rowKey={(i) => i.id}
            pageSize={8}
          />
        </div>
      </div>

      {/* Create Modal */}
      <Dialog
        isOpen={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title="Registrar Nuevo Ítem"
        description="Agrega un nuevo producto o insumo al inventario unificado."
      >
        <form onSubmit={handleSubmitCreate(handleCreateItem)} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input 
                label="Nombre del Producto" 
                required 
                {...registerCreate("nombre")} 
                error={errorsCreate.nombre?.message}
              />
            </div>
            <Input 
              label="SKU / Código" 
              icon={Tag}
              required 
              {...registerCreate("sku")} 
              error={errorsCreate.sku?.message}
            />
            <Input 
              label="Precio Unitario" 
              icon={DollarSign}
              type="number"
              step="0.01"
              required 
              {...registerCreate("precio", { valueAsNumber: true })} 
              error={errorsCreate.precio?.message}
            />
            
            <Select
              label="Tipo de Elemento"
              required
              value={selectedType}
              options={TipoElementoEnum.options.map(t => ({ value: t, label: t.replace("_", " ") }))}
              onValueChange={(val) => setCreateValue("tipo", val as any)}
              error={errorsCreate.tipo?.message}
            />
             <Select
              label="Unidad de Medida"
              required
              value={selectedUnit}
              options={UnidadMedidaEnum.options.map(u => ({ value: u, label: u }))}
              onValueChange={(val) => setCreateValue("unidad_medida", val as any)}
              error={errorsCreate.unidad_medida?.message}
            />
            <Select
              label="Estado Inicial"
              required
              value={selectedStatus}
              options={EstadoProductoEnum.options.map(s => ({ value: s, label: s.replace("_", " ") }))}
              onValueChange={(val) => setCreateValue("estado", val as any)}
              error={errorsCreate.estado?.message}
            />
            <Input 
              label="Fecha Caducidad" 
              type="date"
              icon={Calendar}
              min={new Date().toISOString().split("T")[0]}
              {...registerCreate("fecha_caducidad")} 
              error={errorsCreate.fecha_caducidad?.message}
            />
            <div className="col-span-2">
              <Input 
                label="Descripción (Opcional)" 
                {...registerCreate("descripcion")} 
                error={errorsCreate.descripcion?.message}
              />
            </div>
          </div>
          <button 
            type="submit"
            className="w-full h-12 bg-primary text-on-primary rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            CREAR ELEMENTO EN INVENTARIO
          </button>
        </form>
      </Dialog>

      {/* Movement Modal */}
      <Dialog
        isOpen={isMovementModalOpen}
        onOpenChange={setIsMovementModalOpen}
        title="Registrar Movimiento"
        description={`Ajuste de stock para: ${selectedItem?.nombre}`}
      >
        <form onSubmit={handleSubmitMove(handleCreateMovement)} className="space-y-6 pt-2">
          <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-outline-variant/20 shadow-sm text-primary font-bold">
                {selectedItem?.cantidad}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-primary/60 uppercase">Stock Actual</span>
                <span className="text-[9px] font-bold text-outline uppercase">{selectedItem?.unidad_medida} disponibles</span>
              </div>
            </div>
            <div className="h-8 w-[1px] bg-outline-variant/40 mx-2"></div>
            <div className="text-right">
              <span className="text-[10px] font-black text-primary/60 uppercase">SKU</span>
              <p className="text-[11px] font-bold text-primary">{selectedItem?.sku}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex p-1 bg-surface-container-high rounded-xl border border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setMoveValue("tipo", "ENTRADA")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-black text-[10px] uppercase transition-all ${
                    moveType === "ENTRADA" 
                    ? "bg-green-600 text-white shadow-md" 
                    : "text-outline hover:bg-white/50"
                  }`}
                >
                  <ArrowDownLeft size={16} /> ENTRADA
                </button>
                <button
                  type="button"
                  onClick={() => setMoveValue("tipo", "SALIDA")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-black text-[10px] uppercase transition-all ${
                    moveType === "SALIDA" 
                    ? "bg-error text-white shadow-md" 
                    : "text-outline hover:bg-white/50"
                  }`}
                >
                  <ArrowUpRight size={16} /> SALIDA
                </button>
              </div>

              <Input 
                label="Cantidad" 
                type="number"
                step="0.01"
                required 
                {...registerMove("cantidad", { valueAsNumber: true })} 
                error={errorsMove.cantidad?.message}
              />
              <Input 
                label="Motivo / Referencia" 
                required 
                placeholder="Ej: Compra, Venta, Merma..."
                {...registerMove("motivo")} 
                error={errorsMove.motivo?.message}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              type="submit"
              className={`w-full h-12 rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-white ${
                moveType === "ENTRADA" ? "bg-green-600 shadow-green-200" : "bg-error shadow-error/20"
              }`}
            >
              CONFIRMAR {moveType}
            </button>
            <button 
              type="button"
              onClick={() => setIsMovementModalOpen(false)}
              className="w-full h-11 rounded-xl border border-outline-variant/30 font-bold text-outline text-[11px] uppercase tracking-widest hover:bg-surface-container transition-colors"
            >
              CANCELAR
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
