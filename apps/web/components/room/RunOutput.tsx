"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

import { LANGUAGES } from "@/lib/room/languages";
import type { SharedRun } from "@/lib/room/meta";
import { needsMoreInput, RUN_OUTCOME_LABELS, STDIN_MAX_LENGTH } from "@/lib/room/run-code";

const languageLabels: Record<string, string> = Object.fromEntries(
  LANGUAGES.map(({ id, label }) => [id, label]),
);

type Props = {
  run: SharedRun | null;
  // Entrada (stdin) do programa, compartilhada entre os participantes.
  stdin: string;
  onStdinChange: (value: string) => void;
  // Sem colaboração conectada não há documento onde guardar a entrada.
  canEditStdin: boolean;
};

// Altura do painel, em px. O participante arrasta a borda de cima para mudar.
const DEFAULT_HEIGHT = 240;
const MIN_HEIGHT = 120;
// O editor nunca some: sobra pelo menos isto para ele.
const EDITOR_MIN_HEIGHT = 140;
const KEYBOARD_STEP = 24;

// Painel embaixo do editor, igual para os dois participantes: à esquerda o que o programa
// vai ler do teclado (entrada), à direita a última execução da sala (saída). Fica sempre
// visível para a saída não empurrar o editor quando aparece.
export function RunOutput({ run, stdin, onStdinChange, canEditStdin }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  // A altura é de cada participante (não sincroniza), como as abas Código e Quadro.
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const drag = useRef<{ startY: number; startHeight: number } | null>(null);

  const result = run?.state === "done" ? run.result : null;
  const succeeded = result?.outcome === "success";
  // A última execução parou porque o programa quis ler e não havia mais entrada.
  const askedForInput = result ? needsMoreInput(result) : false;

  function clampHeight(value: number): number {
    const available = sectionRef.current?.parentElement?.clientHeight;
    const max = available ? Math.max(MIN_HEIGHT, available - EDITOR_MIN_HEIGHT) : value;
    return Math.round(Math.min(Math.max(value, MIN_HEIGHT), max));
  }

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    const section = sectionRef.current;
    if (!section) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    // Parte da altura real: o CSS pode ter limitado a que está no estado.
    drag.current = { startY: event.clientY, startHeight: section.getBoundingClientRect().height };
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    // Arrastar para cima aumenta o painel.
    setHeight(clampHeight(drag.current.startHeight + drag.current.startY - event.clientY));
  }

  function endDrag() {
    drag.current = null;
  }

  function resizeWithKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    const current = sectionRef.current?.getBoundingClientRect().height ?? height;
    if (event.key === "ArrowUp") setHeight(clampHeight(current + KEYBOARD_STEP));
    else if (event.key === "ArrowDown") setHeight(clampHeight(current - KEYBOARD_STEP));
    else if (event.key === "Home") setHeight(clampHeight(Number.MAX_SAFE_INTEGER));
    else if (event.key === "End") setHeight(MIN_HEIGHT);
    else return;
    event.preventDefault();
  }

  return (
    <section
      ref={sectionRef}
      aria-label="Entrada e saída do código"
      style={{ height }}
      className="edge-t bg-background flex max-h-[75%] min-h-[120px] shrink-0 flex-col"
    >
      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label="Altura do painel de entrada e saída"
        aria-valuenow={height}
        aria-valuemin={MIN_HEIGHT}
        tabIndex={0}
        title="Arraste para mudar a altura. Dois cliques voltam ao tamanho inicial."
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={() => setHeight(DEFAULT_HEIGHT)}
        onKeyDown={resizeWithKeyboard}
        className="group hover:bg-muted flex h-3 shrink-0 cursor-row-resize touch-none items-center justify-center transition-colors"
      >
        <span aria-hidden="true" className="bg-input group-hover:bg-primary h-1 w-10 rounded-full transition-colors" />
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="flex w-[34%] max-w-[440px] min-w-[230px] shrink-0 flex-col px-4 pb-3">
          <label htmlFor="run-stdin" className="flex flex-wrap items-baseline gap-x-2 font-mono text-xs">
            <span className="font-bold">entrada</span>
            <span className="text-muted-foreground">o que o programa lê do teclado</span>
          </label>
          <textarea
            id="run-stdin"
            aria-describedby="run-stdin-help"
            value={stdin}
            onChange={(event) => onStdinChange(event.target.value)}
            disabled={!canEditStdin}
            maxLength={STDIN_MAX_LENGTH}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            placeholder={"Uma linha para cada input():\npedra\npapel\nsair"}
            className={`bg-card placeholder:text-muted-foreground mt-2 min-h-0 w-full flex-1 resize-none rounded-[10px] border-[1.5px] px-3 py-2 font-mono text-[13px] leading-[1.6] outline-none focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-60 ${
              askedForInput ? "border-primary" : "border-input"
            }`}
          />
          <p
            id="run-stdin-help"
            className={`pt-1.5 font-mono text-xs ${askedForInput ? "text-primary" : "text-muted-foreground"}`}
          >
            {askedForInput
              ? stdin.trim()
                ? "A entrada acabou antes de o programa parar de ler. Faltou alguma linha?"
                : "O programa pediu entrada. Escreva aqui e execute de novo."
              : "A execução não é interativa: preencha antes de executar. Vale para os dois."}
          </p>
        </div>

        <div className="edge-l flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 font-mono text-xs">
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
        </div>
      </div>
    </section>
  );
}
