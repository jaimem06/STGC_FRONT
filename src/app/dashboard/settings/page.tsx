"use client";

import { Settings as SettingsIcon, Sliders, Bell, Shield, Palette } from "lucide-react";

export default function SettingsPage() {
  const sections = [
    { name: "Perfil", icon: Sliders, desc: "Gestiona tu información personal y preferencias." },
    { name: "Notificaciones", icon: Bell, desc: "Configura cómo y cuándo recibes alertas." },
    { name: "Seguridad", icon: Shield, desc: "Cambia tu contraseña y gestiona la autenticación." },
    { name: "Apariencia", icon: Palette, desc: "Personaliza el tema y el diseño de la plataforma." },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h1 className="font-headline text-3xl font-extrabold text-primary tracking-tight">Configuración</h1>
        <p className="font-body text-on-surface-variant mt-1">Personaliza tu experiencia en la plataforma STGC.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section) => (
          <div 
            key={section.name}
            className="bg-white rounded-[32px] p-8 border border-outline-variant/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-surface rounded-2xl text-secondary group-hover:bg-secondary group-hover:text-white transition-colors">
                <section.icon size={24} />
              </div>
              <h2 className="text-xl font-headline font-extrabold text-primary tracking-tight uppercase">
                {section.name}
              </h2>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {section.desc}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-primary/5 rounded-[40px] p-10 border border-primary/10 text-center">
        <SettingsIcon size={48} className="mx-auto text-primary/20 mb-4" />
        <h3 className="font-headline text-lg font-bold text-primary mb-2">Módulo en Desarrollo</h3>
        <p className="text-sm text-on-surface-variant max-w-md mx-auto italic">
          Estamos trabajando para traerte opciones avanzadas de personalización. Pronto podrás ajustar cada detalle de tu cuenta.
        </p>
      </div>
    </div>
  );
}
