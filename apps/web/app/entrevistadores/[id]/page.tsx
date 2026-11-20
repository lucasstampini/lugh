import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  Check,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GitHubIcon, LinkedInIcon } from "@/components/brand-icons";
import { FadeIn } from "@/components/motion/fade-in";
import { ScoreBar } from "@/components/score-bar";
import { HoverLift } from "@/components/motion/hover-lift";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { formatPrice } from "@/lib/format-price";
import { initials } from "@/lib/initials";
import { computeAllWeeks, getFreeSlots, upcomingSlotLabels } from "@/lib/slots";
import {
  AREA_OPTIONS,
  SENIORITY_OPTIONS,
  WEEKDAY_LABELS,
} from "@/lib/interviewer-options";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Pílula dos links sociais, sobre a faixa azul: contorno branco translúcido
// que fecha no hover. A logo da plataforma herda a cor do texto.
const SOCIAL_LINK =
  "flex min-h-9 items-center gap-2 rounded-full border border-white/45 px-3 text-sm font-semibold text-white transition-colors hover:border-white hover:bg-white/15";

const areaLabels = Object.fromEntries(
  AREA_OPTIONS.map((option) => [option.value, option.label]),
);
const seniorityLabels = Object.fromEntries(
  SENIORITY_OPTIONS.map((option) => [option.value, option.label]),
);

// weekday 0 = domingo, igual ao banco.
const WEEKDAY_SHORT = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

// Figma node 3:5021. Os minutos são ilustrativos, igual já era antes: a
// sessão de verdade não tem um roteiro rígido por minuto no banco.
const SESSION_AGENDA = [
  {
    tag: "10 min",
    title: "Contexto e aquecimento",
    description: "Você conta seu objetivo e a gente alinha o desafio.",
  },
  {
    tag: "35 min",
    title: "Desafio técnico ao vivo",
    description: "Código, system design ou comportamental, pensando em voz alta.",
  },
  {
    tag: "15 min",
    title: "Conversa e próximos passos",
    description: "Debrief do exercício, dúvidas e orientações iniciais.",
  },
];

const INCLUSIONS = [
  "Vídeo, código e quadro branco juntos",
  "Feedback estruturado após a sessão",
  "Horário sempre em fuso de Brasília",
];

function formatTime(time: string) {
  return time.slice(0, 5);
}

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

  // Colunas de view chegam como anuláveis nos tipos gerados.
  const profileName = profile.name ?? "";

  const [
    { data: availability },
    { data: completedSessions },
    { data: ratings },
    { data: reviews },
    freeSlots,
  ] = await Promise.all([
      supabase
        .from("availability")
        .select("weekday, start_time, end_time")
        .eq("interviewer_id", id)
        .order("weekday")
        .order("start_time"),
      supabase.rpc("interviewer_completed_sessions", { interviewer: id }),
      supabase.rpc("interviewer_ratings", { interviewer_ids: [id] }),
      // Nota, comentário, data e primeiro nome de quem avaliou: a função só
      // devolve o que é público.
      supabase.rpc("interviewer_reviews", { interviewer: id }),
      // Agenda dos próximos 7 dias, já sem as sessões marcadas.
      getFreeSlots(supabase, id),
    ]);

  // Se a função de sessões marcadas não estiver publicada no banco, a agenda
  // ainda aparece, montada só com os blocos de disponibilidade.
  const slotsFallback =
    freeSlots.error && (availability?.length ?? 0) > 0
      ? computeAllWeeks({ blocks: availability ?? [], booked: [], now: new Date() })
      : null;
  const slotWeeks = slotsFallback ?? freeSlots.weeks;
  const slotsFailed = freeSlots.error && !slotsFallback;
  const hasBlocks = freeSlots.hasBlocks || (availability?.length ?? 0) > 0;

  const freeDays = slotWeeks[0] ?? [];
  const hasFreeSlots = freeDays.some((day) => day.slots.length > 0);

  const blocksByWeekday = new Map<number, { start: string; end: string }[]>();
  for (const block of availability ?? []) {
    const list = blocksByWeekday.get(block.weekday) ?? [];
    list.push({ start: block.start_time, end: block.end_time });
    blocksByWeekday.set(block.weekday, list);
  }

  // O destaque sai das mesmas semanas da agenda, já sem as sessões marcadas:
  // nunca promete um horário que não dá mais para agendar.
  const nextSlot = upcomingSlotLabels(slotWeeks, 1)[0] ?? null;
  const joinYear = new Date(interviewer.created_at).getFullYear();
  const sessionsCount = typeof completedSessions === "number" ? completedSessions : 0;
  const rating = ratings?.[0] ?? null;

  return (
    <main className="flex min-h-screen flex-col">
      <SiteHeader />

      {/* Faixa de topo azul, de largura total (Figma node 3:5021). O amarelo
          fica para os botões de ação: aqui ele competia com o nome. */}
      <section
        className="edge-b bg-brand-deep text-white"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.16) 1.4px, transparent 1.4px)",
          backgroundSize: "26px 26px",
        }}
      >
        <FadeIn className="mx-auto flex max-w-[1312px] flex-col gap-6 px-6 py-12">
          <div className="flex flex-wrap items-center gap-6">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profileName}
                width={96}
                height={96}
                className="rounded-[24px]"
                unoptimized
              />
            ) : (
              <div className="edge bg-card text-ink flex size-24 shrink-0 items-center justify-center rounded-[24px] font-heading text-2xl font-bold">
                {initials(profileName)}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <p className="text-[11px] font-extrabold tracking-[0.1em] text-white/75 uppercase">
                Seu treino, com experiência de mercado
              </p>
              {/* Nome e links sociais na mesma linha, dentro da faixa. */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <h1 className="font-heading text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">
                  {profileName}
                </h1>

                <div className="flex flex-wrap items-center gap-2">
                  {interviewer.linkedin_url ? (
                    <a
                      href={interviewer.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={SOCIAL_LINK}
                    >
                      <LinkedInIcon size={15} />
                      LinkedIn
                      <ExternalLink aria-hidden="true" size={13} className="opacity-70" />
                    </a>
                  ) : null}
                  {interviewer.github_url ? (
                    <a
                      href={interviewer.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={SOCIAL_LINK}
                    >
                      <GitHubIcon size={15} />
                      GitHub
                      <ExternalLink aria-hidden="true" size={13} className="opacity-70" />
                    </a>
                  ) : null}
                </div>
              </div>
              <p className="text-lg font-semibold">{interviewer.headline}</p>
              <p className="text-sm text-white/75">{interviewer.company}</p>
              {!isVisible ? (
                <span className="edge bg-primary text-ink mt-1 w-fit rounded-full px-2.5 py-1 text-xs font-bold">
                  {interviewer.active
                    ? "Perfil pausado (visível só pra você)"
                    : "Aguardando aprovação (visível só pra você)"}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/80">
            <span>
              <span className="font-bold text-white">{sessionsCount}</span>{" "}
              {sessionsCount === 1 ? "sessão" : "sessões"} na Lugh
            </span>
            {rating && rating.review_count > 0 ? (
              <span>
                <span className="text-primary">★</span>{" "}
                <span className="font-bold">
                  {rating.average.toFixed(1).replace(".", ",")}
                </span>{" "}
                · {rating.review_count}{" "}
                {rating.review_count === 1 ? "avaliação" : "avaliações"}
              </span>
            ) : null}
            <span>
              {interviewer.areas.length}{" "}
              {interviewer.areas.length === 1 ? "área" : "áreas"} de atuação
            </span>
            <span>No Lugh desde {joinYear}</span>
          </div>

          <div className="h-px bg-white/25" />

          <div className="flex flex-wrap gap-2">
            {interviewer.areas.map((area) => (
              <span
                key={area}
                className="edge bg-card text-ink rounded-md px-2.5 py-1.5 text-xs font-semibold"
              >
                {areaLabels[area] ?? area}
              </span>
            ))}
            <span className="edge bg-card text-ink rounded-md px-2.5 py-1.5 text-xs font-semibold">
              {seniorityLabels[interviewer.seniority] ?? interviewer.seniority}
            </span>
          </div>
        </FadeIn>
      </section>

      <div className="mx-auto flex w-full max-w-[1312px] flex-col gap-6 px-6 py-10">
        <Link
          href="/entrevistadores"
          className="text-brand-deep group inline-flex items-center gap-1.5 text-sm font-semibold"
        >
          <ArrowLeft
            aria-hidden="true"
            size={15}
            className="transition-transform duration-200 group-hover:-translate-x-0.5"
          />
          Voltar para profissionais
        </Link>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
          <div className="flex flex-col gap-5">
            {interviewer.bio ? (
              <FadeIn className="border-border-soft bg-card flex flex-col gap-4 rounded-[20px] border p-7">
                <h2 className="font-heading text-xl font-bold">
                  Um pouco sobre mim
                </h2>
                <p className="text-foreground text-base leading-relaxed">
                  {interviewer.bio}
                </p>
              </FadeIn>
            ) : null}

            <FadeIn
              index={1}
              className="border-border-soft bg-card flex flex-col gap-5 rounded-[20px] border p-7"
            >
              <h2 className="font-heading text-xl font-bold">
                O que vamos praticar
              </h2>

              <div className="flex flex-col gap-4">
                {SESSION_AGENDA.map((item) => (
                  <div key={item.title} className="flex items-start gap-4">
                    <span className="bg-accent text-ink flex shrink-0 items-center justify-center rounded-md px-2.5 py-1.5 text-xs font-bold">
                      {item.tag}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm font-bold">{item.title}</p>
                      <p className="text-foreground/70 text-sm">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-muted-foreground border-border-soft border-t pt-4 text-xs">
                Traga um computador, conexão estável e vontade de tentar. Não
                precisa preparar uma solução nem instalar ferramentas.
              </p>
            </FadeIn>

            <FadeIn
              index={2}
              className="border-border-soft bg-card flex flex-col gap-4 rounded-[20px] border p-7"
            >
              <h2 className="font-heading text-xl font-bold">Disponibilidade</h2>
              <p className="text-muted-foreground text-sm">
                Horários em Brasília (America/Sao_Paulo).
              </p>

              {blocksByWeekday.size === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Nenhum horário cadastrado ainda.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {Array.from(blocksByWeekday.entries()).map(
                    ([weekday, blocks]) => (
                      <div
                        key={weekday}
                        className="flex flex-wrap items-center gap-3"
                      >
                        <span className="w-24 text-sm font-bold">
                          {WEEKDAY_LABELS[weekday]}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {blocks.map((block, index) => (
                            <span
                              key={index}
                              className="bg-accent text-ink flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                            >
                              <CalendarDays aria-hidden="true" size={12} />
                              {formatTime(block.start)} às {formatTime(block.end)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
            </FadeIn>
            {/* Quem treinou, conta: média em destaque e, abaixo, cada avaliação
                pública com nota, comentário e data, como no site no ar. */}
            <FadeIn
              index={3}
              className="border-border-soft bg-card flex flex-col gap-4 rounded-[20px] border p-7"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="font-heading text-xl font-bold">Quem treinou, conta</h2>
                {rating && rating.review_count > 0 ? (
                  <span className="text-muted-foreground font-mono text-xs">
                    {rating.review_count}{" "}
                    {rating.review_count === 1 ? "avaliação" : "avaliações"}
                  </span>
                ) : null}
              </div>

              {rating && rating.review_count > 0 ? (
                <div className="bg-accent flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl p-4">
                  <span className="font-heading text-3xl leading-none font-extrabold tabular-nums">
                    {rating.average.toFixed(1).replace(".", ",")}
                  </span>
                  <div className="min-w-[140px] flex-1">
                    <ScoreBar score={Math.round(rating.average)} />
                  </div>
                  <span className="text-muted-foreground text-xs">
                    média das sessões concluídas
                  </span>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Ainda sem avaliações. As primeiras sessões concluídas aparecem aqui.
                </p>
              )}

              {reviews && reviews.length > 0 ? (
                <ul className="flex flex-col gap-3">
                  {reviews.map((review, index) => (
                    <li
                      key={index}
                      className="border-border-soft flex flex-col gap-2 rounded-xl border p-4"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <p className="font-bold break-words">
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
                        <p className="text-foreground/80 max-w-[68ch] text-sm break-words whitespace-pre-line">
                          {review.comment}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </FadeIn>
          </div>

          <FadeIn index={5}>
            <div className="flex flex-col gap-5">
              <aside className="border-border-soft bg-card flex h-fit flex-col gap-5 rounded-[20px] border p-6">
                <div className="flex flex-col gap-2">
                  <p className="text-brand-deep text-xs font-extrabold tracking-[0.1em] uppercase">
                    Um passo mais perto
                  </p>
                  <h2 className="font-heading text-2xl font-extrabold tracking-[-0.02em]">
                    Vamos treinar?
                  </h2>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-heading text-brand-deep text-3xl font-extrabold tracking-[-0.03em] tabular-nums">
                    {formatPrice(interviewer.price_cents)}
                  </span>
                  <span className="text-muted-foreground text-sm">/ sessão</span>
                </div>
                <p className="text-foreground/70 text-sm">
                  60 min ao vivo · Individual
                </p>

                <div className="border-border-soft border-t" />

                <div className="flex flex-col gap-2.5">
                  {INCLUSIONS.map((item) => (
                    <div key={item} className="flex items-start gap-2.5">
                      <Check
                        aria-hidden="true"
                        size={15}
                        className="text-brand-deep mt-0.5 shrink-0"
                      />
                      <p className="text-foreground/70 text-sm">{item}</p>
                    </div>
                  ))}
                </div>

                {/* Agenda dos próximos 7 dias: cada horário leva direto para o
                    agendamento daquele slot. */}
                <div className="border-border-soft flex flex-col gap-3 rounded-xl border p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className="text-[10px] font-extrabold tracking-[0.06em] uppercase">
                      Horários livres
                    </p>
                    <span className="text-muted-foreground font-mono text-[11px]">
                      próximos 7 dias · Brasília
                    </span>
                  </div>

                  {nextSlot ? (
                    <div className="edge bg-primary flex flex-col gap-0.5 rounded-lg p-3">
                      <p className="text-ink text-[10px] font-extrabold tracking-[0.06em] uppercase">
                        Próximo horário
                      </p>
                      <p className="text-ink text-sm font-bold">{nextSlot}</p>
                    </div>
                  ) : null}

                  {slotsFailed ? (
                    <p role="alert" className="text-muted-foreground text-sm">
                      Não deu para carregar os horários. Recarregue em alguns segundos.
                    </p>
                  ) : !hasBlocks ? (
                    <p className="text-muted-foreground text-sm">
                      Nenhum horário aberto no momento.
                    </p>
                  ) : !hasFreeSlots ? (
                    <p className="text-muted-foreground text-sm">
                      Sem horário livre nos próximos 7 dias. Veja a semana seguinte ao
                      agendar.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {freeDays.map((day) => (
                        <li key={day.dayKey} className="flex items-start gap-2.5">
                          <span
                            className={`w-14 shrink-0 pt-1 font-mono text-xs ${
                              day.slots.length > 0 ? "font-bold" : "text-muted-foreground"
                            }`}
                          >
                            {WEEKDAY_SHORT[day.weekday]} {day.dayOfMonth}
                          </span>

                          {day.slots.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {day.slots.map((slot) =>
                                isOwner ? (
                                  <span
                                    key={slot.startsAt}
                                    className="bg-accent text-ink rounded-full px-2.5 py-1 font-mono text-xs font-semibold"
                                  >
                                    {slot.hour}h
                                  </span>
                                ) : (
                                  <Link
                                    key={slot.startsAt}
                                    href={`/agendar/${id}?slot=${encodeURIComponent(slot.startsAt)}`}
                                    aria-label={`Agendar ${WEEKDAY_SHORT[day.weekday]} ${day.dayOfMonth} às ${slot.hour}h`}
                                    className="bg-accent text-ink hover:bg-brand-deep rounded-full px-2.5 py-1 font-mono text-xs font-semibold transition-colors hover:text-white"
                                  >
                                    {slot.hour}h
                                  </Link>
                                ),
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground pt-1 font-mono text-xs">
                              sem horários
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <HoverLift>
                  {isOwner ? (
                    <Link
                      href="/painel/perfil"
                      className="border-border-soft flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-bold"
                    >
                      Editar perfil
                    </Link>
                  ) : (
                    <Link
                      href={`/agendar/${interviewer.profile_id}`}
                      className={buttonVariants({ className: "h-12 w-full gap-2" })}
                    >
                      Escolher horário
                      <ArrowRight aria-hidden="true" size={16} />
                    </Link>
                  )}
                </HoverLift>

                <p className="text-muted-foreground text-center text-xs">
                  Pague com PIX depois de escolher. Sem assinatura ou taxa
                  extra.
                </p>
              </aside>

              <div className="border-border-soft bg-card flex items-start gap-3 rounded-[20px] border p-5">
                <CalendarCheck
                  aria-hidden="true"
                  size={20}
                  className="text-brand-deep mt-0.5 shrink-0"
                />
                <p className="text-foreground/70 text-sm">
                  Depois do PIX confirmado, a sessão aparece em Minhas sessões
                  e a sala abre 10 minutos antes do horário.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>

      <footer className="border-border-soft bg-card flex flex-wrap items-center justify-between gap-2 border-t px-6 py-5 lg:px-16">
        <span className="text-muted-foreground text-xs">
          lugh / Seu próximo passo começa no treino.
        </span>
        <span className="text-muted-foreground text-xs">
          Precisa de uma mão? Fale com a gente
        </span>
      </footer>
    </main>
  );
}
