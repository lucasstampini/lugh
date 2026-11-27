-- Respostas do questionário de onboarding do candidato, usadas para sugerir os
-- entrevistadores com melhor match. Todas opcionais: cada pergunta pode ser pulada.
-- A área de interesse continua em profiles.areas.
alter table public.profiles
  add column interview_types text[],
  add column training_urgency text,
  add column career_stage text;

-- Mesmos valores de sessions.type.
alter table public.profiles
  add constraint profiles_interview_types_check check (
    interview_types is null
    or interview_types <@ array['coding', 'system_design', 'behavioral']
  );

alter table public.profiles
  add constraint profiles_training_urgency_check check (
    training_urgency is null
    or training_urgency in ('this_week', 'this_month', 'no_rush')
  );

alter table public.profiles
  add constraint profiles_career_stage_check check (
    career_stage is null
    or career_stage in ('internship', 'first_job', 'working')
  );

grant update (
  interview_types, training_urgency, career_stage
) on public.profiles to authenticated;
