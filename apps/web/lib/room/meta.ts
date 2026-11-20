import type * as Y from "yjs";
import { z } from "zod";

import { DEFAULT_LANGUAGE, languageSchema, parseLanguage, type LanguageId } from "./languages";
import { runResultSchema } from "./run-code";
import { NAME_MAX_LENGTH } from "./session";

// A gaveta `meta` do documento Yjs da sessão guarda o estado compartilhado da sala: a
// linguagem do editor (quando um participante troca, o outro vê a mesma) e a última
// execução do código (os dois veem a mesma saída).

const LANGUAGE_KEY = "language";

export function getLanguage(meta: Y.Map<unknown>): LanguageId {
  return parseLanguage(meta.get(LANGUAGE_KEY));
}

export function setLanguage(meta: Y.Map<unknown>, language: LanguageId): void {
  meta.set(LANGUAGE_KEY, parseLanguage(language));
}

// Chamar só depois do primeiro sync com o servidor: antes disso o documento local está vazio
// mesmo que o outro participante já tenha escolhido uma linguagem, e gravaríamos por cima.
export function ensureDefaultLanguage(meta: Y.Map<unknown>): void {
  if (!meta.has(LANGUAGE_KEY)) {
    meta.set(LANGUAGE_KEY, DEFAULT_LANGUAGE);
  }
}

const RUN_KEY = "run";

// Última execução do código. `running` enquanto a resposta do servidor não chega.
const sharedRunSchema = z.discriminatedUnion("state", [
  z.object({
    state: z.literal("running"),
    by: z.string().max(NAME_MAX_LENGTH * 2),
    language: languageSchema,
  }),
  z.object({
    state: z.literal("done"),
    by: z.string().max(NAME_MAX_LENGTH * 2),
    language: languageSchema,
    result: runResultSchema,
  }),
]);
export type SharedRun = z.infer<typeof sharedRunSchema>;

// O valor vem do documento, escrito por outro navegador: se não tiver o formato esperado
// é tratado como se não houvesse execução.
export function getRun(meta: Y.Map<unknown>): SharedRun | null {
  const parsed = sharedRunSchema.safeParse(meta.get(RUN_KEY));
  return parsed.success ? parsed.data : null;
}

export function setRun(meta: Y.Map<unknown>, run: SharedRun): void {
  meta.set(RUN_KEY, run);
}
