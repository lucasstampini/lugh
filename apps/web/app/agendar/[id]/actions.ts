"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { roomNameFor } from "@/lib/room/session";
import { bookingSchema, findSlotWeek, getFreeSlots, sessionEnd } from "@/lib/slots";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export type BookingState = { error: string | null } | null;

// Código do Postgres para exclusion constraint violada: outra sessão ocupou o
// horário (do entrevistador ou do próprio candidato) entre a checagem e o insert.
const EXCLUSION_VIOLATION = "23P01";

const SLOT_TAKEN = "Esse horário acabou de ser reservado. Escolha outro.";
const OUR_FAULT = "Não deu para agendar agora. O problema é do nosso lado. Tente de novo em alguns segundos.";

// Server Action é um endpoint público: nada do que chega do navegador é
// confiável, então entrevistador, horário e tipo são todos conferidos aqui.
export async function createSession(
  interviewerId: string,
  _prevState: BookingState,
  formData: FormData,
): Promise<BookingState> {
  const parsed = bookingSchema.safeParse({
    interviewerId,
    startsAt: formData.get("slot") ?? "",
    type: formData.get("type") ?? "",
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { startsAt, type, notes } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/agendar/${interviewerId}`)}`);
  }

  if (user.id === interviewerId) {
    return { error: "Você não pode agendar uma sessão com você mesmo." };
  }

  const { data: interviewer, error: interviewerError } = await supabase
    .from("interviewers")
    .select("profile_id")
    .eq("profile_id", interviewerId)
    .eq("active", true)
    .eq("paused", false)
    .maybeSingle();

  if (interviewerError) {
    return { error: OUR_FAULT };
  }
  if (!interviewer) {
    return { error: "Este entrevistador não está mais recebendo agendamentos." };
  }

  const freeSlots = await getFreeSlots(supabase, interviewerId);
  if (freeSlots.error) {
    return { error: OUR_FAULT };
  }
  if (findSlotWeek(freeSlots.weeks, startsAt) === null) {
    return { error: "Esse horário não está mais disponível. Escolha outro." };
  }

  // sessions não aceita escrita do client (grant revogado): o insert é do
  // backend, com service role, depois de todas as checagens acima.
  const sessionId = crypto.randomUUID();
  const roomName = roomNameFor(sessionId);

  const { error: insertError } = await createAdminClient()
    .from("sessions")
    .insert({
      id: sessionId,
      candidate_id: user.id,
      interviewer_id: interviewerId,
      starts_at: new Date(startsAt).toISOString(),
      ends_at: sessionEnd(startsAt),
      type,
      // Nasce confirmada até existir pagamento (fase 7 do PROJETO.md); depois
      // disso passa a nascer pending_payment.
      status: "scheduled",
      candidate_notes: notes || null,
      livekit_room: roomName,
      collab_doc_name: roomName,
    });

  if (insertError) {
    return { error: insertError.code === EXCLUSION_VIOLATION ? SLOT_TAKEN : OUR_FAULT };
  }

  revalidatePath("/sessoes");
  revalidatePath(`/agendar/${interviewerId}`);
  revalidatePath(`/entrevistadores/${interviewerId}`);
  redirect(`/sessoes?agendada=${sessionId}`);
}
