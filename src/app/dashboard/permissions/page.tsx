"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { 
  Key, 
  Plus, 
  CheckCircle2,
  Info
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

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const res = await api.get("/roles/permissions");
      setPermissions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/roles/permissions", { name, description });
      toast.success("Permiso creado con éxito");
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Permisos del Sistema</h1>
          <p className="text-gray-500">Acciones granulares que pueden realizar los usuarios</p>
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="bg-secondary-container text-surface px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-secondary transition-all shadow-md"
        >
          <Plus size={20} /> NUEVO PERMISO
        </button>
      </div>

      {isCreating && (
        <div className="bg-white rounded-2xl p-6 border-2 border-secondary-container shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-bold text-secondary mb-4 flex items-center gap-2">
            <Key size={20} className="text-secondary-container" /> Crear Nuevo Permiso Granular
          </h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Nombre del Permiso"
              required
              placeholder="ej: editar_post"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="Descripción"
              placeholder="Descripción corta..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="flex gap-2 pt-5">
              <button type="submit" className="flex-1 bg-secondary-container text-white font-bold rounded-xl hover:bg-secondary transition-colors text-xs">
                GUARDAR
              </button>
              <button 
                type="button" 
                onClick={() => setIsCreating(false)}
                className="px-4 bg-gray-100 text-gray-500 font-bold rounded-xl hover:bg-gray-200 transition-colors text-xs"
              >
                CANCELAR
              </button>
            </div>
          </form>
          <p className="text-[10px] text-gray-400 mt-3 flex items-center gap-1">
            <Info size={12} /> Los permisos se usan internamente en el código del backend para proteger rutas específicas.
          </p>
        </div>
      )}

      <Search 
        value={search}
        onChange={setSearch}
        placeholder="Buscar permisos por nombre o descripción..."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredPermissions.map((perm) => (
          <div key={perm.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-secondary-container transition-all group">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-surface rounded-lg text-secondary-container group-hover:bg-secondary-container group-hover:text-white transition-colors">
                <CheckCircle2 size={18} />
              </div>
              <h4 className="font-bold text-secondary truncate" title={perm.name}>{perm.name}</h4>
            </div>
            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
              {perm.description || "Sin descripción proporcionada."}
            </p>
          </div>
        ))}
      </div>
      
      {filteredPermissions.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-gray-500 italic">No se encontraron permisos que coincidan con la búsqueda.</p>
        </div>
      )}
    </div>
  );
}
