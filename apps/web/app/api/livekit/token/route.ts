import { authorizeRoomEntry } from "@/lib/room/access";
import { createLivekitToken, readLivekitCredentials } from "@/lib/room/livekit-token";
import { startSession } from "@/lib/sessions";

// POST /api/livekit/token  { sessionId }
// Devolve o token de vídeo da sala, só para participante da sessão e na janela de horário,
// e marca a sessão como em andamento (scheduled → in_progress) na primeira entrada.
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

  // Pedir o token de vídeo é entrar na sala: a sessão passa a estar em andamento.
  // Só vale para sessão real (a sala de teste não tem papel nem linha no banco).
  if (entry.role) {
    try {
      await startSession(entry.sessionId);
    } catch {
      return Response.json(
        { error: "Não deu para abrir a sala. O problema é do nosso lado. Tente de novo em alguns segundos." },
        { status: 500 },
      );
    }
  }

  const token = await createLivekitToken(
    { sessionId: entry.sessionId, identity: entry.identity, name: entry.name },
    credentials,
  );
  return Response.json({ token });
}
