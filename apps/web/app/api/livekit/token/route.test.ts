/**
 * Testes de GET /api/livekit/token
 *
 * O que cobre: as respostas HTTP da rota (400, 500 e 200), chamando o handler
 * direto com um Request, sem subir o Next.
 *
 * Por que importa: é o contrato que o componente <Room /> consome. O front
 * mostra a mensagem de `error` ao usuário, então ela precisa vir clara.
 *
 * Rodar só este arquivo: npx vitest run app/api/livekit/token/route.test.ts
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

function request(query: string) {
  return new Request(`http://localhost/api/livekit/token?${query}`);
}

describe("GET /api/livekit/token", () => {
  beforeEach(() => {
    vi.stubEnv("LIVEKIT_API_KEY", "test-key");
    vi.stubEnv("LIVEKIT_API_SECRET", "test-secret-with-at-least-32-chars!!");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("responde 200 com um token para a sala de teste", async () => {
    const response = await GET(request("room=teste&name=Ana"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(typeof body.token).toBe("string");
    expect(body.token.split(".")).toHaveLength(3); // formato JWT: header.payload.assinatura
  });

  it("responde 400 com mensagem quando o nome está vazio", async () => {
    const response = await GET(request("room=teste&name="));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Informe seu nome" });
  });

  it("responde 400 quando a sala não é a de teste", async () => {
    const response = await GET(request("room=qualquer&name=Ana"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Sala inválida" });
  });

  it("responde 500 explicando o problema quando o LiveKit não está configurado", async () => {
    vi.stubEnv("LIVEKIT_API_SECRET", "");

    const response = await GET(request("room=teste&name=Ana"));

    expect(response.status).toBe(500);
    expect((await response.json()).error).toMatch(/LIVEKIT_API_KEY/);
  });
});
