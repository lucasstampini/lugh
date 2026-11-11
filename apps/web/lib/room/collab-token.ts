import { SignJWT } from "jose";

import type { SessionRole } from "./session";

// Só servidor: usa COLLAB_JWT_SECRET, o mesmo segredo configurado no apps/collab.
// O Hocuspocus confere a assinatura e só abre o documento `session-<sessionId>` do token.

export function readCollabSecret(
  env: Record<string, string | undefined> = process.env,
): Uint8Array | null {
  const secret = env.COLLAB_JWT_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

type CollabTokenInput = {
  sessionId: string;
  userId: string;
  name: string;
  role: SessionRole | null;
};

// Vale 2h: cobre a sessão de 1h com folga. A cada reconexão o navegador pede outro.
export async function createCollabToken(
  { sessionId, userId, name, role }: CollabTokenInput,
  secret: Uint8Array,
): Promise<string> {
  return new SignJWT({ sessionId, name, role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(secret);
}
