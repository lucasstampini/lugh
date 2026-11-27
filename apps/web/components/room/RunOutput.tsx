"use client";

import { useState } from "react";

import { LANGUAGES } from "@/lib/room/languages";
import type { SharedRun } from "@/lib/room/meta";
import { RUN_OUTCOME_LABELS, STDIN_MAX_LENGTH } from "@/lib/room/run-code";

const languageLabels: Record<string, string> = Object.fromEntries(
  LANGUAGES.map(({ id, label }) => [id, label]),
);

type Panel = "output" | "input";

type Props = {
  run: SharedRun | null;
  // Entrada (stdin) do programa, compartilhada entre os participantes.
  stdin: string;
  onStdinChange: (value: string) => void;
  // Sem colaboração conectada não há documento onde guardar a entrada.
  canEditStdin: boolean;
};

const panelTabClass = (active: boolean) =>
  `rounded-sm font-bold outline-none focus-visible:underline ${
    active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
  }`;

// Painel embaixo do editor, igual para os dois participantes: a última execução da sala
// (aba saída) e o que o programa vai ler do teclado (aba entrada). Fica sempre visível
// para a saída não empurrar o editor quando aparece.
export function RunOutput({ run, stdin, onStdinChange, canEditStdin }: Props) {
  // A aba é de cada participante, como as abas Código e Quadro.
  const [panel, setPanel] = useState<Panel>("output");
  const result = run?.state === "done" ? run.result : null;
  const succeeded = result?.outcome === "success";

  // Quando uma execução começa (de qualquer participante), quem estava na entrada volta
  // para a saída, senão o resultado chegaria escondido.
  const runState = run?.state ?? null;
  const [seenRunState, setSeenRunState] = useState(runState);
  if (runState !== seenRunState) {
    setSeenRunState(runState);
    if (runState === "running") setPanel("output");
  }

  return (
    <section
      aria-label="Saída e entrada do código"
      className="edge-t bg-background flex max-h-[38%] min-h-[112px] shrink-0 flex-col"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 pt-2.5 font-mono text-xs">
        <div role="tablist" aria-label="Painel de execução" className="flex items-center gap-x-3">
          <button
            type="button"
            role="tab"
            id="run-tab-output"
            aria-selected={panel === "output"}
            aria-controls="run-panel-output"
            onClick={() => setPanel("output")}
            className={panelTabClass(panel === "output")}
          >
            saída
          </button>
          <button
            type="button"
            role="tab"
            id="run-tab-input"
            aria-selected={panel === "input"}
            aria-controls="run-panel-input"
            onClick={() => setPanel("input")}
            className={panelTabClass(panel === "input")}
          >
            entrada
            {stdin ? (
              <>
                <span aria-hidden="true" className="bg-primary ml-1.5 inline-block size-1.5 rounded-full align-middle" />
                <span className="sr-only"> (preenchida)</span>
              </>
            ) : null}
          </button>
        </div>
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

      {panel === "output" ? (
        <div
          role="tabpanel"
          id="run-panel-output"
          aria-labelledby="run-tab-output"
          className="min-h-0 flex-1 overflow-auto px-4 pt-2 pb-3 font-mono text-[13px] leading-[1.6]"
        >
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
      ) : (
        <div
          role="tabpanel"
          id="run-panel-input"
          aria-labelledby="run-tab-input"
          className="flex min-h-0 flex-1 flex-col px-4 pt-2 pb-3"
        >
          <textarea
            aria-label="Entrada do programa"
            aria-describedby="run-input-help"
            value={stdin}
            onChange={(event) => onStdinChange(event.target.value)}
            disabled={!canEditStdin}
            maxLength={STDIN_MAX_LENGTH}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            placeholder={"pedra\npapel\nsair"}
            className="edge bg-card placeholder:text-muted-foreground min-h-[52px] w-full flex-1 resize-none rounded-[10px] px-3 py-2 font-mono text-[13px] leading-[1.6] outline-none focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-60"
          />
          <p id="run-input-help" className="text-muted-foreground pt-1.5 font-mono text-xs">
            O programa lê daqui em vez do teclado: uma linha para cada leitura (input, Scanner,
            readline). Vale para os dois.
          </p>
        </div>
      )}
    </section>
  );
}
