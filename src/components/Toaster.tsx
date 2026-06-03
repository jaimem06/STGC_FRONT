"use client";

import { Toaster as SonnerToaster } from "sonner";
import { CheckCircle2, AlertCircle, Info, TriangleAlert } from "lucide-react";

export default function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      toastOptions={{
        unstyled: true,
        duration: Infinity,
        classNames: {
          toast: "group w-full max-w-[420px] flex items-center gap-4 p-5 rounded-[28px] shadow-[0_20px_50px_rgba(31,27,20,0.12)] border animate-in slide-in-from-top-4 duration-500 mt-4",
          title: "font-headline font-black text-[14px] leading-tight mb-0.5",
          description: "font-body text-[12px] font-semibold opacity-80 leading-snug",
          success: "bg-secondary-container border-secondary/20 text-secondary",
          error: "bg-error-container border-error/20 text-error",
          warning: "bg-tertiary-container border-tertiary/20 text-tertiary",
          info: "bg-primary-container border-primary/20 text-on-primary",
          default: "bg-surface border-outline-variant/30 text-primary",
          actionButton: "ml-auto bg-surface/20 hover:bg-surface/30 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 border border-current/10 shrink-0",
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
