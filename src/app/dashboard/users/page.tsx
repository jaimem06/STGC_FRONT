"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { 
  UserPlus, 
  Shield, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Ban,
  X,
  Mail,
  Lock,
  Edit2,
  UserCheck,
  UserX,
  UserMinus
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import CompactTable from "@/components/CompactTable";
import CompactInput from "@/components/CompactInput";
import PremiumSelect from "@/components/PremiumSelect";
import PremiumDialog from "@/components/PremiumDialog";
import PremiumConfirm from "@/components/PremiumConfirm";
import CompactSearch from "@/components/CompactSearch";
import { toast } from "sonner";

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
  first_name?: string;
  last_name?: string;
  identifier?: string;
  phone_number?: string;
  suspended_from?: string;
  suspended_until?: string;
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
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(8);

  // UI State
  const [selectedUserForRole, setSelectedUserForRole] = useState<User | null>(null);
  const [selectedRoleName, setSelectedRoleName] = useState("");
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // Registration Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newIdentifier, setNewIdentifier] = useState("");
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [newRole, setNewRole] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // Suspension State
  const [suspendingUserId, setSuspendingUserId] = useState<string | null>(null);
  const [suspendedFrom, setSuspendedFrom] = useState("");
  const [suspendedUntil, setSuspendedUntil] = useState("");
  const [isSuspending, setIsSuspending] = useState(false);

  // Inactivation State
  const [isConfirmInactivateOpen, setIsConfirmInactivateOpen] = useState(false);
  const [userToInactivate, setUserToInactivate] = useState<User | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get("/users"),
        api.get("/roles")
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
    } catch (_err) {
      setError("No tienes permisos suficientes para ver esta lista o el servidor no responde.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const calculatePageSize = () => {
      // Ajuste dinámico de filas según el alto de la pantalla
      // Reservamos espacio para: Header(100), Search(60), Paginación(60), Padding(100)
      // Si el formulario está abierto, restamos ~250px adicionales
      const reservedHeight = isModalOpen ? 580 : 320;
      const availableHeight = window.innerHeight - reservedHeight;
      const rowHeight = 76; 
      const calculatedSize = Math.max(3, Math.floor(availableHeight / rowHeight));
      setPageSize(calculatedSize);
    };

    calculatePageSize();
    window.addEventListener('resize', calculatePageSize);
    return () => window.removeEventListener('resize', calculatePageSize);
  }, [isModalOpen]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateUser = async (userId: string, data: { role_name?: string; status?: string }) => {
    try {
      await api.patch(`/users/${userId}`, data);
      toast.success("Usuario actualizado");
      fetchData(); // Recargar lista
    } catch (err) {
      console.error("Error updating user:", err);
      toast.error("Error al actualizar usuario");
      throw err;
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUserForRole || !selectedRoleName) return;
    setIsUpdatingRole(true);
    try {
      await updateUser(selectedUserForRole.id, { role_name: selectedRoleName });
      setSelectedUserForRole(null);
    } catch (_err) {
      // toast.error is handled in updateUser
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword || !newRole || !newFirstName || !newLastName || !newIdentifier) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    setIsRegistering(true);
    try {
      await api.post("/auth/register", {
        email: newEmail,
        password: newPassword,
        first_name: newFirstName,
        last_name: newLastName,
        identifier: newIdentifier,
        phone_number: newPhoneNumber,
        role_name: newRole
      });
      toast.success("¡Usuario creado con éxito!");
      setIsModalOpen(false);
      setNewEmail("");
      setNewPassword("");
      setNewFirstName("");
      setNewLastName("");
      setNewIdentifier("");
      setNewPhoneNumber("");
      setNewRole("");
      fetchData();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : "Error al registrar usuario");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleSuspend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendingUserId || !suspendedFrom || !suspendedUntil) {
      toast.error("Por favor selecciona las fechas de suspensión");
      return;
    }

    setIsSuspending(true);
    try {
      await api.patch(`/users/${suspendingUserId}/suspend`, {
        suspended_from: suspendedFrom,
        suspended_until: suspendedUntil
      });
      toast.success("Usuario suspendido temporalmente");
      setSuspendingUserId(null);
      setSuspendedFrom("");
      setSuspendedUntil("");
      fetchData();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : "Error al suspender usuario");
    } finally {
      setIsSuspending(false);
    }
  };

  const handleConfirmInactivate = async () => {
    if (!userToInactivate) return;
    try {
      await updateUser(userToInactivate.id, { status: "INACTIVO" });
    } catch (_err) {
      // toast.error is handled in updateUser
    } finally {
      setIsConfirmInactivateOpen(false);
      setUserToInactivate(null);
    }
  };

  const formatString = (str: string) => {
    return str.replace(/_/g, ' ').toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) || 
    u.role.name.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      header: "Colaborador",
      accessor: (user: User) => (
        <div className="flex items-center gap-4 whitespace-nowrap">
          <div className="w-12 h-12 shrink-0 bg-primary-container text-on-primary rounded-2xl flex items-center justify-center font-headline font-bold text-lg shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
            {(user.first_name?.[0] || user.email[0]).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-label text-base font-bold text-primary">
              {user.first_name ? `${user.first_name} ${user.last_name}` : user.email}
            </p>
            <p className="text-xs text-outline font-medium mt-1">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Identificación",
      hideOnMobile: true,
      accessor: (user: User) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-primary">{user.identifier || "---"}</span>
          <span className="text-[10px] text-outline font-bold uppercase tracking-widest mt-1">ID / Cédula</span>
        </div>
      ),
    },
    {
      header: "Cargo / Nivel",
      accessor: (user: User) => (
        <div className="flex flex-col gap-1.5 py-1 min-h-[48px] justify-center">
          <div 
            className="group/role cursor-pointer flex flex-col" 
            onClick={() => {
              setSelectedUserForRole(user);
              setSelectedRoleName(user.role.name);
            }}
          >
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-secondary/80" />
              <span className="text-sm font-bold text-primary">
                {formatString(user.role.name)}
              </span>
              <div className="p-1 bg-surface-container rounded-md group-hover/role:bg-primary/10 transition-colors">
                <Edit2 size={10} className="text-primary/60 group-hover/role:text-primary transition-colors" />
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {user.role.permissions.map(p => (
                <span key={p.name} className="text-[9px] text-outline font-bold uppercase tracking-tighter opacity-70">
                  • {p.name.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Estatus",
      hideOnMobile: true,
      accessor: (user: User) => {
        const StatusIcon = statusIcons[user.status];
        return (
          <div className="flex flex-col gap-1">
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-extrabold border uppercase tracking-widest shadow-sm transition-all whitespace-nowrap ${statusStyles[user.status]}`}>
              <StatusIcon size={14} />
              {user.status}
            </span>
            {user.status === "SUSPENDIDO" && user.suspended_until && (
              <span className="text-[10px] text-error font-bold flex items-center gap-1 mt-0.5">
                <Calendar size={10} /> Hasta {new Date(user.suspended_until).toLocaleDateString()}
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: "Gestión Directa",
      align: "right" as const,
      accessor: (user: User) => (
        <div className="flex items-center justify-end gap-1 whitespace-nowrap">
          {/* Activar */}
          {user.status !== "ACTIVO" && (
            <button 
              onClick={() => updateUser(user.id, { status: "ACTIVO" })}
              title="Marcar como Activo"
              className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-all hover:scale-110 active:scale-95"
            >
              <UserCheck size={18} />
            </button>
          )}
          {/* Pendiente */}
          {user.status !== "PENDIENTE" && (
            <button 
              onClick={() => updateUser(user.id, { status: "PENDIENTE" })}
              title="Poner en Espera / Pendiente"
              className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all hover:scale-110 active:scale-95"
            >
              <Clock size={18} />
            </button>
          )}
          {/* Suspender */}
          {user.status !== "SUSPENDIDO" && (
            <button 
              onClick={() => setSuspendingUserId(user.id)}
              title="Suspender Colaborador"
              className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-all hover:scale-110 active:scale-95"
            >
              <UserMinus size={18} />
            </button>
          )}
          {/* Inactivar */}
          {user.status !== "INACTIVO" && (
            <button 
              onClick={() => {
                setUserToInactivate(user);
                setIsConfirmInactivateOpen(true);
              }}
              title="Desactivar Usuario"
              className="p-2 text-outline hover:bg-surface-container rounded-xl transition-all hover:scale-110 active:scale-95"
            >
              <UserX size={18} />
            </button>
          )}
        </div>
      ),
    },
  ];

  if (loading) return <LoadingSpinner size={52} fullPage />;

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <h1 className="font-headline text-2xl font-extrabold text-primary tracking-tight">Gestión de Usuarios</h1>
          <p className="font-body text-xs text-on-surface-variant">Administra el personal y sus niveles de acceso.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 hover:shadow-lg transition-all active:scale-[0.98]"
        >
          <UserPlus size={16} /> NUEVO USUARIO
        </button>
      </div>

      <CompactSearch 
        value={search}
        onChange={setSearch}
        placeholder="Buscar por correo o cargo..."
      />

      {error ? (
        <div className="bg-error-container/10 border border-error/20 text-error p-6 rounded-2xl flex gap-3 items-center">
          <AlertCircle size={24} />
          <p className="font-body text-sm font-medium">{error}</p>
        </div>
      ) : (
        <div className="bg-white rounded-[32px] shadow-sm border border-outline-variant/10 overflow-hidden">
          {/* Inline Registration Form */}
          {isModalOpen && (
            <form 
              onSubmit={handleRegister} 
              className="p-8 border-b border-outline-variant/10 bg-surface/30 animate-in fade-in slide-in-from-top-4 duration-300"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-headline font-extrabold text-primary tracking-tight">Registrar Nuevo Usuario</h2>
                  <p className="text-[10px] text-on-surface-variant font-medium mt-0.5 uppercase tracking-wider">Completa los datos para el alta en el sistema</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-surface-container rounded-full transition-colors text-outline"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                <CompactInput
                  label="Nombres"
                  required
                  placeholder="Juan"
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                />
                <CompactInput
                  label="Apellidos"
                  required
                  placeholder="Pérez"
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                />
                <CompactInput
                  label="Identificación"
                  required
                  placeholder="12345678"
                  value={newIdentifier}
                  onChange={(e) => setNewIdentifier(e.target.value)}
                />
                <CompactInput
                  label="Teléfono"
                  placeholder="0999999999"
                  value={newPhoneNumber}
                  onChange={(e) => setNewPhoneNumber(e.target.value)}
                />
                <CompactInput
                  label="Correo Electrónico"
                  icon={Mail}
                  type="email"
                  required
                  placeholder="nombre@tierrafertil.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />

                <CompactInput
                  label="Contraseña Temporal"
                  icon={Lock}
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />

                <div className="md:col-span-2 flex gap-4">
                  <div className="flex-1">
                    <PremiumSelect
                      label="Rol Asignado"
                      icon={Shield}
                      required
                      value={newRole}
                      onValueChange={setNewRole}
                      options={roles.map(r => ({ value: r.name, label: r.name }))}
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={isRegistering}
                    className="h-10 bg-primary text-on-primary px-6 rounded-xl font-headline font-bold text-[10px] shadow-lg shadow-primary/10 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 min-w-[120px]"
                  >
                    {isRegistering ? <LoadingSpinner size={16} /> : "REGISTRAR"}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Suspension Modal */}
          {suspendingUserId && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-headline font-extrabold text-primary tracking-tight">Suspender Colaborador</h2>
                      <p className="text-xs text-on-surface-variant font-medium mt-1">Define el periodo de suspensión temporal</p>
                    </div>
                    <button 
                      onClick={() => setSuspendingUserId(null)}
                      className="p-2 hover:bg-surface-container rounded-full text-outline"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleSuspend} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                      <CompactInput
                        label="Desde"
                        icon={Calendar}
                        type="date"
                        required
                        value={suspendedFrom}
                        onChange={(e) => setSuspendedFrom(e.target.value)}
                      />
                      <CompactInput
                        label="Hasta"
                        icon={Calendar}
                        type="date"
                        required
                        value={suspendedUntil}
                        onChange={(e) => setSuspendedUntil(e.target.value)}
                      />
                    </div>

                    <div className="flex gap-4 pt-2">
                      <button 
                        type="button"
                        onClick={() => setSuspendingUserId(null)}
                        className="flex-1 px-6 py-3 rounded-2xl border border-outline-variant/30 font-bold text-outline text-xs hover:bg-surface-container transition-colors"
                      >
                        CANCELAR
                      </button>
                      <button 
                        type="submit"
                        disabled={isSuspending}
                        className="flex-1 bg-error text-on-error px-6 py-3 rounded-2xl font-bold text-xs shadow-lg shadow-error/10 hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        {isSuspending ? <LoadingSpinner size={16} /> : "CONFIRMAR SUSPENSIÓN"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          <CompactTable 
            data={filteredUsers}
            columns={columns}
            rowKey={(u) => u.id}
            pageSize={pageSize}
            emptyMessage="No hay usuarios registrados"
          />
        </div>
      )}

      {/* Role Management Dialog */}
      <PremiumDialog
        isOpen={!!selectedUserForRole}
        onOpenChange={(open) => !open && setSelectedUserForRole(null)}
        title="Gestionar Cargo"
        description={`Actualiza el nivel de acceso para ${selectedUserForRole?.first_name ? `${selectedUserForRole.first_name} ${selectedUserForRole.last_name}` : selectedUserForRole?.email}`}
      >
        <div className="space-y-6">
          <PremiumSelect
            label="Nuevo Cargo / Rol"
            icon={Shield}
            value={selectedRoleName}
            onValueChange={setSelectedRoleName}
            options={roles.map(r => ({ value: r.name, label: formatString(r.name) }))}
          />
          
          <div className="flex gap-4 pt-2">
            <button 
              onClick={() => setSelectedUserForRole(null)}
              className="flex-1 px-6 py-3 rounded-2xl border border-outline-variant/30 font-bold text-outline text-xs hover:bg-surface-container transition-colors"
            >
              CANCELAR
            </button>
            <button 
              onClick={handleUpdateRole}
              disabled={isUpdatingRole}
              className="flex-1 bg-primary text-on-primary px-6 py-3 rounded-2xl font-bold text-xs shadow-lg shadow-primary/10 hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {isUpdatingRole ? <LoadingSpinner size={16} /> : "ACTUALIZAR CARGO"}
            </button>
          </div>
        </div>
      </PremiumDialog>

      <PremiumConfirm
        open={isConfirmInactivateOpen}
        onOpenChange={setIsConfirmInactivateOpen}
        title="¿Desactivar usuario?"
        description={`Esta acción impedirá que ${userToInactivate?.first_name || userToInactivate?.email} acceda al sistema hasta que sea reactivado.`}
        onConfirm={handleConfirmInactivate}
        confirmText="DESACTIVAR"
        variant="warning"
      />
    </div>
  );
}
