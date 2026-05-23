"use client";

import Image from "next/image";

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
  fullPage?: boolean;
}

export default function LoadingSpinner({ size = 40, className = "", fullPage = false }: LoadingSpinnerProps) {
  const containerClasses = fullPage 
    ? "fixed inset-0 flex items-center justify-center bg-surface/50 backdrop-blur-sm z-[100]" 
    : `relative flex items-center justify-center ${className}`;

  return (
    <div className={containerClasses}>
      <div 
        style={{ width: size, height: size }} 
        className="relative shrink-0 flex items-center justify-center"
      >
        <Image
          src="/loader cafe.svg"
          alt="Cargando..."
          width={size}
          height={size}
          className="animate-[spin_1.8s_linear_infinite]"
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          priority
        />
      </div>
    </div>
  );
}
