import type * as Y from "yjs";
import { z } from "zod";

import { DEFAULT_LANGUAGE, languageSchema, parseLanguage, type LanguageId } from "./languages";
import { runResultSchema, STDIN_MAX_LENGTH } from "./run-code";
import { NAME_MAX_LENGTH } from "./session";

// A gaveta `meta` do documento Yjs da sessão guarda o estado compartilhado da sala: a
// linguagem do editor (quando um participante troca, o outro vê a mesma), a entrada que o
// programa lê e a última execução do código (os dois veem a mesma saída).

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

const STDIN_KEY = "stdin";

// Entrada (stdin) que o programa lê ao executar, igual para os dois participantes.
// shortcut: é uma string simples na gaveta, então se os dois digitarem ao mesmo tempo vale
// a última escrita. Para um campo curto de entrada basta; se incomodar, vira um Y.Text.
export function getStdin(meta: Y.Map<unknown>): string {
  const value = meta.get(STDIN_KEY);
  // Escrito por outro navegador: o que não for texto é ignorado e o excesso é cortado.
  return typeof value === "string" ? value.slice(0, STDIN_MAX_LENGTH) : "";
}

export function setStdin(meta: Y.Map<unknown>, stdin: string): void {
  meta.set(STDIN_KEY, stdin.slice(0, STDIN_MAX_LENGTH));
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
