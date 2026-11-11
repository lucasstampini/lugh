"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseReviewForm, type ReviewFieldErrors } from "@/lib/review";
import { UUID_RE } from "@/lib/room/session";
import { createClient } from "@/lib/supabase/server";

export type ReviewState = {
  error: string | null;
  fieldErrors?: ReviewFieldErrors;
} | null;

// Código do Postgres para unique violada: esta sessão já foi avaliada (segundo clique
// ou outra aba). A primeira avaliação fica valendo.
const UNIQUE_VIOLATION = "23505";

const OUR_FAULT =
  "Não deu para enviar sua avaliação agora. O problema é do nosso lado. Tente de novo em alguns segundos.";

// Server Action é um endpoint público: login, participação, status e campos são
// conferidos aqui. O insert é feito com o login do candidato, e a policy de reviews
// repete a regra no banco (só o candidato, só de sessão concluída).
export async function submitReview(
  sessionId: string,
  _prevState: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  if (!UUID_RE.test(sessionId)) {
    return { error: "Sessão não encontrada." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/sessoes/${sessionId}/resultado`)}`);
  }

  // A RLS de sessions só devolve a linha para os dois participantes.
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("id, candidate_id, interviewer_id, status")
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionError) {
    return { error: OUR_FAULT };
  }
  if (!session || session.candidate_id !== user.id) {
    return { error: "Sessão não encontrada." };
  }
  if (session.status !== "completed") {
    return { error: "Dá para avaliar depois que o feedback da sessão chegar." };
  }

  const parsed = parseReviewForm(formData);
  if (!parsed.success) {
    return { error: "Confira os campos marcados abaixo.", fieldErrors: parsed.fieldErrors };
  }

  const { error: insertError } = await supabase.from("reviews").insert({
    session_id: session.id,
    rating: parsed.data.rating,
    comment: parsed.data.comment || null,
  });

  if (insertError && insertError.code !== UNIQUE_VIOLATION) {
    return { error: OUR_FAULT };
  }

  // A média aparece no card do marketplace e no perfil do entrevistador.
  revalidatePath("/entrevistadores");
  revalidatePath(`/entrevistadores/${session.interviewer_id}`);
  revalidatePath(`/sessoes/${session.id}/resultado`);
  return { error: null };
}
