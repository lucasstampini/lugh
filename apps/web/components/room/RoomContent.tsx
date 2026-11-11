"use client";

import "@livekit/components-styles";

import { LiveKitRoom, PreJoin, type LocalUserChoices } from "@livekit/components-react";
import Image from "next/image";
import { useState } from "react";

import { Eyebrow } from "@/components/eyebrow";

import { participantNameSchema } from "@/lib/room/session";

import { CollabProvider } from "./CollabProvider";
import { RoomLayout } from "./RoomLayout";

type Props = { sessionId: string };

type JoinedState = { choices: LocalUserChoices; token: string };

const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

// Fluxo da sala: PreJoin (nome + câmera/mic) → busca token → conecta no LiveKit.
export default function RoomContent({ sessionId }: Props) {
  const [joined, setJoined] = useState<JoinedState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleJoin(choices: LocalUserChoices) {
    setError(null);
    setLoading(true);
    try {
      const query = new URLSearchParams({ room: sessionId, name: choices.username.trim() });
      const response = await fetch(`/api/livekit/token?${query}`);
      const body: { token?: string; error?: string } = await response.json();
      if (!response.ok || !body.token) {
        setError(body.error ?? "Não foi possível entrar na sala");
        return;
      }
      setJoined({ choices, token: body.token });
    } catch {
      setError("Falha de rede ao entrar na sala. Tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  if (!livekitUrl) {
    return <RoomMessage>Vídeo não configurado (NEXT_PUBLIC_LIVEKIT_URL).</RoomMessage>;
  }

  if (!joined) {
    return (
      <div
        data-lk-theme="default"
        // `dark`: a sala é sempre escura (DESIGN.md), inclusive a tela de entrada.
        className="dark flex min-h-screen flex-col"
      >
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
          <div className="pop flex w-full max-w-md flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Eyebrow>sala de entrevista</Eyebrow>
              <h1 className="font-heading text-[clamp(30px,3.4vw,44px)] leading-[1.05] font-extrabold tracking-[-0.02em]">
                Pronto para entrar?
              </h1>
            </div>
            <PreJoin
              // A prop className substitui a classe padrão do LiveKit: sem repetir
              // `lk-prejoin` aqui, o CSS do PreJoin (coluna, prévia da câmera) não vale.
              className="lk-prejoin w-full"
              joinLabel={loading ? "Entrando..." : "Entrar na sala"}
              userLabel="Seu nome"
              micLabel="Microfone"
              camLabel="Câmera"
              persistUserChoices
              onValidate={(values) => !loading && participantNameSchema.safeParse(values.username).success}
              onSubmit={handleJoin}
              onError={() => setError("Não conseguimos acessar câmera ou microfone. Você ainda pode entrar sem eles.")}
            />
            {error && (
              <p role="alert" className="text-destructive text-sm font-semibold">
                {error}
              </p>
            )}
            <p className="text-muted-foreground text-[13px]">
              A sala funciona no navegador do computador. Não precisa instalar nada.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const { choices, token } = joined;

  return (
    <LiveKitRoom
      data-lk-theme="default"
      // `dark` aqui (e não só no layout) para o tema do LiveKit pegar a paleta da sala.
      className="dark"
      // Inline porque o CSS do LiveKit (.lk-room-container { height: 100% }) vence a classe do Tailwind.
      style={{ height: "100dvh" }}
      serverUrl={livekitUrl}
      token={token}
      connect
      video={choices.videoEnabled ? { deviceId: choices.videoDeviceId } : false}
      audio={choices.audioEnabled ? { deviceId: choices.audioDeviceId } : false}
      // "Sair" na barra de controles desconecta; voltamos ao PreJoin.
      onDisconnected={() => setJoined(null)}
      onError={() => setError("A conexão de vídeo falhou. Entre de novo.")}
    >
      {/* O CollabProvider envolve o layout inteiro: editor, quadro e indicador de conexão usam a mesma conexão. */}
      <CollabProvider sessionId={sessionId} userName={choices.username.trim()}>
        <RoomLayout />
      </CollabProvider>
    </LiveKitRoom>
  );
}

function RoomMessage({ children }: { children: React.ReactNode }) {
  return (
    <main className="dark bg-background flex min-h-screen items-center justify-center p-4 text-center">
      <p className="text-muted-foreground font-mono text-[13px]">{children}</p>
    </main>
  );
}
