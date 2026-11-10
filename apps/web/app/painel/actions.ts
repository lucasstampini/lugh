"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const HOUR_RE = /^([01]\d|2[0-3]):00$/;

const addBlockSchema = z.object({
  weekday: z.coerce.number().int().min(0).max(6),
  start: z.string().regex(HOUR_RE, "Escolha uma hora cheia."),
  end: z.string().regex(HOUR_RE, "Escolha uma hora cheia."),
});

async function requireOwnerId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, userId: user.id };
}

export async function togglePaused(paused: boolean) {
  const { supabase, userId } = await requireOwnerId();

  const { error } = await supabase
    .from("interviewers")
    .update({ paused })
    .eq("profile_id", userId);

  if (error) {
    return { error: "Não deu para atualizar agora. Tente de novo." };
  }

  revalidatePath("/painel");
  return { error: null };
}

export async function addAvailabilityBlock(
  _prevState: { error: string | null } | null,
  formData: FormData,
) {
  const parsed = addBlockSchema.safeParse({
    weekday: formData.get("weekday"),
    start: formData.get("start"),
    end: formData.get("end"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { weekday, start, end } = parsed.data;

  if (end <= start) {
    return { error: "O fim precisa ser depois do início." };
  }

  const { supabase, userId } = await requireOwnerId();

  const { data: existing } = await supabase
    .from("availability")
    .select("start_time, end_time")
    .eq("interviewer_id", userId)
    .eq("weekday", weekday);

  const overlaps = (existing ?? []).some(
    (block) => start < block.end_time.slice(0, 5) && end > block.start_time.slice(0, 5),
  );
  if (overlaps) {
    return { error: "Esse horário se sobrepõe a um bloco que você já tem nesse dia." };
  }

  const { error } = await supabase.from("availability").insert({
    interviewer_id: userId,
    weekday,
    start_time: start,
    end_time: end,
  });

  if (error) {
    return { error: "Não deu para adicionar o bloco agora. Tente de novo." };
  }

  revalidatePath("/painel");
  return { error: null };
}

export async function deleteAvailabilityBlock(id: string) {
  const { supabase } = await requireOwnerId();

  const { error } = await supabase.from("availability").delete().eq("id", id);

  if (error) {
    return { error: "Não deu para apagar o bloco agora. Tente de novo." };
  }

  revalidatePath("/painel");
  return { error: null };
}
