/**
 * E2E: editor colaborativo da sala (fase 1, bullets 2 e 3)
 *
 * O que cobre: dois participantes em navegadores separados usando o mesmo editor:
 * o que um digita aparece para o outro, o cursor remoto aparece com o nome de quem
 * digita e a troca de linguagem vale para os dois.
 *
 * Por que importa: o teste de integração (lib/room/collab.test.ts) prova que o
 * documento Yjs sincroniza; este prova que o Monaco de cada navegador está de fato
 * ligado a esse documento (y-monaco) e que a interface reage ao que vem do outro.
 *
 * Pré-requisitos: os do e2e/sala-video.spec.ts. O playwright.config.ts sobe o
 * apps/collab em ws://localhost:1234 e força o Next a usá-lo.
 * Rodar só este arquivo: npx playwright test e2e/sala-editor.spec.ts
 */
import { expect, type Page, test } from "@playwright/test";

import { joinRoom } from "./helpers";

function editorOf(page: Page) {
  return page.locator(".monaco-editor .view-lines");
}

async function typeInEditor(page: Page, text: string) {
  await editorOf(page).click();
  // Ctrl+End: escreve no fim, sem apagar o que já estiver no documento compartilhado.
  await page.keyboard.press("Control+End");
  await page.keyboard.type(text);
}

test.describe("editor colaborativo", () => {
  test("o código digitado por um aparece para o outro", async ({ browser }) => {
    const ana = await joinRoom(browser, "Ana Candidata");
    const bruno = await joinRoom(browser, "Bruno Entrevistador");
    // Texto único por execução: o documento vive na memória do Hocuspocus enquanto há alguém conectado.
    const code = `const resposta = ${Date.now()}`;

    await typeInEditor(ana, code);

    await expect(editorOf(bruno)).toContainText(code);

    await ana.context().close();
    await bruno.context().close();
  });

  test("mostra o cursor do outro participante com o nome dele", async ({ browser }) => {
    const ana = await joinRoom(browser, "Ana Candidata");
    const bruno = await joinRoom(browser, "Bruno Entrevistador");

    await typeInEditor(ana, " ");

    // O y-monaco desenha o cursor remoto como um elemento com esta classe; o nome vem no CSS.
    await expect(bruno.locator(".monaco-editor .yRemoteSelectionHead")).toHaveCount(1);
    const css = await bruno.locator("style").allTextContents();
    expect(css.join("\n")).toContain('content: "Ana Candidata"');

    await ana.context().close();
    await bruno.context().close();
  });

  test("a troca de linguagem vale para os dois", async ({ browser }) => {
    const ana = await joinRoom(browser, "Ana Candidata");
    const bruno = await joinRoom(browser, "Bruno Entrevistador");
    await ana.locator(".monaco-editor").waitFor();

    await ana.getByRole("combobox", { name: "Linguagem" }).click();
    await ana.getByRole("option", { name: "Python", exact: true }).click();

    await expect(bruno.getByRole("combobox", { name: "Linguagem" })).toContainText("Python");
    // Não só o seletor: o realce de sintaxe do Monaco do Bruno também passa a ser Python.
    await expect(bruno.locator('[data-mode-id="python"]')).toHaveCount(1);

    // Volta para Java no Bruno e confere na Ana: a sincronização vale nos dois sentidos.
    await bruno.getByRole("combobox", { name: "Linguagem" }).click();
    await bruno.getByRole("option", { name: "Java", exact: true }).click();

    const anaLanguage = ana.getByRole("combobox", { name: "Linguagem" });
    await expect(anaLanguage).toContainText("Java");
    await expect(anaLanguage).not.toContainText("JavaScript");

    await ana.context().close();
    await bruno.context().close();
  });
});
