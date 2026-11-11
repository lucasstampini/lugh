"use client";

import { useActionState, useState } from "react";
import { Field, FieldError, FormAlert } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  parseReviewForm,
  RATING_MAX,
  RATING_MIN,
  REVIEW_COMMENT_MAX_LENGTH,
} from "@/lib/review";
import { submitReview, type ReviewState } from "./actions";

const RATING_VALUES = Array.from(
  { length: RATING_MAX - RATING_MIN + 1 },
  (_, index) => RATING_MIN + index,
);

// O candidato avalia o entrevistador, uma vez por sessão. Depois de enviada, a página
// recarrega os dados e mostra a avaliação no lugar deste formulário.
export function ReviewForm({
  sessionId,
  interviewerName,
}: {
  sessionId: string;
  interviewerName: string;
}) {
  const [state, formAction, pending] = useActionState(
    // A mesma validação do servidor roda aqui antes de enviar.
    async (prevState: ReviewState, formData: FormData): Promise<ReviewState> => {
      const parsed = parseReviewForm(formData);
      if (!parsed.success) {
        return { error: "Confira os campos marcados abaixo.", fieldErrors: parsed.fieldErrors };
      }
      return submitReview(sessionId, prevState, formData);
    },
    null,
  );

  // Controlados: um erro não pode apagar o que já foi preenchido.
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");

  const fieldErrors = state?.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate className="edge flex flex-col gap-4 rounded-2xl p-5">
      <div
        role="radiogroup"
        aria-labelledby="rating-label"
        aria-describedby={fieldErrors.rating ? "rating-error" : undefined}
        className="flex flex-col gap-2"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p id="rating-label" className="text-sm font-bold">
            Sua nota para {interviewerName}
          </p>
          <span className="text-muted-foreground font-mono text-xs">1 fraco · 5 excelente</span>
        </div>
        <div className="flex gap-1.5 font-mono text-[15px]">
          {RATING_VALUES.map((value) => (
            <label
              key={value}
              className="edge bg-card has-checked:bg-foreground has-checked:text-background has-focus-visible:outline-ring inline-flex min-h-11 w-11 cursor-pointer items-center justify-center rounded-[9px] has-checked:font-bold has-focus-visible:outline-[3px] has-focus-visible:outline-offset-[3px]"
            >
              <input
                type="radio"
                name="rating"
                value={value}
                checked={rating === value}
                onChange={() => setRating(value)}
                className="sr-only"
              />
              <span className="sr-only">nota </span>
              {value}
            </label>
          ))}
        </div>
        <FieldError id="rating-error" message={fieldErrors.rating} />
      </div>

      <Field
        label="Comentário"
        htmlFor="comment"
        counter={`${comment.length}/${REVIEW_COMMENT_MAX_LENGTH}`}
        error={fieldErrors.comment}
        help="Opcional. Só você e quem entrevistou leem o comentário."
      >
        <Textarea
          id="comment"
          name="comment"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          maxLength={REVIEW_COMMENT_MAX_LENGTH}
          aria-invalid={fieldErrors.comment ? true : undefined}
          aria-describedby={fieldErrors.comment ? "comment-error" : undefined}
          placeholder="Ex: as dicas sobre como explicar trade-offs ajudaram muito."
        />
      </Field>

      {state?.error ? (
        <FormAlert title="Não deu para enviar sua avaliação">{state.error}</FormAlert>
      ) : null}

      <Button type="submit" disabled={pending} className="h-12 self-start px-5">
        {pending ? "Enviando..." : "Enviar avaliação"}
      </Button>
    </form>
  );
}
