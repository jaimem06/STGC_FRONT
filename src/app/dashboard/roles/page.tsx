"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
// zod resolver removed because RoleCreate schema may not be exported from shared schemas
import { api } from "@/lib/auth-service";
import { ENDPOINTS } from "@/lib/endpoints";
import { 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Edit3, 
  FileText,
  Briefcase,
  Users2,
  Lock,
  Search as SearchIcon
} from "lucide-react";
// Define local input type for the form to avoid relying on possibly-missing exports
type RoleCreateInput = {
  name: string;
  description?: string | null;
};
import LoadingSpinner from "@/components/LoadingSpinner";
import Input from "@/components/Input";
import Confirm from "@/components/Confirm";
import Dialog from "@/components/Dialog";
import Search from "@/components/Search";
import { toast } from "@/lib/notifications";

interface RoleOut {
  id: string;
  name: string;
  description: string | null;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleOut | null>(null);
  const [search, setSearch] = useState("");

  // Deletion State
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<RoleCreateInput>();

  const fetchData = useCallback(async () => {
    try {
      const response = await api.get(ENDPOINTS.AUTH.ROLES.BASE);
      setRoles(response.data);
    } catch (err: any) {
      toast.error("Error al cargar roles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenCreate = () => {
    setEditingRole(null);
    reset({ name: "", description: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (role: RoleOut) => {
    setEditingRole(role);
    setValue("name", role.name);
    setValue("description", role.description || "");
    setIsModalOpen(true);
  };

  const onSubmit = async (data: RoleCreateInput) => {
    setIsActionLoading(true);
    try {
      if (editingRole) {
        await api.put(ENDPOINTS.AUTH.ROLES.BY_ID(editingRole.id), data);
        toast.success("Rol actualizado con éxito");
      } else {
        await api.post(ENDPOINTS.AUTH.ROLES.BASE, data);
        toast.success("Rol creado con éxito");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Error al guardar el rol");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!roleToDelete) return;
    setIsActionLoading(true);
    try {
      await api.delete(ENDPOINTS.AUTH.ROLES.BY_ID(roleToDelete));
      toast.success("Rol eliminado exitosamente");
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Error al eliminar el rol");
    } finally {
      setIsDeleteConfirmOpen(false);
      setRoleToDelete(null);
      setIsActionLoading(false);
    }
  };

  const groupedRoles = useMemo(() => {
    const filtered = roles.filter(role => 
      role.name.toLowerCase().includes(search.toLowerCase()) || 
      (role.description && role.description.toLowerCase().includes(search.toLowerCase()))
    ).sort((a, b) => a.name.localeCompare(b.name));

    return filtered.reduce((acc, role) => {
      const firstLetter = role.name.charAt(0).toUpperCase();
      if (!acc[firstLetter]) {
        acc[firstLetter] = [];
      }
      acc[firstLetter].push(role);
      return acc;
    }, {} as Record<string, RoleOut[]>);
  }, [roles, search]);

  if (loading) return <LoadingSpinner size={52} fullPage />;

  return (
    <div className="max-w-[1400px] mx-auto space-y-4 animate-fade-in-up px-2 md:px-0">
      {isActionLoading && <LoadingSpinner fullPage message="Procesando..." />}

      {/* Header & Title Card */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        <div className="lg:col-span-1 bg-secondary p-4 rounded-[24px] text-on-secondary flex flex-col justify-between shadow-xl shadow-secondary/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-bl-full -mr-4 -mt-4"></div>
          <div className="relative z-10">
            <h1 className="font-headline text-xl font-black tracking-tighter uppercase leading-none mb-1 text-white">Roles</h1>
            <p className="font-body text-[9px] opacity-70 uppercase tracking-widest font-bold text-white">Estructura Organizacional</p>
          </div>
          <button 
            onClick={handleOpenCreate}
            className="relative z-10 mt-3 h-9 bg-surface text-secondary rounded-lg font-headline font-bold text-[11px] flex items-center justify-center gap-2 hover:bg-white active:scale-95 transition-all shadow-sm"
          >
            <Plus size={14} /> NUEVO ROL
          </button>
        </div>

        {/* Stats / Info Cards */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-[24px] border border-secondary/10 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-secondary/5 rounded-xl flex items-center justify-center text-secondary">
              <Briefcase size={20} />
            </div>
            <div>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest leading-none mb-1">Roles Definidos</p>
              <h4 className="font-headline text-xl font-black text-primary leading-none">{roles.length}</h4>
            </div>
          </div>
          <div className="bg-white p-4 rounded-[24px] border border-primary/10 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary">
              <Users2 size={20} />
            </div>
            <div>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest leading-none mb-1">Impacto</p>
              <h4 className="font-headline text-[10px] font-bold text-primary leading-none">Equipo Operativo</h4>
            </div>
          </div>
          <div className="bg-white p-4 rounded-[24px] border border-tertiary/10 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-tertiary/5 rounded-xl flex items-center justify-center text-tertiary">
              <Lock size={20} />
            </div>
            <div>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest leading-none mb-1">Seguridad</p>
              <h4 className="font-headline text-[10px] font-bold text-tertiary leading-none">Niveles de Acceso</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar / Search */}
      <div className="bg-white p-3 rounded-[20px] shadow-sm flex flex-col md:flex-row gap-3 items-center border border-outline-variant/30">
        <div className="flex-1 w-full relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
            <SearchIcon size={18} />
          </div>
          <input
            type="text"
            className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl pl-11 pr-4 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline/70"
            placeholder="Buscar por nombre o descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Roles Grid Grouped Alphabetically */}
      <div className="space-y-6">
        {Object.keys(groupedRoles).length === 0 ? (
          <div className="text-center py-12">
            <p className="font-headline text-outline text-lg font-bold">No se encontraron roles</p>
            <p className="font-body text-sm text-outline-variant mt-1">Intenta con otro término de búsqueda.</p>
          </div>
        ) : (
          Object.keys(groupedRoles).sort().map(letter => (
            <div key={letter} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center font-headline font-black text-primary border border-outline-variant/30">
                  {letter}
                </div>
                <div className="h-px bg-outline-variant/20 flex-1"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {groupedRoles[letter].map((role) => (
                  <div key={role.id} className="group bg-white rounded-[24px] p-5 border border-outline-variant/30 shadow-sm hover:shadow-xl hover:border-secondary/20 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[180px]">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[60px] -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-500"></div>
                    
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 bg-surface-container-high rounded-xl flex items-center justify-center text-primary shadow-inner">
                          <ShieldCheck size={20} />
                        </div>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => handleOpenEdit(role)}
                            className="p-1.5 text-outline hover:text-secondary hover:bg-secondary/10 rounded-lg transition-all"
                            title="Editar"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button 
                            onClick={() => { setRoleToDelete(role.id); setIsDeleteConfirmOpen(true); }}
                            className="p-1.5 text-outline hover:text-error hover:bg-error/10 rounded-lg transition-all"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <h3 className="font-headline text-lg font-black text-primary mb-2 tracking-tighter uppercase leading-tight line-clamp-1 group-hover:text-secondary transition-colors">
                        {role.name}
                      </h3>
                      
                      <div className="flex items-start gap-1.5">
                        <FileText size={12} className="text-outline shrink-0 mt-0.5" />
                        <p className="font-body text-[11px] text-on-surface-variant font-medium leading-normal italic opacity-80 line-clamp-3">
                          {role.description || "Sin descripción detallada."}
                        </p>
                      </div>
                    </div>

                    <div className="relative z-10 pt-3 mt-3 border-t border-outline-variant/10 flex items-center justify-end">
                      <ShieldCheck size={14} className="text-secondary/20" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={editingRole ? "Editar rol" : "Nuevo rol"}
        description="Define el nombre y las responsabilidades."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-3">
            <Input
              label="Nombre del Rol"
              required
              placeholder="EJ: SUPERVISOR"
              {...register("name")}
              error={errors.name?.message}
            />
            <div className="space-y-1.5">
              <label className="font-label text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Descripción de Funciones</label>
              <textarea
                className={`w-full min-h-[80px] bg-surface-container border ${errors.description ? 'border-error' : 'border-outline-variant/30'} rounded-xl p-3 font-body text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none`}
                placeholder="Detalla las responsabilidades del rol..."
                {...register("description")}
              />
              {errors.description && (
                <p className="text-[10px] text-error font-medium ml-1">{errors.description.message}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 h-10 rounded-lg border border-outline-variant/30 font-bold text-outline text-[10px] uppercase tracking-widest hover:bg-surface-container transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="flex-1 h-10 bg-primary text-on-primary rounded-lg font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-xl transition-all"
            >
              {editingRole ? "Guardar" : "Crear"}
            </button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirm */}
      <Confirm
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title="¿Eliminar este rol?"
        description="Esta acción es irreversible y podría afectar a los usuarios asociados."
        onConfirm={handleConfirmDelete}
        confirmText="ELIMINAR PERMANENTEMENTE"
        variant="danger"
      />
    </div>
  );
}
