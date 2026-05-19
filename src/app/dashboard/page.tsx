"use client";

import { useAuthStore } from "@/store/authStore";
import { 
  Users, 
  ShieldCheck, 
  Key, 
  TrendingUp, 
  Activity, 
  Clock,
  ArrowUpRight
} from "lucide-react";

const stats = [
  { name: "Usuarios Activos", value: "2,450", change: "+12.5%", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
  { name: "Roles Definidos", value: "12", change: "Estable", icon: ShieldCheck, color: "text-purple-600", bg: "bg-purple-50" },
  { name: "Permisos Otorgados", value: "842", change: "+5.2%", icon: Key, color: "text-amber-600", bg: "bg-amber-50" },
  { name: "Tasa de Actividad", value: "98.2%", change: "+2.1%", icon: Activity, color: "text-green-600", bg: "bg-green-50" },
];

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Welcome Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-extrabold text-primary tracking-tight">
            Bienvenido, <span className="text-secondary">{user?.email?.split('@')[0] || "Administrador"}</span>
          </h1>
          <p className="font-body text-on-surface-variant mt-1">
            Aquí tienes un resumen de la actividad en <span className="font-semibold text-primary">STGC Tierra Fértil</span> hoy.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-surface border border-outline-variant/30 rounded-xl flex items-center gap-2 shadow-sm">
            <Clock size={16} className="text-secondary" />
            <span className="font-label text-xs font-bold text-primary">19 MAY, 2026</span>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div 
            key={stat.name}
            className={`p-6 rounded-3xl bg-white border border-outline-variant/10 shadow-sm hover:shadow-md transition-all duration-300 group animate-fade-in-up`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between">
              <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl transition-transform duration-300 group-hover:scale-110 shadow-sm`}>
                <stat.icon size={24} />
              </div>
              <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <span className="text-[10px] font-bold uppercase">{stat.change}</span>
                <TrendingUp size={10} />
              </div>
            </div>
            <div className="mt-4">
              <p className="font-label text-xs font-bold text-on-surface-variant uppercase tracking-wider">{stat.name}</p>
              <h3 className="font-headline text-2xl font-extrabold text-primary mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Placeholder for Main Chart */}
        <div className="lg:col-span-2 bg-white rounded-[32px] p-8 border border-outline-variant/10 shadow-sm min-h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-headline text-xl font-bold text-primary">Actividad del Sistema</h3>
              <p className="text-sm text-on-surface-variant">Frecuencia de accesos y gestiones por hora</p>
            </div>
            <button className="text-secondary hover:text-primary transition-colors">
              <ArrowUpRight size={20} />
            </button>
          </div>
          <div className="flex-grow flex items-center justify-center border-2 border-dashed border-surface-container rounded-3xl bg-surface/30">
            <div className="text-center space-y-2 opacity-40">
              <TrendingUp size={48} className="mx-auto text-primary" />
              <p className="font-body text-sm font-medium">Gráfico de actividad en tiempo real</p>
            </div>
          </div>
        </div>

        {/* Right Sidebar Widget */}
        <div className="space-y-8">
          <div className="bg-primary p-8 rounded-[32px] text-on-primary shadow-xl relative overflow-hidden group">
             {/* Decorative Background */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 transition-transform duration-700 group-hover:scale-150" />
             
             <h3 className="font-headline text-xl font-bold relative z-10">Optimización de Origen</h3>
             <p className="text-sm text-on-primary/70 mt-2 relative z-10">
               Has completado el 85% de las tareas de trazabilidad esta semana.
             </p>
             <button className="mt-6 w-full bg-secondary text-on-secondary font-bold py-3 rounded-2xl shadow-lg hover:shadow-secondary/20 hover:-translate-y-1 transition-all active:scale-[0.98] relative z-10">
               Ver Reporte
             </button>
          </div>

          <div className="bg-white rounded-[32px] p-8 border border-outline-variant/10 shadow-sm">
            <h3 className="font-headline text-lg font-bold text-primary mb-4">Usuarios Recientes</h3>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 hover:bg-surface rounded-2xl transition-colors cursor-pointer group">
                  <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                    {String.fromCharCode(64 + i)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary">Usuario Demo {i}</p>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-tighter">Accedió hace {i * 10} min</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
