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
  return (
    <RadixDialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] animate-in fade-in duration-300" />
        <RadixDialog.Content 
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface rounded-[40px] shadow-2xl p-8 border border-outline-variant/20 max-w-md w-[90vw] z-[101] animate-in zoom-in-95 duration-200 outline-none"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <RadixDialog.Title className="text-2xl font-headline font-extrabold text-primary tracking-tight">
                {title}
              </RadixDialog.Title>
              {description && (
                <RadixDialog.Description className="text-xs text-on-surface-variant font-medium mt-1">
                  {description}
                </RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close className="p-2 hover:bg-surface-container rounded-full text-outline transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/20">
              <X size={20} />
            </RadixDialog.Close>
          </div>

          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
