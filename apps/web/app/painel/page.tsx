import Link from "next/link";
import { redirect } from "next/navigation";
import { Eyebrow } from "@/components/eyebrow";
import { SiteHeader } from "@/components/site-header";
import { WEEKDAY_LABELS } from "@/lib/interviewer-options";
import { createClient } from "@/lib/supabase/server";
import { AddBlockForm } from "./add-block-form";
import { DeleteBlockButton } from "./delete-block-button";
import { PausedToggle } from "./paused-toggle";
import { PayoutForm } from "./payout-form";

export const instant = false;

type Status = "ativo" | "pausado" | "desativado";

const STATUS_COPY: Record<Status, { chip: string; title: string; text: string }> = {
  ativo: {
    chip: "border-border bg-primary text-ink",
    title: "Seu perfil está ativo",
    text: "Você aparece no marketplace e os candidatos podem agendar nos horários abertos abaixo.",
  },
  pausado: {
    chip: "border-border bg-card border-dashed",
    title: "Seu perfil está pausado",
    text: "Você não aparece no marketplace nem recebe novos agendamentos enquanto estiver pausado.",
  },
  desativado: {
    chip: "border-foreground bg-foreground text-background",
    title: "Seu perfil está desativado",
    text: "Seu perfil foi retirado do marketplace pela equipe do Lugh. Fale com a gente para reativar.",
  },
};

// weekday 0 = domingo, igual ao banco. A semana é exibida de segunda a domingo.
const WEEKDAY_SHORT = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

const TEXT_LINK = "text-brand-deep inline-flex min-h-11 items-center font-bold underline";

function formatTime(time: string) {
  return time.slice(0, 5);
}

export default async function PainelPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: interviewer } = await supabase
    .from("interviewers")
    .select("active, paused, abacate_subaccount_id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!interviewer) {
    redirect("/onboarding/entrevistador");
  }

  const { data: availability } = await supabase
    .from("availability")
    .select("id, weekday, start_time, end_time")
    .eq("interviewer_id", user.id)
    .order("weekday")
    .order("start_time");

  const blocksByWeekday = new Map<
    number,
    { id: string; start_time: string; end_time: string }[]
  >();
  for (const block of availability ?? []) {
    const list = blocksByWeekday.get(block.weekday) ?? [];
    list.push(block);
    blocksByWeekday.set(block.weekday, list);
  }

  const status: Status = !interviewer.active
    ? "desativado"
    : interviewer.paused
      ? "pausado"
      : "ativo";
  const copy = STATUS_COPY[status];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto box-border flex w-full max-w-[1120px] flex-col gap-8 px-[clamp(20px,5vw,48px)] pt-[clamp(24px,4vw,48px)] pb-[72px]">
        <div className="flex flex-col gap-2">
          <Eyebrow>entrevistador</Eyebrow>
          <h1 className="font-heading text-[clamp(30px,3.4vw,44px)] leading-[1.05] font-extrabold tracking-[-0.02em]">
            Painel
          </h1>
        </div>

        <div className="flex flex-wrap gap-5">
          <section
            aria-label="Status do perfil"
            className="pop bg-secondary box-border flex min-w-0 flex-[1.5_1_420px] flex-col items-start gap-3.5 rounded-[18px] p-[clamp(18px,2.4vw,28px)]"
          >
            <span
              className={`inline-flex items-center gap-1.5 rounded-[7px] border-[1.5px] px-2 py-0.5 font-mono text-xs font-bold ${copy.chip}`}
            >
              <span
                aria-hidden="true"
                className={`size-2 rounded-full border-[1.5px] border-current ${
                  status === "ativo" ? "live bg-card" : ""
                }`}
              />
              status: {status}
            </span>
            <h2 className="font-heading text-[26px] leading-tight font-bold">{copy.title}</h2>
            <p className="text-muted-foreground max-w-[52ch]">{copy.text}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-[18px] gap-y-2.5">
              {interviewer.active ? <PausedToggle paused={interviewer.paused} /> : null}
              <Link href={`/entrevistadores/${user.id}`} className={TEXT_LINK}>
                Ver perfil público
              </Link>
              <Link href="/painel/perfil" className={TEXT_LINK}>
                Editar perfil
              </Link>
            </div>
          </section>

          {/* O agendamento ainda não existe: o card mostra o estado vazio real. */}
          <section
            aria-label="Próxima sessão"
            className="pop edge bg-card box-border flex min-w-0 flex-[1_1_300px] flex-col gap-3.5 rounded-[18px] p-5 [animation-delay:.1s]"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-heading text-lg font-bold">Próxima sessão</h2>
              <Link href="/sessoes" className={`${TEXT_LINK} text-sm`}>
                Ver todas
              </Link>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="bg-secondary text-muted-foreground w-24 shrink-0 rounded-[10px] px-2 py-2.5 text-center font-mono">
                <div className="text-xs">sem data</div>
                <div className="text-[22px] leading-[1.2] font-bold">--h</div>
              </div>
              <p className="text-muted-foreground min-w-0 text-sm">
                Nenhuma sessão marcada. Quando um candidato agendar, ela aparece aqui.
              </p>
            </div>
          </section>
        </div>

        <section className="flex flex-col gap-4">
          <div>
            <h2 className="font-heading text-[22px] font-bold">Recebimentos</h2>
            <p className="text-muted-foreground mt-1 max-w-[68ch] text-sm">
              {interviewer.abacate_subaccount_id
                ? "Sua parte de cada sessão é separada na hora em que o candidato paga o PIX."
                : "Cadastre seu documento para receber sua parte de cada sessão por PIX. Sem ele, o valor das sessões fica retido com o Lugh."}
            </p>
          </div>

          {interviewer.abacate_subaccount_id ? (
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className="border-border bg-accent rounded-[7px] border-[1.5px] px-2 py-0.5 font-mono text-xs font-bold">
                pix: documento cadastrado
              </span>
              <span className="text-muted-foreground text-sm">
                O repasse cai na chave PIX do seu CPF ou CNPJ.
              </span>
            </p>
          ) : (
            <PayoutForm />
          )}
        </section>

        <section className="flex flex-col gap-4">
          <div>
            <h2 className="font-heading text-[22px] font-bold">Disponibilidade</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Blocos que se repetem toda semana, no horário de Brasília, sempre em hora cheia. Os
              candidatos agendam dentro deles.
            </p>
          </div>

          <AddBlockForm />

          <ul className="border-border-dashed border-b-[1.5px] border-dashed">
            {WEEK_ORDER.map((weekday) => {
              const blocks = blocksByWeekday.get(weekday) ?? [];
              return (
                <li
                  key={weekday}
                  className="border-border-dashed flex flex-wrap items-center gap-x-3.5 gap-y-2 border-t-[1.5px] border-dashed py-3"
                >
                  <span className="w-11 shrink-0 font-mono text-[13px] font-bold">
                    {WEEKDAY_SHORT[weekday]}
                  </span>
                  {blocks.length === 0 ? (
                    <span className="text-muted-foreground flex min-h-11 items-center font-mono text-[13px]">
                      sem horários
                    </span>
                  ) : (
                    blocks.map((block) => (
                      <span
                        key={block.id}
                        className="edge bg-accent inline-flex h-11 items-center gap-1 rounded-[9px] pr-1 pl-3 font-mono text-[13px]"
                      >
                        {formatTime(block.start_time)} às {formatTime(block.end_time)}
                        <DeleteBlockButton
                          id={block.id}
                          description={`${WEEKDAY_LABELS[weekday].toLowerCase()}, ${formatTime(block.start_time)} às ${formatTime(block.end_time)}`}
                        />
                      </span>
                    ))
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </div>
  );
}
