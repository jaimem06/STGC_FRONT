"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/auth-service";
import { ENDPOINTS } from "@/lib/endpoints";
import { 
  UserPlus, 
  Shield, 
  AlertCircle,
  CheckCircle2,
  Clock,
  Ban,
  Mail,
  Lock,
  Edit2,
  UserCheck,
  UserX,
  UserMinus,
  SlidersHorizontal,
  Phone,
  Fingerprint,
  Users as UsersIcon,
  TrendingUp,
  ShieldAlert
} from "lucide-react";
import { UserStatus } from "@/store/authStore";
import { UserCreateSchema, UserCreateInput } from "@/lib/schemas";
import LoadingSpinner from "@/components/LoadingSpinner";
import Table from "@/components/Table";
import Input from "@/components/Input";
import Select from "@/components/Select";
import Dialog from "@/components/Dialog";
import Confirm from "@/components/Confirm";
import Search from "@/components/Search";
import { toast } from "sonner";

interface RoleOut {
  id: string;
  name: string;
  description: string | null;
}

interface UserOut {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  identifier: string | null;
  phone_number: string | null;
  status: UserStatus;
  role: RoleOut;
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
  const [users, setUsers] = useState<UserOut[]>([]);
  const [roles, setRoles] = useState<RoleOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Modal & Confirm States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserOut | null>(null);
  const [statusConfirm, setStatusConfirm] = useState<{
    user: UserOut;
    targetStatus: UserStatus;
  } | null>(null);

  const { 
    register: registerCreate, 
    handleSubmit: handleSubmitCreate, 
    reset: resetCreate, 
    setValue: setCreateValue, 
    watch: watchCreate,
    formState: { errors: errorsCreate }
  } = useForm({
    resolver: zodResolver(UserCreateSchema),
    defaultValues: {
      status: "ACTIVO"
    }
  });

  const selectedRoleName = watchCreate("role_name");

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get(ENDPOINTS.AUTH.USERS.BASE),
        api.get(ENDPOINTS.AUTH.ROLES.BASE)
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
    } catch (err: any) {
      toast.error("Error al cargar datos de usuarios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.status === "ACTIVO").length;
    const alerts = users.filter(u => u.status === "SUSPENDIDO" || u.status === "PENDIENTE").length;
    return { total, active, alerts };
  }, [users]);

  const handleCreateUser = async (data: UserCreateInput) => {
    setIsActionLoading(true);
    try {
      await api.post(ENDPOINTS.AUTH.REGISTER, data);
      toast.success("Usuario creado exitosamente");
      setIsCreateModalOpen(false);
      resetCreate();
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Error al crear usuario");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUpdateUserStatus = async () => {
    if (!statusConfirm) return;
    const { user, targetStatus } = statusConfirm;
    
    setIsActionLoading(true);
    setStatusConfirm(null);
    try {
      await api.patch(ENDPOINTS.AUTH.USERS.BY_ID(user.id), { status: targetStatus });
      toast.success(`Usuario ${user.first_name || user.email} marcado como ${targetStatus.toLowerCase()}`);
      fetchData();
    } catch (err: any) {
      toast.error("Error al actualizar estado del usuario");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId: string, roleName: string) => {
    setIsActionLoading(true);
    try {
      await api.patch(ENDPOINTS.AUTH.USERS.BY_ID(userId), { role_name: roleName });
      toast.success("Rol actualizado correctamente");
      setEditingUser(null);
      fetchData();
    } catch (err: any) {
      toast.error("Error al actualizar rol");
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const fullName = `${u.first_name || ""} ${u.last_name || ""}`.toLowerCase();
      const matchesSearch = 
        search === "" ||
        u.email.toLowerCase().includes(search.toLowerCase()) || 
        u.identifier?.toLowerCase().includes(search.toLowerCase()) ||
        fullName.includes(search.toLowerCase());

      const matchesRole = filterRole === "ALL" || u.role.name === filterRole;
      const matchesStatus = filterStatus === "ALL" || u.status === filterStatus;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, filterRole, filterStatus]);

  const columns = [
    {
      header: "Colaborador",
      accessor: (user: UserOut) => (
        <div className="flex items-center gap-3 py-1">
          <div className="w-9 h-9 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
            <span className="text-primary font-headline font-bold text-xs">
              {(user.first_name?.[0] || user.email[0]).toUpperCase()}
            </span>
          </div>
          <div className="flex flex-col">
            <p className="font-headline text-xs font-bold text-primary leading-tight">
              {user.first_name ? `${user.first_name} ${user.last_name}` : "Sin nombre"}
            </p>
            <p className="font-body text-[10px] text-outline font-medium">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Identificación",
      accessor: (user: UserOut) => (
        <span className="text-xs font-bold text-primary">{user.identifier || "---"}</span>
      ),
    },
    {
      header: "Cargo",
      accessor: (user: UserOut) => (
        <button 
          onClick={() => setEditingUser(user)}
          className="group flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-surface-container transition-all"
          title="Toca para editar cargo"
        >
          <span className="text-xs font-bold text-primary border-b border-dashed border-outline-variant/60 group-hover:border-secondary group-hover:text-secondary transition-all">
            {user.role.name}
          </span>
          <Edit2 size={10} className="text-outline opacity-40 group-hover:opacity-100 group-hover:text-secondary transition-all" />
        </button>
      ),
    },
    {
      header: "Estado",
      accessor: (user: UserOut) => {
        const Icon = statusIcons[user.status];
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-widest ${statusStyles[user.status]}`}>
            <Icon size={10} />
            {user.status}
          </span>
        );
      },
    },
    {
      header: "Acciones",
      align: "right" as const,
      accessor: (user: UserOut) => (
        <div className="flex items-center justify-end gap-0.5">
          {user.status !== "ACTIVO" && (
            <button 
              onClick={() => setStatusConfirm({ user, targetStatus: "ACTIVO" })}
              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-all"
              title="Activar"
            >
              <UserCheck size={16} />
            </button>
          )}
          {user.status === "ACTIVO" && (
            <>
              <button 
                onClick={() => setStatusConfirm({ user, targetStatus: "SUSPENDIDO" })}
                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                title="Suspender"
              >
                <UserMinus size={16} />
              </button>
              <button 
                onClick={() => setStatusConfirm({ user, targetStatus: "INACTIVO" })}
                className="p-1.5 text-outline hover:bg-surface-container rounded-lg transition-all"
                title="Desactivar"
              >
                <UserX size={16} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  if (loading) return <LoadingSpinner size={52} fullPage />;

  return (
    <div className="max-w-[1400px] mx-auto space-y-3 animate-fade-in-up px-2 md:px-0">
      {/* Action Loader */}
      {isActionLoading && <LoadingSpinner fullPage message="Procesando..." />}

      {/* Quick Stats & Header */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {/* Title Card */}
        <div className="lg:col-span-1 bg-primary p-4 rounded-[28px] text-on-primary flex flex-col justify-between shadow-lg shadow-primary/20 relative overflow-hidden group min-h-[110px]">
          <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10">
            <h1 className="font-headline text-xl font-black tracking-tighter uppercase leading-none mb-1">Equipo</h1>
            <p className="font-body text-[9px] opacity-80 uppercase tracking-[0.2em] font-bold">Gestión de Empleados</p>
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="relative z-10 mt-2 h-8 bg-white text-primary rounded-lg font-headline font-bold text-[10px] flex items-center justify-center gap-2 hover:bg-surface-container-lowest active:scale-95 transition-all shadow-md"
          >
            <UserPlus size={14} /> NUEVO REGISTRO
          </button>
        </div>

        {/* Unified Stats Card */}
        <div className="lg:col-span-3 bg-white p-4 rounded-[28px] border border-outline-variant/20 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shadow-sm min-h-[110px]">
          {/* Total */}
          <div className="flex-1 flex items-center justify-between p-3 sm:p-3 rounded-2xl bg-surface-container-high border border-primary/5 transition-all hover:shadow-md group">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <UsersIcon size={16} />
              </div>
              <p className="text-[10px] font-black text-primary/70 uppercase tracking-[0.1em]">Total:</p>
            </div>
            <span className="font-headline text-2xl font-black text-primary tracking-tighter">{stats.total}</span>
          </div>

          {/* Activos */}
          <div className="flex-1 flex items-center justify-between p-3 sm:p-3 rounded-2xl bg-secondary-container border border-secondary/10 transition-all hover:shadow-md group">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-secondary/15 rounded-xl flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
                <TrendingUp size={16} />
              </div>
              <p className="text-[10px] font-black text-secondary/70 uppercase tracking-[0.1em]">Activos:</p>
            </div>
            <span className="font-headline text-2xl font-black text-secondary tracking-tighter">{stats.active}</span>
          </div>

          {/* Alertas */}
          <div className="flex-1 flex items-center justify-between p-3 sm:p-3 rounded-2xl bg-error-container border border-error/10 transition-all hover:shadow-md group">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-error/15 rounded-xl flex items-center justify-center text-error group-hover:scale-110 transition-transform">
                <ShieldAlert size={16} />
              </div>
              <p className="text-[10px] font-black text-error/70 uppercase tracking-[0.1em]">Suspendidos:</p>
            </div>
            <span className="font-headline text-2xl font-black text-error tracking-tighter">{stats.alerts}</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-3 items-start">
        {/* Filters Sidebar */}
        <div className="xl:col-span-1 space-y-3">
          <div className="p-4 rounded-[24px] border border-outline-variant/30 shadow-inner-sm space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-headline text-[10px] font-black text-primary uppercase tracking-widest">Búsqueda</h3>
              <SlidersHorizontal size={12} className="text-outline" />
            </div>
            <Search 
              value={search}
              onChange={setSearch}
              placeholder="Buscar usuarios..."
            />
            
            <div className="space-y-2 pt-1">
               <Select
                label="Cargo"
                value={filterRole}
                onValueChange={setFilterRole}
                options={[
                  { value: "ALL", label: "Todos los cargos" },
                  ...roles.map(r => ({ value: r.name, label: r.name }))
                ]}
              />
              <Select
                label="Estado"
                value={filterStatus}
                onValueChange={setFilterStatus}
                options={[
                  { value: "ALL", label: "Todos los estados" },
                  { value: "ACTIVO", label: "Activo" },
                  { value: "INACTIVO", label: "Inactivo" },
                  { value: "SUSPENDIDO", label: "Suspendido" },
                  { value: "PENDIENTE", label: "Pendiente" },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Table Area */}
        <div className="xl:col-span-3 overflow-hidden min-h-[100px]">
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="font-headline text-[10px] font-black text-primary uppercase tracking-widest">Listado de Personal</h2>
            <div className="text-[10px] font-semibold text-on-surface/70 tracking-wide">
              {filteredUsers.length} coincidencias
            </div>
          </div>
          <Table 
            data={filteredUsers}
            columns={columns}
            rowKey={(u) => u.id}
            pageSize={6}
          />
        </div>
      </div>

      {/* Create Modal */}
      <Dialog
        isOpen={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title="Nuevo Empleado"
        description="Registro de nuevo integrante del equipo."
      >
        <form onSubmit={handleSubmitCreate((data) => handleCreateUser(data as unknown as UserCreateInput))} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <Input 
              label="Nombres" 
              required 
              {...registerCreate("first_name")} 
              error={errorsCreate.first_name?.message}
            />
            <Input 
              label="Apellidos" 
              required 
              {...registerCreate("last_name")} 
              error={errorsCreate.last_name?.message}
            />
            <Input 
              label="ID / Cédula" 
              icon={Fingerprint} 
              required 
              {...registerCreate("identifier")} 
              error={errorsCreate.identifier?.message}
            />
            <Input 
              label="Teléfono" 
              icon={Phone} 
              required
              placeholder="Ej: 0980885416 o +593..."
              {...registerCreate("phone_number")} 
              error={errorsCreate.phone_number?.message}
            />
            <div className="col-span-2">
              <Input 
                label="Correo Corporativo" 
                icon={Mail} 
                type="email" 
                required 
                {...registerCreate("email")} 
                error={errorsCreate.email?.message}
              />
            </div>
            <Input 
              label="Clave Temporal" 
              icon={Lock} 
              type="password" 
              required 
              {...registerCreate("password")} 
              error={errorsCreate.password?.message}
            />
            <Select
              label="Cargo"
              required
              value={selectedRoleName || ""}
              options={roles.map(r => ({ value: r.name, label: r.name }))}
              onValueChange={(val) => setCreateValue("role_name", val)}
              error={errorsCreate.role_name?.message}
            />
          </div>
          <button 
            type="submit"
            className="w-full h-11 bg-primary text-on-primary rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg hover:shadow-xl transition-all"
          >
            REGISTRAR COLABORADOR
          </button>
        </form>
      </Dialog>

      {/* Edit Role Modal */}
      <Dialog
        isOpen={!!editingUser}
        onOpenChange={() => setEditingUser(null)}
        title="Cambiar Cargo"
        description={`Actualiza el rol de ${editingUser?.first_name || editingUser?.email}`}
      >
        <div className="space-y-6 pt-4">
          <Select
            label="Nuevo Cargo"
            value={editingUser?.role.name || ""}
            options={roles.map(r => ({ value: r.name, label: r.name }))}
            onValueChange={(val) => editingUser && handleUpdateUserRole(editingUser.id, val)}
          />
          <button 
            onClick={() => setEditingUser(null)}
            className="w-full h-11 rounded-xl border border-outline-variant/30 font-bold text-outline text-xs uppercase tracking-widest hover:bg-surface-container transition-colors"
          >
            Cerrar
          </button>
        </div>
      </Dialog>

      {/* Status Change Confirmation */}
      <Confirm
        open={!!statusConfirm}
        onOpenChange={() => setStatusConfirm(null)}
        title={`¿Cambiar estado a ${statusConfirm?.targetStatus}?`}
        description={`Estás por cambiar el estado de ${statusConfirm?.user.first_name || statusConfirm?.user.email} a ${statusConfirm?.targetStatus}. ¿Deseas continuar?`}
        onConfirm={handleUpdateUserStatus}
        confirmText="CAMBIAR ESTADO"
        variant={statusConfirm?.targetStatus === "ACTIVO" ? "warning" : "danger"}
      />
    </div>
  );
}
