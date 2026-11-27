export const AREA_OPTIONS = [
  { value: "software_engineer", label: "Software Engineer" },
  { value: "ai_engineer", label: "AI Engineer" },
  { value: "mobile", label: "Mobile" },
  { value: "data", label: "Dados" },
  { value: "system_design", label: "System design" },
  { value: "behavioral", label: "Comportamental" },
] as const;

// Slugs que as áreas tinham antes de serem renomeadas. Links antigos do filtro
// (`/entrevistadores?area=backend`) continuam abrindo a lista certa.
const LEGACY_AREA_SLUGS: Record<string, string> = {
  backend: "software_engineer",
  frontend: "ai_engineer",
};

export function currentAreaSlug(area: string): string {
  return LEGACY_AREA_SLUGS[area] ?? area;
}

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
