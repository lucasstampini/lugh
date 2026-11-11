import { closeLivekitRoom } from "@/lib/room/livekit-token";
import { endSession, getSessionForUser } from "@/lib/sessions";
import { createClient } from "@/lib/supabase/server";

const OUR_FAULT = "Não deu para encerrar a sessão. O problema é do nosso lado. Tente de novo em alguns segundos.";

// POST /api/sessions/<id>/end
// O entrevistador encerra a sessão: in_progress → awaiting_feedback. Não confere a janela
// de horário de propósito, para dar para encerrar uma sessão que passou do tempo.
export async function POST(_request: Request, context: RouteContext<"/api/sessions/[id]/end">) {
  const { id } = await context.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Entre na sua conta para encerrar a sessão." }, { status: 401 });
  }

  let session;
  try {
    session = await getSessionForUser(id, user.id);
  } catch {
    return Response.json({ error: OUR_FAULT }, { status: 500 });
  }
  if (!session) {
    return Response.json({ error: "Sessão não encontrada" }, { status: 404 });
  }
  if (session.role !== "interviewer") {
    return Response.json({ error: "Só o entrevistador pode encerrar a sessão." }, { status: 403 });
  }

  // Segundo clique, ou outra aba que já encerrou: o resultado é o mesmo, sem erro.
  if (session.status !== "awaiting_feedback") {
    if (session.status !== "in_progress") {
      return Response.json(
        { error: "Só dá para encerrar uma sessão em andamento." },
        { status: 409 },
      );
    }

    try {
      await endSession(session.id);
    } catch {
      return Response.json({ error: OUR_FAULT }, { status: 500 });
    }
  }

  // Derruba quem ainda está no vídeo (o candidato). Se falhar, a sessão já está encerrada
  // do mesmo jeito: ninguém consegue token novo e a página mostra "sessão encerrada".
  try {
    await closeLivekitRoom(session.id);
  } catch {
    // Melhor esforço: a sala vazia já não existe no LiveKit, por exemplo.
  }

  return Response.json({ status: "awaiting_feedback" });
}
