"use client";

import "@excalidraw/excalidraw/index.css";

import { Excalidraw, restore } from "@excalidraw/excalidraw";
import type {
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
} from "@excalidraw/excalidraw/types";
import { useEffect, useMemo, useState } from "react";

import { useSceneReady } from "./room/use-scene-ready";

type ImportedScene = Parameters<typeof restore>[0];

// Quanto da caixa o desenho ocupa depois de enquadrado: o resto é margem.
const BOARD_FIT_FACTOR = 0.9;

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

  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const sceneReady = useSceneReady(api);

  // O `scrollToContent` do initialData só centraliza, com zoom de 100%: um desenho maior que a
  // caixa aparecia cortado. Aqui o desenho inteiro é enquadrado, reduzindo o zoom se preciso.
  // `maxZoom: 1` impede que um desenho pequeno seja ampliado.
  useEffect(() => {
    if (!api || !sceneReady) return;
    api.scrollToContent(api.getSceneElements(), {
      fitToViewport: true,
      viewportZoomFactor: BOARD_FIT_FACTOR,
      maxZoom: 1,
      animate: false,
    });
  }, [api, sceneReady]);

  return (
    <Excalidraw
      excalidrawAPI={setApi}
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
