/**
 * Testes de lib/feedback.ts
 *
 * O que cobre: os critérios de nota por tipo de entrevista, a leitura e validação do
 * formulário de feedback e a regra de quando o entrevistador pode enviar.
 *
 * Por que importa: a mesma validação roda no navegador e na Server Action, e as chaves
 * das notas vão direto para feedbacks.scores. Um critério a mais, a menos ou fora de
 * 1 a 5 não pode chegar no banco.
 *
 * Rodar só este arquivo: npx vitest run lib/feedback.test.ts
 */
import { describe, expect, it } from "vitest";

import {
  canSendFeedback,
  FEEDBACK_CRITERIA,
  FEEDBACK_TEXT_MAX_LENGTH,
  feedbackSchema,
  parseFeedbackForm,
  SCORE_LABELS,
  scoreFieldName,
} from "./feedback";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
}

const VALID_CODING = {
  "score-comunicacao": "4",
  "score-tecnica": "3",
  "score-resolucao": "5",
  strengths: "Explicou bem o raciocínio.",
  improvements: "Testar casos de borda antes de dizer que terminou.",
  wouldHire: "yes",
};

function without(field: keyof typeof VALID_CODING): Record<string, string> {
  return Object.fromEntries(Object.entries(VALID_CODING).filter(([name]) => name !== field));
}

describe("FEEDBACK_CRITERIA", () => {
  it("tem critérios diferentes para cada tipo, sem chave repetida no mesmo tipo", () => {
    for (const criteria of Object.values(FEEDBACK_CRITERIA)) {
      const keys = criteria.map((criterion) => criterion.key);
      expect(keys.length).toBeGreaterThanOrEqual(3);
      expect(new Set(keys).size).toBe(keys.length);
    }
    expect(FEEDBACK_CRITERIA.coding.map((c) => c.key)).not.toEqual(
      FEEDBACK_CRITERIA.system_design.map((c) => c.key),
    );
  });

  it("toda chave tem rótulo para a tela de resultado", () => {
    for (const criterion of Object.values(FEEDBACK_CRITERIA).flat()) {
      expect(SCORE_LABELS[criterion.key]).toBe(criterion.label);
    }
  });
});

describe("parseFeedbackForm", () => {
  it("lê um formulário válido, com as notas como número", () => {
    const result = parseFeedbackForm("coding", form(VALID_CODING));

    expect(result).toEqual({
      success: true,
      data: {
        scores: { comunicacao: 4, tecnica: 3, resolucao: 5 },
        strengths: "Explicou bem o raciocínio.",
        improvements: "Testar casos de borda antes de dizer que terminou.",
        wouldHire: true,
      },
    });
  });

  it("'no' vira wouldHire false", () => {
    const result = parseFeedbackForm("coding", form({ ...VALID_CODING, wouldHire: "no" }));
    expect(result.success && result.data.wouldHire).toBe(false);
  });

  it("ignora nota de critério de outro tipo", () => {
    const result = parseFeedbackForm("coding", form({ ...VALID_CODING, "score-arquitetura": "5" }));
    expect(result.success && Object.keys(result.data.scores)).toEqual([
      "comunicacao",
      "tecnica",
      "resolucao",
    ]);
  });

  it("acusa a nota que faltou, pelo nome do campo", () => {
    const result = parseFeedbackForm("coding", form(without("score-tecnica")));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(Object.keys(result.fieldErrors)).toEqual([scoreFieldName("tecnica")]);
    }
  });

  it.each(["0", "6", "3.5", "abc", ""])("recusa a nota %j", (score) => {
    const result = parseFeedbackForm("coding", form({ ...VALID_CODING, "score-resolucao": score }));

    expect(result.success).toBe(false);
    if (!result.success) expect(result.fieldErrors["score-resolucao"]).toBeTruthy();
  });

  it("recusa texto vazio ou só com espaços", () => {
    const result = parseFeedbackForm(
      "coding",
      form({ ...VALID_CODING, strengths: "   ", improvements: "" }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors.strengths).toBeTruthy();
      expect(result.fieldErrors.improvements).toBeTruthy();
    }
  });

  it("recusa texto acima do limite", () => {
    const result = parseFeedbackForm(
      "coding",
      form({ ...VALID_CODING, strengths: "a".repeat(FEEDBACK_TEXT_MAX_LENGTH + 1) }),
    );

    expect(result.success).toBe(false);
    if (!result.success) expect(result.fieldErrors.strengths).toContain("máximo");
  });

  it("exige a resposta de 'avançaria no processo?'", () => {
    const result = parseFeedbackForm("coding", form(without("wouldHire")));

    expect(result.success).toBe(false);
    if (!result.success) expect(result.fieldErrors.wouldHire).toBeTruthy();
  });

  it("usa os critérios do tipo da sessão", () => {
    // As notas de coding não servem para system design.
    const result = parseFeedbackForm("system_design", form(VALID_CODING));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(Object.keys(result.fieldErrors).sort()).toEqual([
        "score-arquitetura",
        "score-requisitos",
        "score-tradeoffs",
      ]);
    }
  });
});

describe("feedbackSchema", () => {
  it("recusa chave de nota que não é do tipo", () => {
    const result = feedbackSchema("behavioral").safeParse({
      scores: { comunicacao: 4, estrutura: 4, exemplos: 4, tecnica: 5 },
      strengths: "ok",
      improvements: "ok",
      wouldHire: "yes",
    });
    expect(result.success).toBe(false);
  });
});

describe("canSendFeedback", () => {
  const ENDS_AT = "2026-11-18T22:00:00.000Z";
  const before = new Date("2026-11-18T21:30:00.000Z");
  const after = new Date("2026-11-18T22:00:00.000Z");

  it("aceita sessão encerrada pelo entrevistador, em qualquer horário", () => {
    expect(canSendFeedback("awaiting_feedback", ENDS_AT, before)).toBe(true);
    expect(canSendFeedback("awaiting_feedback", ENDS_AT, after)).toBe(true);
  });

  it("aceita sessão presa em andamento depois que o horário acabou", () => {
    expect(canSendFeedback("in_progress", ENDS_AT, after)).toBe(true);
  });

  it("recusa sessão em andamento ainda dentro do horário", () => {
    expect(canSendFeedback("in_progress", ENDS_AT, before)).toBe(false);
  });

  it.each(["pending_payment", "scheduled", "completed", "expired", "canceled", "no_show"])(
    "recusa sessão %s",
    (status) => {
      expect(canSendFeedback(status, ENDS_AT, after)).toBe(false);
    },
  );
});
