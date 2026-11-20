"use client";

import { LANGUAGES } from "@/lib/room/languages";
import type { SharedRun } from "@/lib/room/meta";
import { RUN_OUTCOME_LABELS } from "@/lib/room/run-code";

const languageLabels: Record<string, string> = Object.fromEntries(
  LANGUAGES.map(({ id, label }) => [id, label]),
);

// Painel de saída embaixo do editor: mostra a última execução da sala, igual para os dois
// participantes. Fica sempre visível para a saída não empurrar o editor quando aparece.
export function RunOutput({ run }: { run: SharedRun | null }) {
  const result = run?.state === "done" ? run.result : null;
  const succeeded = result?.outcome === "success";

  return (
    <section
      aria-label="Saída do código"
      className="edge-t bg-background flex max-h-[38%] min-h-[112px] shrink-0 flex-col"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 pt-2.5 font-mono text-xs">
        <span className="font-bold">saída</span>
        {run ? (
          <span role="status" aria-live="polite" className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {run.state === "running" ? (
              <span className="text-muted-foreground">
                <span aria-hidden="true" className="bg-primary live mr-1.5 inline-block size-2 rounded-full" />
                executando…
              </span>
            ) : result ? (
              <span
                className={`edge rounded-md px-1.5 py-px font-bold ${
                  succeeded ? "bg-primary text-ink" : "border-destructive text-destructive"
                }`}
              >
                {RUN_OUTCOME_LABELS[result.outcome]}
              </span>
            ) : null}
            <span className="text-muted-foreground">
              {languageLabels[run.language] ?? run.language} · por {run.by}
              {result?.timeSeconds != null
                ? ` · ${result.timeSeconds.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} s`
                : ""}
            </span>
          </span>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-4 pt-2 pb-3 font-mono text-[13px] leading-[1.6]">
        {!run ? (
          <p className="text-muted-foreground">
            Clique em Executar para rodar o código. A saída aparece aqui para os dois.
          </p>
        ) : run.state === "running" ? null : result ? (
          <>
            {result.output ? <pre className="whitespace-pre-wrap break-words">{result.output}</pre> : null}
            {result.errorOutput ? (
              <pre className="text-destructive whitespace-pre-wrap break-words">{result.errorOutput}</pre>
            ) : null}
            {!result.output && !result.errorOutput ? (
              <p className="text-muted-foreground">O programa terminou sem imprimir nada.</p>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}
