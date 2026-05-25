"use client";

import React from "react";
import * as RadixSelect from "@radix-ui/react-select";
import { ChevronDown, Check, LucideIcon } from "lucide-react";

interface SelectProps {
  label?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  icon?: LucideIcon;
  error?: string;
  className?: string;
  required?: boolean;
}

export default function Select({
  label,
  value,
  onValueChange,
  options,
  placeholder = "Seleccionar...",
  icon: Icon,
  error,
  className = "",
  required = false,
}: SelectProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block font-label text-[9px] font-bold uppercase tracking-widest text-outline ml-1">
          {label} {required && <span className="text-error">*</span>}
        </label>
      )}
      
      <RadixSelect.Root value={value} onValueChange={onValueChange}>
        <div className="relative group">
          {Icon && (
            <Icon 
              size={14} 
              className={`absolute left-3 top-1/2 -translate-y-1/2 z-10 transition-colors duration-300 ${
                error ? "text-error" : "text-secondary group-focus-within:text-primary"
              }`} 
            />
          )}
          
          <RadixSelect.Trigger
            className={`flex items-center justify-between w-full ${Icon ? "pl-10" : "px-4"} pr-4 py-2 bg-white border rounded-xl outline-none transition-all font-label text-xs font-bold shadow-sm cursor-pointer select-none group focus:ring-2 focus:ring-primary/10 ${
              error 
                ? "border-error focus:border-error" 
                : "border-outline-variant/20 focus:border-primary/30"
            }`}
          >
            <RadixSelect.Value placeholder={placeholder} />
            <RadixSelect.Icon>
              <ChevronDown size={14} className="text-outline transition-transform duration-300 group-data-[state=open]:rotate-180" />
            </RadixSelect.Icon>
          </RadixSelect.Trigger>

          <RadixSelect.Portal>
            <RadixSelect.Content 
              className="z-[110] overflow-hidden bg-white/95 backdrop-blur-2xl border border-outline-variant/20 rounded-2xl shadow-[0_10px_40px_rgba(31,27,20,0.15)] animate-in fade-in slide-in-from-top-2 duration-200 min-w-[var(--radix-select-trigger-width)] max-h-[var(--radix-select-content-available-height)] md:max-h-[300px]"
              position="popper"
              side="bottom"
              sideOffset={8}
              align="start"
              collisionPadding={20}
            >
              <RadixSelect.ScrollUpButton className="flex items-center justify-center h-8 bg-surface-container-low text-primary cursor-default border-b border-outline-variant/10">
                <ChevronDown className="rotate-180" size={14} />
              </RadixSelect.ScrollUpButton>
              
              <RadixSelect.Viewport className="p-1.5">
                {options.map((option) => (
                  <RadixSelect.Item
                    key={option.value}
                    value={option.value}
                    className="relative flex items-center px-8 py-2.5 rounded-xl font-label text-sm font-bold text-on-surface-variant outline-none cursor-pointer select-none data-[highlighted]:bg-primary data-[highlighted]:text-on-primary data-[state=selected]:text-primary data-[state=selected]:bg-primary/5 transition-colors"
                  >
                    <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                    <RadixSelect.ItemIndicator className="absolute left-2.5 inline-flex items-center justify-center">
                      <Check size={14} strokeWidth={3} />
                    </RadixSelect.ItemIndicator>
                  </RadixSelect.Item>
                ))}
              </RadixSelect.Viewport>
              
              <RadixSelect.ScrollDownButton className="flex items-center justify-center h-8 bg-white/50 text-primary cursor-default border-t border-outline-variant/10">
                <ChevronDown size={14} />
              </RadixSelect.ScrollDownButton>
            </RadixSelect.Content>
          </RadixSelect.Portal>
        </div>
      </RadixSelect.Root>

      {error && (
        <p className="text-[9px] font-bold text-error ml-1 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
}
