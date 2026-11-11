import { ArrowLeft, ArrowUpRight, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CodeAccent, CodeBlock, CodeString } from "@/components/code-block";
import { SiteHeader } from "@/components/site-header";
import { Tag } from "@/components/tag";
import { buttonVariants } from "@/components/ui/button";
import { formatPrice } from "@/lib/format-price";
import { initials } from "@/lib/initials";
import { AREA_OPTIONS, SENIORITY_OPTIONS } from "@/lib/interviewer-options";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const areaLabels: Record<string, string> = Object.fromEntries(
  AREA_OPTIONS.map((option) => [option.value, option.label]),
);
const seniorityLabels: Record<string, string> = Object.fromEntries(
  SENIORITY_OPTIONS.map((option) => [option.value, option.label]),
);

// weekday 0 = domingo, igual ao banco. A semana é exibida de segunda a domingo.
const WEEKDAY_SHORT = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

const H2 = "font-heading text-2xl font-bold";
const EXTERNAL_LINK = "text-brand-deep inline-flex min-h-11 items-center gap-1 font-bold underline";

// "19:00:00" vira "19h"; "19:30:00" vira "19h30".
function formatTime(time: string) {
  const [hour, minute] = time.split(":");
  return minute === "00" ? `${Number(hour)}h` : `${Number(hour)}h${minute}`;
}

export default async function InterviewerProfilePage({
  params,
}: PageProps<"/entrevistadores/[id]">) {
  const { id } = await params;

  if (!UUID_RE.test(id)) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: interviewer } = await supabase
    .from("interviewers")
    .select(
      "profile_id, headline, company, seniority, areas, price_cents, bio, linkedin_url, github_url, active, paused, created_at",
    )
    .eq("profile_id", id)
    .maybeSingle();

  if (!interviewer) {
    notFound();
  }

  const isOwner = user?.id === interviewer.profile_id;

  const isVisible = interviewer.active && !interviewer.paused;
  if (!isVisible && !isOwner) {
    notFound();
  }

  // profiles só deixa cada um ler a própria linha: nome e avatar públicos vêm
  // da view interviewer_profiles (nunca o e-mail). O dono vendo o próprio
  // perfil pausado não aparece na view, então lê a linha dele em profiles.
  const { data: profile } = isVisible
    ? await supabase
        .from("interviewer_profiles")
        .select("name, avatar_url")
        .eq("id", id)
        .maybeSingle()
    : await supabase
        .from("profiles")
        .select("name, avatar_url")
        .eq("id", id)
        .maybeSingle();

  if (!profile) {
    notFound();
  }

  const [{ data: availability }, { data: completedSessions }, { data: ratings }] =
    await Promise.all([
      supabase
        .from("availability")
        .select("weekday, start_time, end_time")
        .eq("interviewer_id", id)
        .order("weekday")
        .order("start_time"),
      supabase.rpc("interviewer_completed_sessions", { interviewer: id }),
      supabase.rpc("interviewer_ratings", { interviewer_ids: [id] }),
    ]);

  const blocksByWeekday = new Map<number, { start: string; end: string }[]>();
  for (const block of availability ?? []) {
    const list = blocksByWeekday.get(block.weekday) ?? [];
    list.push({ start: block.start_time, end: block.end_time });
    blocksByWeekday.set(block.weekday, list);
  }

  const joinYear = new Date(interviewer.created_at).getFullYear();
  const sessionsCount = typeof completedSessions === "number" ? completedSessions : 0;
  const rating = ratings?.[0] ?? null;
  const hasRating = Boolean(rating && rating.review_count > 0);
  const areaNames = interviewer.areas.map((area) => areaLabels[area] ?? area);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto box-border flex w-full max-w-[1240px] flex-col gap-5 px-[clamp(20px,5vw,48px)] pt-5 pb-[72px]">
        <Link
          href="/entrevistadores"
          className="text-foreground inline-flex min-h-11 items-center gap-2 self-start text-[15px] font-bold"
        >
          <ArrowLeft aria-hidden="true" size={16} strokeWidth={2.2} />
          Entrevistadores
        </Link>

        <div className="flex flex-wrap items-start gap-x-10 gap-y-7">
          <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-8">
            <section className="pop bg-secondary flex flex-wrap items-center gap-x-7 gap-y-5 rounded-[18px] p-[clamp(18px,2.4vw,28px)]">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={`Foto de ${profile.name}`}
                  width={168}
                  height={168}
                  className="edge size-[168px] shrink-0 rounded-2xl object-cover"
                  unoptimized
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="edge bg-accent flex size-[168px] shrink-0 items-center justify-center rounded-2xl font-mono text-4xl font-bold"
                >
                  {initials(profile.name)}
                </div>
              )}

              <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-2.5">
                <div className="flex flex-wrap gap-2 font-mono text-xs font-bold">
                  <span className="edge bg-foreground text-background rounded-md px-2 py-0.5 lowercase">
                    {seniorityLabels[interviewer.seniority] ?? interviewer.seniority}
                  </span>
                  <span className="edge bg-card rounded-md px-2 py-0.5">no Lugh desde {joinYear}</span>
                  {!isVisible ? (
                    <span className="edge bg-warning-soft rounded-md px-2 py-0.5">
                      {interviewer.active
                        ? "pausado · só você vê"
                        : "aguardando aprovação · só você vê"}
                    </span>
                  ) : null}
                </div>
                <h1 className="font-heading text-[clamp(30px,3.4vw,44px)] leading-[1.05] font-extrabold tracking-[-0.02em] break-words">
                  {profile.name}
                </h1>
                <p className="text-lg font-semibold">{interviewer.headline}</p>
                <p className="text-muted-foreground">{interviewer.company}</p>
                <div className="flex flex-wrap items-center gap-x-[18px] gap-y-1.5 text-[15px]">
                  <span className="inline-flex items-center gap-1.5 font-mono font-bold">
                    {hasRating && rating ? (
                      <>
                        <Star aria-hidden="true" size={15} className="fill-primary" />
                        <span className="sr-only">Nota </span>
                        {rating.average.toFixed(1).replace(".", ",")}
                        <span className="text-muted-foreground font-medium">
                          · {rating.review_count}{" "}
                          {rating.review_count === 1 ? "avaliação" : "avaliações"}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground font-medium">sem avaliações ainda</span>
                    )}
                  </span>
                  {interviewer.linkedin_url ? (
                    <a
                      href={interviewer.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={EXTERNAL_LINK}
                    >
                      LinkedIn
                      <ArrowUpRight aria-hidden="true" size={14} strokeWidth={2.4} />
                    </a>
                  ) : null}
                  {interviewer.github_url ? (
                    <a
                      href={interviewer.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={EXTERNAL_LINK}
                    >
                      GitHub
                      <ArrowUpRight aria-hidden="true" size={14} strokeWidth={2.4} />
                    </a>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="flex flex-col gap-3">
              <h2 className={H2}>Sobre</h2>
              {interviewer.bio ? (
                <p className="max-w-[68ch] whitespace-pre-line">{interviewer.bio}</p>
              ) : (
                <p className="text-muted-foreground max-w-[68ch]">
                  Este entrevistador ainda não escreveu uma apresentação.
                </p>
              )}
              {areaNames.length > 0 ? (
                <CodeBlock className="max-w-full self-start">
                  <CodeAccent>const</CodeAccent> areas = [
                  {areaNames.map((name, index) => (
                    <span key={name}>
                      <CodeString>{`"${name}"`}</CodeString>
                      {index < areaNames.length - 1 ? ", " : ""}
                    </span>
                  ))}
                  ];
                </CodeBlock>
              ) : null}
            </section>

            <section className="flex flex-wrap gap-x-12 gap-y-7">
              <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-3">
                <h2 className={H2}>Áreas</h2>
                {areaNames.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {areaNames.map((name) => (
                      <Tag key={name} className="lowercase">
                        {name}
                      </Tag>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhuma área informada.</p>
                )}
              </div>

              {/* O comentário de cada avaliação é privado aos dois participantes
                  (RLS de public.reviews): aqui só entram contagem e média. */}
              <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-3">
                <h2 className={H2}>No Lugh</h2>
                <ul className="flex flex-col gap-2">
                  <li className="flex items-center gap-2.5">
                    <span className="bg-accent rounded-md px-[7px] py-0.5 font-mono text-xs font-bold tabular-nums">
                      {sessionsCount}
                    </span>
                    {sessionsCount === 1 ? "sessão concluída" : "sessões concluídas"}
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="bg-accent rounded-md px-[7px] py-0.5 font-mono text-xs font-bold tabular-nums">
                      {rating?.review_count ?? 0}
                    </span>
                    {rating?.review_count === 1 ? "avaliação recebida" : "avaliações recebidas"}
                  </li>
                </ul>
              </div>
            </section>
          </div>

          <aside
            aria-label="Agendamento"
            className="pop edge bg-card box-border flex w-full min-w-0 flex-[1_1_340px] flex-col gap-[18px] rounded-[18px] p-[clamp(18px,2vw,24px)] [animation-delay:.12s] md:max-w-[420px]"
          >
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-heading text-4xl leading-none font-extrabold tabular-nums">
                {formatPrice(interviewer.price_cents)}
              </p>
              <span className="text-muted-foreground font-mono text-[13px]">sessão de 50 min</span>
            </div>
            <div className="border-border border-t-[1.5px] border-dashed" />
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-extrabold">Horários da semana</h2>
              <span className="text-muted-foreground font-mono text-xs">Brasília</span>
            </div>

            {blocksByWeekday.size === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nenhum horário aberto no momento.
              </p>
            ) : (
              <ul className="flex flex-col gap-2.5 font-mono text-[13px]">
                {WEEK_ORDER.map((weekday) => {
                  const blocks = blocksByWeekday.get(weekday) ?? [];
                  return (
                    <li key={weekday} className="flex items-start gap-2.5">
                      <span
                        className={`flex min-h-11 w-11 shrink-0 items-center ${
                          blocks.length > 0 ? "font-bold" : "text-muted-foreground"
                        }`}
                      >
                        {WEEKDAY_SHORT[weekday]}
                      </span>
                      {blocks.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {blocks.map((block) => (
                            <span
                              key={`${block.start}-${block.end}`}
                              className="edge bg-card inline-flex min-h-11 items-center rounded-lg px-2.5"
                            >
                              {formatTime(block.start)} às {formatTime(block.end)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground flex min-h-11 items-center">
                          sem horários
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {isOwner ? (
              <>
                <Link
                  href="/painel/perfil"
                  className={buttonVariants({ variant: "ink", size: "lg", className: "h-[54px] w-full" })}
                >
                  Editar perfil
                </Link>
                <p className="text-muted-foreground text-center text-[13px]">
                  Este é o seu perfil, do jeito que os candidatos veem.
                </p>
              </>
            ) : (
              <>
                <Link
                  href={`/agendar/${interviewer.profile_id}`}
                  className={buttonVariants({ size: "lg", className: "h-[54px] w-full" })}
                >
                  Agendar sessão
                </Link>
                <p className="text-muted-foreground text-center font-mono text-xs">
                  pagamento por PIX · confirmação na hora
                </p>
              </>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
