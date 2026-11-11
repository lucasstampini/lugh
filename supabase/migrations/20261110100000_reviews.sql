-- Fase 6 do PROJETO.md: candidato avalia o entrevistador depois da sessão.
-- Nota em lote por entrevistador_id (sem precisar logar), pro marketplace e
-- pro perfil mostrarem a média sem expor review de ninguém individualmente.
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.sessions(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

create policy "reviews: candidate read own session" on public.reviews
  for select using (
    exists (
      select 1 from public.sessions s
      where s.id = reviews.session_id and s.candidate_id = auth.uid()
    )
  );

create policy "reviews: interviewer read own session" on public.reviews
  for select using (
    exists (
      select 1 from public.sessions s
      where s.id = reviews.session_id and s.interviewer_id = auth.uid()
    )
  );

create policy "reviews: candidate insert own completed session" on public.reviews
  for insert
  with check (
    exists (
      select 1 from public.sessions s
      where s.id = reviews.session_id
        and s.candidate_id = auth.uid()
        and s.status = 'completed'
    )
  );

-- Tela de avaliar ainda não existe (fase 6 não construída); edição e remoção
-- não têm fluxo nenhum até lá.
revoke update, delete on public.reviews from authenticated;

-- Média e contagem por entrevistador, em lote, sem expor review de ninguém:
-- a mesma ideia de interviewer_completed_sessions, mas aceitando vários ids
-- de uma vez pra não disparar uma chamada por card na listagem.
create function public.interviewer_ratings(interviewer_ids uuid[])
returns table (interviewer_id uuid, average numeric, review_count integer)
language sql
security definer
set search_path = public
stable
as $$
  select
    s.interviewer_id,
    round(avg(r.rating)::numeric, 1) as average,
    count(*)::integer as review_count
  from public.reviews r
  join public.sessions s on s.id = r.session_id
  where s.interviewer_id = any(interviewer_ids)
  group by s.interviewer_id;
$$;

grant execute on function public.interviewer_ratings(uuid[]) to anon, authenticated;
