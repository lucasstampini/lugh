-- Horários ocupados de vários entrevistadores de uma vez, pro marketplace
-- calcular o "próximo horário" de cada card sem disparar uma chamada por
-- entrevistador. Mesma ideia de interviewer_booked_slots: só início e fim,
-- nunca quem agendou.
create function public.interviewers_booked_slots(
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
    and s.starts_at < to_ts
    and s.ends_at > from_ts;
$$;

grant execute on function public.interviewers_booked_slots(uuid[], timestamptz, timestamptz)
  to anon, authenticated;
