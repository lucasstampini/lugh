"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useCollab } from "./CollabProvider";
import { ConnectionStatus } from "./ConnectionStatus";
import { LanguageSelect } from "./LanguageSelect";
import { useLanguage } from "./useLanguage";
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

type Tab = "code" | "board";

// Layout da sala (fase 1, bullet 6): vídeo numa coluna lateral fixa e, na área principal,
// as abas Código e Quadro. Precisa estar dentro de <LiveKitRoom> e do <CollabProvider>.
export function RoomLayout() {
  // A aba é de cada participante (não sincroniza): um pode ler o código enquanto o outro desenha.
  const [tab, setTab] = useState<Tab>("code");
  // A linguagem mora aqui porque o seletor fica no cabeçalho, fora do painel do editor.
  const collab = useCollab()?.collab ?? null;
  const [language, changeLanguage] = useLanguage(collab);

  return (
    // `dark`: a sala é toda escura (LiveKit, Monaco vs-dark, Excalidraw dark); sem isto as abas e
    // o indicador usariam os tokens claros do shadcn e o texto sumiria no fundo escuro.
    <div className="dark flex h-full flex-col gap-2 md:flex-row">
      <p role="note" className="text-muted-foreground rounded-md border px-3 py-2 text-xs md:hidden">
        A sala funciona melhor no computador.
      </p>
      <aside className="h-48 shrink-0 md:h-auto md:w-80">
        <VideoPanel />
      </aside>
      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Tabs value={tab} onValueChange={(value: Tab) => setTab(value)} className="min-h-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <TabsList>
              <TabsTrigger value="code">Código</TabsTrigger>
              <TabsTrigger value="board">Quadro</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <LanguageSelect value={language} onChange={changeLanguage} />
              <ConnectionStatus />
            </div>
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
  );
}
