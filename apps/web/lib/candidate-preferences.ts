import { z } from "zod";

import { AREA_OPTIONS } from "@/lib/interviewer-options";
import { SESSION_TYPES, type SessionType } from "@/lib/slots";

// Perguntas do questionário de onboarding do candidato. As respostas ficam em profiles
// (areas, interview_types, training_urgency, career_stage) e alimentam o match.

// Só as áreas de função: system design e comportamental são tipos de entrevista, e a
// pergunta de tipo já cobre.
export const ROLE_AREA_OPTIONS = AREA_OPTIONS.filter(
  (option) => option.value !== "system_design" && option.value !== "behavioral",
);

export const INTERVIEW_TYPE_OPTIONS: { value: SessionType; title: string; description: string }[] = [
  {
    value: "coding",
    title: "Código ao vivo",
    description: "Você resolve um problema no editor e explica o raciocínio enquanto escreve.",
  },
  {
    value: "system_design",
    title: "System design",
    description: "Você desenha a arquitetura de um sistema no quadro, junto com quem entrevista.",
  },
  {
    value: "behavioral",
    title: "Comportamental",
    description: "Perguntas sobre suas experiências e sobre como você trabalha em equipe.",
  },
];

export const URGENCY_OPTIONS = [
  { value: "this_week", title: "Esta semana", description: "Tenho entrevista marcada ou quero começar já." },
  { value: "this_month", title: "Este mês", description: "Estou me candidatando e quero chegar preparado." },
  { value: "no_rush", title: "Sem pressa", description: "Quero treinar com calma, no meu ritmo." },
] as const;
export type TrainingUrgency = (typeof URGENCY_OPTIONS)[number]["value"];

export const CAREER_STAGE_OPTIONS = [
  { value: "internship", title: "Buscando estágio", description: "Ainda estou estudando." },
  { value: "first_job", title: "Buscando a primeira vaga", description: "Quero entrar como júnior." },
  { value: "working", title: "Já trabalho na área", description: "Quero mudar de empresa ou subir de nível." },
] as const;
export type CareerStage = (typeof CAREER_STAGE_OPTIONS)[number]["value"];

export type CandidatePreferences = {
  areas: string[];
  interviewTypes: SessionType[];
  urgency: TrainingUrgency | null;
  careerStage: CareerStage | null;
};

const roleAreaValues = ROLE_AREA_OPTIONS.map((option) => option.value) as [string, ...string[]];
const urgencyValues = URGENCY_OPTIONS.map((option) => option.value) as [TrainingUrgency, ...TrainingUrgency[]];
const careerStageValues = CAREER_STAGE_OPTIONS.map((option) => option.value) as [CareerStage, ...CareerStage[]];

// Pergunta de resposta única que foi pulada chega como "" e vira null.
function optionalChoice<T extends string>(values: [T, ...T[]]) {
  return z
    .union([z.enum(values), z.literal("")])
    .transform((value) => (value === "" ? null : value));
}

// O que o questionário envia. Só o nome é obrigatório: toda pergunta pode ser pulada.
export const candidateQuizSchema = z.object({
  name: z.string().trim().min(1, "Digite seu nome.").max(120, "Até 120 caracteres."),
  areas: z.array(z.enum(roleAreaValues)).max(roleAreaValues.length),
  interviewTypes: z.array(z.enum(SESSION_TYPES)).max(SESSION_TYPES.length),
  urgency: optionalChoice(urgencyValues),
  careerStage: optionalChoice(careerStageValues),
});

// Lê as respostas salvas no perfil. Valor fora das listas (dado antigo ou coluna vazia)
// é ignorado em vez de quebrar a tela de matches.
export function preferencesFromProfile(profile: {
  areas: string[] | null;
  interview_types: string[] | null;
  training_urgency: string | null;
  career_stage: string | null;
}): CandidatePreferences {
  const urgency = z.enum(urgencyValues).safeParse(profile.training_urgency);
  const careerStage = z.enum(careerStageValues).safeParse(profile.career_stage);
  return {
    areas: profile.areas ?? [],
    interviewTypes: (profile.interview_types ?? []).filter((type): type is SessionType =>
      (SESSION_TYPES as readonly string[]).includes(type),
    ),
    urgency: urgency.success ? urgency.data : null,
    careerStage: careerStage.success ? careerStage.data : null,
  };
}
