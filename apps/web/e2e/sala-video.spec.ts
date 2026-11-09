/**
 * E2E: vídeo da sala (fase 1, bullet 1)
 *
 * O que cobre: dois participantes entram em /sala/teste por navegadores
 * separados, se veem pelo LiveKit Cloud e conseguem sair.
 *
 * Por que importa: é o fluxo real do candidato e do entrevistador. Testes
 * unitários provam que o token está certo; este prova que, com ele, duas
 * pessoas de fato se encontram na mesma sala.
 *
 * Pré-requisitos: .env.local com LIVEKIT_* e NEXT_PUBLIC_LIVEKIT_URL; Chromium
 * do Playwright instalado (npx playwright install chromium).
 * Rodar só este arquivo: npx playwright test e2e/sala-video.spec.ts
 */
import { expect, test } from "@playwright/test";

import { joinRoom } from "./helpers";

test.describe("sala de vídeo", () => {
  test("mostra o PreJoin e não deixa entrar sem nome", async ({ page }) => {
    await page.goto("/sala/teste");

    await page.getByPlaceholder("Seu nome").fill("   ");

    // O botão fica desabilitado enquanto o nome é inválido (mesmo schema da rota).
    await expect(page.getByRole("button", { name: "Entrar na sala" })).toBeDisabled();
  });

  test("responde 404 para uma sala que não existe", async ({ page }) => {
    const response = await page.goto("/sala/nao-existe");

    expect(response?.status()).toBe(404);
  });

  test("dois participantes se veem na mesma sala", async ({ browser }) => {
    const ana = await joinRoom(browser, "Ana Candidata");
    const bruno = await joinRoom(browser, "Bruno Entrevistador");

    // Cada um vê dois tiles: o próprio e o do outro, com o nome de quem é.
    for (const page of [ana, bruno]) {
      await expect(page.locator(".lk-participant-tile")).toHaveCount(2);
    }
    await expect(ana.getByText("Bruno Entrevistador")).toBeVisible();
    await expect(bruno.getByText("Ana Candidata")).toBeVisible();

    await ana.context().close();
    await bruno.context().close();
  });

  test("sair da sala volta para a tela de entrada e some para o outro", async ({ browser }) => {
    const ana = await joinRoom(browser, "Ana Candidata");
    const bruno = await joinRoom(browser, "Bruno Entrevistador");
    await expect(bruno.locator(".lk-participant-tile")).toHaveCount(2);

    await ana.locator(".lk-disconnect-button").click();

    await expect(ana.getByRole("button", { name: "Entrar na sala" })).toBeVisible();
    await expect(bruno.locator(".lk-participant-tile")).toHaveCount(1);

    await ana.context().close();
    await bruno.context().close();
  });
});
