-- Quem entrou na sala. A sessão só "aconteceu" quando os dois entraram: é o que libera
-- encerrar, enviar feedback e o repasse. Sessão que chega ao fim do horário sem os dois
-- vira no_show (PROJETO.md) e sai da lista de próximas. Só o backend grava (sessions não
-- aceita escrita do client).
alter table public.sessions
  add column candidate_joined_at timestamptz,
  add column interviewer_joined_at timestamptz;

-- Sessões que já passaram pela sala antes desta coluna existir: valem como realizadas.
update public.sessions
set candidate_joined_at = starts_at, interviewer_joined_at = starts_at
where status in ('in_progress', 'awaiting_feedback', 'completed');
