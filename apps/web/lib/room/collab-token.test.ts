/**
 * Testes de lib/room/collab-token.ts
 *
 * O que cobre: a leitura do segredo e o conteúdo do JWT que o navegador apresenta ao
 * Hocuspocus (para qual sessão vale, de quem é e por quanto tempo).
 *
 * Por que importa: o apps/collab abre o documento `session-<sessionId>` do token. Se o
 * sessionId viesse errado, o participante cairia no documento de outra sessão; se a
 * assinatura não batesse com o segredo, ninguém conseguiria editar.
 *
 * Rodar só este arquivo: npx vitest run lib/room/collab-token.test.ts
 */
import { jwtVerify } from "jose";
import { describe, expect, it } from "vitest";

import { createCollabToken, readCollabSecret } from "./collab-token";

const secret = new TextEncoder().encode("segredo-de-teste-com-pelo-menos-32-chars");

const input = {
  sessionId: "0b8f6c1e-4a57-4d0b-9c58-2f1f4f3f7a10",
  userId: "7d1c2a9e-1111-4222-8333-444455556666",
  name: "Ana Candidata",
  role: "candidate" as const,
};

describe("readCollabSecret", () => {
  it("devolve null quando COLLAB_JWT_SECRET não existe ou está vazia", () => {
    expect(readCollabSecret({})).toBeNull();
    expect(readCollabSecret({ COLLAB_JWT_SECRET: "" })).toBeNull();
  });

  it("devolve o segredo em bytes, como o jose espera", () => {
    expect(readCollabSecret({ COLLAB_JWT_SECRET: "abc" })).toEqual(new TextEncoder().encode("abc"));
  });
});

describe("createCollabToken", () => {
  it("gera um JWT HS256 com a sessão, o usuário, o nome e o papel", async () => {
    const jwt = await createCollabToken(input, secret);

    // Mesma verificação que o apps/collab faz em onAuthenticate.
    const { payload, protectedHeader } = await jwtVerify(jwt, secret, { algorithms: ["HS256"] });
    expect(protectedHeader.alg).toBe("HS256");
    expect(payload).toMatchObject({
      sub: input.userId,
      sessionId: input.sessionId,
      name: "Ana Candidata",
      role: "candidate",
    });
  });

  it("vale por 2 horas", async () => {
    const jwt = await createCollabToken(input, secret);

    const { payload } = await jwtVerify(jwt, secret);
    expect(payload.exp! - payload.iat!).toBe(2 * 60 * 60);
  });

  it("não é aceito se assinado com outro segredo", async () => {
    const jwt = await createCollabToken(input, secret);

    const other = new TextEncoder().encode("outro-segredo-com-pelo-menos-32-chars!!!");

    await expect(jwtVerify(jwt, other)).rejects.toThrow();
  });
});
