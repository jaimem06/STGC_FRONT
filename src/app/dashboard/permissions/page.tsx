"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { 
  Key, 
  Plus, 
  Search,
  CheckCircle2,
  Info
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

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
      setName("");
      setDescription("");
      setIsCreating(false);
      fetchPermissions();
    } catch (err) {
      alert("Error al crear permiso");
    }
  };

  const filteredPermissions = permissions.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size={52} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-deep-green">Permisos del Sistema</h1>
          <p className="text-gray-500">Acciones granulares que pueden realizar los usuarios</p>
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="bg-marine-green text-barium-yellow px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-deep-green transition-all shadow-md"
        >
          <Plus size={20} /> NUEVO PERMISO
        </button>
      </div>

      {isCreating && (
        <div className="bg-white rounded-2xl p-6 border-2 border-marine-green shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-bold text-deep-green mb-4 flex items-center gap-2">
            <Key size={20} className="text-marine-green" /> Crear Nuevo Permiso Granular
          </h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input 
              required
              className="px-4 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-marine-green"
              placeholder="Nombre (ej: editar_post)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input 
              className="px-4 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-marine-green"
              placeholder="Descripción corta..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-marine-green text-white font-bold rounded-lg hover:bg-deep-green transition-colors">
                GUARDAR
              </button>
              <button 
                type="button" 
                onClick={() => setIsCreating(false)}
                className="px-4 bg-gray-100 text-gray-500 font-bold rounded-lg hover:bg-gray-200 transition-colors"
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

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 shadow-sm outline-none focus:ring-2 focus:ring-marine-green transition-all"
          placeholder="Buscar permisos por nombre o descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredPermissions.map((perm) => (
          <div key={perm.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-marine-green transition-all group">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-barium-yellow rounded-lg text-marine-green group-hover:bg-marine-green group-hover:text-white transition-colors">
                <CheckCircle2 size={18} />
              </div>
              <h4 className="font-bold text-deep-green truncate" title={perm.name}>{perm.name}</h4>
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
