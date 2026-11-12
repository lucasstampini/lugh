/**
 * Testes de app/sessoes/[id]/feedback/actions.ts (só o aviso por e-mail)
 *
 * O que cobre: quando o envio do feedback avisa o candidato por e-mail. Login, sessão,
 * banco, repasse e e-mail são simulados; a validação do formulário é a de verdade.
 *
 * Por que importa: o entrevistador pode clicar duas vezes ou reenviar depois de um erro.
 * O candidato tem que receber "Seu feedback chegou" uma vez, e só quando a sessão foi
 * mesmo concluída.
 *
 * Rodar só este arquivo: npx vitest run "app/sessoes/[id]/feedback/actions.test.ts"
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { submitFeedback } from "./actions";

const mocks = vi.hoisted(() => ({
  getSessionForUser: vi.fn(),
  completeSession: vi.fn(),
  endSession: vi.fn(),
  releasePayment: vi.fn(),
  notifyFeedbackReady: vi.fn(),
  insertFeedback: vi.fn(),
}));

const SESSION_ID = "0b8f6c1e-4a57-4d0b-9c58-2f1f4f3f7a10";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

// O redirect de verdade interrompe a action lançando um erro: aqui também.
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT ${path}`);
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: "interviewer-1" } } }) },
  }),
  createAdminClient: () => ({ from: () => ({ insert: mocks.insertFeedback }) }),
}));

vi.mock("@/lib/sessions", () => ({
  getSessionForUser: mocks.getSessionForUser,
  completeSession: mocks.completeSession,
  endSession: mocks.endSession,
}));

vi.mock("@/lib/payments", () => ({ releasePayment: mocks.releasePayment }));
vi.mock("@/lib/notifications", () => ({ notifyFeedbackReady: mocks.notifyFeedbackReady }));
vi.mock("@/lib/room/livekit-token", () => ({ closeLivekitRoom: vi.fn() }));

// Sessão comportamental encerrada, vista pelo entrevistador.
const session = {
  id: SESSION_ID,
  type: "behavioral",
  role: "interviewer",
  userName: "Camila Ribeiro",
  otherParticipantName: "Pedro",
  startsAt: "2026-11-10T22:00:00.000Z",
  endsAt: "2026-11-10T23:00:00.000Z",
  status: "awaiting_feedback",
};

async function validForm(): Promise<FormData> {
  const { FEEDBACK_CRITERIA, scoreFieldName } = await import("@/lib/feedback");
  const form = new FormData();
  for (const criterion of FEEDBACK_CRITERIA.behavioral) {
    form.set(scoreFieldName(criterion.key), "4");
  }
  form.set("strengths", "Respostas bem estruturadas, com exemplos concretos de cada situação.");
  form.set("improvements", "Falar mais do resultado de cada história e do que aprendeu com ela.");
  form.set("wouldHire", "yes");
  return form;
}

const RESULT_REDIRECT = `REDIRECT /sessoes/${SESSION_ID}/resultado`;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getSessionForUser.mockResolvedValue(session);
  mocks.insertFeedback.mockResolvedValue({ error: null });
  mocks.completeSession.mockResolvedValue(true);
  mocks.releasePayment.mockResolvedValue("released");
});

describe("submitFeedback e o e-mail do candidato", () => {
  it("avisa o candidato quando o envio concluiu a sessão", async () => {
    await expect(submitFeedback(SESSION_ID, null, await validForm())).rejects.toThrow(RESULT_REDIRECT);

    expect(mocks.notifyFeedbackReady).toHaveBeenCalledExactlyOnceWith(SESSION_ID);
  });

  it("não repete o aviso quando a sessão já tinha sido concluída por outro envio", async () => {
    // Segundo clique: o feedback já existe (unique violada) e a sessão já saiu de
    // awaiting_feedback, então completeSession não muda nada.
    mocks.insertFeedback.mockResolvedValue({ error: { code: "23505", message: "duplicate" } });
    mocks.completeSession.mockResolvedValue(false);

    await expect(submitFeedback(SESSION_ID, null, await validForm())).rejects.toThrow(RESULT_REDIRECT);

    expect(mocks.notifyFeedbackReady).not.toHaveBeenCalled();
  });

  it("não avisa quando o feedback não foi gravado", async () => {
    mocks.insertFeedback.mockResolvedValue({ error: { code: "08006", message: "timeout" } });

    const state = await submitFeedback(SESSION_ID, null, await validForm());

    expect(state?.error).toBeTruthy();
    expect(mocks.completeSession).not.toHaveBeenCalled();
    expect(mocks.notifyFeedbackReady).not.toHaveBeenCalled();
  });

  it("não avisa quando o formulário é inválido", async () => {
    const state = await submitFeedback(SESSION_ID, null, new FormData());

    expect(state?.fieldErrors).toBeDefined();
    expect(mocks.notifyFeedbackReady).not.toHaveBeenCalled();
  });

  it("não avisa quando quem envia é o candidato", async () => {
    mocks.getSessionForUser.mockResolvedValue({ ...session, role: "candidate" });

    const state = await submitFeedback(SESSION_ID, null, await validForm());

    expect(state?.error).toBe("Sessão não encontrada.");
    expect(mocks.notifyFeedbackReady).not.toHaveBeenCalled();
  });
});
