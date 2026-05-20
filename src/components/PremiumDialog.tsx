"use client";

import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

interface PremiumDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export default function PremiumDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  children,
}: PremiumDialogProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] animate-in fade-in duration-300" />
        <Dialog.Content 
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface rounded-[40px] shadow-2xl p-8 border border-outline-variant/20 max-w-md w-[90vw] z-[101] animate-in zoom-in-95 duration-200 outline-none"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <Dialog.Title className="text-2xl font-headline font-extrabold text-primary tracking-tight">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="text-xs text-on-surface-variant font-medium mt-1">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close className="p-2 hover:bg-surface-container rounded-full text-outline transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/20">
              <X size={20} />
            </Dialog.Close>
          </div>

          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
