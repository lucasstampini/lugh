-- GitHub opcional pra candidato e entrevistador, junto do LinkedIn.
alter table public.profiles add column github_url text;
grant update (github_url) on public.profiles to authenticated;

alter table public.interviewers add column github_url text;
grant update (github_url) on public.interviewers to authenticated;
