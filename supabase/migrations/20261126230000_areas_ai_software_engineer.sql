-- Áreas: 'backend' vira 'software_engineer' e 'frontend' vira 'ai_engineer', em
-- interviewers.areas e em profiles.areas (a lista é a mesma nas duas tabelas).
-- As constraints antigas saem primeiro, senão o update dos dados seria recusado.

alter table public.interviewers drop constraint interviewers_areas_check;
alter table public.profiles drop constraint profiles_areas_check;

update public.interviewers
set areas = array_replace(array_replace(areas, 'backend', 'software_engineer'), 'frontend', 'ai_engineer')
where areas && array['backend', 'frontend'];

update public.profiles
set areas = array_replace(array_replace(areas, 'backend', 'software_engineer'), 'frontend', 'ai_engineer')
where areas && array['backend', 'frontend'];

alter table public.interviewers
  add constraint interviewers_areas_check check (
    array_length(areas, 1) >= 1
    and areas <@ array['software_engineer', 'ai_engineer', 'mobile', 'data', 'system_design', 'behavioral']
  );

alter table public.profiles
  add constraint profiles_areas_check check (
    areas is null
    or areas <@ array['software_engineer', 'ai_engineer', 'mobile', 'data', 'system_design', 'behavioral']
  );
