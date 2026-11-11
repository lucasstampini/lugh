-- Fase 5 do PROJETO.md: sala ligada à sessão real.

-- Estado Yjs de cada sessão (código + quadro), salvo pelo Hocuspocus. O
-- filesystem do Render grátis é apagado ao reiniciar, então o documento mora
-- aqui. Só o backend lê e escreve (service role): RLS ligado e nenhuma policy.
create table public.collab_documents (
  name text primary key,
  state bytea not null,
  updated_at timestamptz not null default now()
);

alter table public.collab_documents enable row level security;

revoke all on public.collab_documents from anon, authenticated;

-- Nome dos dois participantes de uma sessão. profiles não tem leitura pública
-- (exporia o e-mail) e a view interviewer_profiles só cobre o entrevistador,
-- então o entrevistador não tinha como ler o nome do candidato. A função só
-- devolve sessões em que quem chama é participante, e só o nome.
create function public.session_participant_names(session_ids uuid[])
returns table (session_id uuid, candidate_name text, interviewer_name text)
language sql
security definer
set search_path = public
stable
as $$
  select
    s.id,
    coalesce(nullif(btrim(c.preferred_name), ''), c.name),
    i.name
  from public.sessions s
  join public.profiles c on c.id = s.candidate_id
  join public.profiles i on i.id = s.interviewer_id
  where s.id = any(session_ids)
    and auth.uid() in (s.candidate_id, s.interviewer_id);
$$;

revoke execute on function public.session_participant_names(uuid[]) from public, anon;
grant execute on function public.session_participant_names(uuid[]) to authenticated;
