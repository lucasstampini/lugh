/**
 * Testes de lib/room/cursor-styles.ts
 *
 * O que cobre: o CSS gerado para mostrar o cursor de cada participante remoto no
 * editor, com a cor e o nome de quem está digitando.
 *
 * Por que importa: o nome e a cor chegam de outro navegador pelo awareness do Yjs.
 * Sem validação, um participante poderia mandar um "nome" que fecha a string CSS e
 * injeta regras na página do outro. Estes testes garantem que isso não acontece.
 *
 * Rodar só este arquivo: npx vitest run lib/room/cursor-styles.test.ts
 */
import { describe, expect, it } from "vitest";

import { cssStringEscape, remoteCursorCss, safeColor } from "./cursor-styles";

describe("remoteCursorCss", () => {
  it("gera as regras de seleção e de cursor com a cor e o nome do participante", () => {
    const css = remoteCursorCss([{ clientId: 42, name: "Ana", color: "#f97316" }]);

    expect(css).toContain(".yRemoteSelection-42 { background-color: #f9731640; }");
    expect(css).toContain(".yRemoteSelectionHead-42 {");
    expect(css).toContain("border-left: 2px solid #f97316");
    expect(css).toContain('content: "Ana"');
  });

  it("gera regras separadas para cada participante", () => {
    const css = remoteCursorCss([
      { clientId: 1, name: "Ana", color: "#f97316" },
      { clientId: 2, name: "Bruno", color: "#22c55e" },
    ]);

    expect(css).toContain(".yRemoteSelectionHead-1::after");
    expect(css).toContain(".yRemoteSelectionHead-2::after");
  });

  it("usa um rótulo genérico quando o participante não tem nome", () => {
    const css = remoteCursorCss([{ clientId: 7, name: undefined, color: "#f97316" }]);

    expect(css).toContain('content: "Participante"');
  });

  it("não deixa um nome malicioso fechar a string e injetar CSS", () => {
    const css = remoteCursorCss([{ clientId: 3, name: '"; } body { display: none } .x { content: "', color: "#f97316" }]);

    // As aspas viram escape (\22) e as chaves também, então tudo continua dentro do `content`.
    expect(css).not.toContain("body { display: none }");
    expect(css.match(/\{/g)).toHaveLength(3);
  });

  it("ignora clientId que não é número inteiro", () => {
    const css = remoteCursorCss([{ clientId: Number.NaN, name: "Ana", color: "#f97316" }]);

    expect(css).toBe("");
  });
});

describe("safeColor", () => {
  it("aceita cor hexadecimal de 6 dígitos", () => {
    expect(safeColor("#22C55E")).toBe("#22C55E");
  });

  it("troca qualquer outra coisa por uma cor neutra", () => {
    for (const color of ["red", "#fff", "url(x)", "#22c55e; color: red", 123, null]) {
      expect(safeColor(color)).toBe("#A9BDB2");
    }
  });
});

describe("cssStringEscape", () => {
  it("mantém letras com acento, números e espaços", () => {
    expect(cssStringEscape("João 2")).toBe("João 2");
  });

  it("escapa aspas e barra invertida", () => {
    expect(cssStringEscape('a"b\\c')).toBe("a\\22 b\\5c c");
  });
});
