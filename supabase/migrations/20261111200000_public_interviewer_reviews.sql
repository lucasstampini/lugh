-- Fase 6 do PROJETO.md: as avaliações que os candidatos dão passam a ser
-- públicas no perfil do entrevistador (nota, comentário e data).
--
-- A tabela reviews segue sem leitura pública: uma policy aberta exporia o
-- session_id, e o nome de quem avaliou mora em profiles, que nunca tem leitura
-- pública (exporia o e-mail). A função devolve só o que a tela mostra, com o
-- primeiro nome do candidato e nada mais dele.
create function public.interviewer_reviews(interviewer uuid)
returns table (
  rating smallint,
  comment text,
  created_at timestamptz,
  reviewer_first_name text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    r.rating,
    r.comment,
    r.created_at,
    -- Primeiro nome: o nome preferido, se o candidato informou, ou o do cadastro.
    nullif(split_part(btrim(coalesce(nullif(btrim(c.preferred_name), ''), c.name, '')), ' ', 1), '')
  from public.reviews r
  join public.sessions s on s.id = r.session_id
  join public.profiles c on c.id = s.candidate_id
  where s.interviewer_id = interviewer
  order by r.created_at desc
  limit 50;
$$;

grant execute on function public.interviewer_reviews(uuid) to anon, authenticated;
