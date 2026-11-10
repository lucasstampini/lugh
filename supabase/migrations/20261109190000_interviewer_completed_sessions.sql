-- Contagem pública de sessões concluídas por entrevistador, pro perfil
-- público mostrar um número real sem expor quem foram os candidatos (a
-- tabela sessions tem RLS que só deixa os dois participantes lerem a linha).
create function public.interviewer_completed_sessions(interviewer uuid)
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::integer
  from public.sessions
  where interviewer_id = interviewer and status = 'completed';
$$;

grant execute on function public.interviewer_completed_sessions(uuid)
  to anon, authenticated;
