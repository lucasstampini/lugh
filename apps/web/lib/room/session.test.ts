/**
 * Testes de lib/room/session.ts
 *
 * O que cobre: as regras da sala compartilhadas entre navegador e servidor:
 * quais salas existem, o que é um nome válido, como o nome da sala é montado e
 * quando dá para entrar (status da sessão + janela de horário).
 *
 * Por que importa: o mesmo schema valida o nome no PreJoin (cliente) e nas rotas
 * de token (servidor), e a mesma regra de entrada vale na página da sala e nas
 * rotas. Se divergissem, o usuário passaria pela tela e levaria erro só depois.
 *
 * Rodar só este arquivo: npx vitest run lib/room/session.test.ts
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  isTestRoomEnabled,
  NAME_MAX_LENGTH,
  participantNameSchema,
  roomAccess,
  roomEntry,
  roomNameFor,
  tokenBodySchema,
} from "./session";

const SESSION_ID = "0b8f6c1e-4a57-4d0b-9c58-2f1f4f3f7a10";

describe("tokenBodySchema", () => {
  it("aceita o id (uuid) de uma sessão, sem nome", () => {
    const result = tokenBodySchema.safeParse({ sessionId: SESSION_ID });

    expect(result.success).toBe(true);
  });

  it("aceita a sala de teste com um nome", () => {
    const result = tokenBodySchema.safeParse({ sessionId: "teste", name: " Ana " });

    expect(result.success && result.data.name).toBe("Ana");
  });

  it("recusa id que não é uuid nem a sala de teste", () => {
    const result = tokenBodySchema.safeParse({ sessionId: "outra" });

    expect(result.success).toBe(false);
  });

  it("recusa body sem sessionId", () => {
    expect(tokenBodySchema.safeParse({ name: "Ana" }).success).toBe(false);
  });
});

describe("isTestRoomEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("vale em desenvolvimento e nos testes", () => {
    vi.stubEnv("NODE_ENV", "development");

    expect(isTestRoomEnabled()).toBe(true);
  });

  it("não vale em produção", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(isTestRoomEnabled()).toBe(false);
  });
});

describe("participantNameSchema", () => {
  it("remove espaços nas pontas do nome", () => {
    expect(participantNameSchema.parse("  Ana  ")).toBe("Ana");
  });

  it("recusa nome vazio ou só com espaços", () => {
    expect(participantNameSchema.safeParse("").success).toBe(false);
    expect(participantNameSchema.safeParse("   ").success).toBe(false);
  });

  it(`aceita exatamente ${NAME_MAX_LENGTH} caracteres e recusa um a mais`, () => {
    expect(participantNameSchema.safeParse("a".repeat(NAME_MAX_LENGTH)).success).toBe(true);
    expect(participantNameSchema.safeParse("a".repeat(NAME_MAX_LENGTH + 1)).success).toBe(false);
  });
});

describe("roomNameFor", () => {
  it("segue o padrão session-<id>, o mesmo do documento Yjs", () => {
    expect(roomNameFor("teste")).toBe("session-teste");
  });
});

describe("roomAccess", () => {
  const startsAt = "2026-11-12T21:00:00.000Z";
  const endsAt = "2026-11-12T22:00:00.000Z";

  it("fica fechada até 10 minutos antes do início", () => {
    expect(roomAccess(startsAt, endsAt, new Date("2026-11-12T20:49:59.000Z"))).toBe("early");
  });

  it("abre 10 minutos antes e segue aberta até o fim da sessão", () => {
    expect(roomAccess(startsAt, endsAt, new Date("2026-11-12T20:50:00.000Z"))).toBe("open");
    expect(roomAccess(startsAt, endsAt, new Date("2026-11-12T21:59:59.000Z"))).toBe("open");
  });

  it("fecha quando a sessão termina", () => {
    expect(roomAccess(startsAt, endsAt, new Date("2026-11-12T22:00:00.000Z"))).toBe("ended");
  });
});

describe("roomEntry", () => {
  const startsAt = "2026-11-12T21:00:00.000Z";
  const endsAt = "2026-11-12T22:00:00.000Z";
  const during = new Date("2026-11-12T21:30:00.000Z");

  it.each(["scheduled", "in_progress"])("deixa entrar em sessão %s dentro do horário", (status) => {
    expect(roomEntry(status, startsAt, endsAt, during)).toBe("open");
  });

  it("segue a janela de horário para sessão confirmada", () => {
    expect(roomEntry("scheduled", startsAt, endsAt, new Date("2026-11-12T20:00:00.000Z"))).toBe("early");
    expect(roomEntry("in_progress", startsAt, endsAt, new Date("2026-11-12T22:30:00.000Z"))).toBe("ended");
  });

  it.each(["awaiting_feedback", "completed"])(
    "trata sessão %s como encerrada, mesmo dentro do horário",
    (status) => {
      expect(roomEntry(status, startsAt, endsAt, during)).toBe("ended");
    },
  );

  it.each(["pending_payment", "expired", "canceled", "no_show"])(
    "não abre a sala de sessão %s",
    (status) => {
      expect(roomEntry(status, startsAt, endsAt, during)).toBe("unavailable");
    },
  );
});
