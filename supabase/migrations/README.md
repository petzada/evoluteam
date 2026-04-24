# Migrations Supabase — Evoluteam

## Estado atual

Um único arquivo baseline (`20260425_0001_baseline.sql`) representa o schema
final consolidado. Ele substitui as 42 migrations que existiam antes do squash
(Fase 0 → FT-9 + indices de performance).

O squash foi feito em 2026-04-25 porque migrations iam se acumulando com
rollbacks parciais e refactors RLS sobrepostos, dificultando aplicar o schema
em ambientes novos.

## Como aplicar em um projeto Supabase novo

1. Crie o projeto vazio no Supabase.
2. Database → Extensions → habilite `pg_cron` (schema `extensions`). Sem ela
   o job diário de notificação de PDI é pulado com `RAISE NOTICE` (não quebra).
3. SQL Editor → cole `20260425_0001_baseline.sql` inteiro → Run.
4. Atualize as env vars do app:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

## O que o baseline cria

- **9 tabelas fundação**: companies, profiles, departments, positions,
  competencies, employees, invites, notifications, activity_logs
- **Avaliações (FT-2)**: review_cycles, review_cycle_participants,
  review_forms, review_questions, review_assignments, review_answers
- **Feedbacks (FT-3)**: feedbacks
- **PDI (FT-4)**: development_plans, development_plan_actions,
  development_plan_comments + pg_cron job diário
- **Recrutamento (FT-7)**: recruitment_stages, job_openings, candidates,
  job_applications, candidate_stage_history, candidate_feedbacks,
  candidate_scorecards, candidate_tasks + trigger que semeia as 7 etapas
  padrão em toda `companies` nova
- **Permissões por tela (FT-9)**: user_screen_permissions + helper
  `has_screen_permission(screen, action)` + validador de shape JSONB
- **Comentários da liderança (FT-8)**: review_result_comments
- **Funções helper RLS**: `my_company_id`, `my_role`, `my_employee_id`,
  `get_employee_descendants`, `get_employee_ancestors`,
  `is_gestor_of_opening`, `can_read_employee`
- **Índices de performance**: os 7 índices compostos da Fase 2

## O que NÃO entra (legado removido)

- Role `rh` e tabela `rh_permissions` (removidos em FT-9 fase 5)
- Webhook `pg_net` em `auth.users` (substituído por `/api/webhooks/auth-user-created` no app)
- RPCs `get_actor_context` e `dashboard_options` (tentativa de otimização revertida)

## Convenção daqui pra frente

- Próximas features criam novas migrations a partir deste baseline com
  timestamp `>20260425_0001`.
- Nunca editar o baseline nem migrations já aplicadas — gerar nova com
  timestamp posterior.
- Aplicar cada migration no SQL Editor do Supabase, na ordem numérica.
