-- A policy de insert de reviews deixa o candidato gravar direto pelo client, sem passar
-- pela Server Action que limita o comentário a 500 caracteres. O comentário é público no
-- perfil do entrevistador, então o limite precisa valer no banco. O mesmo número está em
-- REVIEW_COMMENT_MAX_LENGTH (apps/web/lib/review.ts).
alter table public.reviews
  add constraint reviews_comment_length check (comment is null or char_length(comment) <= 500);
