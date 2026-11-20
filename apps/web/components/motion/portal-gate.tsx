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
  tone = "primary",
  tagStyle = "pill",
  children,
}: {
  areaTags: AreaTag[];
  // "ink" é a pedra escura. "soft" é a pedra em branco translúcido, para o
  // portão ficar como marca d'água sobre a faixa azul do hero.
  tone?: "primary" | "ink" | "deep" | "soft";
  // "plain" escreve a área como palavra solta, sem o balão branco.
  tagStyle?: "pill" | "plain";
  children?: ReactNode;
}) {
  // "deep" é a pedra azul: sobre o amarelo ela separa o portão dos cards de
  // frente, que são brancos com borda de tinta.
  const stone =
    tone === "ink"
      ? "bg-ink"
      : tone === "deep"
        ? "bg-brand-deep"
        : tone === "soft"
          ? "bg-white/[0.12]"
          : "bg-primary";
  const light = tone === "primary" ? "bg-primary" : tone === "soft" ? "bg-white/[0.12]" : "bg-card";
  const glow =
    tone === "primary"
      ? "0 0 56px 14px rgba(255,194,61,0.5)"
      : "0 0 72px 18px rgba(255,255,255,0.6)";
  const reduceMotion = useReducedMotion();
  const [hovering, setHovering] = useState(false);
  const hover = !reduceMotion && hovering;

  return (
    <div
      className="relative mx-auto aspect-[23/32] h-full"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="absolute bottom-0 left-1/2 h-[87%] w-[91%] -translate-x-1/2">
        <div className={`${stone} absolute top-0 left-0 h-[11%] w-full rounded-[10px]`} />

        <motion.div
          className={`${stone} absolute top-[13%] bottom-0 left-[6%] w-[21%] rounded-t-[10px]`}
          animate={{ x: hover ? -12 : 0 }}
          transition={springGentle}
        />
        <motion.div
          className={`${stone} absolute top-[13%] right-[6%] bottom-0 w-[21%] rounded-t-[10px]`}
          animate={{ x: hover ? 12 : 0 }}
          transition={springGentle}
        />

        {/* A luz do portão: no fundo amarelo ela fica discreta, só um arco
            baixo entre as pedras. O brilho continua respondendo ao hover. */}
        <div className="absolute bottom-0 left-1/2 h-[7%] w-[30%] -translate-x-1/2">
          <motion.div
            className={`${light} absolute inset-0 rounded-t-full`}
            style={{ boxShadow: glow }}
            animate={{ opacity: hover ? 1 : 0 }}
            transition={springGentle}
          />
          <motion.div
            className={`${light} absolute inset-0 rounded-t-full`}
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
          className={
            tagStyle === "plain"
              ? "text-ink/85 absolute font-mono text-[13px] font-bold tracking-[0.02em]"
              : "edge bg-card absolute rounded-full px-4 py-2 text-sm font-bold shadow-sm"
          }
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
