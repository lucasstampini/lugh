"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

// Anel pulsante ("ao vivo"), só transform+opacity (GPU, sem travar).
export function LivePulse({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative flex items-center justify-center">
      {reduceMotion ? null : (
        <>
          <motion.span
            className="border-secondary absolute inset-0 rounded-full border-2"
            animate={{ scale: [1, 1.35, 1.35], opacity: [0.6, 0, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.span
            className="border-secondary absolute inset-0 rounded-full border-2"
            animate={{ scale: [1, 1.35, 1.35], opacity: [0.6, 0, 0] }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: "easeOut",
              delay: 1.2,
            }}
          />
        </>
      )}
      {children}
    </div>
  );
}
