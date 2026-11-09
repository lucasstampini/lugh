import { AccessToken } from "livekit-server-sdk";

import { roomNameFor, type TokenQuery } from "./session";

// Só servidor: usa o segredo do LiveKit. Nunca importar em componente "use client".

type LivekitCredentials = { apiKey: string; apiSecret: string };

export function readLivekitCredentials(
  env: Record<string, string | undefined> = process.env,
): LivekitCredentials | null {
  const apiKey = env.LIVEKIT_API_KEY;
  const apiSecret = env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) return null;
  return { apiKey, apiSecret };
}

// Gera o JWT que autoriza o navegador a entrar na sala de vídeo.
// A identity é aleatória porque ainda não há login: duas abas com o mesmo nome não colidem.
export async function createLivekitToken(
  { room, name }: TokenQuery,
  { apiKey, apiSecret }: LivekitCredentials,
): Promise<string> {
  const token = new AccessToken(apiKey, apiSecret, {
    identity: crypto.randomUUID(),
    name,
    ttl: "2h",
  });

  token.addGrant({
    roomJoin: true,
    room: roomNameFor(room),
    canPublish: true,
    canSubscribe: true,
  });

  return token.toJwt();
}
