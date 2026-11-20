"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState, type ReactNode } from "react";
import { springGentle } from "@/components/motion/springs";

type AreaTag = { label: string; top: string; left?: string; right?: string };

// Mesmo portão do components/motion/portal-gate.tsx da landing real, só
// recolorido pra Atlântico & Coral (pedra em azul, luz em coral em vez de
// Lume). Cópia local: o componente real usa bg-primary/bg-lume (tokens do
// globals.css Índigo/Lume), que não dá pra trocar sem afetar o site inteiro.
export function PortalGateAtlantico({
  areaTags,
  children,
}: {
  areaTags: AreaTag[];
  children?: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const [hovering, setHovering] = useState(false);
  const hover = !reduceMotion && hovering;

  return (
    <div
      className="relative mx-auto hidden aspect-[23/32] w-full max-w-[460px] md:block"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="absolute bottom-0 left-1/2 h-[87%] w-[91%] -translate-x-1/2">
        <div className="absolute top-0 left-0 h-[11%] w-full rounded-[10px] bg-[#2451A4]" />

        <motion.div
          className="absolute top-[13%] bottom-0 left-[6%] w-[21%] rounded-t-[10px] bg-[#2451A4]"
          animate={{ x: hover ? -12 : 0 }}
          transition={springGentle}
        />
        <motion.div
          className="absolute top-[13%] right-[6%] bottom-0 w-[21%] rounded-t-[10px] bg-[#2451A4]"
          animate={{ x: hover ? 12 : 0 }}
          transition={springGentle}
        />

        <div className="absolute bottom-0 left-1/2 h-[16%] w-[42%] -translate-x-1/2">
          <motion.div
            className="absolute inset-0 rounded-t-full bg-[#FF8A70]"
            style={{ boxShadow: "0 0 56px 14px rgba(255,138,112,0.5)" }}
            animate={{ opacity: hover ? 1 : 0 }}
            transition={springGentle}
          />
          <motion.div
            className="absolute inset-0 rounded-t-full bg-[#FF8A70]"
            animate={{ scale: hover ? 1.12 : 1 }}
            transition={springGentle}
          />
        </div>
      </div>

      {areaTags.map((tag, index) => (
        <motion.span
          key={tag.label}
          style={{ top: tag.top, left: tag.left, right: tag.right }}
          className="absolute rounded-full border border-[#E7E2DF] bg-white px-4 py-2 text-sm font-bold text-[#182D4D] shadow-sm"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: hover ? -6 : 0 }}
          transition={{
            opacity: { ...springGentle, delay: Math.min(index, 7) * 0.06 },
            y: springGentle,
          }}
        >
          {tag.label}
        </motion.span>
      ))}

      {children}
    </div>
  );
}
