"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { spring } from "./springs";

const MotionNextLink = motion.create(Link);

// CTA com feedback tátil de clique: explica que o clique foi registrado,
// sem floreio (sem bounce, sem giro). Respeita prefers-reduced-motion.
// Props tipadas explicitamente (não ComponentProps<typeof Link>): o motion
// tipa onDrag/eventos de outro jeito que o anchor nativo, e dá conflito de
// tipos se a gente espalhar todas as props do Link aqui.
export function MotionLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <MotionNextLink
      href={href}
      className={className}
      whileHover={reduceMotion ? undefined : { scale: 1.02 }}
      whileTap={reduceMotion ? undefined : { scale: 0.97 }}
      transition={spring}
    >
      {children}
    </MotionNextLink>
  );
}
