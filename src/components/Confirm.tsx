"use client";

import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { AlertCircle, Trash2 } from "lucide-react";

interface ConfirmProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmText?: string;
  variant?: "danger" | "warning";
}

export default function Confirm({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = "CONTINUAR",
  variant = "danger",
}: ConfirmProps) {
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" />
        <AlertDialogPrimitive.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-md bg-surface rounded-[40px] p-8 shadow-2xl border border-outline-variant/20 animate-in zoom-in-95 duration-200">
          <div className="flex flex-col items-center text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 shadow-sm ${
              variant === "danger" ? "bg-error/10 text-error" : "bg-tertiary/10 text-tertiary"
            }`}>
              {variant === "danger" ? <Trash2 size={32} /> : <AlertCircle size={32} />}
            </div>
            
            <AlertDialogPrimitive.Title className="font-headline text-2xl font-extrabold text-primary mb-3 tracking-tight">
              {title}
            </AlertDialogPrimitive.Title>
            
            <AlertDialogPrimitive.Description className="font-body text-sm text-on-surface-variant mb-10 leading-relaxed max-w-xs">
              {description}
            </AlertDialogPrimitive.Description>

            <div className="flex gap-4 w-full">
              <AlertDialogPrimitive.Cancel asChild>
                <button className="flex-1 px-6 py-4 rounded-2xl border border-outline-variant/30 font-headline font-bold text-xs text-outline hover:bg-surface-container transition-all active:scale-95">
                  CANCELAR
                </button>
              </AlertDialogPrimitive.Cancel>
              
              <AlertDialogPrimitive.Action asChild>
                <button 
                  onClick={onConfirm}
                  className={`flex-1 px-6 py-4 rounded-2xl font-headline font-bold text-xs text-white shadow-xl transition-all active:scale-95 hover:-translate-y-0.5 ${
                    variant === "danger" ? "bg-error shadow-error/20" : "bg-tertiary shadow-tertiary/20"
                  }`}
                >
                  {confirmText}
                </button>
              </AlertDialogPrimitive.Action>
            </div>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
