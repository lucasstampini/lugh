/**
 * Testes de POST /api/payments/create e GET /api/payments/status
 *
 * O que cobre: quem pode pedir e acompanhar o PIX de uma sessão, chamando os handlers
 * direto. Supabase, a leitura da sessão e lib/payments são simulados.
 *
 * Por que importa: as duas rotas são públicas. Só o candidato da sessão pode gerar a
 * cobrança e ver o status dela; qualquer outra pessoa recebe a mesma resposta de sessão
 * inexistente.
 *
 * Rodar só este arquivo: npx vitest run app/api/payments/routes.test.ts
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SessionForUser } from "@/lib/sessions";

import { POST } from "./create/route";
import { GET } from "./status/route";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  getSessionForUser: vi.fn(),
  ensurePayment: vi.fn(),
  refreshPaymentStatus: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: mocks.getUser } }),
}));

vi.mock("@/lib/sessions", () => ({ getSessionForUser: mocks.getSessionForUser }));

vi.mock("@/lib/payments", () => ({
  ensurePayment: mocks.ensurePayment,
  refreshPaymentStatus: mocks.refreshPaymentStatus,
}));

const SESSION_ID = "0b8f6c1e-4a57-4d0b-9c58-2f1f4f3f7a10";
const USER_ID = "7d1c2a9e-1111-4222-8333-444455556666";

const payment = {
  brCode: "000201...",
  brCodeBase64: "data:image/png;base64,AAAA",
  expiresAt: "2026-11-12T12:30:00.000Z",
  amountCents: 10000,
};

function session(overrides: Partial<SessionForUser> = {}): SessionForUser {
  return {
    id: SESSION_ID,
    type: "coding",
    role: "candidate",
    userName: "Ana Candidata",
    otherParticipantName: "Bruno Entrevistador",
    startsAt: "2026-11-12T21:00:00.000Z",
    endsAt: "2026-11-12T22:00:00.000Z",
    status: "pending_payment",
    ...overrides,
  };
}

function create(body: unknown = { sessionId: SESSION_ID }) {
  return POST(
    new Request("http://localhost/api/payments/create", {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

function status(sessionId: string | null = SESSION_ID) {
  const query = sessionId === null ? "" : `?sessionId=${sessionId}`;
  return GET(new Request(`http://localhost/api/payments/status${query}`));
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: USER_ID } } });
  mocks.getSessionForUser.mockResolvedValue(session());
  mocks.ensurePayment.mockResolvedValue({ kind: "pending", payment });
  mocks.refreshPaymentStatus.mockResolvedValue({ status: "pending_payment", paid: false });
});

describe("POST /api/payments/create", () => {
  it("devolve o PIX da sessão para o candidato", async () => {
    const response = await create();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "pending_payment", payment });
    expect(mocks.ensurePayment).toHaveBeenCalledWith(SESSION_ID);
  });

  it.each([
    [{ kind: "settled", status: "scheduled" }, { status: "scheduled" }],
    [{ kind: "expired" }, { status: "expired" }],
  ])("devolve só o status quando não há o que cobrar: %j", async (result, expected) => {
    mocks.ensurePayment.mockResolvedValue(result);

    const response = await create();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(expected);
  });

  it.each(["{", { sessionId: "abc" }, {}])("recusa corpo inválido: %j", async (body) => {
    const response = await create(body);

    expect(response.status).toBe(400);
    expect(mocks.ensurePayment).not.toHaveBeenCalled();
  });

  it("exige login", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    expect((await create()).status).toBe(401);
    expect(mocks.ensurePayment).not.toHaveBeenCalled();
  });

  it("responde 404 para sessão inexistente ou de outras pessoas", async () => {
    mocks.getSessionForUser.mockResolvedValue(null);

    expect((await create()).status).toBe(404);
    expect(mocks.ensurePayment).not.toHaveBeenCalled();
  });

  it("não deixa o entrevistador gerar a cobrança", async () => {
    mocks.getSessionForUser.mockResolvedValue(session({ role: "interviewer" }));

    expect((await create()).status).toBe(403);
    expect(mocks.ensurePayment).not.toHaveBeenCalled();
  });

  it("responde 500 sem vazar o erro quando a AbacatePay ou o banco falham", async () => {
    mocks.ensurePayment.mockRejectedValue(new Error("Token de autenticação inválido"));

    const response = await create();

    expect(response.status).toBe(500);
    expect((await response.json()).error).not.toContain("Token");
  });
});

describe("GET /api/payments/status", () => {
  it("devolve o status conferido para o candidato", async () => {
    mocks.refreshPaymentStatus.mockResolvedValue({ status: "scheduled", paid: true });

    const response = await status();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "scheduled", paid: true });
  });

  it.each([null, "abc"])("recusa sessionId inválido: %j", async (sessionId) => {
    expect((await status(sessionId)).status).toBe(400);
  });

  it("exige login", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    expect((await status()).status).toBe(401);
  });

  it("responde 404 para o entrevistador e para quem não participa", async () => {
    mocks.getSessionForUser.mockResolvedValue(session({ role: "interviewer" }));
    expect((await status()).status).toBe(404);

    mocks.getSessionForUser.mockResolvedValue(null);
    expect((await status()).status).toBe(404);

    expect(mocks.refreshPaymentStatus).not.toHaveBeenCalled();
  });

  it("responde 500 quando a consulta falha", async () => {
    mocks.refreshPaymentStatus.mockRejectedValue(new Error("timeout"));

    expect((await status()).status).toBe(500);
  });
});
