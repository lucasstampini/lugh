import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CodeAccent, CodeBlock, CodeMuted } from "@/components/code-block";
import { Eyebrow } from "@/components/eyebrow";
import { ScoreBar } from "@/components/score-bar";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { SCORE_LABELS } from "@/lib/feedback";
import { initials } from "@/lib/initials";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SESSION_TYPE_LABELS: Record<string, string> = {
  coding: "código ao vivo",
  system_design: "system design",
  behavioral: "comportamental",
};

// "qui, 5 nov · 20h", no horário de Brasília.
function formatSessionDate(iso: string) {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
    .formatToParts(new Date(iso))
    .reduce<Record<string, string>>((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});

  const hour = Number(parts.hour);
  const time = parts.minute === "00" ? `${hour}h` : `${hour}h${parts.minute}`;
  return `${parts.weekday.replace(".", "")}, ${parts.day} ${parts.month.replace(".", "")} · ${time}`;
}

// O entrevistador escreve texto livre: cada linha vira um item da lista.
function toItems(text: string | null) {
  return (text ?? "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-*•]\s*/, "").trim())
    .filter(Boolean);
}

const H2 = "font-heading text-[22px] font-bold";
const CHIP = "edge bg-card rounded-[7px] px-2 py-0.5 font-mono text-xs";

function FeedbackList({ items, tone }: { items: string[]; tone: "strong" | "neutral" }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item, index) => (
        <li
          key={index}
          className={`rounded-xl px-3.5 py-3 break-words ${
            tone === "strong" ? "bg-accent" : "bg-secondary"
          }`}
        >
          {item}
        </li>
      ))}
    </ul>
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

  const { data: interviewerProfile } = await supabase
    .from("interviewer_profiles")
    .select("name, avatar_url")
    .eq("id", session.interviewer_id)
    .maybeSingle();

  const interviewerName = interviewerProfile?.name ?? "Entrevistador";
  const sessionTypeLabel = SESSION_TYPE_LABELS[session.type] ?? session.type;
  const scores = (feedback?.scores as Record<string, number> | undefined) ?? {};
  const scoreEntries = Object.entries(scores);
  const strengths = toItems(feedback?.strengths ?? null);
  const improvements = toItems(feedback?.improvements ?? null);
  const isCandidate = user.id === session.candidate_id;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto box-border flex w-full max-w-[1180px] flex-col gap-7 px-[clamp(20px,5vw,48px)] pt-5 pb-[72px]">
        <Link
          href="/sessoes"
          className="text-foreground inline-flex min-h-11 items-center gap-2 self-start text-[15px] font-bold"
        >
          <ArrowLeft aria-hidden="true" size={16} strokeWidth={2.2} />
          Minhas sessões
        </Link>

        <div className="pop bg-secondary flex flex-wrap items-center gap-x-7 gap-y-[18px] rounded-[18px] p-[clamp(18px,2.4vw,28px)]">
          {interviewerProfile?.avatar_url ? (
            <Image
              src={interviewerProfile.avatar_url}
              alt={`Foto de ${interviewerName}`}
              width={88}
              height={88}
              unoptimized
              className="edge size-[88px] shrink-0 rounded-[14px] object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="edge bg-accent flex size-[88px] shrink-0 items-center justify-center rounded-[14px] font-mono text-2xl font-bold"
            >
              {initials(interviewerName)}
            </div>
          )}
          <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-2">
            <Eyebrow>resultado da sessão</Eyebrow>
            <h1 className="font-heading text-[clamp(28px,3.2vw,40px)] leading-[1.05] font-extrabold tracking-[-0.02em] break-words">
              {isCandidate
                ? `Seu feedback de ${interviewerName}`
                : `Feedback da sessão com ${interviewerName}`}
            </h1>
            <div className="flex flex-wrap gap-1.5">
              <span className={CHIP}>{formatSessionDate(session.starts_at)}</span>
              <span className={CHIP}>{sessionTypeLabel}</span>
              <span className={CHIP}>1h</span>
              {feedback?.would_hire ? (
                <span className={`${CHIP} bg-primary text-ink font-bold`}>avançaria no processo</span>
              ) : null}
            </div>
          </div>
        </div>

        {feedback ? (
          <div className="flex flex-wrap items-start gap-x-12 gap-y-9">
            <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-8">
              {scoreEntries.length > 0 ? (
                <section className="flex flex-col gap-[18px]">
                  <h2 className={H2}>Notas por competência</h2>
                  {scoreEntries.map(([key, value]) => (
                    <div key={key} className="flex flex-col gap-1.5">
                      <div className="flex justify-between gap-3 text-[15px] font-bold">
                        <span>{SCORE_LABELS[key] ?? key}</span>
                        <span className="font-mono tabular-nums">{value}/5</span>
                      </div>
                      <ScoreBar score={value} />
                    </div>
                  ))}
                </section>
              ) : null}

              {strengths.length > 0 ? (
                <section className="flex flex-col gap-3">
                  <h2 className={H2}>Pontos fortes</h2>
                  <FeedbackList items={strengths} tone="strong" />
                </section>
              ) : null}

              {improvements.length > 0 ? (
                <section className="flex flex-col gap-3">
                  <h2 className={H2}>O que melhorar</h2>
                  <FeedbackList items={improvements} tone="neutral" />
                </section>
              ) : null}

              {isCandidate ? (
                <Link
                  href={`/agendar/${session.interviewer_id}`}
                  className={buttonVariants({ variant: "outline", className: "h-12 self-start px-5" })}
                >
                  Agendar outra sessão
                </Link>
              ) : null}
            </div>

            {/* Código e quadro finais ainda não são guardados com o feedback:
                o espaço fica reservado, sem conteúdo inventado. */}
            <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-7">
              <section className="flex flex-col gap-3">
                <h2 className={H2}>Código final</h2>
                <CodeBlock className="rounded-[14px] px-4 py-3.5">
                  <div>
                    <CodeMuted>$</CodeMuted> lugh sessao codigo
                  </div>
                  <CodeMuted>ainda não disponível nesta tela</CodeMuted>
                </CodeBlock>
              </section>
              <section className="flex flex-col gap-3">
                <h2 className={H2}>Quadro final</h2>
                <div className="edge-dashed bg-dots text-muted-foreground rounded-[14px] px-[18px] py-10 text-center font-mono text-[13px]">
                  o quadro da sessão vai aparecer aqui
                </div>
              </section>
            </div>
          </div>
        ) : (
          <div className="edge-dashed flex flex-col items-start gap-3.5 rounded-2xl px-6 py-[clamp(28px,5vw,56px)]">
            <CodeBlock>
              <div>
                <CodeMuted>GET</CodeMuted> /sessoes/resultado
              </div>
              <CodeAccent>feedback: pendente</CodeAccent>
            </CodeBlock>
            <h2 className="font-heading text-[26px] leading-tight font-bold">
              O feedback ainda não chegou
            </h2>
            <p className="text-muted-foreground max-w-[52ch]">
              {interviewerName} ainda não preencheu o feedback desta sessão. Ele aparece aqui assim
              que for enviado.
            </p>
            <Link
              href="/sessoes"
              className={buttonVariants({ variant: "outline", className: "h-12 px-5" })}
            >
              Voltar para minhas sessões
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
