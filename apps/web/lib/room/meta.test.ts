/**
 * Testes de lib/room/meta.ts
 *
 * O que cobre: a linguagem do editor guardada na gaveta `meta` do documento Yjs.
 *
 * Por que importa: os dois participantes precisam ver a mesma linguagem. Quem entra
 * depois não pode sobrescrever a escolha de quem já estava na sala, e um valor
 * inválido no documento não pode quebrar o editor.
 *
 * Rodar só este arquivo: npx vitest run lib/room/meta.test.ts
 */
import { describe, expect, it } from "vitest";
import * as Y from "yjs";

import { ensureDefaultLanguage, getLanguage, setLanguage } from "./meta";

function newMeta() {
  return new Y.Doc().getMap<unknown>("meta");
}

describe("ensureDefaultLanguage", () => {
  it("grava JavaScript quando a sala ainda não tem linguagem", () => {
    const meta = newMeta();

    ensureDefaultLanguage(meta);

    expect(meta.get("language")).toBe("javascript");
  });

  it("não sobrescreve a linguagem escolhida pelo outro participante", () => {
    const meta = newMeta();
    setLanguage(meta, "python");

    ensureDefaultLanguage(meta);

    expect(getLanguage(meta)).toBe("python");
  });
});

describe("getLanguage", () => {
  it("devolve JavaScript quando não há nada gravado", () => {
    expect(getLanguage(newMeta())).toBe("javascript");
  });

  it("devolve JavaScript quando o documento tem uma linguagem inválida", () => {
    const meta = newMeta();
    // Simula um cliente antigo ou adulterado gravando direto no documento.
    meta.set("language", "cobol");

    expect(getLanguage(meta)).toBe("javascript");
  });
});

describe("setLanguage", () => {
  it("grava a linguagem escolhida", () => {
    const meta = newMeta();

    setLanguage(meta, "java");

    expect(getLanguage(meta)).toBe("java");
  });
});
