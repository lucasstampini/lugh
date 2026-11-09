"use client";

import "@excalidraw/excalidraw/index.css";

import { Excalidraw } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { useState } from "react";

// Quadro branco da sala (fase 1, bullet 4): Excalidraw para desenhar a arquitetura em
// entrevistas de system design.
export default function Whiteboard() {
  const [, setApi] = useState<ExcalidrawImperativeAPI | null>(null);

  return (
    <section aria-label="Quadro" className="flex min-h-0 flex-1 flex-col gap-2">
      <h2 className="text-sm font-medium">Quadro</h2>
      {/* O Excalidraw ocupa 100% do pai: sem altura definida aqui ele some (0px). */}
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border">
        <Excalidraw
          excalidrawAPI={setApi}
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
