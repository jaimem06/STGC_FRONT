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
  Key,
  ChevronLeft,
  Menu,
  X,
  User as UserIcon
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";

const menuItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Usuarios", href: "/dashboard/users", icon: Users },
  { name: "Roles", href: "/dashboard/roles", icon: ShieldCheck },
  { name: "Configuración", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  
  const { 
    isSidebarCollapsed, 
    toggleSidebar, 
    setSidebarCollapsed,
    isMobileSidebarOpen, 
    setMobileSidebarOpen 
  } = useUIStore();

  return (
    <>
      {/* Mobile Menu Trigger - Hidden when open to avoid overlap */}
      {!isMobileSidebarOpen && (
        <button 
          onClick={() => {
            setMobileSidebarOpen(true);
            setSidebarCollapsed(true);
          }}
          className="fixed top-4 left-4 z-[60] p-2 rounded-lg bg-primary text-on-primary md:hidden shadow-lg transition-opacity duration-300"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Backdrop for mobile */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[50] md:hidden backdrop-blur-sm"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <aside 
        className={`fixed inset-y-0 left-0 z-[55] bg-surface/80 backdrop-blur-xl border-r border-outline-variant/10 shadow-[8px_0_24px_rgba(31,27,20,0.06)] flex flex-col justify-between transition-all duration-300 ease-in-out ${
          isMobileSidebarOpen ? "translate-x-0 pt-14 pb-6" : "-translate-x-full md:translate-x-0 py-6"
        } ${isSidebarCollapsed ? "w-20" : "w-64"}`}
      >
        {/* Mobile Close Button - Centered horizontally to match compact view */}
        <button 
          onClick={() => setMobileSidebarOpen(false)}
          className="md:hidden absolute top-4 left-1/2 -translate-x-1/2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-high text-primary transition-all z-10"
        >
          <X size={20} />
        </button>

        {/* Header / Brand */}
        <div className={`px-4 mb-6 flex items-center ${isSidebarCollapsed ? "justify-center" : "justify-between"}`}>
          <div 
            className={`flex items-center gap-2 transition-all duration-300 ${isSidebarCollapsed ? "px-0" : "px-1"}`}
            onClick={() => isSidebarCollapsed && toggleSidebar()}
          >
            <div className="w-9 h-9 shrink-0 rounded-xl bg-primary-container flex items-center justify-center text-on-primary shadow-sm">
              <Coffee size={20} />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col whitespace-nowrap overflow-hidden animate-fade-in-up">
                <span className="font-headline text-lg font-extrabold text-primary leading-none tracking-tighter">STGC</span>
                <span className="font-label text-[9px] tracking-[0.2em] text-outline uppercase">TIERRA FÉRTIL</span>
              </div>
            )}
          </div>
          
          {/* Toggle button for desktop */}
          <button 
            onClick={toggleSidebar}
            className={`hidden md:flex items-center justify-center w-6 h-6 rounded-full hover:bg-primary hover:text-on-primary transition-all duration-300 shadow-sm border border-outline-variant/10 text-primary ${
              isSidebarCollapsed 
                ? "absolute -right-3 top-10 bg-surface/90 backdrop-blur-md" 
                : "relative"
            }`}
            title={isSidebarCollapsed ? "Expandir menú" : "Contraer menú"}
          >
            <ChevronLeft 
              size={12} 
              className={`transition-transform duration-500 ${isSidebarCollapsed ? "rotate-180" : ""}`} 
            />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-grow overflow-y-auto px-2 space-y-0.5 custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={(e) => {
                  if (window.innerWidth < 768) {
                    setMobileSidebarOpen(false);
                  }
                }}
                className={`flex items-center gap-3 py-2 transition-all duration-300 rounded-lg group relative ${
                  isActive 
                    ? "bg-primary text-on-primary shadow-sm" 
                    : "text-on-surface-variant hover:bg-surface-container-highest hover:text-primary"
                } ${isSidebarCollapsed ? "justify-center px-0" : "px-3"}`}
                title={isSidebarCollapsed ? item.name : ""}
              >
                <item.icon 
                  size={18} 
                  className={`shrink-0 transition-all duration-300 ${
                    !isActive && "group-hover:text-primary group-hover:scale-110"
                  }`} 
                />
                {!isSidebarCollapsed && (
                  <span className="font-label text-xs font-medium whitespace-nowrap overflow-hidden transition-all duration-300">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Section */}
        <div className={`px-3 mt-auto space-y-3 transition-all duration-300 ${isSidebarCollapsed ? "items-center" : ""}`}>
          {/* User Status Card */}
          <div 
            className={`bg-secondary transition-all duration-300 group hover:bg-secondary/90 cursor-pointer overflow-hidden flex items-center ${
              isSidebarCollapsed 
                ? "justify-center w-10 h-10 rounded-lg mx-auto" 
                : "justify-between w-full p-2 rounded-xl"
            }`}
          >
            <div className={`flex items-center min-w-0 ${isSidebarCollapsed ? "justify-center" : "gap-2"}`}>
              <div className="w-7 h-7 shrink-0 rounded-full bg-surface-container-highest flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-sm">
                <UserIcon size={14} className="text-primary" />
              </div>
              {!isSidebarCollapsed && (
                <span className="font-label text-[10px] font-semibold text-on-secondary truncate">
                  {user?.role?.name || "SIN ROL"}
                </span>
              )}
            </div>
            {!isSidebarCollapsed && (
               <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            )}
          </div>

          {/* Profile & Logout */}
          <div className="flex flex-col gap-1 pt-3 border-t border-outline-variant/30">
            <div className={`flex items-center gap-3 ${isSidebarCollapsed ? "justify-center" : "px-1"}`}>
              <div className="w-8 h-8 shrink-0 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold font-headline text-base shadow-sm border-2 border-surface-container">
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </div>
              {!isSidebarCollapsed && (
                <div className="flex flex-col min-w-0 overflow-hidden animate-fade-in-up">
                  <span className="font-label text-[10px] font-bold text-primary truncate leading-tight">
                    {user?.email?.split('@')[0] || "Usuario"}
                  </span>
                  <span className="text-[9px] text-outline truncate leading-tight">{user?.email || "email@finca.com"}</span>
                </div>
              )}
            </div>
            
            <button 
              onClick={logout}
              className={`flex items-center gap-3 w-full py-2 text-on-surface-variant hover:text-on-error-container hover:bg-error-container transition-all duration-300 rounded-lg active:scale-[0.98] ${
                isSidebarCollapsed ? "justify-center px-0" : "px-2"
              }`}
              title={isSidebarCollapsed ? "Cerrar Sesión" : ""}
            >
              <LogOut size={18} className="shrink-0" />
              {!isSidebarCollapsed && (
                <span className="font-label text-xs font-bold">Cerrar Sesión</span>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
