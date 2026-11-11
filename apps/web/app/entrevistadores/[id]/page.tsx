import { ArrowLeft, ArrowUpRight, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CodeAccent, CodeBlock, CodeString } from "@/components/code-block";
import { SiteHeader } from "@/components/site-header";
import { Tag } from "@/components/tag";
import { buttonVariants } from "@/components/ui/button";
import { formatPrice } from "@/lib/format-price";
import { ScoreBar } from "@/components/score-bar";
import { initials } from "@/lib/initials";
import { AREA_OPTIONS, SENIORITY_OPTIONS } from "@/lib/interviewer-options";
import { getFreeSlots } from "@/lib/slots";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const areaLabels: Record<string, string> = Object.fromEntries(
  AREA_OPTIONS.map((option) => [option.value, option.label]),
);
const seniorityLabels: Record<string, string> = Object.fromEntries(
  SENIORITY_OPTIONS.map((option) => [option.value, option.label]),
);

// weekday 0 = domingo, igual ao banco.
const WEEKDAY_SHORT = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

// "18 nov 2026", no horário de Brasília.
function formatReviewDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
    .format(new Date(iso))
    .replace(/ de /g, " ")
    .replace(".", "");
}

const H2 = "font-heading text-2xl font-bold";
const EXTERNAL_LINK = "text-brand-deep inline-flex min-h-11 items-center gap-1 font-bold underline";
const SLOT_CHIP =
  "edge bg-card inline-flex min-h-11 min-w-[52px] items-center justify-center rounded-lg px-2";

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

  const [freeSlots, { data: completedSessions }, { data: ratings }, { data: reviews }] =
    await Promise.all([
      getFreeSlots(supabase, id),
      supabase.rpc("interviewer_completed_sessions", { interviewer: id }),
      supabase.rpc("interviewer_ratings", { interviewer_ids: [id] }),
      // Nota, comentário e primeiro nome de quem avaliou. Se falhar, a seção some
      // e o resto do perfil segue.
      supabase.rpc("interviewer_reviews", { interviewer: id }),
    ]);

  // Horários livres de hoje a hoje + 6, já sem as sessões marcadas.
  const days = freeSlots.weeks[0] ?? [];
  const hasFreeSlots = days.some((day) => day.slots.length > 0);

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
                  {initials(profile.name ?? "")}
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

            {/* Avaliações públicas: saem pela função interviewer_reviews, que só entrega
                nota, comentário, data e o primeiro nome de quem avaliou. */}
            {reviews && reviews.length > 0 ? (
              <section className="flex flex-col gap-3">
                <div className="flex items-baseline gap-2.5">
                  <h2 className={H2}>Avaliações</h2>
                  <span className="text-muted-foreground font-mono text-[13px] tabular-nums">
                    {reviews.length}
                  </span>
                </div>
                <ul className="flex flex-col gap-3">
                  {reviews.map((review, index) => (
                    <li key={index} className="edge flex flex-col gap-2 rounded-2xl p-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <p className="font-extrabold break-words">
                          {review.reviewer_first_name ?? "Candidato"}
                        </p>
                        <span className="text-muted-foreground font-mono text-xs">
                          {formatReviewDate(review.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="max-w-[180px] flex-1">
                          <ScoreBar score={review.rating} />
                        </div>
                        <span className="font-mono text-sm font-bold tabular-nums">
                          {review.rating}/5
                        </span>
                      </div>
                      {review.comment ? (
                        <p className="max-w-[68ch] break-words whitespace-pre-line">
                          {review.comment}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <aside
            aria-label="Agendamento"
            className="pop edge bg-card box-border flex w-full min-w-0 flex-[1_1_340px] flex-col gap-[18px] rounded-[18px] p-[clamp(18px,2vw,24px)] [animation-delay:.12s] md:max-w-[420px]"
          >
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-heading text-4xl leading-none font-extrabold tabular-nums">
                {formatPrice(interviewer.price_cents)}
              </p>
              <span className="text-muted-foreground font-mono text-[13px]">sessão de 1h</span>
            </div>
            <div className="border-border border-t-[1.5px] border-dashed" />
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-extrabold">Horários livres</h2>
              <span className="text-muted-foreground font-mono text-xs">
                próximos 7 dias · Brasília
              </span>
            </div>

            {freeSlots.error ? (
              <p role="alert" className="text-muted-foreground text-sm">
                Não deu para carregar os horários. O problema é do nosso lado. Recarregue a página
                em alguns segundos.
              </p>
            ) : !freeSlots.hasBlocks ? (
              <p className="text-muted-foreground text-sm">Nenhum horário aberto no momento.</p>
            ) : !hasFreeSlots ? (
              <p className="text-muted-foreground text-sm">
                Sem horário livre nos próximos 7 dias. Veja a semana seguinte ao agendar.
              </p>
            ) : (
              <ul className="flex flex-col gap-2.5 font-mono text-[13px]">
                {days.map((day) => (
                  <li key={day.dayKey} className="flex items-start gap-2.5">
                    <span
                      className={`flex min-h-11 w-16 shrink-0 items-center ${
                        day.slots.length > 0 ? "font-bold" : "text-muted-foreground"
                      }`}
                    >
                      {WEEKDAY_SHORT[day.weekday]} {day.dayOfMonth}
                    </span>
                    {day.slots.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {day.slots.map((slot) =>
                          isOwner ? (
                            <span key={slot.startsAt} className={SLOT_CHIP}>
                              {slot.hour}h
                            </span>
                          ) : (
                            <Link
                              key={slot.startsAt}
                              href={`/agendar/${id}?slot=${encodeURIComponent(slot.startsAt)}`}
                              aria-label={`Agendar ${WEEKDAY_SHORT[day.weekday]} ${day.dayOfMonth} às ${slot.hour}h`}
                              className={`${SLOT_CHIP} lift hover:bg-accent`}
                            >
                              {slot.hour}h
                            </Link>
                          ),
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground flex min-h-11 items-center">
                        sem horários
                      </span>
                    )}
                  </li>
                ))}
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
