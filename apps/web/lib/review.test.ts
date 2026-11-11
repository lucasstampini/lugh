/**
 * Testes de lib/review.ts
 *
 * O que cobre: a leitura e a validação do formulário em que o candidato avalia o
 * entrevistador (nota de 1 a 5 e comentário opcional).
 *
 * Por que importa: a nota entra na média que aparece no card do marketplace. A mesma
 * validação roda no navegador e na Server Action.
 *
 * Rodar só este arquivo: npx vitest run lib/review.test.ts
 */
import { describe, expect, it } from "vitest";

import { parseReviewForm, REVIEW_COMMENT_MAX_LENGTH } from "./review";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
}

describe("parseReviewForm", () => {
  it("lê nota e comentário, sem os espaços das pontas", () => {
    expect(parseReviewForm(form({ rating: "5", comment: "  Muito bom.  " }))).toEqual({
      success: true,
      data: { rating: 5, comment: "Muito bom." },
    });
  });

  it("aceita avaliação sem comentário", () => {
    expect(parseReviewForm(form({ rating: "3" }))).toEqual({
      success: true,
      data: { rating: 3, comment: "" },
    });
  });

  it("exige a nota", () => {
    const result = parseReviewForm(form({ comment: "Gostei." }));

    expect(result.success).toBe(false);
    if (!result.success) expect(result.fieldErrors.rating).toBeTruthy();
  });

  it.each(["0", "6", "4.5", "abc", ""])("recusa a nota %j", (rating) => {
    const result = parseReviewForm(form({ rating }));

    expect(result.success).toBe(false);
    if (!result.success) expect(result.fieldErrors.rating).toBeTruthy();
  });

  it("recusa comentário acima do limite", () => {
    const result = parseReviewForm(
      form({ rating: "4", comment: "a".repeat(REVIEW_COMMENT_MAX_LENGTH + 1) }),
    );

    expect(result.success).toBe(false);
    if (!result.success) expect(result.fieldErrors.comment).toContain("máximo");
  });
});
