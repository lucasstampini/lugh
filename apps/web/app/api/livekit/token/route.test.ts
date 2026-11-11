/**
 * Testes de POST /api/livekit/token
 *
 * O que cobre: as respostas HTTP da rota, chamando o handler direto com um Request,
 * sem subir o Next. Usa a sala de teste (sem login); as regras de acesso da sessão
 * real estão em lib/room/access.test.ts.
 *
 * Por que importa: é o contrato que o componente <Room /> consome. O front
 * mostra a mensagem de `error` ao usuário, então ela precisa vir clara.
 *
 * Rodar só este arquivo: npx vitest run app/api/livekit/token/route.test.ts
 */
import { TokenVerifier } from "livekit-server-sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const API_KEY = "test-key";
const API_SECRET = "test-secret-with-at-least-32-chars!!";

function request(body: unknown) {
  return new Request("http://localhost/api/livekit/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/livekit/token", () => {
  beforeEach(() => {
    vi.stubEnv("LIVEKIT_API_KEY", API_KEY);
    vi.stubEnv("LIVEKIT_API_SECRET", API_SECRET);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("responde 200 com um token para a sala pedida", async () => {
    const response = await POST(request({ sessionId: "teste", name: "Ana" }));

    expect(response.status).toBe(200);
    const body = await response.json();
    const claims = await new TokenVerifier(API_KEY, API_SECRET).verify(body.token);
    expect(claims.name).toBe("Ana");
    expect(claims.video?.room).toBe("session-teste");
  });

  it("responde 400 com mensagem quando o nome está vazio", async () => {
    const response = await POST(request({ sessionId: "teste", name: "" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Informe seu nome" });
  });

  it("responde 400 quando a sala não é válida", async () => {
    const response = await POST(request({ sessionId: "qualquer", name: "Ana" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Sala inválida" });
  });

  it("responde 404 para a sala de teste em produção", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const response = await POST(request({ sessionId: "teste", name: "Ana" }));

    expect(response.status).toBe(404);
  });

  it("responde 500 explicando o problema quando o LiveKit não está configurado", async () => {
    vi.stubEnv("LIVEKIT_API_SECRET", "");

    const response = await POST(request({ sessionId: "teste", name: "Ana" }));

    expect(response.status).toBe(500);
    expect((await response.json()).error).toMatch(/LIVEKIT_API_KEY/);
  });
});
