"use client";

import Editor from "@monaco-editor/react";
import { useState } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEFAULT_LANGUAGE, LANGUAGES, parseLanguage, type LanguageId } from "@/lib/room/languages";

import "./monaco-setup";

const languageItems = Object.fromEntries(LANGUAGES.map(({ id, label }) => [id, label]));

// Editor de código da sala (fase 1, bullet 2): Monaco com seletor de linguagem.
export default function CodeEditor() {
  const [language, setLanguage] = useState<LanguageId>(DEFAULT_LANGUAGE);

  return (
    <section aria-label="Editor de código" className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium">Código</h2>
        <Select items={languageItems} value={language} onValueChange={(value) => setLanguage(parseLanguage(value))}>
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
          loading={<p className="text-muted-foreground p-4 text-sm">Carregando o editor...</p>}
          options={{ minimap: { enabled: false }, fontSize: 14, automaticLayout: true, scrollBeyondLastLine: false }}
        />
      </div>
    </section>
  );
}
