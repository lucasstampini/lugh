/**
 * E2E: quadro colaborativo da sala (fase 1, bullets 4 e 5)
 *
 * O que cobre: dois participantes em navegadores separados usando o mesmo quadro:
 * o que um desenha aparece para o outro, quem entra depois recebe o desenho e o
 * Ctrl+Z de um não apaga o desenho do outro.
 *
 * Por que importa: o teste de integração (lib/room/collab.test.ts) prova que as gavetas
 * `board` e `board-assets` sincronizam; este prova que o Excalidraw de cada navegador
 * está de fato ligado a elas (y-excalidraw) e que o nosso desfazer está no lugar do nativo.
 *
 * Como verifica: o Excalidraw desenha num <canvas>, não no DOM. Contamos os pixels do
 * canvas estático que são diferentes do fundo, em cada metade do quadro (e2e/helpers.ts).
 *
 * Pré-requisitos: os do e2e/sala-editor.spec.ts (collab local sobe pelo playwright.config.ts).
 * Rodar só este arquivo: npx playwright test e2e/sala-quadro.spec.ts
 */
import { expect, type Page, test } from "@playwright/test";

import { drawRectangle, INK, inkIn, joinRoom, openBoard } from "./helpers";

async function joinWithBoard(page: Promise<Page>) {
  const ready = await page;
  await openBoard(ready);
  return ready;
}

test.describe("quadro colaborativo", () => {
  test("o que um desenha aparece para o outro", async ({ browser }) => {
    const ana = await joinWithBoard(joinRoom(browser, "Ana Candidata"));
    const bruno = await joinWithBoard(joinRoom(browser, "Bruno Entrevistador"));
    // O documento vive na memória do collab enquanto há alguém conectado: começa limpo?
    expect(await inkIn(bruno, "left")).toBeLessThan(INK);

    await drawRectangle(ana, "left");

    await expect.poll(() => inkIn(bruno, "left")).toBeGreaterThan(INK);

    await ana.context().close();
    await bruno.context().close();
  });

  test("quem entra depois recebe o desenho que já estava no quadro", async ({ browser }) => {
    const ana = await joinWithBoard(joinRoom(browser, "Ana Candidata"));
    await drawRectangle(ana, "left");

    const bruno = await joinWithBoard(joinRoom(browser, "Bruno Entrevistador"));

    await expect.poll(() => inkIn(bruno, "left")).toBeGreaterThan(INK);

    await ana.context().close();
    await bruno.context().close();
  });

  test("Ctrl+Z desfaz o próprio desenho e mantém o do outro", async ({ browser }) => {
    const ana = await joinWithBoard(joinRoom(browser, "Ana Candidata"));
    const bruno = await joinWithBoard(joinRoom(browser, "Bruno Entrevistador"));
    await drawRectangle(ana, "left");
    await drawRectangle(bruno, "right");
    await expect.poll(() => inkIn(ana, "right")).toBeGreaterThan(INK);

    await ana.keyboard.press("Control+z");

    // Some o retângulo da Ana (esquerda) nos dois; o do Bruno (direita) continua.
    await expect.poll(() => inkIn(bruno, "left")).toBeLessThan(INK);
    await expect.poll(() => inkIn(ana, "left")).toBeLessThan(INK);
    expect(await inkIn(ana, "right")).toBeGreaterThan(INK);

    await ana.context().close();
    await bruno.context().close();
  });
});
