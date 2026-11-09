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
 * canvas estático que são diferentes do fundo, em cada metade do quadro.
 *
 * Pré-requisitos: os do e2e/sala-editor.spec.ts (collab local sobe pelo playwright.config.ts).
 * Rodar só este arquivo: npx playwright test e2e/sala-quadro.spec.ts
 */
import { expect, type Page, test } from "@playwright/test";

import { joinRoom } from "./helpers";

type Half = "left" | "right";

function staticCanvas(page: Page) {
  return page.locator(".excalidraw canvas.static");
}

async function joinWithBoard(page: Promise<Page>) {
  const ready = await page;
  await staticCanvas(ready).waitFor();
  return ready;
}

// Desenha um retângulo no meio da metade escolhida do quadro (tecla "r" + arrastar).
async function drawRectangle(page: Page, half: Half) {
  const box = (await staticCanvas(page).boundingBox())!;
  const x = box.x + box.width * (half === "left" ? 0.2 : 0.65);
  const y = box.y + box.height * 0.35;

  await page.mouse.click(x - 20, y - 20);
  await page.keyboard.press("r");
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 80, y + 50, { steps: 5 });
  await page.mouse.up();
  // Esc solta a seleção, para as alças de seleção não contarem como desenho.
  await page.keyboard.press("Escape");
}

// Quantos pixels da metade do canvas diferem da cor do canto (o fundo).
function inkIn(page: Page, half: Half) {
  return staticCanvas(page).evaluate((canvas: HTMLCanvasElement, side: Half) => {
    const context = canvas.getContext("2d")!;
    const { width, height } = canvas;
    const startX = side === "left" ? 0 : Math.floor(width / 2);
    const data = context.getImageData(startX, 0, Math.floor(width / 2), height).data;
    const [r, g, b] = context.getImageData(1, 1, 1, 1).data;

    let ink = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (Math.abs(data[i] - r) + Math.abs(data[i + 1] - g) + Math.abs(data[i + 2] - b) > 60) ink++;
    }
    return ink;
  }, half);
}

const INK = 50;

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
