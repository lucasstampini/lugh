import Link from "next/link";
import { redirect } from "next/navigation";
import { CodeAccent, CodeBlock, CodeMuted } from "@/components/code-block";
import { Eyebrow } from "@/components/eyebrow";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { initials } from "@/lib/initials";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

const SESSION_TYPE_LABELS: Record<string, string> = {
  coding: "código ao vivo",
  system_design: "system design",
  behavioral: "comportamental",
};

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "aguardando pagamento",
  scheduled: "confirmada",
  in_progress: "em andamento",
  awaiting_feedback: "aguardando feedback",
  completed: "realizada",
  expired: "expirada",
  canceled: "cancelada",
  no_show: "não compareceu",
};

// Verde: está valendo. Verde claro: aconteceu. Tracejado: parada ou sem efeito.
const STATUS_CHIP_CLASS: Record<string, string> = {
  scheduled: "bg-primary text-ink",
  in_progress: "bg-primary text-ink",
  awaiting_feedback: "bg-accent",
  completed: "bg-accent",
};
const STATUS_CHIP_FALLBACK = "border-dashed";

const UPCOMING_STATUSES = new Set([
  "pending_payment",
  "scheduled",
  "in_progress",
  "awaiting_feedback",
]);

const ROOM_STATUSES = new Set(["scheduled", "in_progress"]);

type SessionRowData = {
  id: string;
  candidate_id: string;
  interviewer_id: string;
  starts_at: string;
  type: string;
  status: string;
  candidate_notes: string | null;
};

// "qua, 18 nov" e "19h" (ou "19h30"), no horário de Brasília.
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

  const weekday = parts.weekday.replace(".", "");
  const month = parts.month.replace(".", "");
  const hour = Number(parts.hour);
  return {
    day: `${weekday}, ${parts.day} ${month}`,
    time: parts.minute === "00" ? `${hour}h` : `${hour}h${parts.minute}`,
  };
}

const H2 = "font-heading text-[22px] font-bold";

export default async function SessionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }
  const userId = user.id;

  // Sem filtro: RLS já só devolve sessão onde o usuário logado é o
  // candidate_id ou o interviewer_id.
  const [{ data: sessions, error }, { data: profile }] = await Promise.all([
    supabase
      .from("sessions")
      .select("id, candidate_id, interviewer_id, starts_at, type, status, candidate_notes")
      .order("starts_at", { ascending: false }),
    supabase.from("profiles").select("role").eq("id", userId).single(),
  ]);

  const isInterviewer = profile?.role === "interviewer";

  const interviewerIds = Array.from(
    new Set(
      (sessions ?? [])
        .filter((s) => s.candidate_id === userId)
        .map((s) => s.interviewer_id),
    ),
  );

  const { data: interviewerProfiles } = interviewerIds.length
    ? await supabase
        .from("interviewer_profiles")
        .select("id, name")
        .in("id", interviewerIds)
    : { data: [] };

  const interviewerNameById = new Map(
    (interviewerProfiles ?? []).map((p) => [p.id, p.name]),
  );

  // Próximas em ordem de data (a mais perto primeiro); passadas da mais recente.
  const upcoming = (sessions ?? []).filter((s) => UPCOMING_STATUSES.has(s.status)).reverse();
  const past = (sessions ?? []).filter((s) => !UPCOMING_STATUSES.has(s.status));

  function SessionRow({ session, muted }: { session: SessionRowData; muted?: boolean }) {
    const isCandidate = session.candidate_id === userId;
    const title = isCandidate
      ? (interviewerNameById.get(session.interviewer_id) ?? "Entrevistador")
      : "Sessão com candidato";
    const { day, time } = formatSessionDate(session.starts_at);

    return (
      <li
        className={`bg-card flex flex-wrap items-center gap-x-[18px] gap-y-3.5 rounded-2xl border-[1.5px] p-4 ${
          muted ? "border-border-dashed" : "border-border pop"
        }`}
      >
        <div className="bg-secondary w-24 shrink-0 rounded-[10px] px-2 py-2.5 text-center font-mono">
          <div className="text-muted-foreground text-xs">{day}</div>
          <div className="text-[22px] leading-[1.2] font-bold">{time}</div>
        </div>
        <span
          aria-hidden="true"
          className="edge bg-accent flex size-[52px] shrink-0 items-center justify-center rounded-full font-mono text-sm font-bold"
        >
          {initials(title)}
        </span>
        <div className="min-w-0 flex-[1_1_220px]">
          <p className="text-[17px] font-extrabold break-words">{title}</p>
          {session.candidate_notes ? (
            <p className="text-muted-foreground line-clamp-2 text-sm break-words">
              {session.candidate_notes}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-1.5 font-mono text-xs">
            <span className="edge rounded-[7px] px-2 py-0.5">
              {SESSION_TYPE_LABELS[session.type] ?? session.type}
            </span>
            <span
              className={`edge rounded-[7px] px-2 py-0.5 font-bold ${
                STATUS_CHIP_CLASS[session.status] ?? STATUS_CHIP_FALLBACK
              }`}
            >
              {STATUS_LABELS[session.status] ?? session.status}
            </span>
          </div>
        </div>

        {ROOM_STATUSES.has(session.status) ? (
          <Link href={`/sala/${session.id}`} className={buttonVariants({ className: "h-12 px-5" })}>
            Entrar na sala
          </Link>
        ) : isCandidate && session.status === "completed" ? (
          <Link
            href={`/sessoes/${session.id}/resultado`}
            className={buttonVariants({ variant: "outline", className: "h-12 px-5" })}
          >
            Ver resultado
          </Link>
        ) : null}
      </li>
    );
  }

  const hasSessions = (sessions ?? []).length > 0;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto box-border flex w-full max-w-[1120px] flex-col gap-8 px-[clamp(20px,5vw,48px)] pt-[clamp(24px,4vw,48px)] pb-[72px]">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div className="flex flex-col gap-2">
            <Eyebrow>{isInterviewer ? "entrevistador" : "candidato"}</Eyebrow>
            <h1 className="font-heading text-[clamp(30px,3.4vw,44px)] leading-[1.05] font-extrabold tracking-[-0.02em]">
              Minhas sessões
            </h1>
          </div>
          <Link
            href={isInterviewer ? "/painel" : "/entrevistadores"}
            className={buttonVariants({ variant: "outline", className: "h-12 px-5" })}
          >
            {isInterviewer ? "Abrir horários" : "Agendar nova sessão"}
          </Link>
        </div>

        {error ? (
          <div
            role="alert"
            className="edge flex flex-col items-start gap-3.5 rounded-2xl px-6 py-[clamp(28px,5vw,56px)]"
          >
            <CodeBlock>
              <div>
                <CodeMuted>GET</CodeMuted> /sessoes
              </div>
              <div className="text-destructive-soft">erro: sem resposta do servidor</div>
            </CodeBlock>
            <h2 className="font-heading text-[26px] leading-tight font-bold">
              Não deu para carregar suas sessões
            </h2>
            <p className="text-muted-foreground max-w-[52ch]">
              O problema é do nosso lado. Tente de novo em alguns segundos.
            </p>
            <Link href="/sessoes" className={buttonVariants({ className: "h-12 px-5" })}>
              Tentar de novo
            </Link>
          </div>
        ) : !hasSessions ? (
          <div className="pop edge-dashed flex flex-col items-start gap-3.5 rounded-2xl px-6 py-[clamp(28px,5vw,56px)]">
            <CodeBlock>
              <div>
                <CodeMuted>$</CodeMuted> lugh sessoes
              </div>
              <CodeAccent>0 sessões</CodeAccent>
            </CodeBlock>
            <h2 className="font-heading text-[26px] leading-tight font-bold">
              {isInterviewer
                ? "Ninguém agendou com você ainda"
                : "Você ainda não agendou nenhuma sessão"}
            </h2>
            <p className="text-muted-foreground max-w-[52ch]">
              {isInterviewer
                ? "As sessões aparecem aqui quando um candidato agenda um dos seus horários. Confira se há horários abertos no painel."
                : "Escolha um entrevistador e um horário. A sessão aparece aqui depois que você agenda."}
            </p>
            <Link
              href={isInterviewer ? "/painel" : "/entrevistadores"}
              className={buttonVariants({ className: "h-12 px-5" })}
            >
              {isInterviewer ? "Abrir horários no painel" : "Encontrar um entrevistador"}
            </Link>
          </div>
        ) : (
          <>
            <section className="flex flex-col gap-3">
              <div className="flex items-baseline gap-2.5">
                <h2 className={H2}>Próximas</h2>
                <span className="text-muted-foreground font-mono text-[13px]">{upcoming.length}</span>
              </div>
              {upcoming.length > 0 ? (
                <ul className="flex flex-col gap-3">
                  {upcoming.map((session) => (
                    <SessionRow key={session.id} session={session} />
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">Nenhuma sessão marcada no momento.</p>
              )}
            </section>

            {past.length > 0 ? (
              <section className="flex flex-col gap-3">
                <div className="flex items-baseline gap-2.5">
                  <h2 className={H2}>Passadas</h2>
                  <span className="text-muted-foreground font-mono text-[13px]">{past.length}</span>
                </div>
                <ul className="flex flex-col gap-3">
                  {past.map((session) => (
                    <SessionRow key={session.id} session={session} muted />
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}
