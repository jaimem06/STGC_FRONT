"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { 
  UserPlus, 
  Shield, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Ban,
  ChevronDown
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

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
  ACTIVO: "bg-green-50 text-green-700 border-green-200/50",
  INACTIVO: "bg-surface-container text-on-surface-variant border-outline-variant/30",
  SUSPENDIDO: "bg-error-container/20 text-error border-error/20",
  PENDIENTE: "bg-amber-50 text-amber-700 border-amber-200/50",
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
      console.error("Error updating user:", err);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 space-y-4 animate-fade-in-up">
      <LoadingSpinner size={52} />
      <p className="font-label text-xs font-bold text-outline uppercase tracking-widest">Sincronizando Usuarios</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-extrabold text-primary tracking-tight">Gestión de Usuarios</h1>
          <p className="font-body text-on-surface-variant mt-1">Administra el personal y sus niveles de acceso en la plataforma.</p>
        </div>
        <button className="bg-primary text-on-primary px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-0.5 transition-all active:scale-[0.98]">
          <UserPlus size={20} /> NUEVO USUARIO
        </button>
      </div>

      {error ? (
        <div className="bg-error-container/10 border border-error/20 text-error p-8 rounded-[32px] flex gap-4 items-center">
          <AlertCircle size={32} />
          <p className="font-body font-medium">{error}</p>
        </div>
      ) : (
        <div className="bg-white rounded-[32px] shadow-sm border border-outline-variant/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface/50 border-b border-outline-variant/10">
                  <th className="px-8 py-5 text-[10px] font-bold text-outline uppercase tracking-[0.2em]">Usuario</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-outline uppercase tracking-[0.2em]">Rol</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-outline uppercase tracking-[0.2em]">Estado</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-outline uppercase tracking-[0.2em] text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {users.map((user) => {
                  const StatusIcon = statusIcons[user.status];
                  return (
                    <tr key={user.id} className="hover:bg-surface/30 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary-container text-on-primary rounded-2xl flex items-center justify-center font-headline font-bold text-xl shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                            {user.email[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-label text-sm font-bold text-primary">{user.email}</p>
                            <p className="text-[10px] text-outline flex items-center gap-1 mt-0.5 font-medium">
                              <Calendar size={12} className="text-secondary" /> Miembro desde May 2026
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-sm font-bold flex items-center gap-2 text-primary">
                            <Shield size={14} className="text-secondary" />
                            {user.role.name}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {user.role.permissions.slice(0, 2).map(p => (
                              <span key={p.name} className="text-[9px] bg-surface-container px-2 py-0.5 rounded-lg text-on-surface-variant font-bold uppercase tracking-wider">
                                {p.name}
                              </span>
                            ))}
                            {user.role.permissions.length > 2 && (
                              <span className="text-[9px] text-outline font-bold">+{user.role.permissions.length - 2}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-extrabold border uppercase tracking-widest ${statusStyles[user.status]}`}>
                          <StatusIcon size={12} />
                          {user.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <div className="relative group/select">
                            <select 
                              className="appearance-none bg-surface/50 border border-outline-variant/20 rounded-xl px-4 py-2 pr-8 text-[10px] font-bold text-primary outline-none focus:ring-2 focus:ring-secondary/20 transition-all cursor-pointer uppercase tracking-wider"
                              onChange={(e) => updateUser(user.id, { role_name: e.target.value })}
                              defaultValue={user.role.name}
                            >
                              {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                            </select>
                            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline" />
                          </div>
                          <div className="relative group/select">
                            <select 
                              className="appearance-none bg-surface/50 border border-outline-variant/20 rounded-xl px-4 py-2 pr-8 text-[10px] font-bold text-primary outline-none focus:ring-2 focus:ring-secondary/20 transition-all cursor-pointer uppercase tracking-wider"
                              onChange={(e) => updateUser(user.id, { status: e.target.value })}
                              defaultValue={user.status}
                            >
                              <option value="ACTIVO">Activo</option>
                              <option value="INACTIVO">Inactivo</option>
                              <option value="SUSPENDIDO">Suspendido</option>
                              <option value="PENDIENTE">Pendiente</option>
                            </select>
                            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline" />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {users.length === 0 && !error && (
            <div className="py-24 text-center space-y-2">
              <LoadingSpinner size={48} className="mx-auto opacity-20" />
              <p className="font-label text-xs font-bold text-outline uppercase tracking-widest">No hay usuarios registrados</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
