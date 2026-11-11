"use client";

import dynamic from "next/dynamic";

import type { RoomSession } from "@/lib/room/session";

// <Room /> é o contrato com o resto do app (PROJETO.md). Carrega a sala só no navegador:
// câmera, microfone e WebRTC não existem no servidor.
const RoomContent = dynamic(() => import("./RoomContent"), {
  ssr: false,
  loading: () => (
    <main className="dark bg-background flex min-h-screen items-center justify-center">
      <p role="status" className="text-muted-foreground font-mono text-[13px]">
        carregando a sala…
      </p>
    </main>
  ),
});

export type RoomProps = {
  sessionId: string;
  // Dados da sessão real, já validados no servidor (a página só renderiza a sala para
  // participante). Sem `session` é a sala de teste: sem login, cada um digita o nome.
  session?: RoomSession;
};

export function Room({ sessionId, session }: RoomProps) {
  return <RoomContent sessionId={sessionId} session={session} />;
}
