-- Aceite dos Termos de Uso e da Política de Privacidade. Nulo = ainda não aceitou.
alter table public.profiles add column terms_accepted_at timestamptz;

-- A coluna fica fora do grant de update por coluna de profiles: quem grava é só a
-- função abaixo, com o horário do servidor. Assim o registro do aceite não pode ser
-- apagado nem ter a data trocada pelo client. Chamar de novo não muda a data original.
create function public.accept_terms()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.profiles
  set terms_accepted_at = now()
  where id = (select auth.uid())
    and terms_accepted_at is null;
$$;

revoke execute on function public.accept_terms() from public, anon;
grant execute on function public.accept_terms() to authenticated;
