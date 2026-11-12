import { UUID_RE, type RoomSession, type SessionType } from "@/lib/room/session";
import { createAdminClient, createClient } from "@/lib/supabase/server";

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

// As mudanças de status abaixo são do backend, com service role (sessions não aceita
// escrita do client). Quem chama já conferiu login, participação e papel. O update é
// condicional ao status de origem: duas chamadas ao mesmo tempo não se atropelam, e a
// segunda simplesmente não encontra linha para mudar.

// scheduled → in_progress: o primeiro participante entrou na sala. Para o segundo
// (e para quem recarrega a página) não muda nada.
export async function startSession(sessionId: string): Promise<void> {
  const { error } = await createAdminClient()
    .from("sessions")
    .update({ status: "in_progress" })
    .eq("id", sessionId)
    .eq("status", "scheduled");

  if (error) throw new Error(`Falha ao iniciar a sessão: ${error.message}`);
}

// in_progress → awaiting_feedback: o entrevistador encerrou. Devolve false quando a
// sessão não estava em andamento (nada mudou).
export async function endSession(sessionId: string): Promise<boolean> {
  const { data, error } = await createAdminClient()
    .from("sessions")
    .update({ status: "awaiting_feedback" })
    .eq("id", sessionId)
    .eq("status", "in_progress")
    .select("id");

  if (error) throw new Error(`Falha ao encerrar a sessão: ${error.message}`);
  return data.length > 0;
}

// awaiting_feedback → completed: o entrevistador enviou o feedback. Quem chama grava o
// feedback antes. Repetir não muda nada: a segunda chamada não encontra linha e devolve
// false. Só quem recebe true concluiu a sessão (e avisa o candidato).
export async function completeSession(sessionId: string): Promise<boolean> {
  const { data, error } = await createAdminClient()
    .from("sessions")
    .update({ status: "completed" })
    .eq("id", sessionId)
    .eq("status", "awaiting_feedback")
    .select("id");

  if (error) throw new Error(`Falha ao concluir a sessão: ${error.message}`);
  return data.length > 0;
}
