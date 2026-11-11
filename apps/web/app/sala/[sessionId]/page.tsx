import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Eyebrow } from "@/components/eyebrow";
import { Room } from "@/components/room/Room";
import { buttonVariants } from "@/components/ui/button";
import { canSendFeedback } from "@/lib/feedback";
import { formatSessionDate } from "@/lib/format-session-date";
import {
  isTestRoomEnabled,
  ROOM_OPENS_BEFORE_MINUTES,
  roomEntry,
  TEST_SESSION_ID,
} from "@/lib/room/session";
import { getSessionForUser, type SessionForUser } from "@/lib/sessions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sala | Lugh" };

// A sala pode bloquear a navegação até validar a sessão: ela é aberta por link, e
// validar antes de renderizar garante um 404 de verdade (com Suspense o status sairia 200).
export const instant = false;

export default async function SalaPage({ params }: PageProps<"/sala/[sessionId]">) {
  const { sessionId } = await params;

  // Sala de teste: sem login e sem sessão no banco. Não existe em produção.
  if (sessionId === TEST_SESSION_ID) {
    if (!isTestRoomEnabled()) notFound();
    return <Room sessionId={sessionId} />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/sala/${sessionId}`)}`);
  }

  let session: SessionForUser | null;
  try {
    session = await getSessionForUser(sessionId, user.id);
  } catch {
    return (
      <RoomState
        alert
        eyebrow="erro ao abrir a sala"
        title="Não deu para abrir a sala"
        action={{ href: `/sala/${sessionId}`, label: "Tentar de novo" }}
      >
        O problema é do nosso lado. Tente de novo em alguns segundos.
      </RoomState>
    );
  }

  // Id inválido, sessão que não existe ou de outras pessoas: o mesmo 404, sem revelar qual.
  if (!session) notFound();

  const entry = roomEntry(session.status, session.startsAt, session.endsAt);

  if (entry === "early") {
    const opensAt = new Date(
      new Date(session.startsAt).getTime() - ROOM_OPENS_BEFORE_MINUTES * 60 * 1000,
    ).toISOString();
    const { day, time } = formatSessionDate(opensAt);

    return (
      <RoomState
        eyebrow="sala fechada"
        title={`A sala abre ${day} às ${time}`}
        action={{ href: `/sala/${sessionId}`, label: "Tentar entrar de novo" }}
      >
        Sua sessão com {session.otherParticipantName} ainda não começou. A sala abre{" "}
        {ROOM_OPENS_BEFORE_MINUTES} minutos antes do horário, no horário de Brasília.
      </RoomState>
    );
  }

  if (entry === "ended") {
    const isInterviewer = session.role === "interviewer";
    // É para cá que o entrevistador volta depois de clicar em "Encerrar sessão".
    const owesFeedback = isInterviewer && canSendFeedback(session.status, session.endsAt);

    return (
      <RoomState
        eyebrow="sessão encerrada"
        title="Esta sessão já terminou"
        action={
          owesFeedback
            ? { href: `/sessoes/${session.id}/feedback`, label: "Preencher feedback" }
            : session.status === "completed"
              ? {
                  href: `/sessoes/${session.id}/resultado`,
                  label: isInterviewer ? "Ver feedback" : "Ver resultado",
                }
              : { href: "/sessoes", label: "Ver minhas sessões" }
        }
      >
        {owesFeedback
          ? `A sala da sua sessão com ${session.otherParticipantName} já fechou. Falta o seu feedback.`
          : `A sala da sua sessão com ${session.otherParticipantName} já fechou.`}
      </RoomState>
    );
  }

  if (entry === "unavailable") {
    return (
      <RoomState
        eyebrow="sessão não confirmada"
        title="Esta sessão não está confirmada"
        action={{ href: "/sessoes", label: "Ver minhas sessões" }}
      >
        A sala só abre para sessões confirmadas. Confira a situação dela em Minhas sessões.
      </RoomState>
    );
  }

  return (
    <Room
      sessionId={session.id}
      session={{
        id: session.id,
        type: session.type,
        role: session.role,
        userName: session.userName,
        otherParticipantName: session.otherParticipantName,
        startsAt: session.startsAt,
        endsAt: session.endsAt,
      }}
    />
  );
}

// Tela de estado da sala (fechada, encerrada, erro). Escura como a sala, no mesmo
// desenho da tela de entrada: rótulo, título, uma frase e uma ação.
function RoomState({
  eyebrow,
  title,
  action,
  alert,
  children,
}: {
  eyebrow: string;
  title: string;
  action: { href: string; label: string };
  alert?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="dark bg-background text-foreground flex min-h-screen flex-col">
      <header className="px-[clamp(20px,4vw,40px)] py-[18px]">
        <Image
          src="/brand/lugh-logo-dark-bg.svg"
          alt="Lugh"
          width={87}
          height={30}
          priority
          className="h-[30px] w-auto"
        />
      </header>
      <main className="flex flex-1 items-center justify-center px-[clamp(20px,4vw,40px)] pt-6 pb-16">
        <div
          role={alert ? "alert" : undefined}
          className="pop flex w-full max-w-md flex-col items-start gap-5"
        >
          <div className="flex flex-col gap-2">
            <Eyebrow>{eyebrow}</Eyebrow>
            <h1 className="font-heading text-[clamp(30px,3.4vw,44px)] leading-[1.05] font-extrabold tracking-[-0.02em]">
              {title}
            </h1>
          </div>
          <p className="text-muted-foreground">{children}</p>
          <Link href={action.href} className={buttonVariants({ className: "h-12 px-5" })}>
            {action.label}
          </Link>
        </div>
      </main>
    </div>
  );
}
