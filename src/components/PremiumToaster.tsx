"use client";

import { Toaster as SonnerToaster } from "sonner";

export default function PremiumToaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "w-full max-w-[350px] flex items-center gap-3 p-4 rounded-2xl bg-surface border border-outline-variant/20 shadow-[0_8px_30px_rgb(31,27,20,0.1)] backdrop-blur-xl animate-in slide-in-from-bottom-2 duration-300",
          title: "font-headline font-bold text-sm text-primary",
          description: "font-body text-xs text-on-surface-variant",
          success: "border-l-4 border-secondary",
          error: "border-l-4 border-error",
          warning: "border-l-4 border-tertiary",
          info: "border-l-4 border-primary",
        },
      }}
    />
  );
}
