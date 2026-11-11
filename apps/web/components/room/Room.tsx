"use client";

import dynamic from "next/dynamic";

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

export function Room({ sessionId }: { sessionId: string }) {
  return <RoomContent sessionId={sessionId} />;
}
