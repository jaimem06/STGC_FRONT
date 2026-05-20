"use client";

import React from "react";
import * as Select from "@radix-ui/react-select";
import { ChevronDown, Check, LucideIcon } from "lucide-react";

interface PremiumSelectProps {
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

export default function PremiumSelect({
  label,
  value,
  onValueChange,
  options,
  placeholder = "Seleccionar...",
  icon: Icon,
  error,
  className = "",
  required = false,
}: PremiumSelectProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block font-label text-[10px] font-bold uppercase tracking-widest text-outline ml-1">
          {label} {required && <span className="text-error">*</span>}
        </label>
      )}
      
      <Select.Root value={value} onValueChange={onValueChange}>
        <div className="relative group">
          {Icon && (
            <Icon 
              size={14} 
              className={`absolute left-3 top-1/2 -translate-y-1/2 z-10 transition-colors duration-300 ${
                error ? "text-error" : "text-secondary group-focus-within:text-primary"
              }`} 
            />
          )}
          
          <Select.Trigger
            className={`flex items-center justify-between w-full ${Icon ? "pl-10" : "px-4"} pr-4 py-2.5 bg-white border rounded-2xl outline-none transition-all font-label text-sm font-bold shadow-sm cursor-pointer select-none group focus:ring-2 focus:ring-primary/10 ${
              error 
                ? "border-error focus:border-error" 
                : "border-outline-variant/20 focus:border-primary/30"
            }`}
          >
            <Select.Value placeholder={placeholder} />
            <Select.Icon>
              <ChevronDown size={14} className="text-outline transition-transform duration-300 group-data-[state=open]:rotate-180" />
            </Select.Icon>
          </Select.Trigger>

          <Select.Portal>
            <Select.Content 
              className="z-[100] overflow-hidden bg-white/80 backdrop-blur-xl border border-outline-variant/20 rounded-2xl shadow-[0_10px_40px_rgba(31,27,20,0.12)] animate-in fade-in zoom-in-95 duration-200"
              position="popper"
              sideOffset={5}
            >
              <Select.ScrollUpButton className="flex items-center justify-center h-[25px] bg-white text-primary cursor-default">
                <ChevronDown className="rotate-180" size={14} />
              </Select.ScrollUpButton>
              
              <Select.Viewport className="p-1.5">
                {options.map((option) => (
                  <Select.Item
                    key={option.value}
                    value={option.value}
                    className="relative flex items-center px-8 py-2.5 rounded-xl font-label text-sm font-bold text-on-surface-variant outline-none cursor-pointer select-none data-[highlighted]:bg-primary data-[highlighted]:text-on-primary data-[state=selected]:text-primary data-[state=selected]:bg-primary/5 transition-colors"
                  >
                    <Select.ItemText>{option.label}</Select.ItemText>
                    <Select.ItemIndicator className="absolute left-2.5 inline-flex items-center justify-center">
                      <Check size={14} strokeWidth={3} />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.Viewport>
              
              <Select.ScrollDownButton className="flex items-center justify-center h-[25px] bg-white text-primary cursor-default">
                <ChevronDown size={14} />
              </Select.ScrollDownButton>
            </Select.Content>
          </Select.Portal>
        </div>
      </Select.Root>

      {error && (
        <p className="text-[10px] font-bold text-error ml-1 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
}
