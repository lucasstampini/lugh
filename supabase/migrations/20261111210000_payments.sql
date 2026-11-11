-- Fase 7 do PROJETO.md: pagamento por PIX (AbacatePay).

-- Uma cobrança por sessão. amount_cents é o valor cobrado do candidato, gravado na hora
-- de agendar (mudar o preço depois não muda a cobrança). interviewer_share_cents é a
-- parte separada para a subconta do entrevistador no split: fica 0 quando a cobrança foi
-- criada sem split (entrevistador ainda sem subconta), e aí o valor todo está com o Lugh.
-- br_code e br_code_base64 são o PIX copia e cola e o QR code: a AbacatePay só os devolve
-- na criação, e o candidato precisa conseguir reabrir a tela de pagamento.
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.sessions(id) on delete cascade,
  abacate_billing_id text not null unique,
  amount_cents integer not null check (amount_cents > 0),
  interviewer_share_cents integer not null
    check (interviewer_share_cents >= 0 and interviewer_share_cents <= amount_cents),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'released', 'refunded')),
  br_code text not null,
  br_code_base64 text not null,
  expires_at timestamptz not null,
  paid_at timestamptz,
  released_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;

create policy "payments: candidate read own session" on public.payments
  for select using (
    exists (
      select 1 from public.sessions s
      where s.id = payments.session_id and s.candidate_id = auth.uid()
    )
  );

create policy "payments: interviewer read own session" on public.payments
  for select using (
    exists (
      select 1 from public.sessions s
      where s.id = payments.session_id and s.interviewer_id = auth.uid()
    )
  );

-- Pagamento é escrita sensível: só o backend (service role) cria e muda status.
revoke insert, update, delete on public.payments from anon, authenticated;

-- Sessão que ficou 30 minutos sem pagamento não segura mais o horário, mesmo antes de o
-- backend marcá-la como expired (não há cron: a marcação acontece no próximo acesso).
-- O prazo é o mesmo PAYMENT_WINDOW_MINUTES de apps/web/lib/payments.ts.
create or replace function public.interviewer_booked_slots(
  interviewer uuid,
  from_ts timestamptz,
  to_ts timestamptz
)
returns table (starts_at timestamptz, ends_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select s.starts_at, s.ends_at
  from public.sessions s
  where s.interviewer_id = interviewer
    and s.status in ('pending_payment', 'scheduled', 'in_progress', 'awaiting_feedback')
    and not (s.status = 'pending_payment' and s.created_at < now() - interval '30 minutes')
    and s.starts_at < to_ts
    and s.ends_at > from_ts;
$$;

create or replace function public.interviewers_booked_slots(
  interviewer_ids uuid[],
  from_ts timestamptz,
  to_ts timestamptz
)
returns table (interviewer_id uuid, starts_at timestamptz, ends_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select s.interviewer_id, s.starts_at, s.ends_at
  from public.sessions s
  where s.interviewer_id = any(interviewer_ids)
    and s.status in ('pending_payment', 'scheduled', 'in_progress', 'awaiting_feedback')
    and not (s.status = 'pending_payment' and s.created_at < now() - interval '30 minutes')
    and s.starts_at < to_ts
    and s.ends_at > from_ts;
$$;
