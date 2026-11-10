// Física de mola do DESIGN.md (seção 6), compartilhada entre os componentes
// de animação da landing.
export const spring = {
  type: "spring" as const,
  stiffness: 380,
  damping: 32,
  mass: 0.8,
};

export const springSoft = {
  type: "spring" as const,
  stiffness: 220,
  damping: 28,
};

// Hiper suave: pra movimento ambiente/decorativo (flutuação, hover de
// elementos pequenos), onde a física de mola padrão parece mecânica demais.
export const springGentle = {
  type: "spring" as const,
  stiffness: 90,
  damping: 20,
  mass: 1,
};
