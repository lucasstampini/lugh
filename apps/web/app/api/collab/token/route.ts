import { authorizeRoomEntry } from "@/lib/room/access";
import { createCollabToken, readCollabSecret } from "@/lib/room/collab-token";

// POST /api/collab/token  { sessionId }
// Devolve o JWT que o Hocuspocus exige para abrir o documento da sessão (editor e quadro).
// Mesmas regras do token de vídeo: participante da sessão, na janela de horário.
export async function POST(request: Request) {
  const entry = await authorizeRoomEntry(request);
  if (!entry.ok) {
    return Response.json({ error: entry.error }, { status: entry.status });
  }

  const secret = readCollabSecret();
  if (!secret) {
    return Response.json(
      { error: "Colaboração não configurada no servidor (COLLAB_JWT_SECRET)" },
      { status: 500 },
    );
  }

  const token = await createCollabToken(
    { sessionId: entry.sessionId, userId: entry.identity, name: entry.name, role: entry.role },
    secret,
  );
  return Response.json({ token });
}
