"use client";

import "@livekit/components-styles";

import { LiveKitRoom, PreJoin, type LocalUserChoices } from "@livekit/components-react";
import dynamic from "next/dynamic";
import { useState } from "react";

import { participantNameSchema } from "@/lib/room/session";

import { CollabProvider } from "./CollabProvider";
import { VideoPanel } from "./VideoPanel";

// Monaco só existe no navegador e é pesado: fica num pedaço separado do bundle.
const CodeEditor = dynamic(() => import("./CodeEditor"), {
  ssr: false,
  loading: () => <p className="text-muted-foreground p-4 text-sm">Carregando o editor...</p>,
});

// Excalidraw também só roda no navegador (canvas, window) e é ainda maior que o Monaco.
const Whiteboard = dynamic(() => import("./Whiteboard"), {
  ssr: false,
  loading: () => <p className="text-muted-foreground p-4 text-sm">Carregando o quadro...</p>,
});

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
      <div data-lk-theme="default" className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
        <h1 className="text-2xl font-semibold">Sala de entrevista</h1>
        <PreJoin
          className="w-full max-w-md"
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
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
      </div>
    );
  }

  const { choices, token } = joined;

  return (
    <LiveKitRoom
      data-lk-theme="default"
      className="p-2"
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
      {/* Layout provisório: vídeo à esquerda, editor e quadro à direita. */}
      <div className="flex h-full gap-2">
        <aside className="w-80 shrink-0">
          <VideoPanel />
        </aside>
        <main className="flex min-w-0 flex-1 flex-col">
          <CollabProvider sessionId={sessionId} userName={choices.username.trim()}>
            {/* Provisório: editor em cima e quadro embaixo. As abas Código/Quadro vêm no bullet 6. */}
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <CodeEditor />
              <Whiteboard />
            </div>
          </CollabProvider>
        </main>
      </div>
    </LiveKitRoom>
  );
}

function RoomMessage({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4 text-center">
      <p className="text-muted-foreground">{children}</p>
    </main>
  );
}
