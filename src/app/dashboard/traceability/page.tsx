"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { inventoryApi } from "@/lib/inventory-service";
import { 
  History, 
  RefreshCcw, 
  Search as SearchIcon, 
  Coffee, 
  MapPin, 
  Calendar, 
  Scale, 
  Award,
  ChevronRight,
  ArrowRight,
  GitBranch,
  Info,
  Clock,
  CheckCircle2
} from "lucide-react";
import { 
  LoteCafe, 
  FaseCafeEnum,
  FaseCafe
} from "@/lib/schemas";
import LoadingSpinner from "@/components/LoadingSpinner";
import Table from "@/components/Table";
import Select from "@/components/Select";
import Dialog from "@/components/Dialog";
import Search from "@/components/Search";
import { toast } from "@/lib/notifications";

const faseStyles = {
  PULPA: "bg-red-50 text-red-700 border-red-200/50",
  DESPULPADO: "bg-orange-50 text-orange-700 border-orange-200/50",
  SECADO: "bg-amber-50 text-amber-700 border-amber-200/50",
  TOSTADO: "bg-primary/10 text-primary border-primary/20",
  MOLIDO: "bg-secondary/10 text-secondary border-secondary/20",
};

const calidadStyles = {
  ALTA: "text-green-600",
  MEDIA: "text-amber-600",
  BAJA: "text-error",
};

export default function TraceabilityPage() {
  const [lots, setLots] = useState<LoteCafe[]>([]);
  const [loading, setLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [historyCode, setHistoryCode] = useState("");
  const [history, setHistory] = useState<LoteCafe[] | null>(null);

  const [selectedLot, setSelectedLot] = useState<LoteCafe | null>(null);
  const [nextPhase, setNextPhase] = useState<FaseCafe | "">("");

  const fetchData = useCallback(async () => {
    try {
      const res = await inventoryApi.listLots();
      setLots(res.data);
    } catch (err: any) {
      toast.error("Error al cargar los lotes de café");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTransition = async () => {
    if (!selectedLot || !nextPhase) return;
    
    setIsActionLoading(true);
    try {
      await inventoryApi.transitionLotPhase(selectedLot.id, nextPhase as FaseCafe);
      toast.success("Fase transicionada exitosamente");
      setSelectedLot(null);
      setNextPhase("");
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Error al realizar la transición");
    } finally {
      setIsActionLoading(false);
    }
  };

  const fetchHistory = async (code: string) => {
    if (!code) return;
    setIsActionLoading(true);
    try {
      const res = await inventoryApi.getTraceabilityHistory(code);
      setHistory(res.data);
    } catch (err: any) {
      toast.error("No se encontró historial para este código");
      setHistory(null);
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredLots = useMemo(() => {
    return lots.filter(l => 
      search === "" || 
      l.variedad.toLowerCase().includes(search.toLowerCase()) || 
      l.codigo_trazabilidad.toLowerCase().includes(search.toLowerCase())
    );
  }, [lots, search]);

  const columns = [
    {
      header: "Lote de Café",
      accessor: (lot: LoteCafe) => (
        <div className="flex items-center gap-3 py-1">
          <div className="w-9 h-9 rounded-full bg-secondary/10 flex items-center justify-center border border-secondary/20">
            <Coffee size={18} className="text-secondary" />
          </div>
          <div className="flex flex-col">
            <p className="font-headline text-xs font-bold text-primary leading-tight">
              {lot.variedad}
            </p>
            <p className="font-body text-[10px] text-outline font-medium">{lot.codigo_trazabilidad.substring(0, 8)}...</p>
          </div>
        </div>
      ),
    },
    {
      header: "Fase Actual",
      accessor: (lot: LoteCafe) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-widest ${faseStyles[lot.fase]}`}>
          {lot.fase}
        </span>
      ),
    },
    {
      header: "Cantidad",
      accessor: (lot: LoteCafe) => (
        <div className="flex flex-col">
          <span className="text-xs font-black text-primary">{lot.cantidad_producida.toLocaleString()}</span>
          <span className="text-[9px] font-bold text-outline uppercase">{lot.unidad_medida}</span>
        </div>
      ),
    },
    {
      header: "Calidad",
      accessor: (lot: LoteCafe) => (
        <div className="flex items-center gap-1.5">
          <Award size={12} className={calidadStyles[lot.calidad]} />
          <span className="text-xs font-bold text-primary">{lot.calidad}</span>
        </div>
      ),
    },
    {
      header: "Acciones",
      align: "right" as const,
      accessor: (lot: LoteCafe) => (
        <div className="flex items-center justify-end gap-1.5">
          <button 
            onClick={() => {
              setHistoryCode(lot.codigo_trazabilidad);
              fetchHistory(lot.codigo_trazabilidad);
            }}
            className="p-1.5 text-primary hover:bg-primary/5 rounded-lg transition-all"
            title="Ver Historial"
          >
            <History size={16} />
          </button>
          <button 
            onClick={() => setSelectedLot(lot)}
            className="flex items-center gap-1 px-2 py-1 bg-secondary text-on-secondary hover:bg-secondary/90 rounded-lg transition-all shadow-sm"
            title="Transicionar Fase"
          >
            <RefreshCcw size={14} />
            <span className="text-[10px] font-bold uppercase">Transición</span>
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <LoadingSpinner size={52} fullPage />;

  return (
    <div className="max-w-[1400px] mx-auto space-y-4 animate-fade-in-up px-2 md:px-0">
      {isActionLoading && <LoadingSpinner fullPage message="Procesando..." />}

      {/* Header */}
      <div className="bg-white p-6 rounded-[28px] border border-outline-variant/20 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-secondary rounded-[20px] flex items-center justify-center text-on-secondary shadow-lg shadow-secondary/20">
            <GitBranch size={28} />
          </div>
          <div>
            <h1 className="font-headline text-2xl font-black tracking-tighter uppercase text-primary leading-none">Trazabilidad</h1>
            <p className="font-body text-[11px] text-outline uppercase tracking-[0.2em] font-bold mt-1">Cadena de Valor del Café</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input 
              type="text" 
              placeholder="Código de Trazabilidad..." 
              value={historyCode}
              onChange={(e) => setHistoryCode(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-surface-container rounded-xl border border-outline-variant/30 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={16} />
          </div>
          <button 
            onClick={() => fetchHistory(historyCode)}
            className="h-11 px-5 bg-primary text-on-primary rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-primary/90 transition-all shadow-md"
          >
            BUSCAR
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Main List */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white rounded-[28px] border border-outline-variant/20 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-outline-variant/10 flex items-center justify-between">
              <h2 className="font-headline text-[11px] font-black text-primary uppercase tracking-widest">Lotes en Proceso</h2>
              <div className="w-48">
                <Search 
                  value={search}
                  onChange={setSearch}
                  placeholder="Buscar lote..."
                />
              </div>
            </div>
            <Table 
              data={filteredLots}
              columns={columns}
              rowKey={(l) => l.id}
              pageSize={6}
            />
          </div>
        </div>

        {/* History / Info Sidebar */}
        <div className="xl:col-span-1">
          {history ? (
            <div className="bg-white p-6 rounded-[28px] border border-outline-variant/20 shadow-sm space-y-6 sticky top-4 animate-fade-in-up">
              <div className="flex items-center justify-between">
                <h3 className="font-headline text-[12px] font-black text-primary uppercase tracking-widest">Historial del Lote</h3>
                <button 
                  onClick={() => setHistory(null)}
                  className="text-[10px] font-bold text-outline hover:text-primary transition-colors"
                >
                  CERRAR
                </button>
              </div>

              <div className="relative space-y-8 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[2px] before:bg-outline-variant/30">
                {history.map((step, idx) => (
                  <div key={step.id} className="relative pl-10 animate-fade-in-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                    <div className={`absolute left-0 top-0 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shadow-sm z-10 ${
                      idx === 0 ? "bg-secondary text-white" : "bg-surface-container text-outline"
                    }`}>
                      {idx === 0 ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                    </div>
                    
                    <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 hover:border-primary/20 transition-all">
                      <div className="flex items-center justify-between mb-2">
                         <span className={`px-2 py-0.5 rounded-full text-[8px] font-black border uppercase tracking-tighter ${faseStyles[step.fase]}`}>
                          {step.fase}
                        </span>
                        <span className="text-[9px] font-bold text-outline uppercase tracking-tight">
                          {new Date(step.fecha_creacion).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs font-black text-primary uppercase tracking-tight mb-1">{step.variedad}</p>
                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-outline-variant/10">
                        <div>
                          <p className="text-[8px] font-black text-outline uppercase">Cantidad</p>
                          <p className="text-[10px] font-bold text-primary">{step.cantidad_producida} {step.unidad_medida}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-outline uppercase">Costo</p>
                          <p className="text-[10px] font-bold text-primary">${step.costo_produccion.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-surface-container-low p-8 rounded-[28px] border border-dashed border-outline-variant/60 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-outline/30 shadow-inner">
                <Info size={32} />
              </div>
              <div>
                <h3 className="font-headline text-sm font-black text-primary uppercase tracking-tight">Sin Selección</h3>
                <p className="text-[11px] text-outline font-medium max-w-[200px] mt-1">
                  Selecciona un lote o busca por código para ver su historia completa.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transition Modal */}
      <Dialog
        isOpen={!!selectedLot}
        onOpenChange={() => setSelectedLot(null)}
        title="Nueva Fase de Proceso"
        description={`Transicionar lote: ${selectedLot?.variedad}`}
      >
        <div className="space-y-6 pt-2">
          <div className="flex items-center justify-center gap-4 py-4">
            <div className="text-center space-y-1">
              <div className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest ${faseStyles[selectedLot?.fase || "PULPA"]}`}>
                {selectedLot?.fase}
              </div>
              <p className="text-[9px] font-bold text-outline uppercase">Actual</p>
            </div>
            <ArrowRight className="text-outline/40" />
            <div className="text-center space-y-1">
               <div className="px-3 py-1 rounded-full bg-surface-container text-primary text-[10px] font-black border border-outline-variant/30 uppercase tracking-widest">
                {nextPhase || "..."}
              </div>
              <p className="text-[9px] font-bold text-outline uppercase">Destino</p>
            </div>
          </div>

          <div className="space-y-4">
            <Select
              label="Seleccionar Siguiente Fase"
              required
              value={nextPhase}
              onValueChange={(val) => setNextPhase(val as FaseCafe)}
              options={FaseCafeEnum.options
                .filter(f => f !== selectedLot?.fase)
                .map(f => ({ value: f, label: f }))
              }
            />
            
            <div className="p-4 rounded-2xl bg-surface-container-high border border-primary/5 flex items-start gap-3">
              <Info size={16} className="text-primary mt-0.5" />
              <p className="text-[10px] text-on-surface-variant leading-relaxed">
                Esta acción cerrará el lote actual (<b>{selectedLot?.fase}</b>) y generará uno nuevo en fase <b>{nextPhase || "seleccionada"}</b>. El inventario se actualizará automáticamente.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={handleTransition}
              disabled={!nextPhase}
              className="w-full h-12 bg-secondary text-on-secondary rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-lg hover:shadow-xl disabled:opacity-50 disabled:translate-y-0 hover:-translate-y-0.5 transition-all"
            >
              CONFIRMAR TRANSICIÓN
            </button>
            <button 
              onClick={() => setSelectedLot(null)}
              className="w-full h-11 rounded-xl border border-outline-variant/30 font-bold text-outline text-[11px] uppercase tracking-widest hover:bg-surface-container transition-colors"
            >
              CANCELAR
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
