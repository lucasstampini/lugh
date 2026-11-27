/**
 * Testes de app/onboarding/actions.ts (só o questionário do candidato)
 *
 * O que cobre: o envio do questionário de onboarding. Login e banco são simulados; a
 * validação do formulário e a conferência do aceite dos Termos são as de verdade.
 *
 * Por que importa: é aqui que o usuário vira candidato. Sem aceite dos Termos nada pode
 * ser gravado, pergunta pulada tem que virar null, e uma falha do banco não pode levar
 * para a tela de matches como se tivesse salvado.
 *
 * Rodar só este arquivo: npx vitest run app/onboarding/actions.test.ts
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TERMS_FIELD, TERMS_REQUIRED_MESSAGE } from "@/lib/legal";

import { saveCandidateQuiz } from "./actions";

const mocks = vi.hoisted(() => ({
  user: { id: "user-1" } as { id: string } | null,
  termsAcceptedAt: null as string | null,
  acceptTerms: vi.fn(),
  update: vi.fn(),
  updateError: null as { message: string } | null,
}));

// O redirect de verdade interrompe a action lançando um erro: aqui também.
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT ${path}`);
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: mocks.user } }) },
    rpc: mocks.acceptTerms,
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: { terms_accepted_at: mocks.termsAcceptedAt }, error: null }),
        }),
      }),
      update: (values: unknown) => {
        mocks.update(values);
        return { eq: async () => ({ error: mocks.updateError }) };
      },
    }),
  }),
}));

function form(fields: Record<string, string | string[]>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    for (const item of Array.isArray(value) ? value : [value]) data.append(key, item);
  }
  return data;
}

const MATCHES_REDIRECT = "REDIRECT /onboarding/candidato/matches";

beforeEach(() => {
  mocks.user = { id: "user-1" };
  mocks.termsAcceptedAt = null;
  mocks.updateError = null;
  mocks.update.mockClear();
  mocks.acceptTerms.mockReset().mockResolvedValue({ error: null });
});

describe("saveCandidateQuiz", () => {
  it("grava papel, nome e respostas, registra o aceite e leva para os matches", async () => {
    const data = form({
      name: "Ana Souza",
      areas: ["data", "mobile"],
      interviewTypes: ["system_design"],
      urgency: "this_week",
      careerStage: "first_job",
      [TERMS_FIELD]: "on",
    });

    await expect(saveCandidateQuiz(null, data)).rejects.toThrow(MATCHES_REDIRECT);

    expect(mocks.acceptTerms).toHaveBeenCalledWith("accept_terms");
    expect(mocks.update).toHaveBeenCalledWith({
      role: "candidate",
      name: "Ana Souza",
      areas: ["data", "mobile"],
      interview_types: ["system_design"],
      training_urgency: "this_week",
      career_stage: "first_job",
    });
  });

  it("perguntas puladas viram null", async () => {
    const data = form({ name: "Ana", urgency: "", careerStage: "", [TERMS_FIELD]: "on" });

    await expect(saveCandidateQuiz(null, data)).rejects.toThrow(MATCHES_REDIRECT);

    expect(mocks.update).toHaveBeenCalledWith({
      role: "candidate",
      name: "Ana",
      areas: null,
      interview_types: null,
      training_urgency: null,
      career_stage: null,
    });
  });

  it("sem aceite dos Termos não grava nada", async () => {
    const result = await saveCandidateQuiz(null, form({ name: "Ana", urgency: "", careerStage: "" }));

    expect(result).toEqual({ error: TERMS_REQUIRED_MESSAGE });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("quem já aceitou os Termos passa sem o checkbox", async () => {
    mocks.termsAcceptedAt = "2026-11-26T12:00:00.000Z";

    await expect(
      saveCandidateQuiz(null, form({ name: "Ana", urgency: "", careerStage: "" })),
    ).rejects.toThrow(MATCHES_REDIRECT);
    expect(mocks.acceptTerms).not.toHaveBeenCalled();
  });

  it("nome vazio e resposta inválida voltam com erro, sem tocar no banco", async () => {
    const noName = await saveCandidateQuiz(null, form({ name: "  ", urgency: "", careerStage: "" }));
    const badArea = await saveCandidateQuiz(
      null,
      form({ name: "Ana", areas: ["cobol"], urgency: "", careerStage: "" }),
    );

    expect(noName).toEqual({ error: "Digite seu nome." });
    expect(badArea?.error).toBeTruthy();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("sem login vai para o login", async () => {
    mocks.user = null;

    await expect(
      saveCandidateQuiz(null, form({ name: "Ana", urgency: "", careerStage: "" })),
    ).rejects.toThrow("REDIRECT /login");
  });

  it("erro do banco não leva para os matches", async () => {
    mocks.updateError = { message: "permission denied" };

    const result = await saveCandidateQuiz(
      null,
      form({ name: "Ana", urgency: "", careerStage: "", [TERMS_FIELD]: "on" }),
    );

    expect(result).toEqual({ error: "Não deu para salvar agora. Tente de novo." });
  });
});
