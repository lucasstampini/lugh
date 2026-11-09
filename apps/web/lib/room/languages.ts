import { z } from "zod";

// Linguagens do editor da sala (fase 1, bullet 2). O id é o mesmo que o Monaco usa
// para o realce de sintaxe; o rótulo é o que aparece no seletor.
export const LANGUAGES = [
  { id: "javascript", label: "JavaScript" },
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
] as const;

export type LanguageId = (typeof LANGUAGES)[number]["id"];

export const DEFAULT_LANGUAGE: LanguageId = "javascript";

export const languageSchema = z.enum(LANGUAGES.map((language) => language.id) as [LanguageId, ...LanguageId[]]);

// Valor vindo de fora (documento Yjs, outro participante): qualquer coisa inválida vira o padrão.
export function parseLanguage(value: unknown): LanguageId {
  const result = languageSchema.safeParse(value);
  return result.success ? result.data : DEFAULT_LANGUAGE;
}
