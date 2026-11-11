"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LANGUAGES, parseLanguage, type LanguageId } from "@/lib/room/languages";

const languageItems = Object.fromEntries(LANGUAGES.map(({ id, label }) => [id, label]));

type Props = { value: LanguageId; onChange: (language: LanguageId) => void };

// Seletor de linguagem do editor, no cabeçalho da sala ao lado do indicador de conexão.
export function LanguageSelect({ value, onChange }: Props) {
  return (
    <Select items={languageItems} value={value} onValueChange={(next) => onChange(parseLanguage(next))}>
      <SelectTrigger aria-label="Linguagem" className="min-w-32 font-mono text-[13px]">
        <SelectValue />
      </SelectTrigger>
      {/* O menu abre num portal no <body>, fora da sala: sem isto ele perde a fonte do tema do
          LiveKit (usada na sala toda) e os tokens escuros. */}
      <SelectContent data-lk-theme="default" className="dark">
        {LANGUAGES.map(({ id, label }) => (
          <SelectItem key={id} value={id}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
