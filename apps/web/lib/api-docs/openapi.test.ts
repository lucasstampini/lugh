import { existsSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

import { buildOpenApiSpec, isApiDocsEnabled } from "./openapi";

vi.mock("next/server", () => ({ connection: async () => {} }));

const API_DIR = fileURLToPath(new URL("../../app/api", import.meta.url));

// Caminhos de todas as rotas de app/api, no formato do OpenAPI (/api/sessions/{id}/end).
function routePaths(dir: string = API_DIR): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return routePaths(full);
    if (entry.name !== "route.ts") return [];
    const segments = relative(API_DIR, dir).split(sep).filter(Boolean);
    return [["/api", ...segments].join("/").replace(/\[(\w+)\]/g, "{$1}")];
  });
}

describe("isApiDocsEnabled", () => {
  it("abre só no dev server local", () => {
    expect(isApiDocsEnabled({ NODE_ENV: "development" })).toBe(true);
  });

  it("fecha em produção, no preview da Vercel e em qualquer ambiente da Vercel", () => {
    expect(isApiDocsEnabled({ NODE_ENV: "production" })).toBe(false);
    expect(isApiDocsEnabled({ NODE_ENV: "production", VERCEL: "1", VERCEL_ENV: "preview" })).toBe(false);
    expect(isApiDocsEnabled({ NODE_ENV: "development", VERCEL: "1" })).toBe(false);
    expect(isApiDocsEnabled({ NODE_ENV: "test" })).toBe(false);
    expect(isApiDocsEnabled({})).toBe(false);
  });
});

describe("rotas /api/docs", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("respondem 404 em produção, sem vazar a página nem a especificação", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const page = await (await import("@/app/api/docs/route")).GET();
    const spec = await (await import("@/app/api/docs/openapi.json/route")).GET();

    expect(page.status).toBe(404);
    expect(await page.text()).not.toContain("swagger");
    expect(spec.status).toBe(404);
    expect(await spec.json()).toEqual({ error: "Não encontrado" });
  });

  it("servem a página e a especificação em desenvolvimento", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL", "");
    const page = await (await import("@/app/api/docs/route")).GET();
    const spec = await (await import("@/app/api/docs/openapi.json/route")).GET();

    expect(page.status).toBe(200);
    expect(page.headers.get("Content-Type")).toContain("text/html");
    expect(spec.status).toBe(200);
    expect((await spec.json()).openapi).toBe("3.1.0");
  });
});

describe("buildOpenApiSpec", () => {
  it("documenta todas as rotas de app/api, e só elas", () => {
    expect(existsSync(API_DIR)).toBe(true);
    const documented = Object.keys(buildOpenApiSpec().paths).sort();
    const existing = routePaths()
      .filter((path) => !path.startsWith("/api/docs"))
      .sort();

    expect(documented).toEqual(existing);
  });

  it("tira o corpo das rotas da sala dos schemas zod", () => {
    const spec = buildOpenApiSpec();
    const run = spec.paths["/api/code/run"].post.requestBody.content["application/json"].schema;

    expect(run.required).toEqual(expect.arrayContaining(["sessionId", "language", "code"]));
    expect(run.properties).toHaveProperty("stdin");
  });
});
