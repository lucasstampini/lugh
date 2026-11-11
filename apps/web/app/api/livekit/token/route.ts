import { authorizeRoomEntry } from "@/lib/room/access";
import { createLivekitToken, readLivekitCredentials } from "@/lib/room/livekit-token";

// POST /api/livekit/token  { sessionId }
// Devolve o token de vídeo da sala, só para participante da sessão e na janela de horário.
// O segredo do LiveKit só existe aqui no servidor.
export async function POST(request: Request) {
  const entry = await authorizeRoomEntry(request);
  if (!entry.ok) {
    return Response.json({ error: entry.error }, { status: entry.status });
  }

  const credentials = readLivekitCredentials();
  if (!credentials) {
    return Response.json(
      { error: "Vídeo não configurado no servidor (LIVEKIT_API_KEY / LIVEKIT_API_SECRET)" },
      { status: 500 },
    );
  }

  const token = await createLivekitToken(
    { sessionId: entry.sessionId, identity: entry.identity, name: entry.name },
    credentials,
  );
  return Response.json({ token });
}
