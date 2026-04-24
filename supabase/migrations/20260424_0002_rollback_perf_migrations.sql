-- Rollback das otimizações de performance revertidas em 2026-04-24.
-- Dropa RPCs e índices criados em migrations que saíram junto com o reset
-- do branch para o último commit de feature (1bdcd3d):
--   20260422_0002_get_actor_context_rpc.sql
--   20260422_0003_dashboard_options_rpc.sql
--   20260424_0001_perf_hot_path_indexes.sql
--
-- Essas migrations foram aplicadas em produção antes do reset. Após o reset,
-- o código não referencia mais os RPCs nem precisa dos índices; esta migration
-- limpa o banco para ficar coerente com o código.
--
-- Observação: `drop index concurrently` não roda em transação. Se o Supabase
-- CLI reclamar, aplicar manualmente via SQL Editor (cada DROP em comando
-- separado).

-- RPCs
drop function if exists public.get_actor_context();
drop function if exists public.dashboard_options(uuid);

-- Índices (todos criados com CONCURRENTLY)
drop index concurrently if exists public.notifications_user_unread_idx;
drop index concurrently if exists public.notifications_user_recent_idx;
drop index concurrently if exists public.review_assignments_cycle_reviewee_idx;
drop index concurrently if exists public.review_assignments_cycle_status_idx;
drop index concurrently if exists public.development_plans_company_status_idx;
drop index concurrently if exists public.development_plans_employee_status_idx;
drop index concurrently if exists public.feedbacks_recipient_recent_idx;
drop index concurrently if exists public.feedbacks_company_recipient_created_idx;
drop index concurrently if exists public.employees_company_status_idx;
drop index concurrently if exists public.employees_company_department_idx;
drop index concurrently if exists public.development_plan_actions_plan_idx;
