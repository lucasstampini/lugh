import type * as Y from "yjs";

import { DEFAULT_LANGUAGE, parseLanguage, type LanguageId } from "./languages";

// A gaveta `meta` do documento Yjs da sessão guarda configurações compartilhadas da sala.
// Hoje só a linguagem do editor: quando um participante troca, o outro vê a mesma.

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
