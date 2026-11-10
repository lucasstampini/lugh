create table public.interviewers (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  headline text not null,
  company text not null,
  seniority text not null check (seniority in ('junior', 'mid', 'senior', 'staff')),
  areas text[] not null check (
    array_length(areas, 1) >= 1
    and areas <@ array['backend', 'frontend', 'mobile', 'data', 'system_design', 'behavioral']
  ),
  price_cents integer not null check (price_cents between 3000 and 50000),
  bio text,
  linkedin_url text not null,
  abacate_subaccount_id text,
  active boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.interviewers enable row level security;

create policy "interviewers: public read when active" on public.interviewers
  for select using (active = true);

create policy "interviewers: owner read own" on public.interviewers
  for select using (auth.uid() = profile_id);

-- O "with check" trava active/abacate_subaccount_id no insert, não só a linha:
-- sem isso, dava pra inserir já como active=true direto pelo client.
create policy "interviewers: owner insert" on public.interviewers
  for insert
  with check (
    auth.uid() = profile_id
    and active = false
    and abacate_subaccount_id is null
  );

create policy "interviewers: owner update" on public.interviewers
  for update using (auth.uid() = profile_id);

-- "active" e "abacate_subaccount_id" ficam de fora de propósito: aprovação de
-- perfil e vínculo de pagamento só por quem tem a service role, nunca pelo
-- próprio entrevistador se auto-aprovando.
revoke update on public.interviewers from authenticated;
grant update (
  headline, company, seniority, areas, price_cents, bio, linkedin_url
) on public.interviewers to authenticated;
