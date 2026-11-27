/**
 * Testes de lib/candidate-preferences.ts
 *
 * O que cobre: a validação do que o questionário de onboarding do candidato envia e a
 * leitura das respostas salvas no perfil.
 *
 * Por que importa: toda pergunta pode ser pulada, então vazio tem que virar null em vez
 * de erro; e valor fora das listas não pode chegar ao banco nem quebrar a tela de matches.
 *
 * Rodar só este arquivo: npx vitest run lib/candidate-preferences.test.ts
 */
import { describe, expect, it } from "vitest";

import { candidateQuizSchema, preferencesFromProfile, ROLE_AREA_OPTIONS } from "./candidate-preferences";

const EMPTY = { name: "Ana", areas: [], interviewTypes: [], urgency: "", careerStage: "" };

describe("candidateQuizSchema", () => {
  it("aceita só o nome, com as perguntas puladas virando lista vazia ou null", () => {
    const parsed = candidateQuizSchema.parse({ ...EMPTY, name: "  Ana  " });

    expect(parsed).toEqual({ name: "Ana", areas: [], interviewTypes: [], urgency: null, careerStage: null });
  });

  it("aceita todas as respostas", () => {
    const parsed = candidateQuizSchema.parse({
      name: "Ana",
      areas: ["data", "mobile"],
      interviewTypes: ["coding", "behavioral"],
      urgency: "this_week",
      careerStage: "first_job",
    });

    expect(parsed.urgency).toBe("this_week");
    expect(parsed.careerStage).toBe("first_job");
    expect(parsed.areas).toEqual(["data", "mobile"]);
  });

  it("recusa nome vazio e valores fora das listas", () => {
    expect(candidateQuizSchema.safeParse({ ...EMPTY, name: "   " }).success).toBe(false);
    expect(candidateQuizSchema.safeParse({ ...EMPTY, areas: ["cobol"] }).success).toBe(false);
    expect(candidateQuizSchema.safeParse({ ...EMPTY, interviewTypes: ["pair"] }).success).toBe(false);
    expect(candidateQuizSchema.safeParse({ ...EMPTY, urgency: "ontem" }).success).toBe(false);
    expect(candidateQuizSchema.safeParse({ ...EMPTY, careerStage: "ceo" }).success).toBe(false);
  });

  it("a pergunta de área não oferece system design nem comportamental", () => {
    const values = ROLE_AREA_OPTIONS.map((option) => option.value);

    expect(values).toEqual(["software_engineer", "ai_engineer", "mobile", "data"]);
    expect(candidateQuizSchema.safeParse({ ...EMPTY, areas: ["system_design"] }).success).toBe(false);
  });
});

describe("preferencesFromProfile", () => {
  it("perfil sem respostas vira preferências vazias", () => {
    expect(
      preferencesFromProfile({ areas: null, interview_types: null, training_urgency: null, career_stage: null }),
    ).toEqual({ areas: [], interviewTypes: [], urgency: null, careerStage: null });
  });

  it("ignora valor desconhecido em vez de quebrar", () => {
    expect(
      preferencesFromProfile({
        areas: ["data"],
        interview_types: ["coding", "pair"],
        training_urgency: "ontem",
        career_stage: "working",
      }),
    ).toEqual({ areas: ["data"], interviewTypes: ["coding"], urgency: null, careerStage: "working" });
  });
});
