/**
 * Testes de lib/room/access.ts
 *
 * O que cobre: a checagem que as rotas de token (vídeo e colaboração) fazem antes de
 * entregar uma chave da sala: body válido, login, participação na sessão, status e
 * janela de horário. Supabase e getSessionForUser são simulados.
 *
 * Por que importa: é a porta da sala. A página /sala/[sessionId] também valida, mas as
 * rotas podem ser chamadas direto; se esta checagem falhar, qualquer pessoa logada
 * entraria no vídeo e no código de uma sessão que não é dela.
 *
 * Rodar só este arquivo: npx vitest run lib/room/access.test.ts
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SessionForUser } from "@/lib/sessions";

import { authorizeRoomEntry } from "./access";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  getSessionForUser: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: mocks.getUser } }),
}));

vi.mock("@/lib/sessions", () => ({
  getSessionForUser: mocks.getSessionForUser,
}));

const SESSION_ID = "0b8f6c1e-4a57-4d0b-9c58-2f1f4f3f7a10";
const USER_ID = "7d1c2a9e-1111-4222-8333-444455556666";

function request(body: unknown) {
  return new Request("http://localhost/api/livekit/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function session(overrides: Partial<SessionForUser> = {}): SessionForUser {
  return {
    id: SESSION_ID,
    type: "coding",
    role: "candidate",
    userName: "Ana Candidata",
    otherParticipantName: "Bruno Entrevistador",
    startsAt: "2026-11-12T21:00:00.000Z",
    endsAt: "2026-11-12T22:00:00.000Z",
    status: "scheduled",
    ...overrides,
  };
}

describe("authorizeRoomEntry", () => {
  beforeEach(() => {
    // "Agora" é o meio da sessão: 21h30 UTC.
    vi.useFakeTimers({ now: new Date("2026-11-12T21:30:00.000Z"), toFake: ["Date"] });
    mocks.getUser.mockResolvedValue({ data: { user: { id: USER_ID } } });
    mocks.getSessionForUser.mockResolvedValue(session());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("recusa body que não é JSON", async () => {
    const result = await authorizeRoomEntry(request("isto não é json"));

    expect(result).toEqual({ ok: false, status: 400, error: "Sala inválida" });
  });

  it("recusa id de sessão que não é uuid", async () => {
    const result = await authorizeRoomEntry(request({ sessionId: "qualquer" }));

    expect(result).toEqual({ ok: false, status: 400, error: "Sala inválida" });
    expect(mocks.getSessionForUser).not.toHaveBeenCalled();
  });

  describe("sessão real", () => {
    it("libera o participante dentro do horário, com o id e o nome do perfil", async () => {
      const result = await authorizeRoomEntry(request({ sessionId: SESSION_ID, name: "Nome Forjado" }));

      expect(result).toEqual({
        ok: true,
        sessionId: SESSION_ID,
        identity: USER_ID,
        name: "Ana Candidata",
        role: "candidate",
      });
      expect(mocks.getSessionForUser).toHaveBeenCalledWith(SESSION_ID, USER_ID);
    });

    it("responde 401 sem login", async () => {
      mocks.getUser.mockResolvedValue({ data: { user: null } });

      const result = await authorizeRoomEntry(request({ sessionId: SESSION_ID }));

      expect(result).toMatchObject({ ok: false, status: 401 });
      expect(mocks.getSessionForUser).not.toHaveBeenCalled();
    });

    it("responde 404 para quem não participa da sessão (ou sessão que não existe)", async () => {
      mocks.getSessionForUser.mockResolvedValue(null);

      const result = await authorizeRoomEntry(request({ sessionId: SESSION_ID }));

      expect(result).toEqual({ ok: false, status: 404, error: "Sala não encontrada" });
    });

    it("responde 403 antes de a sala abrir", async () => {
      vi.setSystemTime(new Date("2026-11-12T20:00:00.000Z"));

      const result = await authorizeRoomEntry(request({ sessionId: SESSION_ID }));

      expect(result).toMatchObject({ ok: false, status: 403 });
      expect(result.ok === false && result.error).toMatch(/10 minutos antes/);
    });

    it("responde 403 depois do fim do horário", async () => {
      vi.setSystemTime(new Date("2026-11-12T22:00:00.000Z"));

      const result = await authorizeRoomEntry(request({ sessionId: SESSION_ID }));

      expect(result).toEqual({ ok: false, status: 403, error: "Esta sessão já foi encerrada." });
    });

    it.each(["awaiting_feedback", "completed", "canceled", "pending_payment"])(
      "responde 403 para sessão %s, mesmo dentro do horário",
      async (status) => {
        mocks.getSessionForUser.mockResolvedValue(session({ status }));

        const result = await authorizeRoomEntry(request({ sessionId: SESSION_ID }));

        expect(result).toMatchObject({ ok: false, status: 403 });
      },
    );

    it("responde 500 quando o banco falha", async () => {
      mocks.getSessionForUser.mockRejectedValue(new Error("banco fora do ar"));

      const result = await authorizeRoomEntry(request({ sessionId: SESSION_ID }));

      expect(result).toMatchObject({ ok: false, status: 500 });
    });
  });

  describe("sala de teste", () => {
    it("libera sem login, com o nome digitado e uma identity aleatória", async () => {
      const result = await authorizeRoomEntry(request({ sessionId: "teste", name: "Ana" }));

      expect(result).toMatchObject({ ok: true, sessionId: "teste", name: "Ana", role: null });
      expect(result.ok && result.identity).toMatch(/^[0-9a-f-]{36}$/);
      expect(mocks.getUser).not.toHaveBeenCalled();
    });

    it("exige o nome", async () => {
      const result = await authorizeRoomEntry(request({ sessionId: "teste" }));

      expect(result).toEqual({ ok: false, status: 400, error: "Informe seu nome" });
    });

    it("não existe em produção", async () => {
      vi.stubEnv("NODE_ENV", "production");

      const result = await authorizeRoomEntry(request({ sessionId: "teste", name: "Ana" }));

      expect(result).toEqual({ ok: false, status: 404, error: "Sala não encontrada" });
    });
  });
});
