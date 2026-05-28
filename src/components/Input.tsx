"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: LucideIcon;
  error?: string;
  rightElement?: React.ReactNode;
}

export default function Input({
  label,
  icon: Icon,
  error,
  className = "",
  rightElement,
  ...props
}: InputProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="block font-label text-[9px] font-bold uppercase tracking-widest text-outline ml-1">
        {label}
      </label>
      <div className="relative group">
        {Icon && (
          <Icon 
            size={14} 
            className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
              error ? "text-error" : "text-secondary group-focus-within:text-primary"
            }`} 
          />
        )}
        <input
          className={`w-full ${Icon ? "pl-10" : "px-4"} ${rightElement ? "pr-10" : "pr-4"} py-2 bg-white border rounded-xl outline-none transition-all font-body text-xs shadow-sm placeholder:text-outline-variant/60 ${
            error 
              ? "border-error focus:ring-2 focus:ring-error/10" 
              : "border-outline-variant/20 focus:border-primary/30 focus:ring-2 focus:ring-primary/10"
          }`}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="text-[9px] font-bold text-error ml-1 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
}
