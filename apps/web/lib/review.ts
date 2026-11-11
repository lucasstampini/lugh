import { z } from "zod";

// Regras da avaliação que o candidato dá ao entrevistador. Valem no cliente e no
// servidor; o banco repete a faixa da nota (check em reviews.rating).

export const RATING_MIN = 1;
export const RATING_MAX = 5;
export const REVIEW_COMMENT_MAX_LENGTH = 500;

export const reviewSchema = z.object({
  rating: z.coerce
    .number({ error: "Escolha uma nota de 1 a 5." })
    .int({ error: "Escolha uma nota de 1 a 5." })
    .min(RATING_MIN, { error: "Escolha uma nota de 1 a 5." })
    .max(RATING_MAX, { error: "Escolha uma nota de 1 a 5." }),
  comment: z
    .string()
    .trim()
    .max(REVIEW_COMMENT_MAX_LENGTH, {
      error: `Use no máximo ${REVIEW_COMMENT_MAX_LENGTH} caracteres.`,
    }),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

export type ReviewFieldErrors = { rating?: string; comment?: string };

export type ParsedReview =
  | { success: true; data: ReviewInput }
  | { success: false; fieldErrors: ReviewFieldErrors };

// Lê o formulário de avaliação. A mesma função roda no navegador e na Server Action.
export function parseReviewForm(formData: FormData): ParsedReview {
  const parsed = reviewSchema.safeParse({
    // Number(null) é 0; sem valor, a nota não existe.
    rating: formData.get("rating") ?? undefined,
    comment: formData.get("comment") ?? "",
  });

  if (!parsed.success) {
    const fieldErrors: ReviewFieldErrors = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === "rating" || field === "comment") fieldErrors[field] ??= issue.message;
    }
    return { success: false, fieldErrors };
  }

  return { success: true, data: parsed.data };
}
