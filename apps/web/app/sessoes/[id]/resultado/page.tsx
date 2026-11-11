import { ArrowRight, ArrowUpRight, Bookmark, CheckCheck, FileCode2, FileText, PanelsTopLeft, Wrench } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { ScoreBar } from "@/components/score-bar";
import { initials } from "@/lib/initials";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SESSION_TYPE_LABELS: Record<string, string> = {
  coding: "Entrevista técnica",
  system_design: "System design",
  behavioral: "Comportamental",
};

const SCORE_LABELS: Record<string, string> = {
  comunicacao: "Comunicação",
  tecnica: "Técnica",
  resolucao: "Resolução de problemas",
};

// Plano de prática, materiais e observações detalhadas por competência
// (Figma node 3:6663) não têm coluna no banco ainda: nenhuma tabela guarda
// tarefas de prática, materiais da sessão ou texto por competência. Fica
// como conteúdo de exemplo, sempre marcado como tal, nunca junto do
// feedback real do entrevistador.
const EXAMPLE_PRACTICE_PLAN = [
  {
    number: "01",
    title: "Comece pelos testes",
    meta: "Prioridade alta · 20 min",
    description: "Escreva 4 casos de teste antes de olhar a solução de novo.",
  },
  {
    number: "02",
    title: "Explique em voz alta",
    meta: "Prioridade média · 15 min",
    description: "Grave uma explicação de 2 minutos: ideia, exemplo e complexidade.",
  },
  {
    number: "03",
    title: "Aplique em outro desafio",
    meta: "Prioridade média · 30 min",
    description: "Resolva um exercício parecido usando a mesma estrutura de dados.",
  },
];

const EXAMPLE_MATERIALS = [
  { icon: FileCode2, title: "Código final da sessão", description: "Disponível na sua sala" },
  { icon: PanelsTopLeft, title: "Quadro branco", description: "Mapa de raciocínio da sessão" },
  { icon: FileText, title: "Anotações do entrevistador", description: "Resumo e casos de teste" },
];

function formatSessionDate(iso: string) {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
    .formatToParts(new Date(iso))
    .reduce<Record<string, string>>((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});

  return `${parts.day} ${parts.month} ${parts.year} · ${parts.hour}h${parts.minute}`;
}

function ExampleTag() {
  return (
    <span className="bg-secondary text-primary w-fit rounded-full px-2.5 py-1 text-[11px] font-bold">
      Conteúdo de exemplo
    </span>
  );
}

export default async function SessionResultPage({
  params,
}: PageProps<"/sessoes/[id]/resultado">) {
  const { id } = await params;

  if (!UUID_RE.test(id)) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // RLS só deixa a query abaixo retornar linha se o usuário logado for o
  // candidate_id ou o interviewer_id desta sessão.
  const { data: session } = await supabase
    .from("sessions")
    .select("id, candidate_id, interviewer_id, starts_at, type, status")
    .eq("id", id)
    .maybeSingle();

  if (!session) {
    notFound();
  }

  const { data: feedback } = await supabase
    .from("feedbacks")
    .select("scores, strengths, improvements, would_hire, created_at")
    .eq("session_id", id)
    .maybeSingle();

  const [{ data: candidate }, { data: interviewer }, { data: interviewerProfile }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("name, target_role")
        .eq("id", session.candidate_id)
        .maybeSingle(),
      supabase
        .from("interviewers")
        .select("headline, company, bio, linkedin_url, github_url")
        .eq("profile_id", session.interviewer_id)
        .maybeSingle(),
      supabase
        .from("interviewer_profiles")
        .select("name, avatar_url")
        .eq("id", session.interviewer_id)
        .maybeSingle(),
    ]);

  const candidateFirstName = candidate?.name?.split(" ")[0] ?? "você";
  const interviewerName = interviewerProfile?.name ?? "Entrevistador";
  const sessionTypeLabel = SESSION_TYPE_LABELS[session.type] ?? session.type;
  const scores = (feedback?.scores as Record<string, number> | undefined) ?? {};
  const scoreEntries = Object.entries(scores);
  const average = scoreEntries.length
    ? scoreEntries.reduce((sum, [, value]) => sum + value, 0) / scoreEntries.length
    : null;

  return (
    <main className="flex min-h-screen flex-col">
      <SiteHeader />

      <div className="mx-auto flex w-full max-w-[1312px] flex-col gap-10 px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-3">
            <p className="text-primary text-xs font-extrabold tracking-[0.1em] uppercase">
              Cada treino deixa uma pista
            </p>
            <h1 className="font-heading text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold tracking-[-0.03em]">
              Você já tem um caminho, {candidateFirstName}.
            </h1>
            <p className="text-muted-foreground max-w-prose text-base">
              Veja o que funcionou e escolha o próximo ponto para praticar.
            </p>
          </div>

          {interviewer ? (
            <Link
              href={`/agendar/${session.interviewer_id}`}
              className="bg-primary text-primary-foreground flex h-12 shrink-0 items-center gap-2 rounded-xl px-5 text-sm font-bold"
            >
              Agendar outra sessão
              <ArrowRight aria-hidden="true" size={17} />
            </Link>
          ) : null}
        </div>

        <Link href="/sessoes" className="text-primary -mt-4 w-fit text-sm font-semibold">
          ← Voltar para minhas sessões
        </Link>

        <div className="border-border bg-card flex flex-wrap items-center gap-5 rounded-[20px] border p-6">
          {interviewerProfile?.avatar_url ? (
            <Image
              src={interviewerProfile.avatar_url}
              alt={interviewerName}
              width={56}
              height={56}
              className="rounded-2xl"
              unoptimized
            />
          ) : (
            <div className="bg-secondary text-primary flex size-14 shrink-0 items-center justify-center rounded-2xl font-heading text-lg font-bold">
              {initials(interviewerName)}
            </div>
          )}

          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="font-heading truncate text-lg font-bold tracking-[-0.01em]">
              {sessionTypeLabel}
              {candidate?.target_role ? ` · ${candidate.target_role}` : ""}
            </p>
            <p className="text-muted-foreground truncate text-sm">
              {interviewerName}
              {interviewer ? ` · ${interviewer.headline} · ${interviewer.company}` : ""}
            </p>
            <p className="text-muted-foreground truncate text-xs">
              {formatSessionDate(session.starts_at)} · Brasília (UTC-3)
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="bg-secondary text-primary rounded-md px-2.5 py-1 text-xs font-bold">
              {session.status === "completed" ? "Sessão concluída" : session.status}
            </span>
            {feedback?.created_at ? (
              <span className="text-muted-foreground text-xs">
                Feedback de {formatSessionDate(feedback.created_at)}
              </span>
            ) : null}
          </div>
        </div>

        {feedback ? (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
            <div className="flex flex-col gap-6">
              <div className="bg-secondary flex flex-col gap-5 rounded-[20px] p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex flex-col gap-1.5">
                    <p className="text-primary text-xs font-extrabold tracking-[0.1em] uppercase">
                      Visão geral de {interviewerName}
                    </p>
                    <h2 className="font-heading text-2xl font-extrabold tracking-[-0.02em]">
                      {feedback.would_hire
                        ? "Mandou bem, você está pronto."
                        : "Uma base boa, com espaço para refinar."}
                    </h2>
                  </div>
                  {average !== null ? (
                    <div className="flex shrink-0 flex-col items-end">
                      <span className="font-heading text-3xl font-bold tabular-nums">
                        {average.toFixed(1).replace(".", ",")}/5
                      </span>
                      <span className="text-muted-foreground text-xs">
                        média das {scoreEntries.length} competências
                      </span>
                    </div>
                  ) : null}
                </div>
                <p className="text-sm">
                  {feedback.would_hire
                    ? `${interviewerName} recomendaria você para essa vaga hoje.`
                    : `${interviewerName} ainda não recomendaria você para essa vaga, mas o caminho tá traçado.`}
                </p>
                <p className="text-muted-foreground text-xs">
                  Essa avaliação orienta sua prática. Não é uma previsão de
                  aprovação em processos seletivos.
                </p>
              </div>

              {scoreEntries.length > 0 ? (
                <div className="border-border bg-card flex flex-col gap-6 rounded-[20px] border p-7">
                  <div className="flex items-center justify-between">
                    <h2 className="font-heading text-xl font-bold">
                      Seu treino, por competência
                    </h2>
                    <span className="text-muted-foreground text-xs">Escala de 1 a 5</span>
                  </div>

                  <div className="flex flex-col gap-5">
                    {scoreEntries.map(([key, value]) => (
                      <div key={key} className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-extrabold">
                            {SCORE_LABELS[key] ?? key}
                          </span>
                          <span className="text-primary text-sm font-extrabold tabular-nums">
                            {value}/5
                          </span>
                        </div>
                        <ScoreBar score={value} />
                      </div>
                    ))}
                  </div>

                  <p className="border-border text-muted-foreground border-t pt-4 text-xs">
                    1 · Precisa de apoio &nbsp; 2 · Em construção &nbsp; 3 · Base
                    consistente &nbsp; 4 · Boa autonomia &nbsp; 5 · Domínio no
                    desafio
                  </p>
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {feedback.strengths ? (
                  <div className="border-border bg-card flex flex-col gap-3 rounded-[20px] border p-6">
                    <div className="flex items-center gap-2.5">
                      <CheckCheck aria-hidden="true" size={20} className="text-primary" />
                      <h3 className="font-heading text-lg font-bold">
                        Leve com você
                      </h3>
                    </div>
                    <p className="text-sm">{feedback.strengths}</p>
                  </div>
                ) : null}

                {feedback.improvements ? (
                  <div className="border-border bg-card flex flex-col gap-3 rounded-[20px] border p-6">
                    <div className="flex items-center gap-2.5">
                      <Wrench aria-hidden="true" size={20} className="text-primary" />
                      <h3 className="font-heading text-lg font-bold">
                        Ajuste no próximo
                      </h3>
                    </div>
                    <p className="text-sm">{feedback.improvements}</p>
                  </div>
                ) : null}
              </div>

              {interviewer ? (
                <aside className="border-border bg-card flex flex-col gap-4 rounded-[20px] border p-6">
                  <p className="text-muted-foreground text-xs font-bold tracking-[0.04em] uppercase">
                    Quem te entrevistou
                  </p>

                  <div className="flex items-center gap-3">
                    {interviewerProfile?.avatar_url ? (
                      <Image
                        src={interviewerProfile.avatar_url}
                        alt={interviewerName}
                        width={48}
                        height={48}
                        className="rounded-full"
                        unoptimized
                      />
                    ) : (
                      <div className="bg-secondary text-primary flex size-12 shrink-0 items-center justify-center rounded-full font-heading font-bold">
                        {initials(interviewerName)}
                      </div>
                    )}
                    <div className="flex min-w-0 flex-col">
                      <p className="truncate font-bold">{interviewerName}</p>
                      <p className="text-muted-foreground truncate text-xs">
                        {interviewer.headline} · {interviewer.company}
                      </p>
                    </div>
                  </div>

                  {interviewer.bio ? (
                    <p className="text-muted-foreground line-clamp-3 text-sm">
                      {interviewer.bio}
                    </p>
                  ) : null}

                  <div className="flex flex-col gap-1.5">
                    {interviewer.linkedin_url ? (
                      <a
                        href={interviewer.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary text-sm font-semibold"
                      >
                        Ver perfil no LinkedIn →
                      </a>
                    ) : null}
                    {interviewer.github_url ? (
                      <a
                        href={interviewer.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary text-sm font-semibold"
                      >
                        Ver GitHub →
                      </a>
                    ) : null}
                  </div>
                </aside>
              ) : null}
            </div>

            {/* Sidebar "próximos passos": sem tabela de plano de prática ou
                materiais da sessão ainda. Conteúdo de exemplo, marcado como
                tal, nunca misturado com o feedback real acima. */}
            <div className="flex flex-col gap-6">
              <div className="border-border bg-card flex flex-col gap-5 rounded-[20px] border p-6">
                <div className="flex items-center justify-between">
                  <p className="text-primary text-xs font-extrabold tracking-[0.1em] uppercase">
                    Seu plano de prática
                  </p>
                  <ExampleTag />
                </div>
                <h3 className="font-heading text-xl font-extrabold tracking-[-0.02em]">
                  Uma semana. Três passos possíveis.
                </h3>

                <div className="flex flex-col gap-4">
                  {EXAMPLE_PRACTICE_PLAN.map((task, index) => (
                    <div
                      key={task.number}
                      className={`flex flex-col gap-1.5 ${
                        index < EXAMPLE_PRACTICE_PLAN.length - 1
                          ? "border-border border-b pb-4"
                          : ""
                      }`}
                    >
                      <div className="flex items-baseline gap-2">
                        <span className="text-muted-foreground text-xs font-bold">
                          {task.number}
                        </span>
                        <span className="text-sm font-extrabold">{task.title}</span>
                      </div>
                      <span className="text-muted-foreground text-xs">{task.meta}</span>
                      <p className="text-sm">{task.description}</p>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  disabled
                  className="text-primary flex items-center gap-1.5 text-sm font-bold opacity-60"
                >
                  Marcar plano como salvo
                  <Bookmark aria-hidden="true" size={15} />
                </button>
              </div>

              <div className="border-border bg-card flex flex-col gap-4 rounded-[20px] border p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-lg font-bold">Materiais do treino</h3>
                  <ExampleTag />
                </div>

                <div className="flex flex-col gap-3">
                  {EXAMPLE_MATERIALS.map((material, index) => {
                    const Icon = material.icon;
                    return (
                      <div
                        key={material.title}
                        className={`flex items-center gap-3 ${
                          index < EXAMPLE_MATERIALS.length - 1
                            ? "border-border border-b pb-3"
                            : ""
                        }`}
                      >
                        <Icon aria-hidden="true" size={18} className="text-primary shrink-0" />
                        <div className="flex min-w-0 flex-1 flex-col">
                          <p className="truncate text-sm font-bold">{material.title}</p>
                          <p className="text-muted-foreground truncate text-xs">
                            {material.description}
                          </p>
                        </div>
                        <ArrowUpRight aria-hidden="true" size={15} className="text-muted-foreground shrink-0" />
                      </div>
                    );
                  })}
                </div>
                <p className="text-muted-foreground text-xs">
                  Não houve gravação de vídeo. Seu código e quadro ficam
                  disponíveis na sua sala.
                </p>
              </div>

              {interviewer ? (
                <div className="border-border bg-card flex flex-col gap-3 rounded-[20px] border p-6">
                  <div className="flex items-center justify-between">
                    <span className="sr-only">Mensagem do entrevistador</span>
                    <ExampleTag />
                  </div>
                  <div className="flex items-center gap-2.5">
                    {interviewerProfile?.avatar_url ? (
                      <Image
                        src={interviewerProfile.avatar_url}
                        alt={interviewerName}
                        width={40}
                        height={40}
                        className="rounded-full"
                        unoptimized
                      />
                    ) : (
                      <div className="bg-secondary text-primary flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                        {initials(interviewerName)}
                      </div>
                    )}
                  </div>
                  <p className="font-heading text-sm leading-snug font-bold">
                    &ldquo;Você não precisa acertar tudo de primeira. Continue
                    tornando seu raciocínio visível.&rdquo;
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {interviewerName} · Seu entrevistador
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="border-border bg-card flex flex-col items-center gap-2 rounded-[20px] border p-16 text-center">
            <p className="font-heading text-xl font-bold">
              O feedback ainda não chegou
            </p>
            <p className="text-muted-foreground text-sm">
              Assim que {interviewerName} enviar, aparece aqui.
            </p>
          </div>
        )}

        {interviewer ? (
          <div className="border-border bg-card flex flex-wrap items-center justify-between gap-6 rounded-[20px] border p-7">
            <div className="flex flex-col gap-1.5">
              <h2 className="font-heading text-2xl font-bold tracking-[-0.02em]">
                Pratique, volte e perceba a diferença.
              </h2>
              <p className="text-muted-foreground text-sm">
                Quando fizer sentido para você, um novo treino ajuda a testar
                o que mudou.
              </p>
            </div>
            <Link
              href={`/agendar/${session.interviewer_id}`}
              className="bg-primary text-primary-foreground flex h-12 shrink-0 items-center gap-2 rounded-xl px-5 text-sm font-bold"
            >
              Agendar outra sessão
              <ArrowRight aria-hidden="true" size={17} />
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}
