/**
 * Testes de POST /api/collab/token
 *
 * O que cobre: as respostas HTTP da rota, chamando o handler direto com um Request,
 * sem subir o Next. Usa a sala de teste (sem login); as regras de acesso da sessão
 * real estão em lib/room/access.test.ts.
 *
 * Por que importa: sem este token o Hocuspocus recusa a conexão e o editor e o quadro
 * não sincronizam. O token precisa valer exatamente para o documento da sala pedida.
 *
 * Rodar só este arquivo: npx vitest run app/api/collab/token/route.test.ts
 */
import { jwtVerify } from "jose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const SECRET = "segredo-de-teste-com-pelo-menos-32-chars";

function request(body: unknown) {
  return new Request("http://localhost/api/collab/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/collab/token", () => {
  beforeEach(() => {
    vi.stubEnv("COLLAB_JWT_SECRET", SECRET);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("responde 200 com um token assinado para a sala pedida", async () => {
    const response = await POST(request({ sessionId: "teste", name: "Ana" }));

    expect(response.status).toBe(200);
    const body = await response.json();
    const { payload } = await jwtVerify(body.token, new TextEncoder().encode(SECRET));
    expect(payload).toMatchObject({ sessionId: "teste", name: "Ana", role: null });
  });

  it("repassa a recusa da checagem de acesso", async () => {
    const response = await POST(request({ sessionId: "qualquer" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Sala inválida" });
  });

  it("responde 404 para a sala de teste em produção", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const response = await POST(request({ sessionId: "teste", name: "Ana" }));

    expect(response.status).toBe(404);
  });

  it("responde 500 explicando o problema quando o segredo não está configurado", async () => {
    vi.stubEnv("COLLAB_JWT_SECRET", "");

    const response = await POST(request({ sessionId: "teste", name: "Ana" }));

    expect(response.status).toBe(500);
    expect((await response.json()).error).toMatch(/COLLAB_JWT_SECRET/);
  });
});
