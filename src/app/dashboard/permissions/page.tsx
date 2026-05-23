"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { 
  Key, 
  Plus, 
  CheckCircle2,
  ShieldAlert,
  Zap,
  Lock,
  Eye,
  Search as SearchIcon,
  X,
  Fingerprint
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import Input from "@/components/Input";
import Search from "@/components/Search";
import { toast } from "sonner";

interface Permission {
  id: string;
  name: string;
  description: string;
}

const getPermissionStyles = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("manage") || n.includes("all") || n.includes("admin")) {
    return { 
      accent: "bg-tertiary", 
      icon: <ShieldAlert size={20} className="text-white" />,
      tag: "ADMIN" 
    };
  }
  if (n.includes("view") || n.includes("read")) {
    return { 
      accent: "bg-secondary", 
      icon: <Eye size={20} className="text-white" />,
      tag: "READ" 
    };
  }
  if (n.includes("edit") || n.includes("update") || n.includes("create")) {
    return { 
      accent: "bg-primary-container", 
      icon: <Zap size={20} className="text-white" />,
      tag: "WRITE" 
    };
  }
  return { 
    accent: "bg-outline", 
    icon: <Lock size={20} className="text-white" />,
    tag: "SYS" 
  };
};

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const fetchPermissions = useCallback(async () => {
    try {
      const res = await api.get("/roles/permissions");
      setPermissions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/roles/permissions", { name, description });
      toast.success("Capacidad registrada");
      setName("");
      setDescription("");
      setIsCreating(false);
      fetchPermissions();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Error al crear permiso");
    }
  };

  const filteredPermissions = permissions.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner size={52} fullPage />;

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <Fingerprint size={24} className="text-secondary" />
            </div>
            <span className="text-[10px] font-bold text-secondary uppercase tracking-[0.3em]">Criptografía de Acceso</span>
          </div>
          <h1 className="text-4xl font-headline font-extrabold text-primary tracking-tight">Privilegios</h1>
          <p className="text-sm text-on-surface-variant font-medium opacity-60">Matriz técnica de permisos granulares del núcleo.</p>
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="bg-inverse-surface text-inverse-on-surface px-8 py-4 rounded-2xl font-headline font-bold text-xs flex items-center gap-3 hover:bg-on-surface transition-all active:scale-95 shadow-xl uppercase tracking-widest border border-white/5"
        >
          <Plus size={18} /> Nueva Entrada
        </button>
      </div>

      {isCreating && (
        <div className="bg-white rounded-[40px] p-10 border border-outline-variant/20 shadow-2xl animate-in fade-in slide-in-from-top-6 duration-500 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-secondary" />
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-secondary/20">
                <Key size={24} />
              </div>
              <h3 className="text-2xl font-headline font-extrabold text-primary tracking-tight uppercase text-glow">Definir Capacidad</h3>
            </div>
            <button onClick={() => setIsCreating(false)} className="p-3 hover:bg-surface-container rounded-full text-outline transition-colors"><X size={24}/></button>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
            <div className="md:col-span-4">
              <Input label="Identificador de Sistema" required placeholder="ej: procesar_lotes" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="md:col-span-5">
              <Input label="Función Descriptiva" placeholder="¿Cuál es el alcance de este privilegio?" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="md:col-span-3">
              <button type="submit" className="w-full h-12 bg-primary text-white font-bold rounded-2xl hover:bg-primary-container transition-all text-xs uppercase tracking-widest shadow-lg shadow-primary/20">Registrar en Matriz</button>
            </div>
          </form>
        </div>
      )}

      {/* Global Search Bar */}
      <div className="bg-white/60 backdrop-blur-xl p-2 rounded-[30px] border border-outline-variant/10 shadow-sm max-w-2xl">
        <Search value={search} onChange={setSearch} placeholder="Filtrar por nombre técnico o descripción..." className="!bg-transparent border-none shadow-none" />
      </div>

      {/* Dark Technical Tiles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredPermissions.map((perm) => {
          const styles = getPermissionStyles(perm.name);
          return (
            <div 
              key={perm.id} 
              className="bg-inverse-surface group relative rounded-[32px] p-6 border border-white/5 shadow-2xl hover:shadow-[0_0_40px_rgba(58,104,67,0.15)] hover:border-secondary/40 transition-all duration-500 overflow-hidden"
            >
              {/* Top Accent Bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${styles.accent} opacity-40 group-hover:opacity-100 transition-opacity`} />
              
              {/* Technical Ribbon Tag */}
              <div className="absolute top-4 right-4">
                 <span className={`px-2 py-0.5 rounded-md ${styles.accent} text-[8px] font-black text-white/90 uppercase tracking-tighter opacity-30 group-hover:opacity-100 transition-opacity`}>
                   {styles.tag}
                 </span>
              </div>

              <div className="flex flex-col gap-5 mt-2">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 group-hover:bg-white/10 group-hover:border-white/10 transition-all">
                  {styles.icon}
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-headline font-black text-white text-base uppercase tracking-tight group-hover:text-secondary-container transition-colors truncate">
                    {perm.name.replace(/_/g, ' ')}
                  </h4>
                  <p className="text-[11px] text-outline-variant/60 font-medium leading-relaxed min-h-[48px] italic group-hover:text-outline-variant transition-colors line-clamp-3">
                    {perm.description || "Este token de acceso permite operaciones técnicas fundamentales dentro del esquema de seguridad del núcleo STGC."}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                   <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${styles.accent} animate-pulse`} />
                      <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest group-hover:text-white/40 transition-colors">Verificado</span>
                   </div>
                   <CheckCircle2 size={14} className="text-secondary opacity-0 group-hover:opacity-100 transition-all transform scale-50 group-hover:scale-100" />
                </div>
              </div>

              {/* Technical Decorative Lines */}
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/[0.02] rounded-full blur-2xl group-hover:bg-secondary/5 transition-colors" />
            </div>
          );
        })}
      </div>
      
      {filteredPermissions.length === 0 && (
        <div className="py-32 text-center bg-inverse-surface rounded-[40px] border border-white/5 shadow-inner">
          <SearchIcon size={48} className="mx-auto text-white/10 mb-6" />
          <p className="font-headline text-2xl font-bold text-white/40 italic uppercase tracking-tighter">Sin Coincidencias Técnicas</p>
          <p className="text-xs text-white/20 mt-2 uppercase tracking-widest font-bold">Ajusta los parámetros de búsqueda del núcleo</p>
        </div>
      )}
    </div>
  );
}
