import { UUID_RE, type RoomSession, type SessionType } from "@/lib/room/session";
import { createClient } from "@/lib/supabase/server";

// Só servidor: lê a sessão com o login de quem faz o request.

export type SessionForUser = RoomSession & { status: string };

const SESSION_TYPES = new Set<string>(["coding", "system_design", "behavioral"]);

function isSessionType(value: string): value is SessionType {
  return SESSION_TYPES.has(value);
}

// A sessão vista por um dos participantes: o papel dele e o nome do outro. É o contrato
// entre o marketplace e a sala. Devolve null quando o id é inválido, a sessão não existe
// ou o usuário não participa dela (quem chama trata os três casos como 404, sem revelar
// qual foi). Lança erro quando o banco falha.
export async function getSessionForUser(
  sessionId: string,
  userId: string,
): Promise<SessionForUser | null> {
  if (!UUID_RE.test(sessionId)) return null;

  const supabase = await createClient();

  // A RLS de sessions já só devolve a linha para os dois participantes.
  const { data: session, error } = await supabase
    .from("sessions")
    .select("id, candidate_id, interviewer_id, starts_at, ends_at, type, status")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) throw new Error(`Falha ao ler a sessão: ${error.message}`);
  if (!session) return null;

  const role =
    session.candidate_id === userId
      ? "candidate"
      : session.interviewer_id === userId
        ? "interviewer"
        : null;
  if (!role || !isSessionType(session.type)) return null;

  // profiles não tem leitura pública: o nome do outro participante sai só por esta função.
  const { data: names, error: namesError } = await supabase.rpc("session_participant_names", {
    session_ids: [session.id],
  });

  if (namesError) throw new Error(`Falha ao ler os participantes: ${namesError.message}`);
  const participants = names?.[0];
  if (!participants) return null;

  const candidateName = participants.candidate_name?.trim() || "Candidato";
  const interviewerName = participants.interviewer_name?.trim() || "Entrevistador";

  return {
    id: session.id,
    type: session.type,
    role,
    userName: role === "candidate" ? candidateName : interviewerName,
    otherParticipantName: role === "candidate" ? interviewerName : candidateName,
    startsAt: session.starts_at,
    endsAt: session.ends_at,
    status: session.status,
  };
}
