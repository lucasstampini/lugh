-- Fase 4/6 do PROJETO.md: sessions e feedbacks. Agendamento (fase 4) e sala
-- (fase 5) ainda não escrevem aqui de verdade, mas a tela /sessoes/[id]/resultado
-- (fase 6) precisa de dado real pra não inventar conteúdo na tela.
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  interviewer_id uuid not null references public.profiles(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  type text not null check (type in ('coding', 'system_design', 'behavioral')),
  status text not null default 'pending_payment' check (status in (
    'pending_payment', 'scheduled', 'in_progress', 'awaiting_feedback',
    'completed', 'expired', 'canceled', 'no_show'
  )),
  candidate_notes text,
  livekit_room text,
  collab_doc_name text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

alter table public.sessions enable row level security;

create policy "sessions: candidate read own" on public.sessions
  for select using (auth.uid() = candidate_id);

create policy "sessions: interviewer read own" on public.sessions
  for select using (auth.uid() = interviewer_id);

-- Agendamento e mudança de status ainda não têm fluxo pelo client (fases 4/5/7
-- não construídas); até lá, escrita só pelo backend com service role.
revoke insert, update, delete on public.sessions from authenticated;

create table public.feedbacks (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.sessions(id) on delete cascade,
  scores jsonb not null,
  strengths text,
  improvements text,
  would_hire boolean,
  created_at timestamptz not null default now()
);

alter table public.feedbacks enable row level security;

create policy "feedbacks: candidate read own session" on public.feedbacks
  for select using (
    exists (
      select 1 from public.sessions s
      where s.id = feedbacks.session_id and s.candidate_id = auth.uid()
    )
  );

create policy "feedbacks: interviewer read own session" on public.feedbacks
  for select using (
    exists (
      select 1 from public.sessions s
      where s.id = feedbacks.session_id and s.interviewer_id = auth.uid()
    )
  );

-- Formulário de feedback (fase 6, entrevistador preenche) ainda não existe;
-- até lá, escrita só pelo backend com service role.
revoke insert, update, delete on public.feedbacks from authenticated;
