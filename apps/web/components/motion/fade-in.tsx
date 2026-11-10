"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { spring, springSoft } from "./springs";

// Entrada padrão do DESIGN.md: opacidade 0 → 1 e y 8 → 0, disparada quando
// entra na viewport. Com prefers-reduced-motion, só a opacidade muda.
export function FadeIn({
  children,
  index = 0,
  large = false,
  className,
}: {
  children?: ReactNode;
  index?: number;
  large?: boolean;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  // Stagger de 0,04s por item, no máximo 8 itens animados.
  const delay = Math.min(index, 7) * 0.04;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ ...(large ? springSoft : spring), delay }}
    >
      {children}
    </motion.div>
  );
}
