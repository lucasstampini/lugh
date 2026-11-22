"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import { getCode, getMeta, type Collab } from "@/lib/room/collab";
import type { LanguageId } from "@/lib/room/languages";
import { getRun, setRun, type SharedRun } from "@/lib/room/meta";
import { runResultSchema, type RunResult } from "@/lib/room/run-code";

type Options = {
  collab: Collab | null;
  sessionId: string;
  userName: string;
  // Na sala de teste o servidor exige o nome no corpo (não há login).
  sendName: boolean;
  language: LanguageId;
};

// Bem acima do tempo máximo de uma execução (20 s de espera pelo Judge0 no servidor).
const RUN_STALE_MS = 40_000;

function failed(message: string): RunResult {
  return { outcome: "failed", output: "", errorOutput: message, timeSeconds: null };
}

async function requestRun(body: Record<string, unknown>): Promise<RunResult> {
  let response: Response;
  try {
    response = await fetch("/api/code/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return failed("Sem conexão com o servidor. Tente de novo.");
  }

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = data && typeof data === "object" && "error" in data ? data.error : null;
    return failed(typeof error === "string" ? error : "Não deu para executar o código. Tente de novo.");
  }
  const result = runResultSchema.safeParse(
    data && typeof data === "object" && "result" in data ? data.result : null,
  );
  return result.success ? result.data : failed("Não deu para executar o código. Tente de novo.");
}

// Execução do código da sala. O estado (executando, última saída) mora na gaveta `meta`
// do documento Yjs: candidato e entrevistador veem a mesma execução, quem quer que tenha
// clicado. O código enviado é o do documento compartilhado, não o de um editor local.
export function useRunCode({ collab, sessionId, userName, sendName, language }: Options) {
  // Só de quem clicou: evita dois cliques seguidos enquanto a resposta não chega.
  const [pending, setPending] = useState(false);

  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!collab) return () => {};
      const meta = getMeta(collab.ydoc);
      meta.observe(onChange);
      return () => meta.unobserve(onChange);
    },
    [collab],
  );
  // O valor guardado no documento é um objeto novo a cada escrita e o mesmo entre
  // escritas, então serve de snapshot estável para o useSyncExternalStore.
  const raw = useSyncExternalStore(
    subscribe,
    () => (collab ? getMeta(collab.ydoc).get("run") : undefined),
    () => undefined,
  );
  const shared: SharedRun | null = collab ? getRun(getMeta(collab.ydoc)) : null;

  // Quem clicou pode fechar a aba antes de a resposta chegar: o documento ficaria em
  // "executando" para sempre. Passado o prazo, esta tela mostra que a execução não terminou.
  const [staleRaw, setStaleRaw] = useState<unknown>(null);
  const running = shared?.state === "running";
  useEffect(() => {
    if (!running) return;
    const id = setTimeout(() => setStaleRaw(raw), RUN_STALE_MS);
    return () => clearTimeout(id);
  }, [running, raw]);

  const run: SharedRun | null =
    shared?.state === "running" && staleRaw === raw
      ? { ...shared, state: "done", result: failed("A execução não terminou. Execute de novo.") }
      : shared;

  const execute = useCallback(async () => {
    if (!collab || pending) return;
    const meta = getMeta(collab.ydoc);
    const code = getCode(collab.ydoc).toString();

    setPending(true);
    setRun(meta, { state: "running", by: userName, language });
    const result = await requestRun({
      sessionId,
      name: sendName ? userName : undefined,
      language,
      code,
    });
    setRun(meta, { state: "done", by: userName, language, result });
    setPending(false);
  }, [collab, pending, sessionId, userName, sendName, language]);

  return { run, pending, canRun: Boolean(collab), execute };
}
