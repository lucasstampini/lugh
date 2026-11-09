import { createLivekitToken, readLivekitCredentials } from "@/lib/room/livekit-token";
import { tokenQuerySchema } from "@/lib/room/session";

// GET /api/livekit/token?room=teste&name=Ana
// Devolve o token de vídeo da sala. O segredo do LiveKit só existe aqui no servidor.
export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = tokenQuerySchema.safeParse(params);

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Parâmetros inválidos" },
      { status: 400 },
    );
  }

  const credentials = readLivekitCredentials();
  if (!credentials) {
    return Response.json(
      { error: "Vídeo não configurado no servidor (LIVEKIT_API_KEY / LIVEKIT_API_SECRET)" },
      { status: 500 },
    );
  }

  const token = await createLivekitToken(parsed.data, credentials);
  return Response.json({ token });
}
