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
 * A reconexão ("Reconectando...") é coberta por lib/room/connection.test.ts e testada à mão:
 * derrubar o collab no meio do E2E afetaria os outros arquivos, que usam o mesmo servidor.
 *
 * Pré-requisitos: os do e2e/sala-editor.spec.ts (collab local sobe pelo playwright.config.ts).
 * Rodar só este arquivo: npx playwright test e2e/sala-layout.spec.ts
 */
import { expect, type Page, test } from "@playwright/test";

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
