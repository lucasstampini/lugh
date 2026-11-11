-- profiles.email é sensível; não pode ficar visível pro público só porque a
-- pessoa é entrevistador ativo. RLS filtra linha, não coluna: uma policy de
-- leitura pública em profiles exporia a linha inteira (email incluso) pra
-- qualquer um com a anon key. Por isso profiles continua "cada um lê só a
-- própria linha" e o marketplace lê esta view, que roda com o privilégio do
-- dono (sem security_invoker) e só devolve nome e avatar de entrevistador
-- com active = true.
create view public.interviewer_profiles as
select p.id, p.name, p.avatar_url
from public.profiles p
join public.interviewers i on i.profile_id = p.id
where i.active = true;

grant select on public.interviewer_profiles to anon, authenticated;
