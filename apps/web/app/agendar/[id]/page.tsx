import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CodeBlock, CodeMuted } from "@/components/code-block";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { formatPrice } from "@/lib/format-price";
import { formatSessionDate } from "@/lib/format-session-date";
import { initials } from "@/lib/initials";
import { PAYMENT_WINDOW_MINUTES, paymentSecondsLeft, type PaymentView } from "@/lib/payments";
import { BOOKING_WEEKS, findSlotWeek, getFreeSlots } from "@/lib/slots";
import { createClient } from "@/lib/supabase/server";
import { type BookingDay, BookingForm } from "./booking-form";
import { PaymentStep } from "./payment-step";

export const instant = false;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// weekday 0 = domingo, igual ao banco.
const WEEKDAY_SHORT = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

const STEPS = ["01 horário e tipo", "02 pagamento", "03 confirmação"];

const SESSION_TYPE_LABELS: Record<string, string> = {
  coding: "código ao vivo",
  system_design: "system design",
  behavioral: "comportamental",
};

const SUMMARY_ROW = "flex justify-between gap-4";

function Steps({ current }: { current: number }) {
  return (
    <ol aria-label="Etapas" className="flex flex-wrap gap-2 font-mono text-[13px] font-bold">
      {STEPS.map((step, index) => (
        <li
          key={step}
          aria-current={index === current ? "step" : undefined}
          className={`rounded-lg border-[1.5px] px-3 py-1.5 ${
            index === current
              ? "border-border bg-primary text-ink"
              : index < current
                ? "border-border bg-accent"
                : "border-border-dashed text-muted-foreground border-dashed"
          }`}
        >
          {step}
        </li>
      ))}
    </ol>
  );
}

// Etapa 02: o PIX de uma sessão já reservada (?pagar=<sessionId>). Não depende do perfil
// público do entrevistador: se ele pausar o perfil depois da reserva, o candidato ainda
// consegue pagar. O nome vem da função de participantes e o valor, da própria cobrança.
async function PaymentPage({
  interviewerId,
  sessionId,
  userId,
}: {
  interviewerId: string;
  sessionId: string;
  userId: string;
}) {
  const supabase = await createClient();

  // A RLS de sessions e de payments só devolve linha para quem participa da sessão.
  const [{ data: session }, { data: payment }, { data: names }] = await Promise.all([
    supabase
      .from("sessions")
      .select("id, candidate_id, interviewer_id, starts_at, type, status, created_at")
      .eq("id", sessionId)
      .maybeSingle(),
    supabase
      .from("payments")
      .select("br_code, br_code_base64, expires_at, amount_cents")
      .eq("session_id", sessionId)
      .maybeSingle(),
    supabase.rpc("session_participant_names", { session_ids: [sessionId] }),
  ]);

  // Só o candidato paga, e a sessão precisa ser deste entrevistador.
  if (!session || session.candidate_id !== userId || session.interviewer_id !== interviewerId) {
    notFound();
  }

  if (session.status === "scheduled") {
    redirect(`/sessoes?agendada=${session.id}`);
  }
  if (session.status !== "pending_payment" && session.status !== "expired") {
    redirect("/sessoes");
  }

  const interviewerName = names?.[0]?.interviewer_name?.trim() || "Entrevistador";
  const { day, time } = formatSessionDate(session.starts_at);
  const expired = session.status === "expired" || paymentSecondsLeft(session.created_at) <= 0;

  const initialPayment: PaymentView | null = payment
    ? {
        brCode: payment.br_code,
        brCodeBase64: payment.br_code_base64,
        expiresAt: payment.expires_at,
        amountCents: payment.amount_cents,
      }
    : null;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto box-border flex w-full max-w-[1120px] flex-col gap-6 px-[clamp(20px,5vw,48px)] pt-5 pb-[72px]">
        <Link
          href="/sessoes"
          className="text-foreground inline-flex min-h-11 items-center gap-2 self-start text-[15px] font-bold"
        >
          <ArrowLeft aria-hidden="true" size={16} strokeWidth={2.2} />
          Minhas sessões
        </Link>

        <Steps current={1} />

        <div className="flex flex-wrap items-start gap-x-12 gap-y-7">
          <div className="min-w-0 flex-[999_1_480px]">
            <PaymentStep
              sessionId={session.id}
              interviewerId={interviewerId}
              initialPayment={initialPayment}
              initialExpired={expired}
            />
          </div>

          <aside
            aria-label="Resumo da sessão"
            className="edge bg-card box-border flex w-full min-w-0 flex-[1_1_320px] flex-col gap-4 rounded-[18px] p-5 md:max-w-[400px]"
          >
            <div className="flex items-center gap-3.5">
              <span
                aria-hidden="true"
                className="edge bg-accent flex size-[60px] shrink-0 items-center justify-center rounded-full font-mono font-bold"
              >
                {initials(interviewerName)}
              </span>
              <p className="min-w-0 font-extrabold break-words">{interviewerName}</p>
            </div>
            <div className="border-border border-t-[1.5px] border-dashed" />
            <dl className="flex flex-col gap-2.5 font-mono text-[13px]">
              <div className={SUMMARY_ROW}>
                <dt className="text-muted-foreground">horário</dt>
                <dd className="font-bold">
                  {day} · {time}
                </dd>
              </div>
              <div className={SUMMARY_ROW}>
                <dt className="text-muted-foreground">tipo</dt>
                <dd>{SESSION_TYPE_LABELS[session.type] ?? session.type}</dd>
              </div>
              <div className={SUMMARY_ROW}>
                <dt className="text-muted-foreground">duração</dt>
                <dd>1h</dd>
              </div>
            </dl>
            {initialPayment ? (
              <>
                <div className="border-border border-t-[1.5px] border-dashed" />
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-extrabold">Total</span>
                  <span className="font-heading text-[28px] leading-none font-extrabold tabular-nums">
                    {formatPrice(initialPayment.amountCents)}
                  </span>
                </div>
              </>
            ) : null}
            <p className="text-muted-foreground font-mono text-xs">
              o horário fica reservado por {PAYMENT_WINDOW_MINUTES} min
            </p>
          </aside>
        </div>
      </main>
    </div>
  );
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AgendarPage({
  params,
  searchParams,
}: PageProps<"/agendar/[id]">) {
  const { id } = await params;

  if (!UUID_RE.test(id)) {
    notFound();
  }

  const query = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Ninguém agenda consigo mesmo: o entrevistador volta para o próprio perfil.
  if (user?.id === id) {
    redirect(`/entrevistadores/${id}`);
  }

  const payParam = firstParam(query.pagar);
  if (payParam !== undefined) {
    if (!UUID_RE.test(payParam)) {
      notFound();
    }
    if (!user) {
      redirect(`/login?next=${encodeURIComponent(`/agendar/${id}`)}`);
    }
    return <PaymentPage interviewerId={id} sessionId={payParam} userId={user.id} />;
  }

  const [{ data: interviewer }, { data: profile }, freeSlots] = await Promise.all([
    supabase
      .from("interviewers")
      .select("profile_id, headline, price_cents")
      .eq("profile_id", id)
      .eq("active", true)
      .eq("paused", false)
      .maybeSingle(),
    supabase.from("interviewer_profiles").select("name, avatar_url").eq("id", id).maybeSingle(),
    getFreeSlots(supabase, id),
  ]);

  if (!interviewer || !profile) {
    notFound();
  }

  // Horário que veio do perfil (?slot=). Só vale se ainda estiver livre; aí a
  // tela já abre na semana dele.
  const slotParam = firstParam(query.slot);
  const slotWeek = slotParam ? findSlotWeek(freeSlots.weeks, slotParam) : null;
  const weekParam = Number(firstParam(query.semana));
  const week =
    Number.isInteger(weekParam) && weekParam >= 0 && weekParam < BOOKING_WEEKS
      ? weekParam
      : (slotWeek ?? 0);

  const days: BookingDay[] = (freeSlots.weeks[week] ?? []).map((day) => ({
    dayKey: day.dayKey,
    label: `${WEEKDAY_SHORT[day.weekday]} ${day.dayOfMonth}`,
    slots: day.slots.map((slot) => {
      const { day: dateLabel, time } = formatSessionDate(slot.startsAt);
      return { startsAt: slot.startsAt, time, label: `${dateLabel} · ${time}` };
    }),
  }));

  const initialSlot =
    slotParam && slotWeek === week
      ? (days.flatMap((day) => day.slots).find(
          (slot) => new Date(slot.startsAt).getTime() === new Date(slotParam).getTime(),
        )?.startsAt ?? null)
      : null;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto box-border flex w-full max-w-[1120px] flex-col gap-6 px-[clamp(20px,5vw,48px)] pt-5 pb-[72px]">
        <Link
          href={`/entrevistadores/${id}`}
          className="text-foreground inline-flex min-h-11 items-center gap-2 self-start text-[15px] font-bold"
        >
          <ArrowLeft aria-hidden="true" size={16} strokeWidth={2.2} />
          Perfil de {profile.name}
        </Link>

        <Steps current={0} />

        {freeSlots.error ? (
          <div
            role="alert"
            className="edge flex flex-col items-start gap-3.5 rounded-2xl px-6 py-[clamp(28px,5vw,56px)]"
          >
            <CodeBlock>
              <div>
                <CodeMuted>GET</CodeMuted> /agendar
              </div>
              <div className="text-destructive-soft">erro: sem resposta do servidor</div>
            </CodeBlock>
            <h1 className="font-heading text-[26px] leading-tight font-bold">
              Não deu para carregar os horários
            </h1>
            <p className="text-muted-foreground max-w-[52ch]">
              O problema é do nosso lado. Tente de novo em alguns segundos.
            </p>
            <Link href={`/agendar/${id}`} className={buttonVariants({ className: "h-12 px-5" })}>
              Tentar de novo
            </Link>
          </div>
        ) : !freeSlots.hasBlocks ? (
          <div className="edge-dashed flex flex-col items-start gap-3.5 rounded-2xl px-6 py-[clamp(28px,5vw,56px)]">
            <h1 className="font-heading text-[26px] leading-tight font-bold">
              {profile.name} ainda não abriu horários
            </h1>
            <p className="text-muted-foreground max-w-[52ch]">
              Volte em alguns dias ou escolha outro entrevistador.
            </p>
            <Link href="/entrevistadores" className={buttonVariants({ className: "h-12 px-5" })}>
              Ver outros entrevistadores
            </Link>
          </div>
        ) : (
          <BookingForm
            // Trocar de semana ou de horário pré-selecionado remonta o form.
            key={`${week}-${initialSlot ?? ""}`}
            interviewerId={id}
            interviewerName={profile.name ?? "Entrevistador"}
            headline={interviewer.headline}
            avatarUrl={profile.avatar_url}
            price={formatPrice(interviewer.price_cents)}
            days={days}
            week={week}
            initialSlot={initialSlot}
          />
        )}
      </main>
    </div>
  );
}
