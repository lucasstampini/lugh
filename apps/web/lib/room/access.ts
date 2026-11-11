import { getSessionForUser } from "@/lib/sessions";
import { createClient } from "@/lib/supabase/server";

import {
  isTestRoomEnabled,
  ROOM_ENTRY_MESSAGES,
  roomEntry,
  TEST_SESSION_ID,
  tokenBodySchema,
  type SessionRole,
} from "./session";

// Só servidor. A checagem que as duas rotas de token (vídeo e colaboração) fazem antes
// de entregar uma chave da sala: quem pede é participante da sessão e está na hora.
// A página /sala/[sessionId] faz a mesma checagem, mas as rotas não confiam nela: dá
// para chamar a rota direto.

export type RoomEntryGrant = {
  ok: true;
  sessionId: string;
  // Quem é no vídeo e no documento: o id do usuário (ou um id aleatório na sala de teste).
  identity: string;
  name: string;
  // null na sala de teste, que não tem papéis.
  role: SessionRole | null;
};

export type RoomEntryDenial = { ok: false; status: number; error: string };

function deny(status: number, error: string): RoomEntryDenial {
  return { ok: false, status, error };
}

export async function authorizeRoomEntry(request: Request): Promise<RoomEntryGrant | RoomEntryDenial> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return deny(400, "Sala inválida");
  }

  const parsed = tokenBodySchema.safeParse(body);
  if (!parsed.success) {
    return deny(400, parsed.error.issues[0]?.message ?? "Sala inválida");
  }
  const { sessionId, name } = parsed.data;

  if (sessionId === TEST_SESSION_ID) {
    if (!isTestRoomEnabled()) return deny(404, "Sala não encontrada");
    if (!name) return deny(400, "Informe seu nome");
    // Sem login na sala de teste: identity aleatória, para duas abas com o mesmo nome não colidirem.
    return { ok: true, sessionId, identity: crypto.randomUUID(), name, role: null };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return deny(401, "Entre na sua conta para acessar a sala.");

  let session;
  try {
    session = await getSessionForUser(sessionId, user.id);
  } catch {
    return deny(500, "Não deu para abrir a sala. O problema é do nosso lado. Tente de novo em alguns segundos.");
  }
  if (!session) return deny(404, "Sala não encontrada");

  const entry = roomEntry(session.status, session.startsAt, session.endsAt);
  if (entry !== "open") return deny(403, ROOM_ENTRY_MESSAGES[entry]);

  return { ok: true, sessionId, identity: user.id, name: session.userName, role: session.role };
}
