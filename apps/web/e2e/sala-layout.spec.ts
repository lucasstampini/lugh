/**
 * E2E: layout da sala e indicador de conexão (fase 1, bullets 6 e 7)
 *
 * O que cobre: as abas Código / Quadro, o indicador de conexão e o aviso de tela pequena.
 *
 * Por que importa: os dois painéis ficam sempre montados e só são escondidos. Se uma troca
 * de aba desmontasse o editor ou o quadro, o binding com o Yjs seria destruído: o texto
 * sumiria da tela, o desfazer seria perdido e o quadro escondido deixaria de receber o que
 * o outro desenha. Estes testes pegam esse tipo de regressão.
 *
 * Queda do collab: em vez de derrubar o servidor (que os outros arquivos também usam), o teste
 * intercepta o WebSocket de uma janela só com `routeWebSocket`, corta e depois deixa reconectar.
 * As combinações de estados estão em lib/room/connection.test.ts.
 *
 * Pré-requisitos: os do e2e/sala-editor.spec.ts (collab local sobe pelo playwright.config.ts).
 * Rodar só este arquivo: npx playwright test e2e/sala-layout.spec.ts
 */
import { expect, type Page, test, type WebSocketRoute } from "@playwright/test";

import { drawRectangle, INK, inkIn, joinRoom, openBoard } from "./helpers";

function editorOf(page: Page) {
  return page.locator(".monaco-editor .view-lines");
}

test.describe("layout da sala", () => {
  test("o indicador mostra Conectado para os dois participantes", async ({ browser }) => {
    const ana = await joinRoom(browser, "Ana Candidata");
    const bruno = await joinRoom(browser, "Bruno Entrevistador");

    // Só fica "Conectado" quando o vídeo (LiveKit) e a colaboração (Hocuspocus) conectaram.
    await expect(ana.getByRole("status").filter({ hasText: "Conectado" })).toBeVisible();
    await expect(bruno.getByRole("status").filter({ hasText: "Conectado" })).toBeVisible();

    await ana.context().close();
    await bruno.context().close();
  });

  test("mostra Reconectando... quando o collab cai e Conectado quando volta", async ({ browser }) => {
    // Intercepta só o WebSocket do collab desta janela: os outros testes não são afetados.
    // Enquanto `offline` for true, cada tentativa de reconexão é recusada na hora.
    let offline = false;
    const sockets: WebSocketRoute[] = [];
    const ana = await joinRoom(browser, "Ana Candidata", (context) =>
      context.routeWebSocket(/localhost:1234/, (ws) => {
        if (offline) return ws.close();
        ws.connectToServer();
        sockets.push(ws);
      }),
    );
    const status = ana.getByRole("status").filter({ hasText: /Conectado|Reconectando/ });
    await expect(status).toHaveText("Conectado");

    offline = true;
    for (const ws of sockets) await ws.close();

    await expect(status).toHaveText("Reconectando...");

    // O provider tenta de novo sozinho (com espera crescente): basta liberar a conexão.
    offline = false;
    await expect(status).toHaveText("Conectado", { timeout: 30_000 });

    await ana.context().close();
  });

  test("trocar de aba não perde o código nem o desenho", async ({ browser }) => {
    const ana = await joinRoom(browser, "Ana Candidata");
    const bruno = await joinRoom(browser, "Bruno Entrevistador");
    const code = `const aba = ${Date.now()}`;

    // A sala abre no Código.
    await expect(ana.getByRole("tab", { name: "Código" })).toHaveAttribute("aria-selected", "true");
    await editorOf(ana).click();
    await ana.keyboard.press("Control+End");
    await ana.keyboard.type(code);

    await openBoard(ana);
    await drawRectangle(ana, "left");
    await ana.getByRole("tab", { name: "Código" }).click();

    // O texto continua no editor da Ana depois de ida e volta pelo Quadro...
    await expect(editorOf(ana)).toContainText(code);
    // ...e o Bruno, parado na aba Código, recebeu o texto.
    await expect(editorOf(bruno)).toContainText(code);
    // O quadro dele estava escondido, mas montado: o desenho já está lá ao abrir a aba.
    await openBoard(bruno);
    await expect.poll(() => inkIn(bruno, "left")).toBeGreaterThan(INK);

    // E o desenho da Ana segue no quadro dela ao voltar.
    await openBoard(ana);
    await expect.poll(() => inkIn(ana, "left")).toBeGreaterThan(INK);

    await ana.context().close();
    await bruno.context().close();
  });

  test("em tela pequena avisa que a sala funciona melhor no computador", async ({ browser }) => {
    const ana = await joinRoom(browser, "Ana Candidata");
    const notice = ana.getByText("A sala funciona melhor no computador.");
    await expect(notice).toBeHidden();

    await ana.setViewportSize({ width: 390, height: 844 });

    await expect(notice).toBeVisible();
    await expect(ana.getByRole("tab", { name: "Quadro" })).toBeVisible();

    await ana.context().close();
  });
});
