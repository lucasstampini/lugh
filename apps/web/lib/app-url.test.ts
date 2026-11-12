/**
 * Testes de lib/app-url.ts
 *
 * O que cobre: de onde sai a base dos links absolutos (APP_URL, domínio de produção da
 * Vercel ou localhost).
 *
 * Por que importa: link de e-mail não tem como ser relativo. Base errada manda o
 * usuário para um endereço que não abre.
 *
 * Rodar só este arquivo: npx vitest run lib/app-url.test.ts
 */
import { describe, expect, it } from "vitest";

import { appUrl } from "./app-url";

describe("appUrl", () => {
  it("usa APP_URL quando definida, com ou sem barra no fim", () => {
    expect(appUrl("/sessoes", { APP_URL: "https://lugh.example" })).toBe(
      "https://lugh.example/sessoes",
    );
    expect(appUrl("/sessoes", { APP_URL: "https://lugh.example/" })).toBe(
      "https://lugh.example/sessoes",
    );
  });

  it("prefere APP_URL ao domínio da Vercel", () => {
    expect(
      appUrl("/painel", {
        APP_URL: "https://lugh.example",
        VERCEL_PROJECT_PRODUCTION_URL: "lugh.vercel.app",
      }),
    ).toBe("https://lugh.example/painel");
  });

  it("usa o domínio de produção da Vercel, com https, quando não há APP_URL", () => {
    expect(appUrl("/sala/abc", { VERCEL_PROJECT_PRODUCTION_URL: "lugh.vercel.app" })).toBe(
      "https://lugh.vercel.app/sala/abc",
    );
  });

  it("cai no localhost em desenvolvimento", () => {
    expect(appUrl("/sessoes", {})).toBe("http://localhost:3000/sessoes");
    expect(appUrl("/sessoes", { APP_URL: "  " })).toBe("http://localhost:3000/sessoes");
  });
});
