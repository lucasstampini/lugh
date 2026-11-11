import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format-price";
import { initials } from "@/lib/initials";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// weekday 0 = domingo, igual ao banco. A semana é exibida de segunda a domingo.
const WEEKDAY_SHORT = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

const STEPS = ["01 horário e tipo", "02 pagamento", "03 confirmação"];

const SESSION_TYPES = [
  {
    value: "coding",
    title: "Código ao vivo",
    description: "Você resolve um problema no editor e explica o raciocínio enquanto escreve.",
  },
  {
    value: "system_design",
    title: "System design",
    description: "Você desenha a arquitetura de um sistema no quadro, junto com quem entrevista.",
  },
  {
    value: "behavioral",
    title: "Comportamental",
    description: "Perguntas sobre suas experiências e sobre como você trabalha em equipe.",
  },
];

// Horas cheias dentro de um bloco: "18:00" a "21:00" vira [18, 19, 20].
function hoursInBlock(start: string, end: string) {
  const first = Number(start.slice(0, 2));
  const endHour = Number(end.slice(0, 2));
  // Bloco até meia-noite chega do banco como "00:00" ou "24:00".
  const last = endHour === 0 ? 24 : endHour;
  return Array.from({ length: Math.max(last - first, 0) }, (_, index) => first + index);
}

const H2 = "font-heading text-[22px] font-bold";
const SUMMARY_ROW = "flex justify-between gap-4";

// Primeira etapa do agendamento, só de leitura: mostra os horários e tipos
// reais do entrevistador. Reserva e pagamento (etapas 2 e 3) ainda não
// existem, então o botão de seguir fica desabilitado.
export default async function AgendarPage({ params }: PageProps<"/agendar/[id]">) {
  const { id } = await params;

  if (!UUID_RE.test(id)) {
    notFound();
  }

  const supabase = await createClient();
  const [{ data: interviewer }, { data: profile }, { data: availability }] = await Promise.all([
    supabase
      .from("interviewers")
      .select("profile_id, headline, price_cents")
      .eq("profile_id", id)
      .eq("active", true)
      .eq("paused", false)
      .maybeSingle(),
    supabase.from("interviewer_profiles").select("name, avatar_url").eq("id", id).maybeSingle(),
    supabase
      .from("availability")
      .select("weekday, start_time, end_time")
      .eq("interviewer_id", id)
      .order("weekday")
      .order("start_time"),
  ]);

  if (!interviewer || !profile) {
    notFound();
  }

  const hoursByWeekday = new Map<number, number[]>();
  for (const block of availability ?? []) {
    const list = hoursByWeekday.get(block.weekday) ?? [];
    list.push(...hoursInBlock(block.start_time, block.end_time));
    hoursByWeekday.set(block.weekday, list);
  }
  const hasSlots = hoursByWeekday.size > 0;

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

        <form className="flex flex-wrap items-start gap-x-12 gap-y-7">
          <div className="flex min-w-0 flex-[999_1_480px] flex-col gap-7">
            <h1 className="font-heading text-[clamp(30px,3.4vw,44px)] leading-[1.05] font-extrabold tracking-[-0.02em]">
              Agende sua sessão
            </h1>

            <fieldset className="flex flex-col gap-3.5">
              <div className="flex items-baseline justify-between gap-3">
                <legend className={H2}>Horário</legend>
                <span className="text-muted-foreground font-mono text-xs">horário de Brasília</span>
              </div>
              {hasSlots ? (
                <div className="bg-secondary flex flex-col gap-2.5 rounded-2xl p-4 font-mono text-[13px]">
                  {WEEK_ORDER.map((weekday) => {
                    const hours = hoursByWeekday.get(weekday) ?? [];
                    return (
                      <div key={weekday} className="flex items-start gap-2.5">
                        <span
                          className={`flex min-h-11 w-11 shrink-0 items-center ${
                            hours.length > 0 ? "font-bold" : "text-muted-foreground"
                          }`}
                        >
                          {WEEKDAY_SHORT[weekday]}
                        </span>
                        {hours.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {hours.map((hour) => (
                              <label
                                key={hour}
                                className="edge bg-card has-checked:bg-primary has-checked:text-ink has-focus-visible:outline-ring inline-flex min-h-11 min-w-[58px] cursor-pointer items-center justify-center rounded-lg px-2 has-checked:font-bold has-focus-visible:outline-[3px] has-focus-visible:outline-offset-[3px]"
                              >
                                <input
                                  type="radio"
                                  name="slot"
                                  value={`${weekday}-${hour}`}
                                  className="sr-only"
                                />
                                {hour}h
                              </label>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground flex min-h-11 items-center">
                            sem horários
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="edge-dashed text-muted-foreground rounded-2xl p-4">
                  {profile.name} ainda não abriu horários. Volte em alguns dias ou escolha outro
                  entrevistador.
                </p>
              )}
            </fieldset>

            <fieldset className="flex flex-col gap-2.5">
              <legend className={`${H2} mb-3.5`}>Tipo de entrevista</legend>
              {SESSION_TYPES.map((type, index) => (
                <label
                  key={type.value}
                  className="edge bg-card has-checked:bg-accent flex cursor-pointer items-start gap-3 rounded-[14px] px-4 py-3.5"
                >
                  <input
                    type="radio"
                    name="type"
                    value={type.value}
                    defaultChecked={index === 0}
                    className="accent-brand-deep mt-1 size-5 shrink-0"
                  />
                  <span>
                    <span className="block font-extrabold">{type.title}</span>
                    <span className="text-muted-foreground block text-sm">{type.description}</span>
                  </span>
                </label>
              ))}
            </fieldset>
          </div>

          <aside
            aria-label="Resumo da sessão"
            className="edge bg-card box-border flex w-full min-w-0 flex-[1_1_320px] flex-col gap-4 rounded-[18px] p-5 md:max-w-[400px]"
          >
            <div className="flex items-center gap-3.5">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt=""
                  width={60}
                  height={60}
                  unoptimized
                  className="edge size-[60px] shrink-0 rounded-full object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="edge bg-accent flex size-[60px] shrink-0 items-center justify-center rounded-full font-mono font-bold"
                >
                  {initials(profile.name)}
                </span>
              )}
              <div className="min-w-0">
                <p className="font-extrabold break-words">{profile.name}</p>
                <p className="text-muted-foreground text-sm break-words">{interviewer.headline}</p>
              </div>
            </div>
            <div className="border-border border-t-[1.5px] border-dashed" />
            <dl className="flex flex-col gap-2.5 font-mono text-[13px]">
              <div className={SUMMARY_ROW}>
                <dt className="text-muted-foreground">duração</dt>
                <dd>50 min</dd>
              </div>
              <div className={SUMMARY_ROW}>
                <dt className="text-muted-foreground">pagamento</dt>
                <dd>PIX</dd>
              </div>
            </dl>
            <div className="border-border border-t-[1.5px] border-dashed" />
            <div className="flex items-baseline justify-between gap-4">
              <span className="font-extrabold">Total</span>
              <span className="font-heading text-[28px] leading-none font-extrabold tabular-nums">
                {formatPrice(interviewer.price_cents)}
              </span>
            </div>
            <Button type="button" size="lg" disabled aria-describedby="agendar-em-breve" className="h-[54px] w-full">
              Ir para o pagamento
            </Button>
            <p id="agendar-em-breve" className="text-muted-foreground text-center font-mono text-xs">
              reserva e pagamento por PIX chegam em breve
            </p>
          </aside>
        </form>
      </main>
    </div>
  );
}
