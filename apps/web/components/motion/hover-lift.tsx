"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { spring } from "./springs";

// Feedback de hover do mouse em cards: levanta levemente, explica que ali
// tem algo pra olhar com mais atenção. Sem giro, sem bounce.
export function HoverLift({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      whileHover={reduceMotion ? undefined : { y: -4 }}
      transition={spring}
    >
      {children}
    </motion.div>
  );
}
