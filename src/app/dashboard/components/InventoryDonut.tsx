"use client";

export interface DonutSegment {
  label: string;
  value: number;
  /** Color CSS resuelto (token de globals.css vía var()). */
  color: string;
}

interface InventoryDonutProps {
  segments: DonutSegment[];
  /** Número grande al centro. */
  centerValue: string;
  centerLabel: string;
}

/**
 * Dona SVG dependency-free. Cada segmento se dibuja como un arco con un pequeño
 * espacio para un acabado elegante. Los colores provienen del tema (globals.css).
 */
export default function InventoryDonut({ segments, centerValue, centerLabel }: InventoryDonutProps) {
  const size = 180;
  const stroke = 20;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((acc, s) => acc + s.value, 0);
  const gap = total > 0 ? circumference * 0.012 : 0; // separación sutil entre arcos

  let offset = 0;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        {/* Pista base */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-surface-container-high)"
          strokeWidth={stroke}
        />
        {total > 0 &&
          segments.map((seg) => {
            const raw = (seg.value / total) * circumference;
            const dash = Math.max(raw - gap, 0);
            const el = (
              <circle
                key={seg.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                className="transition-all duration-700 ease-out"
              />
            );
            offset += raw;
            return seg.value > 0 ? el : null;
          })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-headline text-3xl font-extrabold text-primary leading-none">{centerValue}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">{centerLabel}</span>
      </div>
    </div>
  );
}
