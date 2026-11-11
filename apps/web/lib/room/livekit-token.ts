import { AccessToken, RoomServiceClient } from "livekit-server-sdk";

import { roomNameFor } from "./session";

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

type LivekitTokenInput = {
  sessionId: string;
  // Id do usuário logado. O LiveKit aceita uma conexão por identity: a mesma pessoa em
  // duas abas derruba a primeira.
  identity: string;
  name: string;
};

// Gera o JWT que autoriza o navegador a entrar na sala de vídeo.
export async function createLivekitToken(
  { sessionId, identity, name }: LivekitTokenInput,
  { apiKey, apiSecret }: LivekitCredentials,
): Promise<string> {
  const token = new AccessToken(apiKey, apiSecret, { identity, name, ttl: "2h" });

  token.addGrant({
    roomJoin: true,
    room: roomNameFor(sessionId),
    canPublish: true,
    canSubscribe: true,
  });

  return token.toJwt();
}

// Fecha a sala de vídeo: o LiveKit desconecta todo mundo que ainda está nela. Usado quando
// o entrevistador encerra a sessão, para o candidato também sair. A API do LiveKit fala
// HTTP no mesmo host do WebSocket (wss:// vira https://).
export async function closeLivekitRoom(
  sessionId: string,
  env: Record<string, string | undefined> = process.env,
): Promise<void> {
  const credentials = readLivekitCredentials(env);
  const url = env.NEXT_PUBLIC_LIVEKIT_URL;
  if (!credentials || !url) throw new Error("LiveKit não configurado");

  const client = new RoomServiceClient(
    url.replace(/^ws/, "http"),
    credentials.apiKey,
    credentials.apiSecret,
  );
  await client.deleteRoom(roomNameFor(sessionId));
}
