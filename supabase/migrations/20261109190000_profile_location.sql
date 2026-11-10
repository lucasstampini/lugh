-- Cidade e estado do candidato, pra etapa "Dados pessoais" do perfil.
alter table public.profiles
  add column city text,
  add column state text;

grant update (city, state) on public.profiles to authenticated;
