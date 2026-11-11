"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AbacatePayError, createSubAccount } from "@/lib/abacatepay";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { taxIdSchema } from "@/lib/tax-id";

const START_HOUR_RE = /^([01]\d|2[0-3]):00$/;
// O fim aceita 24:00 (meia-noite), senão o bloco 23:00 às 00:00 seria impossível.
const END_HOUR_RE = /^(0[1-9]|1\d|2[0-4]):00$/;

const addBlockSchema = z.object({
  weekday: z.coerce.number().int().min(0).max(6),
  start: z.string().regex(START_HOUR_RE, "Escolha uma hora cheia."),
  end: z.string().regex(END_HOUR_RE, "Escolha uma hora cheia."),
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

// Server Action é um endpoint público: o tipo do TypeScript não garante o que
// chega do navegador, então os argumentos também passam pelo zod.
export async function togglePaused(paused: boolean) {
  if (!z.boolean().safeParse(paused).success) {
    return { error: "Não deu para atualizar agora. Tente de novo." };
  }

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
  if (!z.uuid().safeParse(id).success) {
    return { error: "Não deu para apagar o bloco agora. Tente de novo." };
  }

  // A policy de delete (RLS) garante que só o dono apaga o próprio bloco.
  const { supabase } = await requireOwnerId();

  const { error } = await supabase.from("availability").delete().eq("id", id);

  if (error) {
    return { error: "Não deu para apagar o bloco agora. Tente de novo." };
  }

  revalidatePath("/painel");
  return { error: null };
}

export type PayoutAccountState = { error: string | null; fieldError?: string } | null;

const PAYOUT_OUR_FAULT =
  "Não deu para cadastrar agora. O problema é do nosso lado. Tente de novo em alguns segundos.";

// Mensagens da AbacatePay que são culpa do documento digitado, e o que dizer em cada uma.
// Qualquer outra (subcontas não liberadas na loja, chave recusada, rede) é problema nosso.
const TAX_ID_ERRORS: [pattern: string, message: string][] = [
  ["CPF ou CNPJ inválido", "CPF ou CNPJ inválido. Confira os números."],
  ["da própria loja", "Esse documento é o da conta do Lugh. Use o seu CPF ou CNPJ."],
];

// Cria a subconta da AbacatePay que recebe a parte do entrevistador em cada PIX. O
// documento vai direto para a AbacatePay e não é gravado no banco: aqui fica só o id.
export async function registerPayoutAccount(
  _prevState: PayoutAccountState,
  formData: FormData,
): Promise<PayoutAccountState> {
  const parsed = taxIdSchema.safeParse(formData.get("taxId"));
  if (!parsed.success) {
    return { error: null, fieldError: parsed.error.issues[0].message };
  }

  const { supabase, userId } = await requireOwnerId();

  const [{ data: interviewer, error: interviewerError }, { data: profile }] = await Promise.all([
    supabase
      .from("interviewers")
      .select("abacate_subaccount_id")
      .eq("profile_id", userId)
      .maybeSingle(),
    supabase.from("profiles").select("name").eq("id", userId).maybeSingle(),
  ]);

  if (interviewerError) {
    return { error: PAYOUT_OUR_FAULT };
  }
  if (!interviewer) {
    redirect("/onboarding/entrevistador");
  }

  // Segundo clique ou outra aba: a subconta já existe, não há o que criar.
  if (interviewer.abacate_subaccount_id) {
    revalidatePath("/painel");
    return { error: null };
  }

  const name = profile?.name?.trim();
  if (!name) {
    return { error: "Seu perfil está sem nome. Preencha o nome no perfil e tente de novo." };
  }

  let subAccountId: string;
  try {
    // O limite da AbacatePay para o nome do titular é de 100 caracteres.
    ({ id: subAccountId } = await createSubAccount({
      name: name.slice(0, 100),
      taxId: parsed.data,
      profileId: userId,
    }));
  } catch (error) {
    const known =
      error instanceof AbacatePayError
        ? TAX_ID_ERRORS.find(([pattern]) => error.message.includes(pattern))
        : undefined;
    return known ? { error: null, fieldError: known[1] } : { error: PAYOUT_OUR_FAULT };
  }

  // abacate_subaccount_id não aceita escrita do client (grant por coluna): é do backend.
  // Condicional ao campo vazio para dois envios ao mesmo tempo não se atropelarem.
  const { error: updateError } = await createAdminClient()
    .from("interviewers")
    .update({ abacate_subaccount_id: subAccountId })
    .eq("profile_id", userId)
    .is("abacate_subaccount_id", null);

  if (updateError) {
    return { error: PAYOUT_OUR_FAULT };
  }

  revalidatePath("/painel");
  return { error: null };
}
