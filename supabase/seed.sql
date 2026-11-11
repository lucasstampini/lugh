-- Dados de demonstração: entrevistadores fictícios, empresas genéricas, sem
-- avatar (cai no fallback de iniciais). Nunca fotos ou nomes de empresas
-- reais. Rodado por "supabase db reset", direto como superuser (não passa
-- pelas policies de RLS pensadas pro client, por isso insere active = true
-- direto).

insert into auth.users (id, email, raw_user_meta_data) values
  ('d0000000-0000-4000-8000-000000000001', 'mariana.demo@lugh.app', '{"full_name": "Mariana Albuquerque"}'::jsonb),
  ('d0000000-0000-4000-8000-000000000002', 'rafael.demo@lugh.app', '{"full_name": "Rafael Nogueira"}'::jsonb),
  ('d0000000-0000-4000-8000-000000000003', 'juliana.demo@lugh.app', '{"full_name": "Juliana Okada"}'::jsonb),
  ('d0000000-0000-4000-8000-000000000004', 'thiago.demo@lugh.app', '{"full_name": "Thiago Barbosa"}'::jsonb),
  ('d0000000-0000-4000-8000-000000000005', 'camila.demo@lugh.app', '{"full_name": "Camila Ferreira"}'::jsonb),
  ('d0000000-0000-4000-8000-000000000006', 'beatriz.demo@lugh.app', '{"full_name": "Beatriz Lima"}'::jsonb),
  ('d0000000-0000-4000-8000-000000000007', 'pedro.demo@lugh.app', '{"full_name": "Pedro Martins"}'::jsonb);

-- O trigger "on_auth_user_created" já criou a linha em profiles (sem role,
-- sem avatar) quando os auth.users acima foram inseridos. Completa aqui.
insert into public.profiles (id, name, email, role) values
  ('d0000000-0000-4000-8000-000000000001', 'Mariana Albuquerque', 'mariana.demo@lugh.app', 'interviewer'),
  ('d0000000-0000-4000-8000-000000000002', 'Rafael Nogueira', 'rafael.demo@lugh.app', 'interviewer'),
  ('d0000000-0000-4000-8000-000000000003', 'Juliana Okada', 'juliana.demo@lugh.app', 'interviewer'),
  ('d0000000-0000-4000-8000-000000000004', 'Thiago Barbosa', 'thiago.demo@lugh.app', 'interviewer'),
  ('d0000000-0000-4000-8000-000000000005', 'Camila Ferreira', 'camila.demo@lugh.app', 'interviewer'),
  ('d0000000-0000-4000-8000-000000000006', 'Beatriz Lima', 'beatriz.demo@lugh.app', 'interviewer'),
  ('d0000000-0000-4000-8000-000000000007', 'Pedro Martins', 'pedro.demo@lugh.app', 'candidate')
on conflict (id) do update set
  role = excluded.role,
  avatar_url = null;

insert into public.interviewers (
  profile_id, headline, company, seniority, areas, price_cents, bio, linkedin_url, active
) values
  ('d0000000-0000-4000-8000-000000000001', 'Engenheira de Software Sênior', 'Fintech de grande porte', 'senior', array['backend', 'system_design'], 15000, 'Gosto de ajudar quem tá começando a entender como pensar em escala.', 'https://linkedin.com/in/mariana-demo', true),
  ('d0000000-0000-4000-8000-000000000002', 'Tech Lead Frontend', 'Big tech', 'senior', array['frontend'], 18000, 'Já revisei centenas de code reviews, trago isso pra prática.', 'https://linkedin.com/in/rafael-demo', true),
  ('d0000000-0000-4000-8000-000000000003', 'Staff Engineer', 'E-commerce de grande porte', 'staff', array['system_design', 'backend'], 22000, 'Foco em system design pra quem quer a vaga de sênior.', 'https://linkedin.com/in/juliana-demo', true),
  ('d0000000-0000-4000-8000-000000000004', 'Engenheiro de Dados Pleno', 'Healthtech em crescimento', 'mid', array['data'], 9000, 'Entrevista tranquila, direto ao ponto, com feedback honesto.', 'https://linkedin.com/in/thiago-demo', true),
  ('d0000000-0000-4000-8000-000000000005', 'Engineering Manager', 'Banco digital', 'senior', array['behavioral'], 20000, 'Já contratei dezenas de pessoas, sei o que o processo cobra.', 'https://linkedin.com/in/camila-demo', true),
  ('d0000000-0000-4000-8000-000000000006', 'Desenvolvedora Mobile Sênior', 'Startup de logística', 'senior', array['mobile'], 12000, 'iOS e Android, do zero ao avançado.', 'https://linkedin.com/in/beatriz-demo', true);

-- 2 ou 3 blocos de disponibilidade por entrevistador, em horário de Brasília.
insert into public.availability (interviewer_id, weekday, start_time, end_time) values
  ('d0000000-0000-4000-8000-000000000001', 1, '09:00', '12:00'),
  ('d0000000-0000-4000-8000-000000000001', 3, '14:00', '17:00'),
  ('d0000000-0000-4000-8000-000000000002', 2, '18:00', '20:00'),
  ('d0000000-0000-4000-8000-000000000002', 4, '18:00', '21:00'),
  ('d0000000-0000-4000-8000-000000000003', 1, '19:00', '21:00'),
  ('d0000000-0000-4000-8000-000000000003', 5, '09:00', '11:00'),
  ('d0000000-0000-4000-8000-000000000003', 6, '10:00', '13:00'),
  ('d0000000-0000-4000-8000-000000000004', 2, '08:00', '10:00'),
  ('d0000000-0000-4000-8000-000000000004', 3, '08:00', '10:00'),
  ('d0000000-0000-4000-8000-000000000005', 4, '13:00', '16:00'),
  ('d0000000-0000-4000-8000-000000000005', 0, '10:00', '12:00'),
  ('d0000000-0000-4000-8000-000000000006', 1, '20:00', '22:00'),
  ('d0000000-0000-4000-8000-000000000006', 5, '19:00', '21:00');

-- 1 sessão já concluída com feedback, pra /sessoes/[id]/resultado ter dado
-- real (fases 4, 5 e 7 ainda não escrevem isso de verdade pelo client).
insert into public.sessions (
  id, candidate_id, interviewer_id, starts_at, ends_at, type, status,
  candidate_notes, livekit_room, collab_doc_name
) values (
  'e0000000-0000-4000-8000-000000000001',
  'd0000000-0000-4000-8000-000000000007',
  'd0000000-0000-4000-8000-000000000001',
  '2026-11-04 19:00:00-03',
  '2026-11-04 20:00:00-03',
  'system_design',
  'completed',
  'Quero treinar pra uma vaga de backend sênior, foco em escalar um sistema do zero.',
  'session-e0000000-0000-4000-8000-000000000001',
  'session-e0000000-0000-4000-8000-000000000001'
);

insert into public.feedbacks (session_id, scores, strengths, improvements, would_hire) values (
  'e0000000-0000-4000-8000-000000000001',
  '{"comunicacao": 4, "tecnica": 3, "resolucao": 4}'::jsonb,
  'Explicou bem o raciocínio antes de desenhar, considerou trade-offs de consistência x disponibilidade e ouviu as dicas sem travar.',
  'Pode chegar no número de réplicas e no particionamento mais rápido, sem precisar de tanto empurrão.',
  true
);

-- 1 sessão futura já agendada, pra "/sessoes" ter "Próximas" e "Passadas".
insert into public.sessions (
  id, candidate_id, interviewer_id, starts_at, ends_at, type, status,
  candidate_notes
) values (
  'e0000000-0000-4000-8000-000000000002',
  'd0000000-0000-4000-8000-000000000007',
  'd0000000-0000-4000-8000-000000000002',
  '2026-11-18 18:00:00-03',
  '2026-11-18 19:00:00-03',
  'coding',
  'scheduled',
  'Quero revisar code review e boas práticas de frontend.'
);
