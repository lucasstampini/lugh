-- "active" (só service role liga/desliga, ex: moderação) e "paused"
-- (pausar/retomar, o próprio entrevistador) são conceitos diferentes de
-- propósito: quem foi desativado pela moderação não consegue se reativar
-- pelo interruptor de pausa.
alter table public.interviewers
  add column paused boolean not null default false;

grant update (paused) on public.interviewers to authenticated;

-- "pausado some do marketplace" (TAREFAS-MOACIR 3.4): a view pública e a
-- policy de disponibilidade também precisam esconder quem está pausado.
drop view public.interviewer_profiles;

create view public.interviewer_profiles as
select p.id, p.name, p.avatar_url
from public.profiles p
join public.interviewers i on i.profile_id = p.id
where i.active = true and i.paused = false;

grant select on public.interviewer_profiles to anon, authenticated;

drop policy "availability: public read when interviewer active" on public.availability;

create policy "availability: public read when interviewer active" on public.availability
  for select using (
    exists (
      select 1 from public.interviewers i
      where i.profile_id = availability.interviewer_id and i.active = true and i.paused = false
    )
  );
