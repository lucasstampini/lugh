import type { Browser, Page } from "@playwright/test";

// Abre a sala de teste num contexto de navegador isolado (como uma janela anônima)
// e entra com o nome dado, passando pelo PreJoin.
export async function joinRoom(browser: Browser, name: string): Promise<Page> {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("/sala/teste");
  await page.getByPlaceholder("Seu nome").fill(name);
  await page.getByRole("button", { name: "Entrar na sala" }).click();

  // Entrou quando a barra de controles aparece (só existe dentro do LiveKitRoom).
  await page.locator(".lk-control-bar").waitFor();
  return page;
}

// --- Quadro (Excalidraw) ---
// O Excalidraw desenha num <canvas>, não no DOM. Para saber se há desenho, contamos os
// pixels do canvas estático que são diferentes do fundo, em cada metade do quadro.

export type Half = "left" | "right";

// Acima disto, a metade do quadro tem desenho (abaixo é ruído de antialiasing).
export const INK = 50;

export function staticCanvas(page: Page) {
  return page.locator(".excalidraw canvas.static");
}

// A sala abre na aba Código; o quadro fica montado, mas escondido até abrir a aba Quadro.
export async function openBoard(page: Page) {
  await page.getByRole("tab", { name: "Quadro" }).click();
  await staticCanvas(page).waitFor();
}

// Desenha um retângulo no meio da metade escolhida do quadro (tecla "r" + arrastar).
// Na esquerda começa em 30% da largura: com a ferramenta Retângulo ativa, o Excalidraw abre o
// painel de propriedades (cores, traço) colado à esquerda, e um clique ali não desenha.
export async function drawRectangle(page: Page, half: Half) {
  const box = (await staticCanvas(page).boundingBox())!;
  const x = box.x + box.width * (half === "left" ? 0.3 : 0.65);
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
export function inkIn(page: Page, half: Half) {
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
