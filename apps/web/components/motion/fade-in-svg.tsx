"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { spring, springSoft } from "./springs";

// Igual ao FadeIn, mas <motion.g> em vez de <motion.div>: dentro de <svg>,
// um div quebra a renderização (não é elemento SVG válido).
export function FadeInG({
  children,
  index = 0,
  large = false,
}: {
  children?: ReactNode;
  index?: number;
  large?: boolean;
}) {
  const delay = Math.min(index, 7) * 0.04;

  return (
    <motion.g
      className="motion-reduce:transform-none!"
      initial={{ opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ ...(large ? springSoft : spring), delay }}
    >
      {children}
    </motion.g>
  );
}
