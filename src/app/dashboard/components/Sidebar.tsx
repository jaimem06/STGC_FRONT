"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Users, 
  ShieldCheck, 
  Settings, 
  LogOut, 
  Coffee, 
  LayoutDashboard,
  Key
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

const menuItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Usuarios", href: "/dashboard/users", icon: Users },
  { name: "Roles", href: "/dashboard/roles", icon: ShieldCheck },
  { name: "Permisos", href: "/dashboard/permissions", icon: Key },
  { name: "Configuración", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <aside className="w-64 bg-deep-green text-barium-yellow flex flex-col h-screen sticky top-0 shadow-2xl">
      <div className="p-6 border-b border-marine-green flex items-center gap-3">
        <div className="bg-marine-green p-2 rounded-lg">
          <Coffee size={24} />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-none">STGC</h1>
          <p className="text-[10px] opacity-60 tracking-widest mt-1 uppercase">Tierra Fértil</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                isActive 
                  ? "bg-marine-green text-white shadow-lg" 
                  : "hover:bg-marine-green/20 text-barium-yellow/70 hover:text-barium-yellow"
              }`}
            >
              <item.icon size={20} className={isActive ? "text-white" : "group-hover:scale-110 transition-transform"} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-marine-green">
        <div className="bg-marine-green/20 p-4 rounded-2xl mb-4">
          <p className="text-xs opacity-50 mb-1">Usuario</p>
          <p className="font-semibold truncate">{user?.email || "Cargando..."}</p>
          <p className="text-[10px] bg-sepia-e37/20 text-sepia-e37 inline-block px-2 py-0.5 rounded mt-2 font-bold">
            {user?.role?.name || "SIN ROL"}
          </p>
        </div>
        
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all font-semibold"
        >
          <LogOut size={20} />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
