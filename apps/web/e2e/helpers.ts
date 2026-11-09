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
