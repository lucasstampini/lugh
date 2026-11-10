-- Campos extras do candidato (não existem no entrevistador): experiência em
-- anos e áreas de interesse, reaproveitando a mesma lista de valores de
-- interviewers.areas pra casar com o filtro do marketplace, mais apelido,
-- vaga alvo, bio e linkedin do próprio candidato.
alter table public.profiles
  add column experience_years smallint,
  add column areas text[],
  add column preferred_name text,
  add column target_role text,
  add column bio text,
  add column linkedin_url text;

alter table public.profiles
  add constraint profiles_experience_years_check check (
    experience_years is null or experience_years between 0 and 60
  );

alter table public.profiles
  add constraint profiles_areas_check check (
    areas is null
    or areas <@ array['backend', 'frontend', 'mobile', 'data', 'system_design', 'behavioral']
  );

grant update (
  experience_years, areas, preferred_name, target_role, bio, linkedin_url
) on public.profiles to authenticated;
