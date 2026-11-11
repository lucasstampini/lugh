"use client";

import "@excalidraw/excalidraw/index.css";

import { Excalidraw, restore } from "@excalidraw/excalidraw";
import type { ExcalidrawInitialDataState } from "@excalidraw/excalidraw/types";
import { useMemo } from "react";

type ImportedScene = Parameters<typeof restore>[0];

// Canvas do quadro final. Carregado só no navegador, por session-board.tsx.
export default function SessionBoardCanvas({
  elements,
  files,
}: {
  elements: unknown[];
  files: Record<string, unknown>;
}) {
  const initialData = useMemo<ExcalidrawInitialDataState>(() => {
    // Os elementos e arquivos foram gravados pelo próprio Excalidraw na sala e chegam do
    // servidor como JSON. O cast só diz isso ao TypeScript: quem confere e conserta o
    // formato é o `restore`, a mesma porta de entrada que o Excalidraw usa para arquivos.
    const scene = restore({ elements, files } as ImportedScene, null, null);

    return {
      elements: scene.elements,
      files: scene.files,
      appState: { viewBackgroundColor: "transparent" },
      scrollToContent: true,
    };
  }, [elements, files]);

  return (
    <Excalidraw
      initialData={initialData}
      viewModeEnabled
      zenModeEnabled
      theme="light"
      langCode="pt-BR"
      UIOptions={{
        canvasActions: {
          loadScene: false,
          saveToActiveFile: false,
          export: false,
          toggleTheme: false,
          changeViewBackgroundColor: false,
          clearCanvas: false,
        },
      }}
    />
  );
}
