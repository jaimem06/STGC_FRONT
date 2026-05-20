"use client";

import React from "react";
import { Search as SearchIcon, X } from "lucide-react";

interface SearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function Search({
  value,
  onChange,
  placeholder = "Buscar...",
  className = "",
}: SearchProps) {
  return (
    <div className={`relative group ${className}`}>
      <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300">
        <SearchIcon 
          size={18} 
          className="text-outline group-focus-within:text-primary" 
        />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-12 pr-10 py-3 bg-white border border-outline-variant/20 rounded-2xl outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/30 transition-all font-body text-sm shadow-sm placeholder:text-outline-variant/60"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-surface-container rounded-full text-outline transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
