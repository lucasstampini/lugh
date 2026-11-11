/**
 * Testes de lib/room/livekit-token.ts
 *
 * O que cobre: a leitura das credenciais do LiveKit e o conteúdo do JWT gerado
 * (para qual sala ele vale e o que permite fazer).
 *
 * Por que importa: o token é a "chave" da sala de vídeo. Se a permissão vier
 * errada, a pessoa entra mas não consegue ligar a câmera ou ouvir o outro; se a
 * sala vier errada, os dois participantes caem em salas diferentes.
 *
 * Rodar só este arquivo: npx vitest run lib/room/livekit-token.test.ts
 */
import { TokenVerifier } from "livekit-server-sdk";
import { describe, expect, it } from "vitest";

import { createLivekitToken, readLivekitCredentials } from "./livekit-token";

// Credenciais falsas: o JWT é assinado e verificado localmente, sem falar com o LiveKit.
const credentials = { apiKey: "test-key", apiSecret: "test-secret-with-at-least-32-chars!!" };

describe("readLivekitCredentials", () => {
  it("devolve null quando falta a chave ou o segredo", () => {
    expect(readLivekitCredentials({ LIVEKIT_API_KEY: "k" })).toBeNull();
    expect(readLivekitCredentials({ LIVEKIT_API_SECRET: "s" })).toBeNull();
  });

  it("devolve as credenciais quando as duas existem", () => {
    expect(readLivekitCredentials({ LIVEKIT_API_KEY: "k", LIVEKIT_API_SECRET: "s" })).toEqual({
      apiKey: "k",
      apiSecret: "s",
    });
  });
});

describe("createLivekitToken", () => {
  const input = { sessionId: "teste", identity: "user-1", name: "Ana" };

  it("gera um JWT válido para a sala session-<id> com permissão de publicar e assistir", async () => {
    const jwt = await createLivekitToken(input, credentials);

    // Verifica a assinatura com o mesmo segredo, exatamente como o LiveKit Cloud faria.
    const claims = await new TokenVerifier(credentials.apiKey, credentials.apiSecret).verify(jwt);
    expect(claims.name).toBe("Ana");
    expect(claims.video).toMatchObject({
      roomJoin: true,
      room: "session-teste",
      canPublish: true,
      canSubscribe: true,
    });
  });

  it("usa como identity o id recebido (o usuário logado)", async () => {
    const jwt = await createLivekitToken(input, credentials);

    const claims = await new TokenVerifier(credentials.apiKey, credentials.apiSecret).verify(jwt);
    expect(claims.sub).toBe("user-1");
  });

  it("não é aceito se assinado com outro segredo", async () => {
    const jwt = await createLivekitToken(input, credentials);

    const verifier = new TokenVerifier(credentials.apiKey, "outro-segredo-com-pelo-menos-32-chars");

    await expect(verifier.verify(jwt)).rejects.toThrow();
  });
});
