"use client";

import Editor, { type OnMount } from "@monaco-editor/react";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { MonacoBinding } from "y-monaco";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCode, getMeta, type Collab } from "@/lib/room/collab";
import { DEFAULT_LANGUAGE, LANGUAGES, parseLanguage, type LanguageId } from "@/lib/room/languages";
import { getLanguage, setLanguage } from "@/lib/room/meta";

import { useCollab } from "./CollabProvider";
import "./monaco-setup";
import { RemoteCursorStyles } from "./RemoteCursorStyles";

type MonacoEditor = Parameters<OnMount>[0];

const languageItems = Object.fromEntries(LANGUAGES.map(({ id, label }) => [id, label]));

// Linguagem do editor: compartilhada pelo `meta` do documento Yjs quando há colaboração,
// local quando não há. Os dois participantes sempre veem a mesma.
function useLanguage(collab: Collab | null): [LanguageId, (language: LanguageId) => void] {
  const [localLanguage, setLocalLanguage] = useState<LanguageId>(DEFAULT_LANGUAGE);

  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!collab) return () => {};
      const meta = getMeta(collab.ydoc);
      meta.observe(onChange);
      return () => meta.unobserve(onChange);
    },
    [collab],
  );
  const sharedLanguage = useSyncExternalStore(
    subscribe,
    () => (collab ? getLanguage(getMeta(collab.ydoc)) : null),
    () => null,
  );

  const change = useCallback(
    (language: LanguageId) => (collab ? setLanguage(getMeta(collab.ydoc), language) : setLocalLanguage(language)),
    [collab],
  );

  return [sharedLanguage ?? localLanguage, change];
}

// Editor de código da sala (fase 1, bullets 2 e 3): Monaco com seletor de linguagem,
// sincronizado com o outro participante pelo Yjs (texto, linguagem e cursores).
export default function CodeEditor() {
  const collabState = useCollab();
  const collab = collabState?.collab ?? null;
  const [editor, setEditor] = useState<MonacoEditor | null>(null);
  const [language, changeLanguage] = useLanguage(collab);

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
    <section aria-label="Editor de código" className="flex min-h-0 flex-1 flex-col gap-2">
      {collab?.provider.awareness && <RemoteCursorStyles awareness={collab.provider.awareness} />}
      <div className="flex items-center justify-end gap-2">
        <Select items={languageItems} value={language} onValueChange={(value) => changeLanguage(parseLanguage(value))}>
          <SelectTrigger aria-label="Linguagem" size="sm" className="min-w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map(({ id, label }) => (
              <SelectItem key={id} value={id}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
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
