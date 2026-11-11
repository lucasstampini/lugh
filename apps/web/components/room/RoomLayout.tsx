"use client";

import { useRoomContext } from "@livekit/components-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SESSION_TYPE_LABELS, type RoomSession } from "@/lib/room/session";

import { useCollab } from "./CollabProvider";
import { ConnectionStatus } from "./ConnectionStatus";
import { EndSessionButton } from "./EndSessionButton";
import { LanguageSelect } from "./LanguageSelect";
import { RoomTimer } from "./RoomTimer";
import { useLanguage } from "./useLanguage";
import { VideoPanel } from "./VideoPanel";

// Monaco só existe no navegador e é pesado: fica num pedaço separado do bundle.
const CodeEditor = dynamic(() => import("./CodeEditor"), {
  ssr: false,
  loading: () => <p className="text-muted-foreground p-4 font-mono text-[13px]">carregando o editor…</p>,
});

// Excalidraw também só roda no navegador (canvas, window) e é ainda maior que o Monaco.
const Whiteboard = dynamic(() => import("./Whiteboard"), {
  ssr: false,
  loading: () => <p className="text-muted-foreground p-4 font-mono text-[13px]">carregando o quadro…</p>,
});

type Tab = "code" | "board";

// Layout da sala (fase 1, bullet 6): cabeçalho fino, vídeo numa coluna lateral fixa e, na
// área principal, as abas Código e Quadro. Precisa estar dentro de <LiveKitRoom> e do <CollabProvider>.
type Props = {
  // Sessão real: o cabeçalho mostra o outro participante, o tipo e o tempo marcado.
  // Sem ela é a sala de teste.
  session?: RoomSession;
  // O entrevistador encerrou a sessão (o servidor já confirmou).
  onSessionEnded: () => void;
};

export function RoomLayout({ session, onSessionEnded }: Props) {
  const room = useRoomContext();
  // A aba é de cada participante (não sincroniza): um pode ler o código enquanto o outro desenha.
  const [tab, setTab] = useState<Tab>("code");
  // A linguagem mora aqui porque o seletor fica no cabeçalho, fora do painel do editor.
  const collab = useCollab()?.collab ?? null;
  const [language, changeLanguage] = useLanguage(collab);

  return (
    // `dark`: a sala é toda escura (LiveKit, Monaco, Excalidraw dark); sem isto as abas e
    // o indicador usariam os tokens claros do shadcn e o texto sumiria no fundo escuro.
    <div className="dark bg-background text-foreground flex h-full flex-col">
      <header className="edge-b flex flex-wrap items-center justify-between gap-x-6 gap-y-2.5 px-5 py-3">
        <div className="flex min-w-0 items-center gap-4">
          <Image
            src="/brand/lugh-logo-dark-bg.svg"
            alt="Lugh"
            width={75}
            height={26}
            className="h-[26px] w-auto"
          />
          <span aria-hidden="true" className="bg-border h-6 w-[1.5px]" />
          {session ? (
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
              <p className="min-w-0 truncate text-[15px] font-extrabold">
                <span className="sr-only">Sessão com </span>
                {session.otherParticipantName}
              </p>
              <span className="edge rounded-[7px] px-2 py-0.5 font-mono text-xs">
                {SESSION_TYPE_LABELS[session.type]}
              </span>
            </div>
          ) : (
            <p className="text-muted-foreground font-mono text-xs">sala de entrevista</p>
          )}
        </div>
        <RoomTimer startsAt={session?.startsAt} endsAt={session?.endsAt} />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <ConnectionStatus />
          {/* Sair desconecta do vídeo e volta para a tela de entrada: dá para entrar de novo
              enquanto a sessão estiver aberta. Fica longe dos controles de mic e câmera
              para evitar clique acidental. */}
          <Button type="button" variant="outline" size="sm" onClick={() => room.disconnect()}>
            Sair da sala
          </Button>
          {session?.role === "interviewer" ? (
            <EndSessionButton
              sessionId={session.id}
              otherParticipantName={session.otherParticipantName}
              onEnded={onSessionEnded}
            />
          ) : null}
        </div>
      </header>

      <p
        role="note"
        className="edge text-muted-foreground mx-5 mt-3 rounded-[10px] px-3 py-2 text-xs md:hidden"
      >
        A sala funciona melhor no computador.
      </p>

      <div className="flex min-h-0 flex-1 flex-col gap-4 px-5 pt-4 pb-5 md:flex-row">
        <aside aria-label="Vídeo" className="h-48 shrink-0 md:h-auto md:w-[280px]">
          <VideoPanel />
        </aside>
        <main className="edge bg-card flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl">
          <Tabs
            value={tab}
            onValueChange={(value: Tab) => setTab(value)}
            className="min-h-0 flex-1 gap-0"
          >
            <div className="edge-b flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 px-3.5 py-2.5">
              <TabsList>
                <TabsTrigger value="code">Código</TabsTrigger>
                <TabsTrigger value="board">Quadro</TabsTrigger>
              </TabsList>
              {tab === "code" ? (
                <div className="flex items-center gap-2.5">
                  <span aria-hidden="true" className="text-muted-foreground font-mono text-xs">
                    linguagem
                  </span>
                  <LanguageSelect value={language} onChange={changeLanguage} />
                  {/* Rodar o código ainda não existe: o botão fica desabilitado até lá. */}
                  <Button
                    type="button"
                    disabled
                    title="Executar código chega em breve"
                    className="rounded-[10px] px-4"
                  >
                    Executar
                  </Button>
                </div>
              ) : null}
            </div>
            {/* keepMounted: o painel inativo só fica escondido. Desmontar destruiria o binding
                do Yjs (e o Monaco perderia desfazer, cursor e rolagem) a cada troca de aba. */}
            <TabsContent value="code" keepMounted className="flex min-h-0 flex-col data-hidden:hidden">
              <CodeEditor language={language} />
            </TabsContent>
            <TabsContent value="board" keepMounted className="flex min-h-0 flex-col data-hidden:hidden">
              <Whiteboard />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
