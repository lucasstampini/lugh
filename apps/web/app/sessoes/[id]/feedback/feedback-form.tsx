"use client";

import { useActionState, useState } from "react";
import { Field, FieldError, FormAlert } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  FEEDBACK_CRITERIA,
  FEEDBACK_TEXT_MAX_LENGTH,
  parseFeedbackForm,
  SCORE_MAX,
  SCORE_MIN,
  scoreFieldName,
} from "@/lib/feedback";
import type { SessionType } from "@/lib/room/session";
import { submitFeedback, type FeedbackState } from "./actions";

const SCORE_VALUES = Array.from({ length: SCORE_MAX - SCORE_MIN + 1 }, (_, index) => SCORE_MIN + index);

const HIRE_OPTIONS = [
  { value: "yes", label: "Sim, avançaria" },
  { value: "no", label: "Ainda não" },
] as const;

const H2 = "font-heading text-[22px] font-bold";
const SUMMARY_ROW = "flex justify-between gap-4";
// Escolha em pílula (nota e sim/não): marcada fica em tinta com texto branco.
const CHOICE =
  "edge bg-card has-checked:bg-foreground has-checked:text-background has-focus-visible:outline-ring inline-flex min-h-11 cursor-pointer items-center justify-center has-checked:font-bold has-focus-visible:outline-[3px] has-focus-visible:outline-offset-[3px]";

export function FeedbackForm({
  sessionId,
  type,
  candidateName,
  sessionDate,
  typeLabel,
}: {
  sessionId: string;
  type: SessionType;
  candidateName: string;
  // "qua, 18 nov · 19h"
  sessionDate: string;
  typeLabel: string;
}) {
  const criteria = FEEDBACK_CRITERIA[type];

  const [state, formAction, pending] = useActionState(
    // A mesma validação do servidor roda aqui antes: erro de campo aparece sem ida e volta.
    async (prevState: FeedbackState, formData: FormData): Promise<FeedbackState> => {
      const parsed = parseFeedbackForm(type, formData);
      if (!parsed.success) {
        return { error: "Confira os campos marcados abaixo.", fieldErrors: parsed.fieldErrors };
      }
      return submitFeedback(sessionId, prevState, formData);
    },
    null,
  );

  // Controlados: o React limpa campos não controlados depois da action, e um erro não
  // pode apagar o que o entrevistador já escreveu.
  const [scores, setScores] = useState<Record<string, number>>({});
  const [strengths, setStrengths] = useState("");
  const [improvements, setImprovements] = useState("");
  const [wouldHire, setWouldHire] = useState<string | null>(null);

  const fieldErrors = state?.fieldErrors ?? {};
  const given = criteria.filter((criterion) => scores[criterion.key] !== undefined);
  const average =
    given.length > 0
      ? given.reduce((sum, criterion) => sum + scores[criterion.key], 0) / given.length
      : null;

  return (
    <form action={formAction} noValidate className="flex flex-wrap items-start gap-x-12 gap-y-7">
      <div className="flex min-w-0 flex-[999_1_480px] flex-col gap-8">
        <div className="flex flex-col gap-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className={H2}>Notas</h2>
            <span className="text-muted-foreground font-mono text-xs">1 fraco · 5 excelente</span>
          </div>

          {criteria.map((criterion) => {
            const name = scoreFieldName(criterion.key);
            const error = fieldErrors[name];

            return (
              <div
                key={criterion.key}
                role="radiogroup"
                aria-labelledby={`${name}-label`}
                aria-describedby={error ? `${name}-error` : `${name}-help`}
                className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3"
              >
                <div className="min-w-0 flex-[1_1_260px]">
                  <p id={`${name}-label`} className="font-extrabold">
                    {criterion.label}
                  </p>
                  <p id={`${name}-help`} className="text-muted-foreground text-sm">
                    {criterion.help}
                  </p>
                </div>
                <div className="flex gap-1.5 font-mono text-[15px]">
                  {SCORE_VALUES.map((value) => (
                    <label key={value} className={`${CHOICE} w-11 rounded-[9px]`}>
                      <input
                        type="radio"
                        name={name}
                        value={value}
                        checked={scores[criterion.key] === value}
                        onChange={() => setScores((current) => ({ ...current, [criterion.key]: value }))}
                        className="sr-only"
                      />
                      <span className="sr-only">nota </span>
                      {value}
                    </label>
                  ))}
                </div>
                <div className="w-full empty:hidden">
                  <FieldError id={`${name}-error`} message={error} />
                </div>
              </div>
            );
          })}
        </div>

        <Field
          label="Pontos fortes"
          htmlFor="strengths"
          counter={`${strengths.length}/${FEEDBACK_TEXT_MAX_LENGTH}`}
          error={fieldErrors.strengths}
          help="Um ponto por linha. Cada linha vira um item na tela do candidato."
        >
          <Textarea
            id="strengths"
            name="strengths"
            value={strengths}
            onChange={(event) => setStrengths(event.target.value)}
            maxLength={FEEDBACK_TEXT_MAX_LENGTH}
            aria-invalid={fieldErrors.strengths ? true : undefined}
            aria-describedby={fieldErrors.strengths ? "strengths-error" : undefined}
            placeholder="Ex: explicou o raciocínio antes de escrever a primeira linha."
            className="min-h-32"
          />
        </Field>

        <Field
          label="O que melhorar"
          htmlFor="improvements"
          counter={`${improvements.length}/${FEEDBACK_TEXT_MAX_LENGTH}`}
          error={fieldErrors.improvements}
          help="Um ponto por linha. Diga o que fazer diferente na próxima entrevista."
        >
          <Textarea
            id="improvements"
            name="improvements"
            value={improvements}
            onChange={(event) => setImprovements(event.target.value)}
            maxLength={FEEDBACK_TEXT_MAX_LENGTH}
            aria-invalid={fieldErrors.improvements ? true : undefined}
            aria-describedby={fieldErrors.improvements ? "improvements-error" : undefined}
            placeholder="Ex: testar a solução com um caso de borda antes de dizer que terminou."
            className="min-h-32"
          />
        </Field>

        <fieldset
          aria-describedby={fieldErrors.wouldHire ? "wouldHire-error" : undefined}
          className="flex flex-col gap-2.5"
        >
          <legend className={`${H2} mb-1`}>Avançaria com {candidateName} no processo?</legend>
          <p className="text-muted-foreground text-sm">
            Pense numa vaga do nível que a pessoa está buscando.
          </p>
          <div className="flex flex-wrap gap-2">
            {HIRE_OPTIONS.map((option) => (
              <label key={option.value} className={`${CHOICE} rounded-[9px] px-4 text-sm font-semibold`}>
                <input
                  type="radio"
                  name="wouldHire"
                  value={option.value}
                  checked={wouldHire === option.value}
                  onChange={() => setWouldHire(option.value)}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </div>
          <FieldError id="wouldHire-error" message={fieldErrors.wouldHire} />
        </fieldset>
      </div>

      <aside
        aria-label="Resumo do feedback"
        className="edge bg-card box-border flex w-full min-w-0 flex-[1_1_300px] flex-col gap-4 rounded-[18px] p-5 md:max-w-[380px]"
      >
        <dl className="flex flex-col gap-2.5 font-mono text-[13px]">
          <div className={SUMMARY_ROW}>
            <dt className="text-muted-foreground">candidato</dt>
            <dd className="text-right font-bold break-words">{candidateName}</dd>
          </div>
          <div className={SUMMARY_ROW}>
            <dt className="text-muted-foreground">sessão</dt>
            <dd className="text-right">{sessionDate}</dd>
          </div>
          <div className={SUMMARY_ROW}>
            <dt className="text-muted-foreground">tipo</dt>
            <dd className="text-right">{typeLabel}</dd>
          </div>
          <div className={SUMMARY_ROW}>
            <dt className="text-muted-foreground">notas dadas</dt>
            <dd aria-live="polite" className="tabular-nums">
              {given.length} de {criteria.length}
            </dd>
          </div>
        </dl>
        <div className="border-border border-t-[1.5px] border-dashed" />
        <div className="flex items-baseline justify-between gap-4">
          <span className="font-extrabold">Média</span>
          <span className="font-heading text-[28px] leading-none font-extrabold tabular-nums">
            {average === null ? "0,0" : average.toFixed(1).replace(".", ",")}
            <span className="text-muted-foreground ml-1 font-mono text-[13px] font-normal">/ 5</span>
          </span>
        </div>

        {state?.error ? (
          <FormAlert title="Não deu para enviar o feedback">{state.error}</FormAlert>
        ) : null}

        <Button type="submit" size="lg" disabled={pending} className="h-[54px] w-full">
          {pending ? "Enviando..." : "Enviar feedback"}
        </Button>
        <p className="text-muted-foreground text-center font-mono text-xs">
          depois de enviado, não dá para editar
        </p>
      </aside>
    </form>
  );
}
