/**
 * Testes de POST /api/sessions/<id>/end
 *
 * O que cobre: quem pode encerrar uma sessão e o que acontece em cada status, chamando
 * o handler direto. Supabase, a leitura da sessão e o LiveKit são simulados.
 *
 * Por que importa: encerrar muda o status para awaiting_feedback e derruba os dois do
 * vídeo, sem volta. Só o entrevistador pode fazer isso, e um segundo clique (ou a outra
 * aba) não pode virar erro nem encerrar duas vezes.
 *
 * Rodar só este arquivo: npx vitest run "app/api/sessions/[id]/end/route.test.ts"
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SessionForUser } from "@/lib/sessions";

import { POST } from "./route";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  getSessionForUser: vi.fn(),
  endSession: vi.fn(),
  closeLivekitRoom: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: mocks.getUser } }),
}));

vi.mock("@/lib/sessions", () => ({
  getSessionForUser: mocks.getSessionForUser,
  endSession: mocks.endSession,
}));

vi.mock("@/lib/room/livekit-token", () => ({
  closeLivekitRoom: mocks.closeLivekitRoom,
}));

const SESSION_ID = "0b8f6c1e-4a57-4d0b-9c58-2f1f4f3f7a10";
const USER_ID = "7d1c2a9e-1111-4222-8333-444455556666";

function session(overrides: Partial<SessionForUser> = {}): SessionForUser {
  return {
    id: SESSION_ID,
    type: "coding",
    role: "interviewer",
    userName: "Bruno Entrevistador",
    otherParticipantName: "Ana Candidata",
    startsAt: "2026-11-12T21:00:00.000Z",
    endsAt: "2026-11-12T22:00:00.000Z",
    status: "in_progress",
    ...overrides,
  };
}

function end(id = SESSION_ID) {
  return POST(new Request(`http://localhost/api/sessions/${id}/end`, { method: "POST" }), {
    params: Promise.resolve({ id }),
  });
}

describe("POST /api/sessions/[id]/end", () => {
  beforeEach(() => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: USER_ID } } });
    mocks.getSessionForUser.mockResolvedValue(session());
    mocks.endSession.mockResolvedValue(true);
    mocks.closeLivekitRoom.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("o entrevistador encerra a sessão em andamento e a sala de vídeo é fechada", async () => {
    const response = await end();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "awaiting_feedback" });
    expect(mocks.endSession).toHaveBeenCalledWith(SESSION_ID);
    expect(mocks.closeLivekitRoom).toHaveBeenCalledWith(SESSION_ID);
  });

  it("responde 401 sem login", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const response = await end();

    expect(response.status).toBe(401);
    expect(mocks.endSession).not.toHaveBeenCalled();
  });

  it("responde 404 para quem não participa da sessão", async () => {
    mocks.getSessionForUser.mockResolvedValue(null);

    const response = await end();

    expect(response.status).toBe(404);
    expect(mocks.endSession).not.toHaveBeenCalled();
  });

  it("responde 403 quando o candidato tenta encerrar", async () => {
    mocks.getSessionForUser.mockResolvedValue(session({ role: "candidate" }));

    const response = await end();

    expect(response.status).toBe(403);
    expect(mocks.endSession).not.toHaveBeenCalled();
    expect(mocks.closeLivekitRoom).not.toHaveBeenCalled();
  });

  it.each(["scheduled", "completed", "canceled"])(
    "responde 409 para sessão %s, que não está em andamento",
    async (status) => {
      mocks.getSessionForUser.mockResolvedValue(session({ status }));

      const response = await end();

      expect(response.status).toBe(409);
      expect(mocks.endSession).not.toHaveBeenCalled();
    },
  );

  it("segundo clique em sessão já encerrada responde 200 sem encerrar de novo", async () => {
    mocks.getSessionForUser.mockResolvedValue(session({ status: "awaiting_feedback" }));

    const response = await end();

    expect(response.status).toBe(200);
    expect(mocks.endSession).not.toHaveBeenCalled();
    // Ainda tenta fechar o vídeo: a primeira tentativa pode ter falhado.
    expect(mocks.closeLivekitRoom).toHaveBeenCalledWith(SESSION_ID);
  });

  it("encerra mesmo depois do horário marcado", async () => {
    mocks.getSessionForUser.mockResolvedValue(
      session({ startsAt: "2020-01-01T10:00:00.000Z", endsAt: "2020-01-01T11:00:00.000Z" }),
    );

    const response = await end();

    expect(response.status).toBe(200);
    expect(mocks.endSession).toHaveBeenCalled();
  });

  it("responde 200 mesmo se o LiveKit falhar ao fechar a sala", async () => {
    mocks.closeLivekitRoom.mockRejectedValue(new Error("sala não existe"));

    const response = await end();

    expect(response.status).toBe(200);
  });

  it("responde 500 quando o banco falha, sem fechar o vídeo", async () => {
    mocks.endSession.mockRejectedValue(new Error("banco fora do ar"));

    const response = await end();

    expect(response.status).toBe(500);
    expect(mocks.closeLivekitRoom).not.toHaveBeenCalled();
  });
});
