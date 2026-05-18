"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { 
  UserPlus, 
  MoreVertical, 
  Shield, 
  Mail, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Ban,
  Loader2
} from "lucide-react";

interface Permission {
  name: string;
}

interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

interface User {
  id: string;
  email: string;
  role: Role;
  status: "ACTIVO" | "INACTIVO" | "SUSPENDIDO" | "PENDIENTE";
}

const statusStyles = {
  ACTIVO: "bg-green-100 text-green-700 border-green-200",
  INACTIVO: "bg-gray-100 text-gray-700 border-gray-200",
  SUSPENDIDO: "bg-red-100 text-red-700 border-red-200",
  PENDIENTE: "bg-yellow-100 text-yellow-700 border-yellow-200",
};

const statusIcons = {
  ACTIVO: CheckCircle2,
  INACTIVO: Ban,
  SUSPENDIDO: AlertCircle,
  PENDIENTE: Clock,
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get("/users"),
        api.get("/roles")
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
    } catch (err: any) {
      setError("No tienes permisos suficientes para ver esta lista o el servidor no responde.");
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId: string, data: { role_name?: string; status?: string }) => {
    try {
      await api.patch(`/users/${userId}`, data);
      fetchData(); // Recargar lista
    } catch (err) {
      alert("Error al actualizar el usuario");
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-marine-green" size={40} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-deep-green">Gestión de Usuarios</h1>
          <p className="text-gray-500">Administra el personal y sus niveles de acceso</p>
        </div>
        <button className="bg-marine-green text-barium-yellow px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-deep-green transition-all shadow-md">
          <UserPlus size={20} /> NUEVO USUARIO
        </button>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl flex gap-4 items-center">
          <AlertCircle size={32} />
          <p className="font-medium">{error}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => {
                const StatusIcon = statusIcons[user.status];
                return (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-barium-yellow rounded-full flex items-center justify-center text-deep-green font-bold border border-marine-green/20">
                          {user.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-deep-green">{user.email}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar size={12} /> Miembro desde May 2026
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium flex items-center gap-2 text-deep-green">
                          <Shield size={14} className="text-marine-green" />
                          {user.role.name}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {user.role.permissions.slice(0, 2).map(p => (
                            <span key={p.name} className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 lowercase">
                              {p.name}
                            </span>
                          ))}
                          {user.role.permissions.length > 2 && (
                            <span className="text-[10px] text-gray-400">+{user.role.permissions.length - 2}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusStyles[user.status]}`}>
                        <StatusIcon size={14} />
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <select 
                        className="text-xs border rounded p-1 mr-2 outline-none focus:ring-1 focus:ring-marine-green"
                        onChange={(e) => updateUser(user.id, { role_name: e.target.value })}
                        defaultValue={user.role.name}
                      >
                        {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                      </select>
                      <select 
                        className="text-xs border rounded p-1 outline-none focus:ring-1 focus:ring-marine-green"
                        onChange={(e) => updateUser(user.id, { status: e.target.value })}
                        defaultValue={user.status}
                      >
                        <option value="ACTIVO">Activo</option>
                        <option value="INACTIVO">Inactivo</option>
                        <option value="SUSPENDIDO">Suspendido</option>
                        <option value="PENDIENTE">Pendiente</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {users.length === 0 && !error && (
            <div className="py-20 text-center">
              <p className="text-gray-500">No hay usuarios registrados.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
