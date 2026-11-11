export const AREA_OPTIONS = [
  { value: "backend", label: "Backend" },
  { value: "frontend", label: "Frontend" },
  { value: "mobile", label: "Mobile" },
  { value: "data", label: "Dados" },
  { value: "system_design", label: "System design" },
  { value: "behavioral", label: "Comportamental" },
] as const;

export const SENIORITY_OPTIONS = [
  { value: "junior", label: "Júnior" },
  { value: "mid", label: "Pleno" },
  { value: "senior", label: "Sênior" },
  { value: "staff", label: "Staff / Principal" },
] as const;

// weekday 0 = domingo, segue o padrão do Postgres/JS Date.getDay().
export const WEEKDAY_LABELS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
] as const;
