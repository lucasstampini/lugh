"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canSendFeedback, parseFeedbackForm, type FeedbackFieldErrors } from "@/lib/feedback";
import { notifyFeedbackReady } from "@/lib/notifications";
import { releasePayment } from "@/lib/payments";
import { closeLivekitRoom } from "@/lib/room/livekit-token";
import { completeSession, endSession, getSessionForUser, type SessionForUser } from "@/lib/sessions";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export type FeedbackState = {
  error: string | null;
  fieldErrors?: FeedbackFieldErrors;
} | null;

// Código do Postgres para unique violada: o feedback desta sessão já foi gravado
// (segundo clique, outra aba, ou a conclusão do status falhou na primeira vez).
const UNIQUE_VIOLATION = "23505";

const OUR_FAULT =
  "Não deu para enviar o feedback agora. O problema é do nosso lado. Tente de novo em alguns segundos.";

// Server Action é um endpoint público: login, papel, status da sessão e cada campo são
// conferidos aqui, não importa o que a tela já tenha validado.
export async function submitFeedback(
  sessionId: string,
  _prevState: FeedbackState,
  formData: FormData,
): Promise<FeedbackState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/sessoes/${sessionId}/feedback`)}`);
  }

  let session: SessionForUser | null;
  try {
    session = await getSessionForUser(sessionId, user.id);
  } catch {
    return { error: OUR_FAULT };
  }

  // Sessão inexistente, de outras pessoas ou vista pelo candidato: a mesma resposta.
  if (!session || session.role !== "interviewer") {
    return { error: "Sessão não encontrada." };
  }

  const resultPath = `/sessoes/${session.id}/resultado`;

  if (session.status === "completed") {
    redirect(resultPath);
  }
  if (!canSendFeedback(session.status, session.endsAt)) {
    return { error: "Esta sessão ainda não terminou. O feedback abre quando ela for encerrada." };
  }

  const parsed = parseFeedbackForm(session.type, formData);
  if (!parsed.success) {
    return { error: "Confira os campos marcados abaixo.", fieldErrors: parsed.fieldErrors };
  }

  let completed = false;
  try {
    // O horário acabou e ninguém encerrou: encerra agora, pelo mesmo caminho do botão.
    if (session.status === "in_progress") {
      await endSession(session.id);
      try {
        await closeLivekitRoom(session.id);
      } catch {
        // Melhor esforço: a sala vazia já não existe no LiveKit, por exemplo.
      }
    }

    // feedbacks não aceita escrita do client (grant revogado): o insert é do backend.
    const { error: insertError } = await createAdminClient().from("feedbacks").insert({
      session_id: session.id,
      scores: parsed.data.scores,
      strengths: parsed.data.strengths,
      improvements: parsed.data.improvements,
      would_hire: parsed.data.wouldHire,
    });

    // Feedback já gravado: fica o primeiro, e só falta concluir a sessão.
    if (insertError && insertError.code !== UNIQUE_VIOLATION) {
      return { error: OUR_FAULT };
    }

    completed = await completeSession(session.id);
  } catch {
    return { error: OUR_FAULT };
  }

  // Só o envio que concluiu a sessão avisa o candidato: segundo clique ou outra aba não
  // repetem o e-mail. O aviso nunca lança erro.
  if (completed) {
    await notifyFeedbackReady(session.id);
  }

  // Feedback entregue: libera o repasse do entrevistador. Se falhar, o feedback já
  // está salvo e o pagamento continua como a receber no painel.
  try {
    await releasePayment(session.id);
  } catch {
    // Melhor esforço: não desfaz o feedback por causa do repasse.
  }

  revalidatePath("/sessoes");
  revalidatePath("/painel");
  revalidatePath(resultPath);
  redirect(resultPath);
}
