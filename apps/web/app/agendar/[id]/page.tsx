import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CodeBlock, CodeMuted } from "@/components/code-block";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { formatPrice } from "@/lib/format-price";
import { formatSessionDate } from "@/lib/format-session-date";
import { BOOKING_WEEKS, findSlotWeek, getFreeSlots } from "@/lib/slots";
import { createClient } from "@/lib/supabase/server";
import { type BookingDay, BookingForm } from "./booking-form";

export const instant = false;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// weekday 0 = domingo, igual ao banco.
const WEEKDAY_SHORT = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

// O pagamento entra como etapa do meio na fase 7 do PROJETO.md.
const STEPS = ["01 horário e tipo", "02 confirmação"];

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

        <ol aria-label="Etapas" className="flex flex-wrap gap-2 font-mono text-[13px] font-bold">
          {STEPS.map((step, index) => (
            <li
              key={step}
              aria-current={index === 0 ? "step" : undefined}
              className={`rounded-lg border-[1.5px] px-3 py-1.5 ${
                index === 0
                  ? "border-border bg-primary text-ink"
                  : "border-border-dashed text-muted-foreground border-dashed"
              }`}
            >
              {step}
            </li>
          ))}
        </ol>

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
