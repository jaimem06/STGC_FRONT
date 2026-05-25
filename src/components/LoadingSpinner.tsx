"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
  fullPage?: boolean;
  message?: string;
}

export default function LoadingSpinner({ 
  size = 48, 
  className = "", 
  fullPage = false,
  message
}: LoadingSpinnerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const containerClasses = fullPage 
    ? "fixed inset-0 flex flex-col items-center justify-center bg-surface/90 backdrop-blur-md z-[9999] animate-in fade-in duration-300" 
    : `relative flex flex-col items-center justify-center gap-3 ${className}`;

  const content = (
    <div className={containerClasses}>
      <div className="relative flex items-center justify-center">
        {/* Decorative Ring */}
        <div 
          className="absolute inset-0 rounded-full border-2 border-primary/5 animate-pulse"
          style={{ width: size + 16, height: size + 16, left: -8, top: -8 }}
        />
        
        {/* Icon Container */}
        <div 
          style={{ width: size, height: size }} 
          className="relative shrink-0 flex items-center justify-center rounded-full animate-[bounce_1.5s_infinite]"
        >
          <Image
            src="/loader cafe.svg"
            alt="Cargando..."
            width={size}
            height={size}
            className="animate-[spin_2.8s_linear_infinite]"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            priority
          />
        </div>
      </div>

      {message && (
        <div className="flex flex-col items-center gap-1.5 mt-2">
          <p className="font-headline text-[10px] font-black text-primary uppercase tracking-[0.3em] animate-pulse text-center px-4">
            {message}
          </p>
          <div className="w-10 h-0.5 bg-primary/10 rounded-full overflow-hidden">
            <div className="w-1/2 h-full bg-primary/30 animate-progress-slide" 
                 style={{ transformOrigin: 'left' }} 
            />
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes progress-slide {
          0% { transform: translateX(-100%) scaleX(0.2); }
          50% { transform: translateX(0%) scaleX(1); }
          100% { transform: translateX(100%) scaleX(0.2); }
        }
        .animate-progress-slide {
          animation: progress-slide 1.1s infinite ease-in-out;
        }
      `}</style>
    </div>
  );

  if (fullPage) {
    if (!mounted) return null;
    return createPortal(content, document.body);
  }

  return content;
}
