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
import { FadeIn } from "@/components/motion/fade-in";
import { HoverLift } from "@/components/motion/hover-lift";
import { SiteHeader } from "@/components/site-header";
import { nextAvailableSlot } from "@/lib/availability";
import { initials } from "@/lib/initials";
import {
  AREA_OPTIONS,
  SENIORITY_OPTIONS,
  WEEKDAY_LABELS,
} from "@/lib/interviewer-options";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const priceFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const areaLabels = Object.fromEntries(
  AREA_OPTIONS.map((option) => [option.value, option.label]),
);
const seniorityLabels = Object.fromEntries(
  SENIORITY_OPTIONS.map((option) => [option.value, option.label]),
);

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

  const nextSlot = nextAvailableSlot(availability ?? []);
  const joinYear = new Date(interviewer.created_at).getFullYear();
  const sessionsCount = typeof completedSessions === "number" ? completedSessions : 0;
  const rating = ratings?.[0] ?? null;

  return (
    <main className="flex min-h-screen flex-col">
      <SiteHeader />

      {/* Hero Índigo de largura total (Figma node 3:5021), substitui o card
          branco que existia antes. */}
      <section className="bg-primary text-primary-foreground">
        <FadeIn className="mx-auto flex max-w-[1312px] flex-col gap-6 px-6 py-12 lg:px-0">
          <div className="flex flex-wrap items-center gap-6">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.name}
                width={96}
                height={96}
                className="rounded-[24px]"
                unoptimized
              />
            ) : (
              <div className="bg-secondary text-primary flex size-24 shrink-0 items-center justify-center rounded-[24px] font-heading text-2xl font-bold">
                {initials(profile.name)}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <p className="text-[11px] font-extrabold tracking-[0.1em] uppercase opacity-80">
                Seu treino, com experiência de mercado
              </p>
              <h1 className="font-heading text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">
                {profile.name}
              </h1>
              <p className="text-lg opacity-90">{interviewer.headline}</p>
              <p className="text-sm opacity-80">{interviewer.company}</p>
              {!isVisible ? (
                <span className="bg-lume text-foreground mt-1 w-fit rounded-full px-2.5 py-1 text-xs font-semibold">
                  {interviewer.active
                    ? "Perfil pausado (visível só pra você)"
                    : "Aguardando aprovação (visível só pra você)"}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm opacity-90">
            <span>
              <span className="text-lume font-bold">{sessionsCount}</span>{" "}
              {sessionsCount === 1 ? "sessão" : "sessões"} na Lugh
            </span>
            {rating && rating.review_count > 0 ? (
              <span>
                <span className="text-lume">★</span>{" "}
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

          <div className="h-px bg-primary-foreground/25" />

          <div className="flex flex-wrap gap-2">
            {interviewer.areas.map((area) => (
              <span
                key={area}
                className="bg-card text-primary rounded-md px-2.5 py-1.5 text-xs font-semibold"
              >
                {areaLabels[area] ?? area}
              </span>
            ))}
            <span className="bg-card text-primary rounded-md px-2.5 py-1.5 text-xs font-semibold">
              {seniorityLabels[interviewer.seniority] ?? interviewer.seniority}
            </span>
          </div>
        </FadeIn>
      </section>

      <div className="mx-auto flex w-full max-w-[1312px] flex-col gap-6 px-6 py-10">
        <Link
          href="/entrevistadores"
          className="text-primary group inline-flex items-center gap-1.5 text-sm font-semibold"
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
              <FadeIn className="border-border bg-card flex flex-col gap-4 rounded-[20px] border p-7">
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
              className="border-border bg-card flex flex-col gap-5 rounded-[20px] border p-7"
            >
              <h2 className="font-heading text-xl font-bold">
                O que vamos praticar
              </h2>

              <div className="flex flex-col gap-4">
                {SESSION_AGENDA.map((item) => (
                  <div key={item.title} className="flex items-start gap-4">
                    <span className="bg-secondary text-primary flex shrink-0 items-center justify-center rounded-md px-2.5 py-1.5 text-xs font-bold">
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

              <p className="text-muted-foreground border-border border-t pt-4 text-xs">
                Traga um computador, conexão estável e vontade de tentar. Não
                precisa preparar uma solução nem instalar ferramentas.
              </p>
            </FadeIn>

            <FadeIn
              index={2}
              className="border-border bg-card flex flex-col gap-4 rounded-[20px] border p-7"
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
                              className="text-primary bg-secondary flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
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

            {/* Comentário de review continua privado aos dois participantes
                (RLS de public.reviews), só a média/contagem é pública. */}
            <FadeIn
              index={3}
              className="border-border bg-card flex flex-col gap-3 rounded-[20px] border p-7"
            >
              <h2 className="font-heading text-xl font-bold">
                Quem treinou, conta
              </h2>
              {rating && rating.review_count > 0 ? (
                <p className="text-foreground/70 text-sm">
                  Nota média de{" "}
                  <span className="text-lume font-bold">
                    {rating.average.toFixed(1).replace(".", ",")}
                  </span>{" "}
                  em {rating.review_count}{" "}
                  {rating.review_count === 1 ? "avaliação" : "avaliações"}.
                </p>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Ainda sem avaliações. As primeiras sessões concluídas
                  aparecem aqui.
                </p>
              )}
            </FadeIn>

            <FadeIn
              index={4}
              className="flex flex-wrap gap-3"
            >
              <a
                href={interviewer.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="border-border hover:border-primary hover:text-primary flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors"
              >
                LinkedIn
                <ExternalLink aria-hidden="true" size={13} />
              </a>
              {interviewer.github_url ? (
                <a
                  href={interviewer.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-border hover:border-primary hover:text-primary flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors"
                >
                  GitHub
                  <ExternalLink aria-hidden="true" size={13} />
                </a>
              ) : null}
            </FadeIn>
          </div>

          <FadeIn index={5}>
            <div className="flex flex-col gap-5">
              <aside className="border-border bg-card flex h-fit flex-col gap-5 rounded-[20px] border p-6">
                <div className="flex flex-col gap-2">
                  <p className="text-primary text-xs font-extrabold tracking-[0.1em] uppercase">
                    Um passo mais perto
                  </p>
                  <h2 className="font-heading text-2xl font-extrabold tracking-[-0.02em]">
                    Vamos treinar?
                  </h2>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-heading text-primary text-3xl font-extrabold tracking-[-0.03em] tabular-nums">
                    {priceFormatter.format(interviewer.price_cents / 100)}
                  </span>
                  <span className="text-muted-foreground text-sm">/ sessão</span>
                </div>
                <p className="text-foreground/70 text-sm">
                  60 min ao vivo · Individual
                </p>

                <div className="border-border border-t" />

                <div className="flex flex-col gap-2.5">
                  {INCLUSIONS.map((item) => (
                    <div key={item} className="flex items-start gap-2.5">
                      <Check
                        aria-hidden="true"
                        size={15}
                        className="text-primary mt-0.5 shrink-0"
                      />
                      <p className="text-foreground/70 text-sm">{item}</p>
                    </div>
                  ))}
                </div>

                {nextSlot ? (
                  <div className="bg-lume flex flex-col gap-1 rounded-xl p-4">
                    <p className="text-lume-foreground text-[10px] font-extrabold tracking-[0.06em] uppercase">
                      Próximo horário
                    </p>
                    <p className="text-lume-foreground text-sm font-bold">
                      {nextSlot}
                    </p>
                    <p className="text-lume-foreground text-xs">
                      Horário de Brasília.
                    </p>
                  </div>
                ) : null}

                <HoverLift>
                  {isOwner ? (
                    <Link
                      href="/painel/perfil"
                      className="border-border flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-bold"
                    >
                      Editar perfil
                    </Link>
                  ) : (
                    <Link
                      href={`/agendar/${interviewer.profile_id}`}
                      className="bg-primary text-primary-foreground flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-bold"
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

              <div className="border-border bg-card flex items-start gap-3 rounded-[20px] border p-5">
                <CalendarCheck
                  aria-hidden="true"
                  size={20}
                  className="text-primary mt-0.5 shrink-0"
                />
                <p className="text-foreground/70 text-sm">
                  Mudou de plano? Você pode cancelar ou remarcar sem custo
                  até 24h antes.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>

      <footer className="border-border bg-card flex flex-wrap items-center justify-between gap-2 border-t px-6 py-5 lg:px-16">
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
