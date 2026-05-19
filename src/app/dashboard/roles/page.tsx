"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckSquare, 
  Square,
  AlertTriangle
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

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

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rolesRes, permsRes] = await Promise.all([
        api.get("/roles"),
        api.get("/roles/permissions")
      ]);
      setRoles(rolesRes.data);
      setPermissions(permsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name, description, permission_ids: selectedPerms };

    try {
      if (editingRole) {
        await api.put(`/roles/${editingRole.id}`, payload);
      } else {
        await api.post("/roles", payload);
      }
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      alert("Error al guardar el rol");
    }
  };

  const deleteRole = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este rol?")) return;
    try {
      await api.delete(`/roles/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error al eliminar");
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

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size={52} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-deep-green">Roles del Sistema</h1>
          <p className="text-gray-500">Define las jerarquías y sus permisos asociados</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-marine-green text-barium-yellow px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-deep-green transition-all shadow-md"
        >
          <Plus size={20} /> NUEVO ROL
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <div key={role.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-barium-yellow p-3 rounded-xl text-marine-green">
                <ShieldCheck size={24} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(role)} className="p-2 text-gray-400 hover:text-marine-green transition-colors">
                  <Edit3 size={18} />
                </button>
                <button onClick={() => deleteRole(role.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-deep-green">{role.name}</h3>
            <p className="text-sm text-gray-500 mb-6 flex-1">{role.description || "Sin descripción"}</p>
            
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Permisos Asignados</p>
              <div className="flex flex-wrap gap-2">
                {role.permissions.map(p => (
                  <span key={p.id} className="text-[10px] bg-marine-green/10 text-marine-green px-2 py-1 rounded-md font-medium">
                    {p.name}
                  </span>
                ))}
                {role.permissions.length === 0 && <p className="text-xs text-gray-400 italic">Ningún permiso</p>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Simplificado */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-deep-green">{editingRole ? "Editar Rol" : "Crear Nuevo Rol"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-deep-green">Nombre del Rol</label>
                  <input 
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-marine-green"
                    placeholder="Ej: SUPERVISOR"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-deep-green">Descripción</label>
                  <input 
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-marine-green"
                    placeholder="Breve descripción..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold text-deep-green">Asignar Permisos Granulares</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {permissions.map((perm) => {
                    const isSelected = selectedPerms.includes(perm.id);
                    return (
                      <button
                        key={perm.id}
                        type="button"
                        onClick={() => {
                          setSelectedPerms(prev => 
                            isSelected ? prev.filter(id => id !== perm.id) : [...prev, perm.id]
                          );
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                          isSelected 
                            ? "bg-marine-green/10 border-marine-green text-marine-green" 
                            : "bg-gray-50 border-gray-100 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                        <span className="text-xs font-semibold">{perm.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-lg border border-gray-200 font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  CANCELAR
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-lg bg-marine-green text-barium-yellow font-bold hover:bg-deep-green transition-colors"
                >
                  {editingRole ? "ACTUALIZAR ROL" : "CREAR ROL"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
