// Física de mola do DESIGN.md (seção 6), compartilhada entre os componentes
// de animação. A mola padrão passa um pouco do ponto antes de assentar: é o
// mesmo gesto do `lift` e do `pop` em CSS (cubic-bezier(.34, 1.56, .64, 1)).
export const spring = {
  type: "spring" as const,
  stiffness: 340,
  damping: 18,
  mass: 0.8,
};

// Elementos grandes (cards, painéis): mesma personalidade, menos quique.
export const springSoft = {
  type: "spring" as const,
  stiffness: 220,
  damping: 22,
};

// Hiper suave: pra movimento ambiente/decorativo (flutuação, hover de
// elementos pequenos), onde a física de mola padrão parece mecânica demais.
export const springGentle = {
  type: "spring" as const,
  stiffness: 90,
  damping: 20,
  mass: 1,
};
