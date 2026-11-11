"use client";

import { motion } from "motion/react";
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
  return (
    <motion.div
      // Com prefers-reduced-motion o CSS anula o deslocamento.
      className={`motion-reduce:transform-none! ${className ?? ""}`}
      whileHover={{ y: -4 }}
      transition={spring}
    >
      {children}
    </motion.div>
  );
}
