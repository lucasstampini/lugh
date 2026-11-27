import { z } from "zod";

// Linguagens do editor da sala (fase 1, bullet 2). O id é o mesmo que o Monaco usa
// para o realce de sintaxe; o rótulo é o que aparece no seletor.
export const LANGUAGES = [
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
  { id: "c", label: "C" },
  { id: "cpp", label: "C++" },
  { id: "csharp", label: "C#" },
  { id: "go", label: "Go" },
  { id: "rust", label: "Rust" },
  { id: "kotlin", label: "Kotlin" },
  { id: "swift", label: "Swift" },
  { id: "ruby", label: "Ruby" },
  { id: "php", label: "PHP" },
] as const;

export type LanguageId = (typeof LANGUAGES)[number]["id"];

export const DEFAULT_LANGUAGE: LanguageId = "javascript";

export const languageSchema = z.enum(LANGUAGES.map((language) => language.id) as [LanguageId, ...LanguageId[]]);

// Valor vindo de fora (documento Yjs, outro participante): qualquer coisa inválida vira o padrão.
export function parseLanguage(value: unknown): LanguageId {
  const result = languageSchema.safeParse(value);
  return result.success ? result.data : DEFAULT_LANGUAGE;
}
