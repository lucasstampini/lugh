import { appUrl } from "@/lib/app-url";
import {
  confirmationEmail,
  feedbackReadyEmail,
  payoutEmail,
  type EmailContent,
} from "@/lib/emails";
import { sendEmail } from "@/lib/resend";
import { SESSION_TYPE_LABELS, type SessionType } from "@/lib/room/session";
import { createAdminClient } from "@/lib/supabase/server";

// Só servidor: lê e-mail e nome dos participantes com a service role (profiles não tem
// leitura pública) e envia pela Resend.
//
// E-mail é aviso, não parte da operação: nenhuma função daqui lança erro. Se o banco ou
// a Resend falharem, o pagamento, a sessão e o feedback seguem como estão. Quem chama
// garante que só chama uma vez por evento (na transição de status); a chave de
// idempotência cobre a repetição da mesma chamada.

type Participant = { name: string; email: string };

type SessionContext = {
  id: string;
  startsAt: string;
  type: SessionType;
  candidate: Participant;
  interviewer: Participant;
};

function isSessionType(value: string): value is SessionType {
  return value in SESSION_TYPE_LABELS;
}

// A sessão e os dois participantes. null quando a sessão não existe ou está incompleta.
async function loadSession(sessionId: string): Promise<SessionContext | null> {
  const admin = createAdminClient();

  const { data: session } = await admin
    .from("sessions")
    .select("id, starts_at, type, candidate_id, interviewer_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session || !isSessionType(session.type)) return null;

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, name, preferred_name, email")
    .in("id", [session.candidate_id, session.interviewer_id]);

  const candidate = profiles?.find((profile) => profile.id === session.candidate_id);
  const interviewer = profiles?.find((profile) => profile.id === session.interviewer_id);
  if (!candidate || !interviewer) return null;

  return {
    id: session.id,
    startsAt: session.starts_at,
    type: session.type,
    // A mesma regra de nomes de session_participant_names e getSessionForUser.
    candidate: {
      name: candidate.preferred_name?.trim() || candidate.name?.trim() || "Candidato",
      email: candidate.email,
    },
    interviewer: {
      name: interviewer.name?.trim() || "Entrevistador",
      email: interviewer.email,
    },
  };
}

// Um envio. A falha de um destinatário não pode impedir o do outro.
async function deliver(to: string, content: EmailContent, idempotencyKey: string): Promise<void> {
  try {
    await sendEmail({ to, ...content, idempotencyKey });
  } catch {
    // Sem chave, Resend fora do ar ou destinatário recusado: o e-mail não sai e pronto.
  }
}

// O PIX foi pago e a sessão ficou scheduled: confirmação para os dois, com o link da sala.
export async function notifySessionConfirmed(sessionId: string): Promise<void> {
  try {
    const session = await loadSession(sessionId);
    if (!session) return;

    const shared = {
      startsAt: session.startsAt,
      type: session.type,
      roomUrl: appUrl(`/sala/${session.id}`),
    };

    await Promise.all([
      deliver(
        session.candidate.email,
        confirmationEmail({
          ...shared,
          role: "candidate",
          recipientName: session.candidate.name,
          otherName: session.interviewer.name,
        }),
        `confirmacao-${session.id}-candidato`,
      ),
      deliver(
        session.interviewer.email,
        confirmationEmail({
          ...shared,
          role: "interviewer",
          recipientName: session.interviewer.name,
          otherName: session.candidate.name,
        }),
        `confirmacao-${session.id}-entrevistador`,
      ),
    ]);
  } catch {
    // Banco fora do ar: sem e-mail desta vez.
  }
}

// O entrevistador enviou o feedback e a sessão ficou completed: avisa o candidato, com
// o link do resultado.
export async function notifyFeedbackReady(sessionId: string): Promise<void> {
  try {
    const session = await loadSession(sessionId);
    if (!session) return;

    await deliver(
      session.candidate.email,
      feedbackReadyEmail({
        candidateName: session.candidate.name,
        interviewerName: session.interviewer.name,
        startsAt: session.startsAt,
        resultUrl: appUrl(`/sessoes/${session.id}/resultado`),
      }),
      `feedback-${session.id}`,
    );
  } catch {
    // Banco fora do ar: sem e-mail desta vez.
  }
}

// O repasse da sessão foi liberado (payments.status = released): avisa o entrevistador
// do valor. amountCents é a parte dele, em centavos.
export async function notifyPayoutReleased(sessionId: string, amountCents: number): Promise<void> {
  try {
    const session = await loadSession(sessionId);
    if (!session) return;

    await deliver(
      session.interviewer.email,
      payoutEmail({
        interviewerName: session.interviewer.name,
        candidateName: session.candidate.name,
        amountCents,
        startsAt: session.startsAt,
        panelUrl: appUrl("/painel"),
      }),
      `repasse-${session.id}`,
    );
  } catch {
    // Banco fora do ar: sem e-mail desta vez.
  }
}
