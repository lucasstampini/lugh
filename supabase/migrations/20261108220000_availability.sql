create table public.availability (
  id uuid primary key default gen_random_uuid(),
  interviewer_id uuid not null references public.interviewers(profile_id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  check (end_time > start_time),
  check (end_time - start_time >= interval '1 hour')
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
