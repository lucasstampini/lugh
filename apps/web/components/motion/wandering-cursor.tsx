"use client";

import { motion } from "motion/react";

// Cursor colaborativo andando pelo quadro, igual ao item real do produto
// (DESIGN.md: candidato em Lume, entrevistador em Índigo claro). HTML (não
// SVG) com left/top em %, pra não distorcer a seta quando o container não
// tem a mesma proporção de um viewBox fixo.
export function WanderingCursor({
  points,
  color,
  label,
  labelTextColor = "var(--foreground)",
  duration = 7,
  delay = 0,
}: {
  points: { x: number; y: number }[];
  // Cor CSS: passe um token (ex: "var(--lume)"), nunca hex solto.
  color: string;
  label?: string;
  // DESIGN.md: texto sobre Lume é sempre Megálito, nunca branco.
  labelTextColor?: string;
  duration?: number;
  delay?: number;
}) {
  const left = points.map((p) => `${p.x}%`);
  const top = points.map((p) => `${p.y}%`);

  return (
    <motion.div
      // motion-reduce:hidden: com prefers-reduced-motion o cursor some por CSS.
      className="pointer-events-none absolute flex items-center gap-1.5 motion-reduce:hidden"
      animate={{ left, top, opacity: [0, 1, 1, 1, 0] }}
      transition={{ duration, repeat: Infinity, delay, ease: "easeInOut" }}
    >
      <svg width="14" height="18" viewBox="0 0 12 18" fill="none" className="shrink-0">
        <path
          d="M0,0 L0,15 L3.6,11.6 L6.4,17.2 L8.4,16.2 L5.6,10.6 L10.4,10.6 Z"
          fill={color}
          stroke="var(--foreground)"
          strokeWidth="0.8"
        />
      </svg>
      {label ? (
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold whitespace-nowrap"
          style={{ backgroundColor: color, color: labelTextColor }}
        >
          {label}
        </span>
      ) : null}
    </motion.div>
  );
}
