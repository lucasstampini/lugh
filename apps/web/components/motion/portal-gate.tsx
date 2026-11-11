"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState, type ReactNode } from "react";
import { springGentle } from "./springs";

type AreaTag = { label: string; top: string; left?: string; right?: string };

// O portão: ao passar o mouse, as pedras se afastam e a luz cresce, como se
// a porta estivesse se abrindo. Explica a metáfora da marca (Lugh só entra
// provando o ofício), não é só decoração.
//
// Hover é estado explícito (useState), não propagação de variants por
// contexto: com camada extra de entrada por cima do balão da tag, a
// propagação parava no meio do caminho e só a palavra de dentro (que anima
// por conta própria) reagia, o balão ficava parado.
export function PortalGate({
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
        <div className="bg-primary absolute top-0 left-0 h-[11%] w-full rounded-[10px]" />

        <motion.div
          className="bg-primary absolute top-[13%] bottom-0 left-[6%] w-[21%] rounded-t-[10px]"
          animate={{ x: hover ? -12 : 0 }}
          transition={springGentle}
        />
        <motion.div
          className="bg-primary absolute top-[13%] right-[6%] bottom-0 w-[21%] rounded-t-[10px]"
          animate={{ x: hover ? 12 : 0 }}
          transition={springGentle}
        />

        {/* boxShadow animado force repaint todo frame e travava a animação;
            a sombra agora é fixa, só a opacidade da camada de brilho muda
            (compositor, sem repaint) e a forma sólida só escala (transform). */}
        <div className="absolute bottom-0 left-1/2 h-[16%] w-[42%] -translate-x-1/2">
          <motion.div
            className="bg-lume absolute inset-0 rounded-t-full"
            style={{
              boxShadow:
                "0 0 56px 14px color-mix(in srgb, var(--lume) 50%, transparent)",
            }}
            animate={{ opacity: hover ? 1 : 0 }}
            transition={springGentle}
          />
          <motion.div
            className="bg-lume absolute inset-0 rounded-t-full"
            animate={{ scale: hover ? 1.12 : 1 }}
            transition={springGentle}
          />
        </div>
      </div>

      {areaTags.map((tag, index) => (
        // Um único motion.span: balão (fundo, borda, padding) e palavra são
        // o mesmo elemento, então entrada e hover do portão sempre movem as
        // duas coisas juntas. Sem flutuação contínua: só reage ao mouse.
        <motion.span
          key={tag.label}
          style={{ top: tag.top, left: tag.left, right: tag.right }}
          className="bg-card border-border absolute rounded-full border px-4 py-2 text-sm font-bold shadow-sm motion-reduce:transform-none!"
          initial={{ opacity: 0, y: 16 }}
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
