"use client";

import "@excalidraw/excalidraw/index.css";

import { Excalidraw } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { useEffect, useRef, useState } from "react";
import { ExcalidrawBinding } from "y-excalidraw";
import * as Y from "yjs";

import { getBoard, getBoardAssets } from "@/lib/room/collab";

import { attachBoardUndo } from "./board-undo";
import { useCollab } from "./CollabProvider";
import { useSceneReady } from "./use-scene-ready";

type PointerUpdate = ExcalidrawBinding["onPointerUpdate"];

// Quadro branco da sala (fase 1, bullets 4 e 5): Excalidraw para desenhar a arquitetura em
// entrevistas de system design, sincronizado com o outro participante pelo mesmo
// documento Yjs do editor (gavetas `board` e `board-assets`).
export default function Whiteboard() {
  const collabState = useCollab();
  const collab = collabState?.collab ?? null;
  const containerRef = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const [onPointerUpdate, setOnPointerUpdate] = useState<PointerUpdate | null>(null);
  // Se o binding carregar o desenho do documento antes de a cena ficar pronta, o desenho é
  // apagado pelo `initialData` (vazio) e o binding propaga a "remoção" para todos.
  const sceneReady = useSceneReady(api);

  useEffect(() => {
    const container = containerRef.current;
    if (!api || !sceneReady || !collab || !container) return;

    const board = getBoard(collab.ydoc);
    // O binding lê o que já está no documento (quem entra depois vê o desenho) e, dali em
    // diante, leva cada mudança do Excalidraw para o Yjs e vice-versa.
    const binding = new ExcalidrawBinding(board, getBoardAssets(collab.ydoc), api, collab.provider.awareness ?? undefined);
    // Desfazer só as próprias ações: o UndoManager rastreia apenas transações do binding local.
    const undoManager = new Y.UndoManager(board, { trackedOrigins: new Set([binding]) });
    const detachUndo = attachBoardUndo(container, undoManager);
    // Ponteiro do mouse vai para o awareness: o outro vê onde você está apontando, com seu nome.
    setOnPointerUpdate(() => binding.onPointerUpdate);

    return () => {
      setOnPointerUpdate(null);
      detachUndo();
      undoManager.destroy();
      binding.destroy();
    };
  }, [api, sceneReady, collab]);

  return (
    <section aria-label="Quadro" className="flex min-h-0 flex-1 flex-col">
      {/* O Excalidraw ocupa 100% do pai: sem altura definida aqui ele some (0px). */}
      <div ref={containerRef} className="min-h-0 flex-1 overflow-hidden">
        <Excalidraw
          excalidrawAPI={setApi}
          onPointerUpdate={onPointerUpdate ?? undefined}
          isCollaborating={Boolean(collab)}
          theme="dark"
          langCode="pt-BR"
          UIOptions={{
            // Na sala não faz sentido abrir/salvar arquivo nem trocar o tema; o quadro é da sessão.
            canvasActions: { loadScene: false, saveToActiveFile: false, export: false, toggleTheme: false },
          }}
        />
      </div>
    </section>
  );
}
