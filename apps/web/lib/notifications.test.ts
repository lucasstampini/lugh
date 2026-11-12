/**
 * Testes de lib/notifications.ts
 *
 * O que cobre: quem recebe cada e-mail, com qual chave de idempotência e qual link, e o
 * que acontece quando o banco ou a Resend falham. O banco e a Resend são simulados; os
 * textos são os de verdade (lib/emails.ts).
 *
 * Por que importa: estas funções rodam dentro da confirmação do pagamento e do envio do
 * feedback. Se uma delas lançar erro, um e-mail que não saiu derruba o webhook ou o
 * feedback. E e-mail para o destinatário errado expõe a sessão de outra pessoa.
 *
 * Rodar só este arquivo: npx vitest run lib/notifications.test.ts
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { notifyFeedbackReady, notifyPayoutReleased, notifySessionConfirmed } from "./notifications";

type Result = { data?: unknown; error?: { message: string } | null };

const mocks = vi.hoisted(() => ({
  sendEmail: vi.fn(),
  respond: vi.fn(),
}));

// Imitação mínima do query builder do Supabase: devolve o que o teste programou para a
// tabela.
function builder(table: string) {
  const settle = async (): Promise<Result> => ({
    data: null,
    error: null,
    ...((await mocks.respond(table)) as Result | undefined),
  });
  const chain = {
    select: () => chain,
    eq: () => chain,
    in: () => chain,
    maybeSingle: settle,
    then: (resolve: (value: Result) => unknown, reject: (reason: unknown) => unknown) =>
      settle().then(resolve, reject),
  };
  return chain;
}

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: () => ({ from: builder }),
}));

vi.mock("@/lib/resend", () => ({
  sendEmail: mocks.sendEmail,
}));

const SESSION_ID = "0b8f6c1e-4a57-4d0b-9c58-2f1f4f3f7a10";
const CANDIDATE_ID = "11111111-1111-4111-8111-111111111111";
const INTERVIEWER_ID = "22222222-2222-4222-8222-222222222222";

const session = {
  id: SESSION_ID,
  // 19h em Brasília, quarta, 18 de novembro.
  starts_at: "2026-11-18T22:00:00.000Z",
  type: "coding",
  candidate_id: CANDIDATE_ID,
  interviewer_id: INTERVIEWER_ID,
};
const candidate = {
  id: CANDIDATE_ID,
  name: "Pedro Henrique Almeida",
  preferred_name: "Pedro",
  email: "pedro@exemplo.com",
};
const interviewer = {
  id: INTERVIEWER_ID,
  name: "Camila Ribeiro",
  preferred_name: null,
  email: "camila@exemplo.com",
};

function database(tables: Record<string, Result>) {
  mocks.respond.mockImplementation((table: string) => tables[table]);
}

type Sent = {
  to: string;
  subject: string;
  text: string;
  html: string;
  idempotencyKey: string;
  scheduledAt?: Date;
};

function allSent(): Sent[] {
  return (mocks.sendEmail.mock.calls as [Sent][]).map(([input]) => input);
}

// O e-mail imediato para um destinatário (o lembrete agendado fica de fora).
function sentTo(email: string): Sent | undefined {
  return allSent().find((input) => input.to === email && !input.scheduledAt);
}

function reminderTo(email: string): Sent | undefined {
  return allSent().find((input) => input.to === email && input.scheduledAt);
}

// A sessão é às 22:00 UTC do dia 18. Dois dias antes, e em cima da hora.
const DAYS_BEFORE = new Date("2026-11-16T15:00:00.000Z");
const MINUTES_BEFORE = new Date("2026-11-18T20:58:00.000Z");

beforeEach(() => {
  vi.clearAllMocks();
  mocks.sendEmail.mockResolvedValue({ id: "email-1" });
  database({ sessions: { data: session }, profiles: { data: [candidate, interviewer] } });
});

describe("notifySessionConfirmed", () => {
  it("envia a confirmação para os dois, cada um com o seu texto e a sua chave", async () => {
    await notifySessionConfirmed(SESSION_ID, MINUTES_BEFORE);

    expect(mocks.sendEmail).toHaveBeenCalledTimes(2);

    const toCandidate = sentTo("pedro@exemplo.com");
    expect(toCandidate).toMatchObject({
      subject: "Sessão confirmada: qua, 18 nov às 19h",
      idempotencyKey: `confirmacao-${SESSION_ID}-candidato`,
    });
    // O candidato é chamado pelo nome preferido.
    expect(toCandidate?.text).toContain("Olá, Pedro. Recebemos o seu pagamento");
    expect(toCandidate?.text).toContain("entrevistador: Camila Ribeiro");

    const toInterviewer = sentTo("camila@exemplo.com");
    expect(toInterviewer).toMatchObject({
      idempotencyKey: `confirmacao-${SESSION_ID}-entrevistador`,
    });
    expect(toInterviewer?.text).toContain("Pedro agendou e pagou uma sessão com você");
  });

  it("põe o link da sala da sessão", async () => {
    await notifySessionConfirmed(SESSION_ID);

    expect(sentTo("pedro@exemplo.com")?.text).toContain(
      `Entrar na sala: http://localhost:3000/sala/${SESSION_ID}`,
    );
  });

  it("envia para o entrevistador mesmo quando o envio do candidato falha", async () => {
    mocks.sendEmail.mockImplementation(async (input: Sent) => {
      if (input.to === "pedro@exemplo.com") throw new Error("recusado");
      return { id: "email-2" };
    });

    await expect(notifySessionConfirmed(SESSION_ID)).resolves.toBeUndefined();

    expect(sentTo("camila@exemplo.com")).toBeDefined();
  });

  it("não envia nada quando a sessão não existe", async () => {
    database({ sessions: { data: null } });

    await expect(notifySessionConfirmed(SESSION_ID)).resolves.toBeUndefined();

    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("não envia nada quando falta o perfil de um dos participantes", async () => {
    database({ sessions: { data: session }, profiles: { data: [candidate] } });

    await notifySessionConfirmed(SESSION_ID);

    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("não lança erro quando o banco falha", async () => {
    mocks.respond.mockRejectedValue(new Error("banco fora do ar"));

    await expect(notifySessionConfirmed(SESSION_ID)).resolves.toBeUndefined();

    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("usa um nome genérico quando o perfil está sem nome", async () => {
    database({
      sessions: { data: session },
      profiles: { data: [{ ...candidate, name: " ", preferred_name: null }, interviewer] },
    });

    await notifySessionConfirmed(SESSION_ID);

    expect(sentTo("pedro@exemplo.com")?.text).toContain("Olá, Candidato.");
  });
});

describe("lembrete de 1 hora antes", () => {
  it("agenda o lembrete dos dois para 1 hora antes do início", async () => {
    await notifySessionConfirmed(SESSION_ID, DAYS_BEFORE);

    expect(mocks.sendEmail).toHaveBeenCalledTimes(4);

    const toCandidate = reminderTo("pedro@exemplo.com");
    expect(toCandidate).toMatchObject({
      subject: "Sua sessão começa às 19h",
      idempotencyKey: `lembrete-${SESSION_ID}-candidato`,
      scheduledAt: new Date("2026-11-18T21:00:00.000Z"),
    });
    expect(toCandidate?.text).toContain(`Entrar na sala: http://localhost:3000/sala/${SESSION_ID}`);

    expect(reminderTo("camila@exemplo.com")).toMatchObject({
      idempotencyKey: `lembrete-${SESSION_ID}-entrevistador`,
      scheduledAt: new Date("2026-11-18T21:00:00.000Z"),
    });
  });

  it("não agenda lembrete para sessão marcada a menos de 1h05 do início", async () => {
    await notifySessionConfirmed(SESSION_ID, MINUTES_BEFORE);

    expect(reminderTo("pedro@exemplo.com")).toBeUndefined();
    expect(reminderTo("camila@exemplo.com")).toBeUndefined();
    // A confirmação sai do mesmo jeito.
    expect(sentTo("pedro@exemplo.com")).toBeDefined();
  });

  it("envia a confirmação mesmo quando o agendamento do lembrete falha", async () => {
    mocks.sendEmail.mockImplementation(async (input: Sent) => {
      if (input.scheduledAt) throw new Error("agendamento recusado");
      return { id: "email-1" };
    });

    await expect(notifySessionConfirmed(SESSION_ID, DAYS_BEFORE)).resolves.toBeUndefined();

    expect(sentTo("pedro@exemplo.com")).toBeDefined();
    expect(sentTo("camila@exemplo.com")).toBeDefined();
  });
});

describe("notifyFeedbackReady", () => {
  it("avisa só o candidato, com o link do resultado", async () => {
    await notifyFeedbackReady(SESSION_ID);

    expect(mocks.sendEmail).toHaveBeenCalledTimes(1);
    const sent = sentTo("pedro@exemplo.com");
    expect(sent).toMatchObject({
      subject: "Seu feedback chegou",
      idempotencyKey: `feedback-${SESSION_ID}`,
    });
    expect(sent?.text).toContain("Camila Ribeiro enviou o feedback");
    expect(sent?.text).toContain(
      `Ver o resultado: http://localhost:3000/sessoes/${SESSION_ID}/resultado`,
    );
  });

  it("não lança erro quando a Resend recusa", async () => {
    mocks.sendEmail.mockRejectedValue(new Error("recusado"));

    await expect(notifyFeedbackReady(SESSION_ID)).resolves.toBeUndefined();
  });
});

describe("notifyPayoutReleased", () => {
  it("avisa só o entrevistador, com o valor e o link do painel", async () => {
    await notifyPayoutReleased(SESSION_ID, 8000);

    expect(mocks.sendEmail).toHaveBeenCalledTimes(1);
    const sent = sentTo("camila@exemplo.com");
    expect(sent).toMatchObject({ idempotencyKey: `repasse-${SESSION_ID}` });
    expect(sent?.subject.replaceAll(" ", " ")).toBe("Você recebeu R$ 80");
    expect(sent?.text).toContain("com Pedro foi liberado");
    expect(sent?.text).toContain("Ver meus ganhos: http://localhost:3000/painel");
  });

  it("não lança erro quando o banco falha", async () => {
    mocks.respond.mockRejectedValue(new Error("banco fora do ar"));

    await expect(notifyPayoutReleased(SESSION_ID, 8000)).resolves.toBeUndefined();

    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });
});
