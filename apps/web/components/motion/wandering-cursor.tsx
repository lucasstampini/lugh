"use client";

import { motion, useReducedMotion } from "motion/react";

// Cursor colaborativo andando pelo quadro, igual ao item real do produto
// (DESIGN.md: candidato em Lume, entrevistador em Índigo claro). HTML (não
// SVG) com left/top em %, pra não distorcer a seta quando o container não
// tem a mesma proporção de um viewBox fixo.
export function WanderingCursor({
  points,
  color,
  label,
  labelTextColor = "#fff",
  duration = 7,
  delay = 0,
}: {
  points: { x: number; y: number }[];
  color: string;
  label?: string;
  // DESIGN.md: texto sobre Lume é sempre Megálito, nunca branco.
  labelTextColor?: string;
  duration?: number;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) {
    return null;
  }

  const left = points.map((p) => `${p.x}%`);
  const top = points.map((p) => `${p.y}%`);

  return (
    <motion.div
      className="pointer-events-none absolute flex items-center gap-1.5"
      animate={{ left, top, opacity: [0, 1, 1, 1, 0] }}
      transition={{ duration, repeat: Infinity, delay, ease: "easeInOut" }}
    >
      <svg width="14" height="18" viewBox="0 0 12 18" fill="none" className="shrink-0">
        <path
          d="M0,0 L0,15 L3.6,11.6 L6.4,17.2 L8.4,16.2 L5.6,10.6 L10.4,10.6 Z"
          fill={color}
          stroke="#fff"
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
