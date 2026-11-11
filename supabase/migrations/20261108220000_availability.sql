-- Usados pela constraint que impede dois blocos sobrepostos no mesmo dia:
-- btree_gist dá igualdade em uuid/smallint dentro de um índice gist, e o
-- Postgres não tem tipo de intervalo pronto pra "time".
create extension if not exists btree_gist with schema extensions;

create type public.time_range as range (subtype = time);

create table public.availability (
  id uuid primary key default gen_random_uuid(),
  interviewer_id uuid not null references public.interviewers(profile_id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  check (end_time > start_time),
  check (end_time - start_time >= interval '1 hour'),
  -- Sempre em hora cheia (09:00, 10:00...). O fim pode ser 24:00.
  check (
    extract(minute from start_time) = 0 and extract(second from start_time) = 0
    and extract(minute from end_time) = 0 and extract(second from end_time) = 0
  ),
  -- A Server Action já valida sobreposição, mas a policy de insert deixa o
  -- dono gravar direto pelo client: a regra precisa valer no banco.
  constraint availability_no_overlap exclude using gist (
    interviewer_id with =,
    weekday with =,
    (public.time_range(start_time, end_time)) with &&
  )
);

alter table public.availability enable row level security;

create policy "availability: public read when interviewer active" on public.availability
  for select using (
    exists (
      select 1 from public.interviewers i
      where i.profile_id = availability.interviewer_id and i.active = true
    )
  );

create policy "availability: owner read own" on public.availability
  for select using (auth.uid() = interviewer_id);

create policy "availability: owner insert own" on public.availability
  for insert with check (auth.uid() = interviewer_id);

create policy "availability: owner delete own" on public.availability
  for delete using (auth.uid() = interviewer_id);
