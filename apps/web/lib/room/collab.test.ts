/**
 * Testes de integração de lib/room/collab.ts
 *
 * O que cobre: dois participantes conectados a um Hocuspocus de verdade (subido
 * dentro do teste, numa porta livre) compartilhando o documento da sessão:
 * código, linguagem, quadro (elementos e imagens) e awareness (nome e cor),
 * inclusive depois de o servidor cair e voltar. No fim, o mesmo com um servidor que
 * exige o token da sessão (fase 5): entra quem tem, fica de fora quem não tem.
 *
 * Por que importa: é o coração da sala colaborativa. Os E2E (e2e/sala-editor.spec.ts e
 * e2e/sala-quadro.spec.ts) provam que Monaco e Excalidraw estão ligados ao documento; este prova que o documento de fato
 * chega ao outro lado e que nada se perde numa queda, cenário real com o Render
 * grátis dormindo ou a internet do candidato oscilando.
 *
 * Rodar só este arquivo: npx vitest run lib/room/collab.test.ts
 */
import type { Socket } from "node:net";

import { Server } from "@hocuspocus/server";
import { jwtVerify } from "jose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { yjsToExcalidraw } from "y-excalidraw";
import * as Y from "yjs";

import { createCollabToken } from "./collab-token";
import { createCollab, getBoard, getBoardAssets, getCode, getMeta, type Collab } from "./collab";
import { getLanguage, setLanguage } from "./meta";

const WAIT = { timeout: 15_000, interval: 50 };

// Sobe um Hocuspocus real numa porta livre (ou na porta dada, para "religar" o mesmo servidor).
async function startServer(port = 0) {
  const server = new Server({ port, address: "127.0.0.1", quiet: true, stopOnSignals: false });
  const sockets = new Set<Socket>();
  server.httpServer.on("connection", (socket) => sockets.add(socket));
  await server.listen();

  // Simula uma queda de verdade (processo morto, Render reiniciando): corta as conexões TCP.
  // Só o server.destroy() fecha os documentos mas deixa os sockets abertos, e o provider
  // nunca percebe que precisa reconectar.
  async function crash() {
    sockets.forEach((socket) => socket.destroy());
    await server.destroy();
  }

  return { server, crash };
}

// Um elemento do quadro no formato que o y-excalidraw grava: Y.Map { el, pos }.
function boardElement(id: string, pos: string) {
  const item = new Y.Map<unknown>();
  item.set("el", { id, type: "rectangle", version: 1 });
  item.set("pos", pos);
  return item;
}

function boardIds(collab: Collab) {
  return yjsToExcalidraw(getBoard(collab.ydoc)).map((el: { id: string }) => el.id);
}

function waitForSync(collab: Collab) {
  return vi.waitFor(() => expect(collab.provider.synced).toBe(true), WAIT);
}

describe("createCollab", () => {
  let server: Server;
  let crash: () => Promise<void>;
  let url: string;
  let collabs: Collab[];

  function join(name: string, color = "#3b82f6") {
    // Este servidor não exige autenticação: o token é ignorado.
    const collab = createCollab({
      url,
      sessionId: "teste",
      user: { name, color },
      token: async () => "sem-autenticacao",
    });
    collabs.push(collab);
    return collab;
  }

  beforeEach(async () => {
    ({ server, crash } = await startServer());
    url = `ws://127.0.0.1:${server.address.port}`;
    collabs = [];
  });

  afterEach(async () => {
    collabs.forEach((collab) => collab.destroy());
    await server.destroy();
  });

  it("entra no documento session-<id>", async () => {
    const ana = join("Ana");

    await waitForSync(ana);

    expect(ana.provider.configuration.name).toBe("session-teste");
  });

  it("o código digitado por um aparece para o outro", async () => {
    const ana = join("Ana");
    const bruno = join("Bruno");
    await Promise.all([waitForSync(ana), waitForSync(bruno)]);

    getCode(ana.ydoc).insert(0, "function soma(a, b) {}");

    await vi.waitFor(() => expect(getCode(bruno.ydoc).toString()).toBe("function soma(a, b) {}"), WAIT);
  });

  it("edições simultâneas dos dois são mantidas", async () => {
    const ana = join("Ana");
    const bruno = join("Bruno");
    await Promise.all([waitForSync(ana), waitForSync(bruno)]);

    // Os dois escrevem "ao mesmo tempo", antes de receber a edição do outro.
    getCode(ana.ydoc).insert(0, "A");
    getCode(bruno.ydoc).insert(0, "B");

    // O Yjs (CRDT) converge os dois para o mesmo texto, sem perder nenhuma letra.
    await vi.waitFor(() => {
      expect(getCode(ana.ydoc).toString()).toHaveLength(2);
      expect(getCode(bruno.ydoc).toString()).toBe(getCode(ana.ydoc).toString());
    }, WAIT);
  });

  it("a troca de linguagem chega ao outro participante", async () => {
    const ana = join("Ana");
    const bruno = join("Bruno");
    await Promise.all([waitForSync(ana), waitForSync(bruno)]);

    setLanguage(getMeta(ana.ydoc), "python");

    await vi.waitFor(() => expect(getLanguage(getMeta(bruno.ydoc))).toBe("python"), WAIT);
  });

  it("cada um vê o nome e a cor do outro pelo awareness", async () => {
    const ana = join("Ana", "#f97316");
    const bruno = join("Bruno", "#22c55e");
    await Promise.all([waitForSync(ana), waitForSync(bruno)]);

    await vi.waitFor(() => {
      const users = [...bruno.provider.awareness!.getStates().values()].map((state) => state.user);
      expect(users).toContainEqual({ name: "Ana", color: "#f97316" });
    }, WAIT);
  });

  it("quem entra depois recebe o que já foi escrito", async () => {
    const ana = join("Ana");
    await waitForSync(ana);
    getCode(ana.ydoc).insert(0, "print('oi')");

    const bruno = join("Bruno");

    await vi.waitFor(() => expect(getCode(bruno.ydoc).toString()).toBe("print('oi')"), WAIT);
  });

  it("uma edição feita com o servidor fora do ar chega quando ele volta", async () => {
    const ana = join("Ana");
    const bruno = join("Bruno");
    await Promise.all([waitForSync(ana), waitForSync(bruno)]);
    const { port } = server.address;
    let anaStatus = "connected";
    ana.provider.on("status", ({ status }: { status: string }) => (anaStatus = status));

    // Derruba o servidor e espera a Ana perceber; ela continua editando a cópia local.
    await crash();
    await vi.waitFor(() => expect(anaStatus).not.toBe("connected"), WAIT);
    getCode(ana.ydoc).insert(0, "escrito offline");

    // Sobe de novo na mesma porta: os providers reconectam sozinhos e reenviam o que faltou.
    ({ server, crash } = await startServer(port));

    await vi.waitFor(() => expect(getCode(bruno.ydoc).toString()).toBe("escrito offline"), WAIT);
  }, 30_000);

  it("um elemento desenhado no quadro aparece para o outro", async () => {
    const ana = join("Ana");
    const bruno = join("Bruno");
    await Promise.all([waitForSync(ana), waitForSync(bruno)]);

    getBoard(ana.ydoc).push([boardElement("retangulo-api", "a0")]);

    await vi.waitFor(() => expect(boardIds(bruno)).toEqual(["retangulo-api"]), WAIT);
  });

  it("os desenhos dos dois ficam na ordem das camadas, igual nos dois lados", async () => {
    const ana = join("Ana");
    const bruno = join("Bruno");
    await Promise.all([waitForSync(ana), waitForSync(bruno)]);

    // A posição (índice fracionário) define a camada, não a ordem de chegada.
    getBoard(ana.ydoc).push([boardElement("de-cima", "a2")]);
    getBoard(bruno.ydoc).push([boardElement("de-baixo", "a1")]);

    await vi.waitFor(() => {
      expect(boardIds(ana)).toEqual(["de-baixo", "de-cima"]);
      expect(boardIds(bruno)).toEqual(["de-baixo", "de-cima"]);
    }, WAIT);
  });

  it("uma imagem colada no quadro chega ao outro", async () => {
    const ana = join("Ana");
    const bruno = join("Bruno");
    await Promise.all([waitForSync(ana), waitForSync(bruno)]);

    getBoardAssets(ana.ydoc).set("arquivo-1", { id: "arquivo-1", mimeType: "image/png", dataURL: "data:image/png;base64,AA==" });

    await vi.waitFor(() => expect(getBoardAssets(bruno.ydoc).get("arquivo-1")).toMatchObject({ mimeType: "image/png" }), WAIT);
  });

  it("editor e quadro dividem o documento sem se misturar", async () => {
    const ana = join("Ana");
    const bruno = join("Bruno");
    await Promise.all([waitForSync(ana), waitForSync(bruno)]);

    getCode(ana.ydoc).insert(0, "SELECT 1");
    getBoard(ana.ydoc).push([boardElement("caixa", "a0")]);

    await vi.waitFor(() => {
      expect(getCode(bruno.ydoc).toString()).toBe("SELECT 1");
      expect(boardIds(bruno)).toEqual(["caixa"]);
    }, WAIT);
  });

  it("desfazer no quadro só desfaz as próprias ações, não o desenho do outro", async () => {
    const ana = join("Ana");
    const bruno = join("Bruno");
    await Promise.all([waitForSync(ana), waitForSync(bruno)]);
    // Mesma configuração do Whiteboard: só rastreia transações com a origem do binding local.
    const anaOrigin = { binding: "ana" };
    const anaUndo = new Y.UndoManager(getBoard(ana.ydoc), { trackedOrigins: new Set([anaOrigin]) });
    ana.ydoc.transact(() => getBoard(ana.ydoc).push([boardElement("da-ana", "a1")]), anaOrigin);
    getBoard(bruno.ydoc).push([boardElement("do-bruno", "a2")]);
    await vi.waitFor(() => expect(boardIds(ana)).toEqual(["da-ana", "do-bruno"]), WAIT);

    anaUndo.undo();

    await vi.waitFor(() => expect(boardIds(bruno)).toEqual(["do-bruno"]), WAIT);
    anaUndo.destroy();
  });
});

// Servidor que exige token, com a mesma checagem do apps/collab (onAuthenticate):
// assinatura válida e documento igual ao da sessão do token.
describe("createCollab com servidor autenticado", () => {
  const secret = new TextEncoder().encode("segredo-de-teste-com-pelo-menos-32-chars");
  const SESSION_ID = "0b8f6c1e-4a57-4d0b-9c58-2f1f4f3f7a10";
  const OTHER_SESSION_ID = "9a1b2c3d-0000-4111-8222-333344445555";

  let server: Server;
  let url: string;
  let collabs: Collab[];

  function tokenFor(sessionId: string, name: string) {
    return createCollabToken({ sessionId, userId: `id-${name}`, name, role: "candidate" }, secret);
  }

  function join(sessionId: string, token: () => Promise<string>) {
    const collab = createCollab({ url, sessionId, user: { name: "Ana", color: "#2EF58A" }, token });
    collabs.push(collab);
    return collab;
  }

  function waitForDenial(collab: Collab) {
    return new Promise<void>((resolve) => collab.provider.on("authenticationFailed", () => resolve()));
  }

  beforeEach(async () => {
    server = new Server({
      port: 0,
      address: "127.0.0.1",
      quiet: true,
      stopOnSignals: false,
      async onAuthenticate({ token, documentName }) {
        const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
        if (documentName !== `session-${payload.sessionId}`) throw new Error("Sem acesso a esta sessão");
      },
    });
    await server.listen();
    url = `ws://127.0.0.1:${server.address.port}`;
    collabs = [];
  });

  afterEach(async () => {
    collabs.forEach((collab) => collab.destroy());
    await server.destroy();
  });

  it("dois participantes com token da sessão editam o mesmo documento", async () => {
    const ana = join(SESSION_ID, () => tokenFor(SESSION_ID, "Ana"));
    const bruno = join(SESSION_ID, () => tokenFor(SESSION_ID, "Bruno"));
    await Promise.all([waitForSync(ana), waitForSync(bruno)]);

    getCode(ana.ydoc).insert(0, "privado");

    await vi.waitFor(() => expect(getCode(bruno.ydoc).toString()).toBe("privado"), WAIT);
  });

  it("recusa token de outra sessão", async () => {
    const intruso = join(SESSION_ID, () => tokenFor(OTHER_SESSION_ID, "Intruso"));

    await waitForDenial(intruso);

    expect(intruso.provider.synced).toBe(false);
  });

  it("recusa token com assinatura inválida", async () => {
    const intruso = join(SESSION_ID, async () => "token-inventado");

    await waitForDenial(intruso);

    expect(intruso.provider.synced).toBe(false);
  });

  it("avisa que o acesso foi negado quando não consegue buscar o token", async () => {
    const semToken = join(SESSION_ID, async () => {
      throw new Error("403 da rota de token");
    });

    await waitForDenial(semToken);

    expect(semToken.provider.synced).toBe(false);
  });
});
