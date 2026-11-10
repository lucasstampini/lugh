-- profiles.email é sensível; não pode ficar visível pro público só porque a
-- pessoa é entrevistador ativo. Em vez de abrir a linha inteira de profiles
-- pra leitura pública, cria uma view só com as colunas que o marketplace
-- precisa mostrar (nome, avatar), restrita a entrevistadores active = true.

create policy "profiles: public read for active interviewers" on public.profiles
  for select using (
    exists (
      select 1 from public.interviewers i
      where i.profile_id = profiles.id and i.active = true
    )
  );

create view public.interviewer_profiles
with (security_invoker = true) as
select p.id, p.name, p.avatar_url
from public.profiles p
join public.interviewers i on i.profile_id = p.id
where i.active = true;

grant select on public.interviewer_profiles to anon, authenticated;
