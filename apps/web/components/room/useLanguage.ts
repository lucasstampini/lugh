"use client";

import { useCallback, useState, useSyncExternalStore } from "react";

import { getMeta, type Collab } from "@/lib/room/collab";
import { DEFAULT_LANGUAGE, type LanguageId } from "@/lib/room/languages";
import { getLanguage, setLanguage } from "@/lib/room/meta";

// Linguagem do editor: compartilhada pelo `meta` do documento Yjs quando há colaboração,
// local quando não há. Os dois participantes sempre veem a mesma.
export function useLanguage(collab: Collab | null): [LanguageId, (language: LanguageId) => void] {
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
