import {
  checkPixCharge,
  createPixCharge,
  isSplitUnavailable,
  isTestMode,
  withdrawFromSubAccount,
  type PixCharge,
  type PixChargeInput,
} from "@/lib/abacatepay";
import { notifySessionConfirmed } from "@/lib/notifications";
import { createAdminClient } from "@/lib/supabase/server";

// Só servidor: pagamento é escrita sensível, tudo aqui usa a service role. Quem chama já
// conferiu login e participação na sessão (ou, no webhook, a assinatura).

// Prazo para pagar o PIX depois de agendar. Passou disso, a sessão expira e o horário
// volta a ficar livre. O mesmo prazo está nas funções *_booked_slots do banco.
export const PAYMENT_WINDOW_MINUTES = 30;

// Parte do entrevistador em cada sessão. O resto fica com o Lugh, que paga a taxa do PIX.
export const INTERVIEWER_SHARE_PERCENT = 80;

// A AbacatePay não cria cobrança PIX com menos de 5 minutos de validade.
const MIN_CHARGE_SECONDS = 300;

// Códigos do Postgres: unique violada e exclusion constraint violada.
const UNIQUE_VIOLATION = "23505";
const EXCLUSION_VIOLATION = "23P01";

const CHARGE_DESCRIPTION = "Mock interview no Lugh";

export function interviewerShare(amountCents: number): number {
  return Math.floor((amountCents * INTERVIEWER_SHARE_PERCENT) / 100);
}

export function paymentDeadline(sessionCreatedAt: string): Date {
  return new Date(new Date(sessionCreatedAt).getTime() + PAYMENT_WINDOW_MINUTES * 60 * 1000);
}

// Segundos que faltam para o prazo de pagamento (zero ou negativo se já passou).
export function paymentSecondsLeft(sessionCreatedAt: string, now: Date = new Date()): number {
  return Math.floor((paymentDeadline(sessionCreatedAt).getTime() - now.getTime()) / 1000);
}

// pending_payment → expired para toda sessão que passou do prazo. Não há cron: roda nos
// pontos em que o status importa (agendar, pagar, listar sessões). Melhor esforço: se
// falhar, o calendário já ignora essas sessões e a próxima chamada tenta de novo.
export async function expireUnpaidSessions(now: Date = new Date()): Promise<void> {
  const cutoff = new Date(now.getTime() - PAYMENT_WINDOW_MINUTES * 60 * 1000).toISOString();

  await createAdminClient()
    .from("sessions")
    .update({ status: "expired" })
    .eq("status", "pending_payment")
    .lt("created_at", cutoff);
}

// O que a tela de pagamento precisa para mostrar o PIX.
export type PaymentView = {
  brCode: string;
  brCodeBase64: string;
  // Fim do prazo de pagamento (ISO, UTC).
  expiresAt: string;
  amountCents: number;
};

export type EnsurePaymentResult =
  | { kind: "pending"; payment: PaymentView }
  // A sessão já saiu de pending_payment (paga, cancelada...): não há o que cobrar.
  | { kind: "settled"; status: string }
  | { kind: "expired" }
  | { kind: "not_found" };

type PaymentViewRow = {
  br_code: string;
  br_code_base64: string;
  expires_at: string;
  amount_cents: number;
};

function toView(row: PaymentViewRow): PaymentView {
  return {
    brCode: row.br_code,
    brCodeBase64: row.br_code_base64,
    expiresAt: row.expires_at,
    amountCents: row.amount_cents,
  };
}

// Cobra com split quando o entrevistador tem subconta. Se a loja ainda não tem split
// liberado na AbacatePay, cobra sem split em vez de travar o agendamento: o valor fica
// com o Lugh e interviewer_share_cents grava 0.
async function createCharge(
  input: Omit<PixChargeInput, "split">,
  subAccountId: string | null,
): Promise<{ charge: PixCharge; shareCents: number }> {
  if (subAccountId) {
    const shareCents = interviewerShare(input.amountCents);
    try {
      const charge = await createPixCharge({
        ...input,
        split: { subAccountId, amountCents: shareCents },
      });
      return { charge, shareCents };
    } catch (error) {
      if (!isSplitUnavailable(error)) throw error;
    }
  }
  return { charge: await createPixCharge(input), shareCents: 0 };
}

// Garante que a sessão tem uma cobrança PIX e devolve os dados dela. Chamar de novo
// devolve a mesma cobrança (uma por sessão). Lança erro quando o banco ou a AbacatePay
// falham.
export async function ensurePayment(
  sessionId: string,
  now: Date = new Date(),
): Promise<EnsurePaymentResult> {
  const admin = createAdminClient();

  const { data: session, error: sessionError } = await admin
    .from("sessions")
    .select("id, status, created_at, interviewer_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionError) throw new Error(`Falha ao ler a sessão: ${sessionError.message}`);
  if (!session) return { kind: "not_found" };
  if (session.status === "expired") return { kind: "expired" };
  if (session.status !== "pending_payment") return { kind: "settled", status: session.status };

  const secondsLeft = paymentSecondsLeft(session.created_at, now);
  if (secondsLeft <= 0) {
    await expireUnpaidSessions(now);
    return { kind: "expired" };
  }

  const { data: existing, error: existingError } = await admin
    .from("payments")
    .select("br_code, br_code_base64, expires_at, amount_cents")
    .eq("session_id", session.id)
    .maybeSingle();

  if (existingError) throw new Error(`Falha ao ler o pagamento: ${existingError.message}`);
  if (existing) return { kind: "pending", payment: toView(existing) };

  // Sem cobrança ainda e sem tempo para criar uma: libera o horário agora.
  if (secondsLeft < MIN_CHARGE_SECONDS) {
    await admin
      .from("sessions")
      .update({ status: "expired" })
      .eq("id", session.id)
      .eq("status", "pending_payment");
    return { kind: "expired" };
  }

  const { data: interviewer, error: interviewerError } = await admin
    .from("interviewers")
    .select("price_cents, abacate_subaccount_id")
    .eq("profile_id", session.interviewer_id)
    .maybeSingle();

  if (interviewerError || !interviewer) {
    throw new Error("Falha ao ler o entrevistador da sessão");
  }

  const { charge, shareCents } = await createCharge(
    {
      amountCents: interviewer.price_cents,
      description: CHARGE_DESCRIPTION,
      expiresInSeconds: secondsLeft,
      externalId: session.id,
    },
    interviewer.abacate_subaccount_id,
  );

  const row = {
    session_id: session.id,
    abacate_billing_id: charge.id,
    amount_cents: interviewer.price_cents,
    interviewer_share_cents: shareCents,
    br_code: charge.brCode,
    br_code_base64: charge.brCodeBase64,
    // O prazo que vale é o da sessão, não o relógio da AbacatePay.
    expires_at: paymentDeadline(session.created_at).toISOString(),
  };

  const { error: insertError } = await admin.from("payments").insert(row);

  if (insertError) {
    // Outra chamada gravou primeiro (duas abas, duplo clique): vale a que já está lá.
    if (insertError.code === UNIQUE_VIOLATION) {
      const { data: winner } = await admin
        .from("payments")
        .select("br_code, br_code_base64, expires_at, amount_cents")
        .eq("session_id", session.id)
        .maybeSingle();
      if (winner) return { kind: "pending", payment: toView(winner) };
    }
    throw new Error(`Falha ao gravar o pagamento: ${insertError.message}`);
  }

  return { kind: "pending", payment: toView(row) };
}

export type ConfirmResult =
  // A sessão ficou (ou já estava) confirmada.
  | "confirmed"
  // O PIX foi pago depois de a sessão expirar e outra pessoa já pegou o horário. O
  // pagamento fica como paid e a sessão como expired, para estorno manual.
  | "slot_lost"
  // Não existe pagamento com esse id de cobrança.
  | "unknown";

// O PIX foi pago: payments pending → paid e sessão pending_payment → scheduled. Quem
// chama já confirmou o pagamento na AbacatePay. Idempotente: os dois updates são
// condicionais ao status de origem, então repetir (webhook reenviado, webhook e consulta
// ao mesmo tempo) não muda nada. Lança erro quando o banco falha.
export async function confirmPayment(
  billingId: string,
  now: Date = new Date(),
): Promise<ConfirmResult> {
  const admin = createAdminClient();

  const { data: payment, error: paymentError } = await admin
    .from("payments")
    .select("id, session_id")
    .eq("abacate_billing_id", billingId)
    .maybeSingle();

  if (paymentError) throw new Error(`Falha ao ler o pagamento: ${paymentError.message}`);
  if (!payment) return "unknown";

  const { error: paidError } = await admin
    .from("payments")
    .update({ status: "paid", paid_at: now.toISOString() })
    .eq("id", payment.id)
    .eq("status", "pending");

  if (paidError) throw new Error(`Falha ao marcar o pagamento: ${paidError.message}`);

  // Sessão expirada também volta: pagar no último segundo não pode perder o horário se
  // ele ainda está livre. Se não está, a trava de double booking recusa o update.
  const { data: confirmed, error: sessionError } = await admin
    .from("sessions")
    .update({ status: "scheduled" })
    .eq("id", payment.session_id)
    .in("status", ["pending_payment", "expired"])
    .select("id");

  if (sessionError) {
    if (sessionError.code === EXCLUSION_VIOLATION) return "slot_lost";
    throw new Error(`Falha ao confirmar a sessão: ${sessionError.message}`);
  }

  // Só a chamada que de fato confirmou a sessão avisa por e-mail: o webhook reenviado e
  // a consulta de status que chega junto não encontram linha para mudar.
  if (confirmed?.length) {
    await notifySessionConfirmed(payment.session_id);
  }

  return "confirmed";
}

export type PaymentStatus = {
  // Status atual da sessão.
  status: string;
  // true quando o PIX foi pago, mesmo que a sessão não tenha sido confirmada (slot_lost).
  paid: boolean;
};

function isPaid(status: string | undefined): boolean {
  return status === "paid" || status === "released";
}

// Status de pagamento de uma sessão, conferindo na AbacatePay enquanto estiver pendente.
// É o que a tela de pagamento consulta: confirma sozinha mesmo se o webhook atrasar ou
// não chegar (localhost não recebe webhook). Devolve null se a sessão não existe.
export async function refreshPaymentStatus(
  sessionId: string,
  now: Date = new Date(),
): Promise<PaymentStatus | null> {
  const admin = createAdminClient();

  async function read() {
    const [session, payment] = await Promise.all([
      admin.from("sessions").select("status, created_at").eq("id", sessionId).maybeSingle(),
      admin
        .from("payments")
        .select("abacate_billing_id, status")
        .eq("session_id", sessionId)
        .maybeSingle(),
    ]);
    if (session.error) throw new Error(`Falha ao ler a sessão: ${session.error.message}`);
    if (payment.error) throw new Error(`Falha ao ler o pagamento: ${payment.error.message}`);
    return { session: session.data, payment: payment.data };
  }

  const before = await read();
  if (!before.session) return null;

  // Sessão recém-expirada com cobrança pendente também é conferida: o PIX pode ter sido
  // pago nos últimos segundos do prazo, antes de a confirmação chegar.
  const unpaid = !before.payment || before.payment.status === "pending";
  const worthChecking =
    unpaid && (before.session.status === "pending_payment" || before.session.status === "expired");

  if (!worthChecking) {
    return { status: before.session.status, paid: isPaid(before.payment?.status) };
  }

  if (before.payment) {
    let chargeStatus: string | null = null;
    try {
      chargeStatus = await checkPixCharge(before.payment.abacate_billing_id);
    } catch {
      // AbacatePay fora do ar: fica o que está no banco e a próxima consulta tenta de novo.
    }
    if (chargeStatus === "PAID") {
      await confirmPayment(before.payment.abacate_billing_id, now);
    }
  }

  if (paymentSecondsLeft(before.session.created_at, now) <= 0) {
    await expireUnpaidSessions(now);
  }

  const after = await read();
  if (!after.session) return null;
  return { status: after.session.status, paid: isPaid(after.payment?.status) };
}

export type ReleaseResult =
  // O repasse saiu (ou já tinha saído) para o PIX do entrevistador.
  | "released"
  // Não há o que repassar: sessão sem pagamento confirmado, ou cobrança feita sem split
  // (o valor está com o Lugh, não na subconta).
  | "nothing_to_release"
  // A AbacatePay não completou o saque. O pagamento segue como paid, a receber.
  | "failed";

// O entrevistador enviou o feedback: saca a parte dele da subconta e marca o pagamento
// como released. Quem chama já concluiu a sessão. Idempotente: o saque usa o id da
// sessão como externalId e o update é condicional ao status paid. No Modo Teste da
// AbacatePay não existe saque, então só o status muda. Lança erro quando o banco ou a
// AbacatePay falham; o feedback já está salvo e não depende disto.
export async function releasePayment(
  sessionId: string,
  now: Date = new Date(),
): Promise<ReleaseResult> {
  const admin = createAdminClient();

  const { data: payment, error: paymentError } = await admin
    .from("payments")
    .select("id, status, interviewer_share_cents, sessions(interviewer_id)")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (paymentError) throw new Error(`Falha ao ler o pagamento: ${paymentError.message}`);
  if (!payment) return "nothing_to_release";
  if (payment.status === "released") return "released";
  if (payment.status !== "paid" || payment.interviewer_share_cents === 0) {
    return "nothing_to_release";
  }

  if (!isTestMode()) {
    const { data: interviewer, error: interviewerError } = await admin
      .from("interviewers")
      .select("abacate_subaccount_id")
      .eq("profile_id", payment.sessions.interviewer_id)
      .maybeSingle();

    if (interviewerError) throw new Error(`Falha ao ler o entrevistador: ${interviewerError.message}`);
    if (!interviewer?.abacate_subaccount_id) return "nothing_to_release";

    const status = await withdrawFromSubAccount({
      subAccountId: interviewer.abacate_subaccount_id,
      amountCents: payment.interviewer_share_cents,
      externalId: `repasse-${sessionId}`,
      description: "Repasse de sessão no Lugh",
    });
    if (status !== "COMPLETE") return "failed";
  }

  const { error: updateError } = await admin
    .from("payments")
    .update({ status: "released", released_at: now.toISOString() })
    .eq("id", payment.id)
    .eq("status", "paid");

  if (updateError) throw new Error(`Falha ao marcar o repasse: ${updateError.message}`);
  return "released";
}

export type Earnings = {
  // Parte de sessões pagas que ainda não foi repassada (o feedback não foi enviado).
  pendingCents: number;
  // Parte já repassada para o PIX do entrevistador.
  releasedCents: number;
};

export function sumEarnings(
  payments: { status: string; interviewer_share_cents: number }[],
): Earnings {
  const total = (status: string) =>
    payments
      .filter((payment) => payment.status === status)
      .reduce((sum, payment) => sum + payment.interviewer_share_cents, 0);

  return { pendingCents: total("paid"), releasedCents: total("released") };
}
