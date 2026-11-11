import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { initials } from "@/lib/initials";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

const SESSION_TYPE_LABELS: Record<string, string> = {
  coding: "Code",
  system_design: "System design",
  behavioral: "Comportamental",
};

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Aguardando pagamento",
  scheduled: "Agendada",
  in_progress: "Em andamento",
  awaiting_feedback: "Aguardando feedback",
  completed: "Concluída",
  expired: "Expirada",
  canceled: "Cancelada",
  no_show: "Não compareceu",
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  scheduled: "bg-lume text-lume-foreground",
  in_progress: "bg-lume text-lume-foreground",
};

const UPCOMING_STATUSES = new Set([
  "pending_payment",
  "scheduled",
  "in_progress",
  "awaiting_feedback",
]);

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

  return `${parts.weekday}, ${parts.day} de ${parts.month} · ${parts.hour}:${parts.minute}`;
}

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
  const { data: sessions, error } = await supabase
    .from("sessions")
    .select(
      "id, candidate_id, interviewer_id, starts_at, type, status, candidate_notes",
    )
    .order("starts_at", { ascending: false });

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

  const upcoming = (sessions ?? []).filter((s) =>
    UPCOMING_STATUSES.has(s.status),
  );
  const past = (sessions ?? []).filter((s) => !UPCOMING_STATUSES.has(s.status));

  function sessionTitle(session: { candidate_id: string; interviewer_id: string }) {
    if (session.candidate_id === userId) {
      return interviewerNameById.get(session.interviewer_id) ?? "Entrevistador";
    }
    return "Sessão com candidato";
  }

  function SessionRow({
    session,
  }: {
    session: {
      id: string;
      candidate_id: string;
      interviewer_id: string;
      starts_at: string;
      type: string;
      status: string;
      candidate_notes: string | null;
    };
  }) {
    const isCandidate = session.candidate_id === userId;
    const title = sessionTitle(session);

    return (
      <div className="border-border bg-card flex items-center gap-5 rounded-[20px] border p-6">
        <div className="bg-secondary text-primary flex size-14 shrink-0 items-center justify-center rounded-2xl font-heading text-lg font-bold">
          {initials(title)}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="font-heading truncate text-xl font-bold tracking-[-0.01em]">
            {title}
          </p>
          <p className="text-foreground/70 truncate text-sm">
            {SESSION_TYPE_LABELS[session.type] ?? session.type} ·{" "}
            {formatSessionDate(session.starts_at)}
          </p>
          {session.candidate_notes ? (
            <p className="text-muted-foreground truncate text-xs">
              {session.candidate_notes}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <span
            className={`rounded-md px-2.5 py-1 text-xs font-bold ${
              STATUS_BADGE_CLASS[session.status] ?? "bg-secondary text-primary"
            }`}
          >
            {STATUS_LABELS[session.status] ?? session.status}
          </span>

          {isCandidate && session.status === "completed" ? (
            <Link
              href={`/sessoes/${session.id}/resultado`}
              className="text-primary text-xs font-bold"
            >
              Ver resultado →
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col">
      <SiteHeader />

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-3">
            <p className="text-primary text-xs font-extrabold tracking-[0.1em] uppercase">
              Minhas sessões
            </p>
            <h1 className="font-heading text-[clamp(2rem,4.5vw,3rem)] font-bold tracking-[-0.03em]">
              Suas entrevistas.
            </h1>
            <p className="text-foreground/70 max-w-prose text-base">
              Próximas e passadas, com o feedback de cada uma assim que ele
              chega.
            </p>
          </div>

          <Link
            href="/entrevistadores"
            className="bg-primary text-primary-foreground flex h-12 shrink-0 items-center gap-2 rounded-xl px-5 text-sm font-bold"
          >
            Agendar sessão
            <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </div>

        {error ? (
          <p className="text-destructive text-sm">
            Não deu para carregar suas sessões agora. Tente de novo.
          </p>
        ) : (sessions ?? []).length === 0 ? (
          <div className="border-border bg-card flex flex-col items-center gap-3 rounded-[20px] border p-16 text-center">
            <p className="font-heading text-xl font-bold">
              Nenhuma sessão ainda
            </p>
            <p className="text-foreground/70 text-sm">
              Agende uma sessão com um entrevistador pra ela aparecer aqui.
            </p>
            <Link href="/entrevistadores" className="text-primary text-sm font-semibold">
              Ver entrevistadores →
            </Link>
          </div>
        ) : (
          <>
            {upcoming.length > 0 ? (
              <div className="flex flex-col gap-4">
                <h2 className="font-heading text-xl font-bold">Próximas</h2>
                <div className="flex flex-col gap-3">
                  {upcoming.map((session) => (
                    <SessionRow key={session.id} session={session} />
                  ))}
                </div>
              </div>
            ) : null}

            {past.length > 0 ? (
              <div className="flex flex-col gap-4">
                <h2 className="font-heading text-xl font-bold">Passadas</h2>
                <div className="flex flex-col gap-3">
                  {past.map((session) => (
                    <SessionRow key={session.id} session={session} />
                  ))}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
