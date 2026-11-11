import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { WEEKDAY_LABELS } from "@/lib/interviewer-options";
import { createClient } from "@/lib/supabase/server";
import { AddBlockForm } from "./add-block-form";
import { DeleteBlockButton } from "./delete-block-button";
import { PausedToggle } from "./paused-toggle";

export const instant = false;

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
    .select("active, paused")
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

  const isLive = interviewer.active && !interviewer.paused;

  return (
    <main className="flex min-h-screen flex-col">
      <SiteHeader />

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <span className="bg-primary h-2 w-8 rounded-full" />
            <span className="text-primary text-sm font-extrabold tracking-[0.08em] uppercase">
              Seu painel
            </span>
          </div>
          <h1 className="font-heading text-4xl font-extrabold tracking-[-0.03em] md:text-5xl">
            Gerencie sua agenda.
          </h1>
        </div>

        <section className="border-border bg-card flex flex-wrap items-center justify-between gap-4 rounded-[20px] border p-6">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              {isLive ? <span className="bg-primary size-2 rounded-full" /> : null}
              <p className="font-heading text-xl font-bold">
                {!interviewer.active
                  ? "Seu perfil está desativado"
                  : isLive
                    ? "Seu perfil está ativo"
                    : "Seu perfil está pausado"}
              </p>
            </div>
            <p className="text-foreground/70 text-sm">
              {!interviewer.active
                ? "Seu perfil foi retirado do marketplace pela equipe do Lugh. Fale com a gente para reativar."
                : isLive
                  ? "Candidatos conseguem te encontrar e agendar sessões."
                  : "Seu perfil não aparece no marketplace enquanto estiver pausado."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {interviewer.active ? (
              <PausedToggle paused={interviewer.paused} />
            ) : null}
            <Link
              href="/painel/perfil"
              className="border-border flex h-11 items-center rounded-lg border px-5 text-sm font-semibold"
            >
              Editar perfil
            </Link>
          </div>
        </section>

        <section className="border-border bg-card flex flex-col gap-6 rounded-[20px] border p-6">
          <div className="flex flex-col gap-1">
            <h2 className="font-heading text-2xl font-bold">Disponibilidade</h2>
            <p className="text-foreground/70 text-sm">
              Horários em Brasília (America/Sao_Paulo), sempre em hora cheia.
            </p>
          </div>

          <AddBlockForm />

          {blocksByWeekday.size === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhum horário cadastrado ainda.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {Array.from(blocksByWeekday.entries()).map(([weekday, blocks]) => (
                <div key={weekday} className="flex flex-wrap items-center gap-3">
                  <span className="w-24 font-medium">{WEEKDAY_LABELS[weekday]}</span>
                  <div className="flex flex-wrap gap-2">
                    {blocks.map((block) => (
                      <span
                        key={block.id}
                        className="bg-secondary text-primary flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
                      >
                        {formatTime(block.start_time)} às {formatTime(block.end_time)}
                        <DeleteBlockButton id={block.id} />
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
