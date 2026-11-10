-- "active" (aprovação, só service role) e "paused" (pausar/retomar, o
-- próprio entrevistador) são conceitos diferentes de propósito: sem essa
-- separação, dar ao entrevistador o direito de ligar "active" de novo
-- reabriria a brecha de auto-aprovação já corrigida nesta tabela.
alter table public.interviewers
  add column paused boolean not null default false;

grant update (paused) on public.interviewers to authenticated;

-- "pausado some do marketplace" (TAREFAS-MOACIR 3.4): a view e a policy
-- pública que escondiam o e-mail também precisam esconder quem está pausado,
-- não só quem nunca foi aprovado.
drop policy "profiles: public read for active interviewers" on public.profiles;

create policy "profiles: public read for active interviewers" on public.profiles
  for select using (
    exists (
      select 1 from public.interviewers i
      where i.profile_id = profiles.id and i.active = true and i.paused = false
    )
  );

drop view public.interviewer_profiles;

create view public.interviewer_profiles
with (security_invoker = true) as
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
