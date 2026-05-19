"use client";

import Image from "next/image";

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export default function LoadingSpinner({ size = 40, className = "" }: LoadingSpinnerProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <Image
        src="/loader cafe.svg"
        alt="Cargando..."
        width={size}
        height={size}
        className="animate-[spin_1.8s_linear_infinite]"
        priority
      />
    </div>
  );
}
