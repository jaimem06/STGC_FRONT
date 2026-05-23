"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckSquare, 
  Square,
  AlertTriangle,
  X
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import Input from "@/components/Input";
import Confirm from "@/components/Confirm";
import { toast } from "sonner";

interface Permission {
  id: string;
  name: string;
  description: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // Deletion State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [rolesRes, permsRes] = await Promise.all([
        api.get("/roles"),
        api.get("/roles/permissions")
      ]);
      setRoles(rolesRes.data);
      setPermissions(permsRes.data);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { 
      name: name.toUpperCase(), 
      description, 
      permission_ids: selectedPerms 
    };

    try {
      if (editingRole) {
        await api.patch(`/roles/${editingRole.id}`, payload);
        toast.success("Rol actualizado con éxito");
      } else {
        await api.post("/roles", payload);
        toast.success("Rol creado con éxito");
      }
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Error al guardar el rol");
    }
  };

  const confirmDelete = (roleId: string) => {
    setRoleToDelete(roleId);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!roleToDelete) return;
    try {
      await api.delete(`/roles/${roleToDelete}`);
      toast.info("Rol eliminado. Los usuarios afectados han sido reasignados a 'Cajero Mesero' automáticamente.");
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Error al eliminar el rol");
    } finally {
      setIsConfirmOpen(false);
      setRoleToDelete(null);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setSelectedPerms([]);
    setEditingRole(null);
  };

  const openEdit = (role: Role) => {
    setEditingRole(role);
    setName(role.name);
    setDescription(role.description || "");
    setSelectedPerms(role.permissions.map(p => p.id));
    setIsModalOpen(true);
  };

  const togglePerm = (id: string) => {
    setSelectedPerms(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  if (loading) return <LoadingSpinner size={52} fullPage />;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Roles del Sistema</h1>
          <p className="text-gray-500 text-sm">Define las jerarquías y sus permisos asociados</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-secondary-container text-surface px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-secondary transition-all shadow-md text-xs uppercase tracking-widest"
        >
          <Plus size={20} /> NUEVO ROL
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <div key={role.id} className="bg-white rounded-[32px] p-8 border border-outline-variant/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex justify-between items-start mb-6">
              <div className="bg-surface p-3 rounded-xl text-secondary-container shadow-inner">
                <ShieldCheck size={28} />
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(role)} className="p-2 text-outline hover:text-secondary transition-colors">
                  <Edit3 size={18} />
                </button>
                <button onClick={() => confirmDelete(role.id)} className="p-2 text-outline hover:text-error transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            <h3 className="text-xl font-headline font-extrabold text-primary mb-2 tracking-tight group-hover:text-secondary-container transition-colors uppercase">
              {role.name}
            </h3>
            <p className="text-sm text-on-surface-variant mb-6 min-h-[40px] font-medium leading-relaxed italic opacity-70">
              {role.description || "Sin descripción"}
            </p>

            <div className="pt-6 border-t border-outline-variant/5">
              <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-3">Permisos Asignados</p>
              <div className="flex flex-wrap gap-1.5">
                {role.permissions.map((p) => (
                  <span key={p.id} className="text-[10px] bg-secondary-container/10 text-secondary-container px-2 py-1 rounded-md font-medium border border-secondary-container/5">
                    {p.name}
                  </span>
                ))}
                {role.permissions.length === 0 && <p className="text-[10px] text-outline/50 italic font-medium">Ningún permiso asignado</p>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="p-8 border-b border-outline-variant/5 flex justify-between items-center bg-surface/30 backdrop-blur-md">
              <div>
                <h2 className="text-2xl font-headline font-extrabold text-primary uppercase tracking-tighter">
                  {editingRole ? "Editar Estructura" : "Nuevo Rol de Acceso"}
                </h2>
                <p className="text-[10px] font-bold text-outline uppercase tracking-widest mt-1">Configuración de capacidades</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-2 hover:bg-surface-container rounded-full text-outline transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Nombre del Rol"
                  required
                  placeholder="Ej: SUPERVISOR"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Input
                  label="Descripción Funcional"
                  placeholder="Explica el alcance..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-4">
                <label className="block font-label text-[10px] font-bold uppercase tracking-widest text-outline ml-1">
                  Asignar Permisos Granulares
                </label>
                
                <div className="bg-tertiary/5 border border-tertiary/10 rounded-2xl p-4 flex gap-3 text-tertiary">
                  <AlertTriangle className="shrink-0 mt-0.5" size={20} />
                  <p className="text-[11px] leading-relaxed font-medium italic">
                    <strong>Advertencia de Seguridad:</strong> Asignar privilegios como <code className="bg-tertiary/10 px-1 rounded not-italic font-bold">ALL_ACCESS</code> otorga control total. Procede con precaución.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {permissions.map((perm) => {
                    const isSelected = selectedPerms.includes(perm.id);
                    return (
                      <button
                        key={perm.id}
                        type="button"
                        onClick={() => togglePerm(perm.id)}
                        className={`p-4 rounded-2xl border text-[11px] font-bold transition-all text-left flex items-center gap-3 group/perm ${
                          isSelected 
                            ? "bg-secondary text-white border-secondary shadow-lg shadow-secondary/10" 
                            : "bg-surface border-outline-variant/20 text-on-surface-variant hover:border-primary/40 shadow-sm"
                        }`}
                      >
                        <div className={`p-1 rounded-md transition-colors ${isSelected ? "bg-white/20" : "bg-surface-container text-outline group-hover/perm:text-primary"}`}>
                          {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                        </div>
                        <span className="truncate uppercase tracking-tight" title={perm.name}>{perm.name.replace(/_/g, ' ')}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-8 border-t border-outline-variant/5 flex gap-4 sticky bottom-0 bg-white pb-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-4 rounded-2xl border border-outline-variant/30 font-bold text-outline text-xs uppercase tracking-widest hover:bg-surface-container transition-all"
                >
                  CANCELAR
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-8 py-4 rounded-2xl bg-primary text-white font-bold text-xs uppercase tracking-widest shadow-xl shadow-primary/10 hover:shadow-2xl active:scale-95 transition-all"
                >
                  {editingRole ? "ACTUALIZAR ROL" : "CREAR ROL"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Confirm
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="¿Eliminar este rol?"
        description="Esta acción es permanente. Los usuarios que tengan este rol serán reasignados automáticamente a 'Cajero Mesero' para evitar pérdida de acceso."
        onConfirm={handleConfirmDelete}
        confirmText="ELIMINAR ROL"
        variant="danger"
      />
    </div>
  );
}
