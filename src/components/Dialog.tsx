"use client";

import React from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

interface DialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export default function Dialog({
  isOpen,
  onOpenChange,
  title,
  description,
  children,
}: DialogProps) {
  // Salvaguarda: al cerrar (o encadenar con otro modal como Confirm), Radix puede
  // dejar `pointer-events: none` en el <body> y bloquear toda la interacción.
  React.useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        document.body.style.pointerEvents = "";
      }, 0);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  return (
    <RadixDialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-xl z-[100] animate-in fade-in duration-300" />
        <RadixDialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface rounded-[32px] shadow-[0_12px_48px_rgba(31,27,20,0.28)] ring-1 ring-black/[0.04] p-6 border border-outline-variant/20 max-w-md w-[90vw] z-[101] animate-in zoom-in-95 duration-200 outline-none max-h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <RadixDialog.Title className="text-xl font-headline font-extrabold text-primary tracking-tight">
                {title}
              </RadixDialog.Title>
              {description && (
                <RadixDialog.Description className="text-[11px] text-on-surface-variant font-medium mt-0.5">
                  {description}
                </RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close
              aria-label="Cerrar"
              title="Cerrar"
              className="p-1.5 -mr-1.5 -mt-1 hover:bg-surface-container rounded-full text-outline hover:text-on-surface transition-colors outline-none shrink-0"
            >
              <X size={18} />
            </RadixDialog.Close>
          </div>

          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
