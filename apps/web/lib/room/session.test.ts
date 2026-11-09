/**
 * Testes de lib/room/session.ts
 *
 * O que cobre: as regras da sala compartilhadas entre navegador e servidor:
 * quais salas existem, o que é um nome válido e como o nome da sala é montado.
 *
 * Por que importa: o mesmo schema valida o nome no PreJoin (cliente) e na rota
 * de token (servidor). Se os dois divergissem, o usuário passaria pela tela e
 * levaria erro só depois.
 *
 * Rodar só este arquivo: npx vitest run lib/room/session.test.ts
 */
import { describe, expect, it } from "vitest";

import { NAME_MAX_LENGTH, participantNameSchema, roomNameFor, tokenQuerySchema } from "./session";

describe("tokenQuerySchema", () => {
  it("aceita a sala de teste com um nome válido", () => {
    const result = tokenQuerySchema.safeParse({ room: "teste", name: "Ana" });

    expect(result.success).toBe(true);
  });

  it("recusa qualquer sala que não seja a de teste", () => {
    const result = tokenQuerySchema.safeParse({ room: "outra", name: "Ana" });

    expect(result.success).toBe(false);
  });

  it("recusa query sem nome", () => {
    const result = tokenQuerySchema.safeParse({ room: "teste" });

    expect(result.success).toBe(false);
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
