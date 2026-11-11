import { z } from "zod";

import type { SessionType } from "@/lib/room/session";

// Regras do feedback que valem no cliente e no servidor. Sem dependências de servidor:
// este arquivo pode ir para o bundle do navegador.

export type FeedbackCriterion = {
  // Chave gravada em feedbacks.scores (jsonb).
  key: string;
  label: string;
  // O que observar para dar a nota.
  help: string;
};

export const SCORE_MIN = 1;
export const SCORE_MAX = 5;
export const FEEDBACK_TEXT_MAX_LENGTH = 1500;

const COMMUNICATION: FeedbackCriterion = {
  key: "comunicacao",
  label: "Comunicação",
  help: "Explicou o raciocínio em voz alta e fez perguntas antes de sair resolvendo.",
};

// Os critérios mudam conforme o tipo da entrevista (fase 6 do PROJETO.md).
export const FEEDBACK_CRITERIA: Record<SessionType, FeedbackCriterion[]> = {
  coding: [
    COMMUNICATION,
    {
      key: "tecnica",
      label: "Qualidade do código",
      help: "Código legível, nomes claros, domínio da linguagem e das estruturas de dados.",
    },
    {
      key: "resolucao",
      label: "Resolução de problemas",
      help: "Quebrou o problema em partes, testou casos de borda e chegou numa solução que funciona.",
    },
  ],
  system_design: [
    COMMUNICATION,
    {
      key: "requisitos",
      label: "Levantamento de requisitos",
      help: "Perguntou sobre escala, usuários e restrições antes de desenhar.",
    },
    {
      key: "arquitetura",
      label: "Arquitetura",
      help: "Componentes fazem sentido juntos e o desenho aguenta a carga pedida.",
    },
    {
      key: "tradeoffs",
      label: "Trade-offs",
      help: "Comparou alternativas e justificou as escolhas.",
    },
  ],
  behavioral: [
    COMMUNICATION,
    {
      key: "estrutura",
      label: "Estrutura das respostas",
      help: "Respostas com começo, meio e fim: contexto, o que fez e o resultado.",
    },
    {
      key: "exemplos",
      label: "Exemplos concretos",
      help: "Trouxe situações reais, com o próprio papel e números quando existiam.",
    },
  ],
};

// Rótulo de cada chave de nota, de qualquer tipo. A tela de resultado lê daqui.
export const SCORE_LABELS: Record<string, string> = Object.fromEntries(
  Object.values(FEEDBACK_CRITERIA)
    .flat()
    .map((criterion) => [criterion.key, criterion.label]),
);

// Nome do campo de nota no formulário.
export function scoreFieldName(key: string): string {
  return `score-${key}`;
}

const scoreSchema = z.coerce
  .number({ error: "Dê uma nota de 1 a 5." })
  .int({ error: "Dê uma nota de 1 a 5." })
  .min(SCORE_MIN, { error: "Dê uma nota de 1 a 5." })
  .max(SCORE_MAX, { error: "Dê uma nota de 1 a 5." });

function textSchema(emptyMessage: string) {
  return z
    .string({ error: emptyMessage })
    .trim()
    .min(1, { error: emptyMessage })
    .max(FEEDBACK_TEXT_MAX_LENGTH, {
      error: `Use no máximo ${FEEDBACK_TEXT_MAX_LENGTH} caracteres.`,
    });
}

// Schema do feedback de um tipo de entrevista: uma nota para cada critério daquele tipo
// (nem a mais, nem a menos), os dois textos e a resposta de "avançaria no processo?".
export function feedbackSchema(type: SessionType) {
  const scores = Object.fromEntries(
    FEEDBACK_CRITERIA[type].map((criterion) => [criterion.key, scoreSchema]),
  );

  return z.object({
    scores: z.strictObject(scores),
    strengths: textSchema("Conte pelo menos um ponto forte."),
    improvements: textSchema("Conte pelo menos um ponto a melhorar."),
    wouldHire: z.enum(["yes", "no"], { error: "Responda se avançaria com a pessoa." }),
  });
}

export type FeedbackInput = {
  scores: Record<string, number>;
  strengths: string;
  improvements: string;
  wouldHire: boolean;
};

export type FeedbackFieldErrors = Record<string, string>;

export type ParsedFeedback =
  | { success: true; data: FeedbackInput }
  | { success: false; fieldErrors: FeedbackFieldErrors };

// Lê o formulário de feedback. A mesma função roda no navegador (antes de enviar) e na
// Server Action. Os erros saem pelo nome do campo: `score-<chave>`, `strengths`,
// `improvements` e `wouldHire`.
export function parseFeedbackForm(type: SessionType, formData: FormData): ParsedFeedback {
  const scores = Object.fromEntries(
    FEEDBACK_CRITERIA[type].map((criterion) => [
      criterion.key,
      // Number(null) é 0 e passaria por "nota baixa demais"; sem valor, a nota não existe.
      formData.get(scoreFieldName(criterion.key)) ?? undefined,
    ]),
  );

  const parsed = feedbackSchema(type).safeParse({
    scores,
    strengths: formData.get("strengths") ?? "",
    improvements: formData.get("improvements") ?? "",
    wouldHire: formData.get("wouldHire") ?? undefined,
  });

  if (!parsed.success) {
    const fieldErrors: FeedbackFieldErrors = {};
    for (const issue of parsed.error.issues) {
      const [field, key] = issue.path;
      const name = field === "scores" && typeof key === "string" ? scoreFieldName(key) : String(field);
      fieldErrors[name] ??= issue.message;
    }
    return { success: false, fieldErrors };
  }

  return {
    success: true,
    data: {
      scores: parsed.data.scores,
      strengths: parsed.data.strengths,
      improvements: parsed.data.improvements,
      wouldHire: parsed.data.wouldHire === "yes",
    },
  };
}

// O entrevistador pode enviar o feedback? Depois de encerrar a sessão, ou quando o horário
// acabou e ninguém clicou em "Encerrar sessão" (a sessão ficou presa em in_progress).
export function canSendFeedback(status: string, endsAt: string, now: Date = new Date()): boolean {
  if (status === "awaiting_feedback") return true;
  return status === "in_progress" && now.getTime() >= new Date(endsAt).getTime();
}
