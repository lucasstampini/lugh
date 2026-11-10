create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role text check (role in ('candidate', 'interviewer')),
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: own read" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles: own update" on public.profiles
  for update using (auth.uid() = id);

-- A policy acima só restringe a linha, não a coluna. Sem isso, qualquer
-- usuário autenticado consegue reescrever o próprio email ou created_at
-- direto pelo client (bypassa as Server Actions, que só editam name/role).
revoke update on public.profiles from authenticated;
grant update (name, role, avatar_url) on public.profiles to authenticated;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
