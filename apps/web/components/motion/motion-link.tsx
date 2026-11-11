"use client";

import { motion } from "motion/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { spring } from "./springs";

const MotionNextLink = motion.create(Link);

// CTA com feedback tátil de clique: explica que o clique foi registrado,
// sem floreio (sem bounce, sem giro). Respeita prefers-reduced-motion por CSS
// (motion-reduce:): decidir no render mudava os atributos do link entre
// servidor e navegador (o whileTap acrescenta tabindex) e quebrava a hidratação.
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
  return (
    <MotionNextLink
      href={href}
      className={`motion-reduce:transform-none! ${className ?? ""}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={spring}
    >
      {children}
    </MotionNextLink>
  );
}
