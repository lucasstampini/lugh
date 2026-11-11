-- Fase 4 do PROJETO.md: agendamento.

-- Trava de double booking. A Server Action já confere se o horário está
-- livre, mas dois pedidos ao mesmo tempo passam os dois nessa checagem: só o
-- banco garante que um horário não é vendido duas vezes. Vale para os status
-- que ainda ocupam o horário; sessão expirada, cancelada ou concluída libera.
alter table public.sessions
  add constraint sessions_no_overlap_interviewer exclude using gist (
    interviewer_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status in ('pending_payment', 'scheduled', 'in_progress', 'awaiting_feedback'));

-- O mesmo candidato também não pode estar em duas sessões ao mesmo tempo.
alter table public.sessions
  add constraint sessions_no_overlap_candidate exclude using gist (
    candidate_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status in ('pending_payment', 'scheduled', 'in_progress', 'awaiting_feedback'));

-- Horários ocupados de um entrevistador num intervalo, pro calendário de
-- horários livres. A RLS de sessions só deixa os dois participantes lerem a
-- linha, então quem está agendando não enxerga as sessões dos outros: a
-- função devolve só início e fim, nunca quem agendou.
create function public.interviewer_booked_slots(
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
    and s.starts_at < to_ts
    and s.ends_at > from_ts;
$$;

grant execute on function public.interviewer_booked_slots(uuid, timestamptz, timestamptz)
  to anon, authenticated;
