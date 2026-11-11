/**
 * Testes de lib/room/snapshot.ts
 *
 * O que cobre: a leitura do retrato final da sala (código, linguagem e quadro) a partir
 * do estado Yjs salvo pelo Hocuspocus, no formato que o banco entrega (bytea em hex).
 *
 * Por que importa: é o que o candidato revê na tela de resultado. O quadro tem que sair
 * na ordem de desenho e sem os elementos apagados, e um documento corrompido não pode
 * derrubar a página do feedback.
 *
 * Rodar só este arquivo: npx vitest run lib/room/snapshot.test.ts
 */
import { describe, expect, it, vi } from "vitest";
import * as Y from "yjs";

// O módulo importa o cliente do Supabase (só servidor); estes testes não tocam no banco.
vi.mock("@/lib/supabase/server", () => ({ createAdminClient: vi.fn() }));

import { getBoard, getBoardAssets, getCode, getMeta } from "./collab";
import { setLanguage } from "./meta";
import { decodeSnapshot, fromBytea } from "./snapshot";

function boardItem(pos: string, el: Record<string, unknown>): Y.Map<unknown> {
  return new Y.Map(Object.entries({ pos, el }));
}

function stateOf(fill: (ydoc: Y.Doc) => void): Uint8Array {
  const ydoc = new Y.Doc();
  fill(ydoc);
  return Y.encodeStateAsUpdate(ydoc);
}

describe("fromBytea", () => {
  it("lê o hex com o prefixo \\x que o PostgREST entrega", () => {
    expect(Array.from(fromBytea("\\x00ff10"))).toEqual([0, 255, 16]);
  });

  it("faz o caminho de volta do que o collab grava", () => {
    const state = stateOf((ydoc) => getCode(ydoc).insert(0, "print('oi')"));
    const stored = `\\x${Buffer.from(state).toString("hex")}`;

    expect(decodeSnapshot(fromBytea(stored))?.code).toBe("print('oi')");
  });
});

describe("decodeSnapshot", () => {
  it("devolve o código e a linguagem escolhida", () => {
    const snapshot = decodeSnapshot(
      stateOf((ydoc) => {
        getCode(ydoc).insert(0, "def soma(a, b):\n    return a + b\n");
        setLanguage(getMeta(ydoc), "python");
      }),
    );

    expect(snapshot?.code).toBe("def soma(a, b):\n    return a + b\n");
    expect(snapshot?.language).toBe("python");
  });

  it("documento vazio vira retrato vazio, com a linguagem padrão", () => {
    expect(decodeSnapshot(stateOf(() => {}))).toEqual({
      code: "",
      language: "javascript",
      boardElements: [],
      boardFiles: {},
    });
  });

  it("devolve o quadro na ordem de desenho (pos), não na ordem de inserção", () => {
    const snapshot = decodeSnapshot(
      stateOf((ydoc) => {
        getBoard(ydoc).push([
          boardItem("a2", { id: "frente", type: "rectangle" }),
          boardItem("a0", { id: "fundo", type: "ellipse" }),
          boardItem("a1", { id: "meio", type: "arrow" }),
        ]);
      }),
    );

    expect(snapshot?.boardElements).toEqual([
      { id: "fundo", type: "ellipse" },
      { id: "meio", type: "arrow" },
      { id: "frente", type: "rectangle" },
    ]);
  });

  it("deixa de fora os elementos apagados", () => {
    const snapshot = decodeSnapshot(
      stateOf((ydoc) => {
        getBoard(ydoc).push([
          boardItem("a0", { id: "fica", isDeleted: false }),
          boardItem("a1", { id: "apagado", isDeleted: true }),
        ]);
      }),
    );

    expect(snapshot?.boardElements).toEqual([{ id: "fica", isDeleted: false }]);
  });

  it("devolve os arquivos do quadro pelo id", () => {
    const file = { id: "f1", mimeType: "image/png", dataURL: "data:image/png;base64,AAAA" };
    const snapshot = decodeSnapshot(stateOf((ydoc) => getBoardAssets(ydoc).set("f1", file)));

    expect(snapshot?.boardFiles).toEqual({ f1: file });
  });

  it("devolve null para um estado corrompido", () => {
    expect(decodeSnapshot(new Uint8Array([1, 2, 3, 4, 5]))).toBeNull();
  });
});
