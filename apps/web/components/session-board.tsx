"use client";

import dynamic from "next/dynamic";

// Quadro final da sessão na tela de resultado, somente leitura. O Excalidraw só roda no
// navegador, então o canvas entra por dynamic sem SSR.
const SessionBoardCanvas = dynamic(() => import("./session-board-canvas"), {
  ssr: false,
  loading: () => (
    <p role="status" className="text-muted-foreground p-4 font-mono text-[13px]">
      carregando o quadro…
    </p>
  ),
});

export function SessionBoard({
  elements,
  files,
}: {
  elements: unknown[];
  files: Record<string, unknown>;
}) {
  return (
    <div className="edge bg-card h-[420px] overflow-hidden rounded-[14px]">
      <SessionBoardCanvas elements={elements} files={files} />
    </div>
  );
}
