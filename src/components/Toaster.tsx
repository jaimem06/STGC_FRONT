"use client";

import { Toaster as SonnerToaster } from "sonner";
import { CheckCircle2, AlertCircle, Info, TriangleAlert } from "lucide-react";

export default function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      toastOptions={{
        unstyled: true,
        classNames: {
          // fila 1: icono + texto (ancho completo) · fila 2: botones (derecha)
          // pointer-events-auto: mantiene el toast clicable aunque Radix ponga
          // `pointer-events: none` en el <body> mientras hay un modal abierto.
          toast: "pointer-events-auto group w-full max-w-[400px] flex flex-wrap items-center gap-x-3 gap-y-3 p-4 rounded-[24px] shadow-[0_20px_50px_rgba(31,27,20,0.12)] border animate-in slide-in-from-top-4 duration-500 mt-4",
          content: "grow basis-[calc(100%-3.25rem)] min-w-0",
          title: "font-headline font-black text-[14px] leading-tight mb-0.5",
          description: "font-body text-[12px] font-semibold opacity-80 leading-snug",
          success: "bg-secondary-container border-secondary/20 text-secondary",
          error: "bg-error-container border-error/20 text-error",
          warning: "bg-tertiary-container border-tertiary/30 text-primary",
          info: "bg-primary-container border-primary/20 text-on-primary",
          default: "bg-surface border-outline-variant/30 text-primary",
          actionButton: "ml-auto bg-surface/25 hover:bg-surface/40 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 border border-current/10 shrink-0",
          cancelButton: "ml-auto bg-transparent hover:bg-surface/25 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 border border-current/25 shrink-0 opacity-80",
        },
      }}
      icons={{
        success: <CheckCircle2 size={22} className="shrink-0" />,
        error: <AlertCircle size={22} className="shrink-0" />,
        warning: <TriangleAlert size={22} className="shrink-0" />,
        info: <Info size={22} className="shrink-0" />,
      }}
    />
  );
}
