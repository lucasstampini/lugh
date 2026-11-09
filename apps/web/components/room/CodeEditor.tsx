"use client";

import Editor, { type OnMount } from "@monaco-editor/react";
import { useEffect, useState } from "react";
import { MonacoBinding } from "y-monaco";

import { getCode } from "@/lib/room/collab";
import type { LanguageId } from "@/lib/room/languages";

import { useCollab } from "./CollabProvider";
import "./monaco-setup";
import { RemoteCursorStyles } from "./RemoteCursorStyles";

type MonacoEditor = Parameters<OnMount>[0];

// Editor de código da sala (fase 1, bullets 2 e 3): Monaco sincronizado com o outro
// participante pelo Yjs (texto e cursores). A linguagem vem do seletor no cabeçalho da sala.
export default function CodeEditor({ language }: { language: LanguageId }) {
  const collabState = useCollab();
  const collab = collabState?.collab ?? null;
  const [editor, setEditor] = useState<MonacoEditor | null>(null);

  // Liga o texto do Monaco ao Y.Text `code`: o que um digita vai para o documento, e o que
  // chega do documento aparece no editor. Destruir no cleanup evita binding duplicado.
  useEffect(() => {
    const model = editor?.getModel();
    if (!editor || !model || !collab) return;

    const binding = new MonacoBinding(
      getCode(collab.ydoc),
      model,
      new Set([editor]),
      collab.provider.awareness ?? undefined,
    );
    // O y-monaco só desenha os cursores remotos quando o awareness muda. Quem entra depois
    // (ou cujo editor termina de carregar depois) não veria o cursor do outro até ele se mexer.
    binding._rerenderDecorations();
    return () => binding.destroy();
  }, [editor, collab]);

  return (
    <section aria-label="Editor de código" className="flex min-h-0 flex-1 flex-col">
      {collab?.provider.awareness && <RemoteCursorStyles awareness={collab.provider.awareness} />}
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border">
        <Editor
          language={language}
          theme="vs-dark"
          onMount={setEditor}
          loading={<p className="text-muted-foreground p-4 text-sm">Carregando o editor...</p>}
          options={{ minimap: { enabled: false }, fontSize: 14, automaticLayout: true, scrollBeyondLastLine: false }}
        />
      </div>
    </section>
  );
}
