/**
 * Testes de lib/room/colors.ts
 *
 * O que cobre: a cor de cada participante: pelo papel na sessão real e, na sala de
 * teste, derivada do nome digitado no PreJoin.
 *
 * Por que importa: a cor identifica o cursor de cada pessoa no editor. Ela precisa
 * ser estável (recarregar a página não troca a cor) e sempre válida para o CSS.
 *
 * Rodar só este arquivo: npx vitest run lib/room/colors.test.ts
 */
import { describe, expect, it } from "vitest";

import { colorForRole, colorFromName, PARTICIPANT_COLORS } from "./colors";

describe("colorForRole", () => {
  it("entrevistador em Verde e candidato em branco, como no DESIGN.md", () => {
    expect(colorForRole("interviewer")).toBe("#2EF58A");
    expect(colorForRole("candidate")).toBe("#FFFFFF");
  });
});

describe("colorFromName", () => {
  it("devolve sempre a mesma cor para o mesmo nome", () => {
    expect(colorFromName("Ana Candidata")).toBe(colorFromName("Ana Candidata"));
  });

  it("ignora maiúsculas e espaços nas pontas", () => {
    expect(colorFromName("  ana candidata ")).toBe(colorFromName("Ana Candidata"));
  });

  it("sempre escolhe uma cor da paleta", () => {
    const names = ["Ana", "Bruno", "Çé", "\u{1F642}", "", "a".repeat(40)];

    for (const name of names) {
      expect(PARTICIPANT_COLORS).toContain(colorFromName(name));
    }
  });

  it("espalha nomes diferentes por mais de uma cor", () => {
    const names = ["Ana", "Bruno", "Carla", "Diego", "Elisa", "Fábio", "Gabi", "Heitor"];

    const colors = new Set(names.map(colorFromName));

    expect(colors.size).toBeGreaterThan(1);
  });
});
