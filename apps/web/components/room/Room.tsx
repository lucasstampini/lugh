"use client";

import dynamic from "next/dynamic";

// <Room /> é o contrato com o resto do app (PROJETO.md). Carrega a sala só no navegador:
// câmera, microfone e WebRTC não existem no servidor.
const RoomContent = dynamic(() => import("./RoomContent"), {
  ssr: false,
  loading: () => (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Carregando a sala...</p>
    </main>
  ),
});

export function Room({ sessionId }: { sessionId: string }) {
  return <RoomContent sessionId={sessionId} />;
}
