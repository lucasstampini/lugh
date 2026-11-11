"use client";

import { motion } from "motion/react";

// Pisca periódica sobre a região dos olhos do retrato (coordenadas vêm do
// Figma: GROUP 'Eyes' relativo ao frame 'Camila · retrato editorial',
// 208x182). Uma faixa cor de pele cobre os olhos por um instante, como uma
// pálpebra. Com prefers-reduced-motion, não pisca (escondido por CSS, pra o
// HTML do servidor ser igual ao do navegador).
export function BlinkingEyes() {
  return (
    <motion.div
      className="absolute rounded-full bg-[#C88765] motion-reduce:hidden"
      style={{ left: "37%", top: "39.5%", width: "24%", height: "4%" }}
      animate={{ opacity: [0, 0, 1, 0, 0] }}
      transition={{
        duration: 4.5,
        repeat: Infinity,
        times: [0, 0.94, 0.96, 0.98, 1],
        ease: "linear",
      }}
    />
  );
}
