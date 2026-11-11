import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CodeAccent, CodeBlock, CodeMuted } from "@/components/code-block";
import { Eyebrow } from "@/components/eyebrow";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { canSendFeedback } from "@/lib/feedback";
import { formatSessionDate } from "@/lib/format-session-date";
import { SESSION_TYPE_LABELS } from "@/lib/room/session";
import { getSessionForUser, type SessionForUser } from "@/lib/sessions";
import { createClient } from "@/lib/supabase/server";
import { FeedbackForm } from "./feedback-form";

export const metadata: Metadata = { title: "Feedback da sessão | Lugh" };

// Valida a sessão antes de renderizar, para o 404 sair como 404 de verdade.
export const instant = false;

const H1 =
  "font-heading text-[clamp(30px,3.4vw,44px)] leading-[1.05] font-extrabold tracking-[-0.02em] break-words";

export default async function SessionFeedbackPage({
  params,
}: PageProps<"/sessoes/[id]/feedback">) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/sessoes/${id}/feedback`)}`);
  }

  let session: SessionForUser | null;
  try {
    session = await getSessionForUser(id, user.id);
  } catch {
    return (
      <Shell>
        <div
          role="alert"
          className="edge flex flex-col items-start gap-3.5 rounded-2xl px-6 py-[clamp(28px,5vw,56px)]"
        >
          <CodeBlock>
            <div>
              <CodeMuted>GET</CodeMuted> /sessoes/feedback
            </div>
            <div className="text-destructive-soft">erro: sem resposta do servidor</div>
          </CodeBlock>
          <h1 className="font-heading text-[26px] leading-tight font-bold">
            Não deu para abrir o feedback
          </h1>
          <p className="text-muted-foreground max-w-[52ch]">
            O problema é do nosso lado. Tente de novo em alguns segundos.
          </p>
          <Link
            href={`/sessoes/${id}/feedback`}
            className={buttonVariants({ className: "h-12 px-5" })}
          >
            Tentar de novo
          </Link>
        </div>
      </Shell>
    );
  }

  // Id inválido, sessão de outras pessoas ou candidato tentando abrir: o mesmo 404.
  if (!session || session.role !== "interviewer") {
    notFound();
  }

  // Feedback já enviado: o que existe para ver é o resultado.
  if (session.status === "completed") {
    redirect(`/sessoes/${session.id}/resultado`);
  }

  const candidateName = session.otherParticipantName;

  if (!canSendFeedback(session.status, session.endsAt)) {
    const notOverYet = session.status === "scheduled" || session.status === "in_progress";

    return (
      <Shell>
        <div className="pop edge-dashed flex flex-col items-start gap-3.5 rounded-2xl px-6 py-[clamp(28px,5vw,56px)]">
          <CodeBlock>
            <div>
              <CodeMuted>$</CodeMuted> lugh feedback
            </div>
            <CodeAccent>{notOverYet ? "sessão: em aberto" : "sessão: sem feedback"}</CodeAccent>
          </CodeBlock>
          <h1 className="font-heading text-[26px] leading-tight font-bold">
            {notOverYet ? "A sessão ainda não terminou" : "Esta sessão não recebe feedback"}
          </h1>
          <p className="text-muted-foreground max-w-[52ch]">
            {notOverYet
              ? `O feedback de ${candidateName} abre quando você encerrar a sessão na sala ou quando o horário dela acabar.`
              : "Só sessões que aconteceram recebem feedback. Confira a situação dela em Minhas sessões."}
          </p>
          <Link href="/sessoes" className={buttonVariants({ className: "h-12 px-5" })}>
            Voltar para minhas sessões
          </Link>
        </div>
      </Shell>
    );
  }

  const { day, time } = formatSessionDate(session.startsAt);
  const typeLabel = SESSION_TYPE_LABELS[session.type];

  return (
    <Shell>
      <div className="flex flex-col gap-2">
        <Eyebrow>feedback da sessão</Eyebrow>
        <h1 className={H1}>Como {candidateName} foi na entrevista?</h1>
        <p className="text-muted-foreground max-w-[60ch]">
          É o que {candidateName} leva da sessão. Seja específico: diga o que funcionou e o que
          fazer diferente na próxima.
        </p>
      </div>

      <FeedbackForm
        sessionId={session.id}
        type={session.type}
        candidateName={candidateName}
        sessionDate={`${day} · ${time}`}
        typeLabel={typeLabel}
      />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto box-border flex w-full max-w-[1040px] flex-col gap-7 px-[clamp(20px,5vw,48px)] pt-5 pb-[72px]">
        <Link
          href="/sessoes"
          className="text-foreground inline-flex min-h-11 items-center gap-2 self-start text-[15px] font-bold"
        >
          <ArrowLeft aria-hidden="true" size={16} strokeWidth={2.2} />
          Minhas sessões
        </Link>
        {children}
      </main>
    </div>
  );
}
