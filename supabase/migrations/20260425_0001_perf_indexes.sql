-- Recria os indices de performance que tinham sido dropados em 20260424_0002
-- Mantemos apenas os que NAO duplicam algum indice ja existente nas migrations
-- de feature (init_fase_0, ft3_feedbacks, ft4_development_plans, etc).
--
-- Sem CONCURRENTLY: migrations rodam em transacao no Supabase. Lock e curto
-- enquanto a base for pequena (FT-1..FT-9 ainda em consolidacao).

-- notifications: lookup ordenado por mais recente. O init ja tem
-- (user_id) WHERE read_at IS NULL para o badge de nao lidas.
CREATE INDEX IF NOT EXISTS notifications_user_recent_idx
  ON public.notifications(user_id, created_at DESC);

-- review_assignments: caminho critico de avaliacoes. Init tem
-- (reviewer_id, status) e (cycle_id) puro; faltam estes compostos.
CREATE INDEX IF NOT EXISTS review_assignments_cycle_reviewee_idx
  ON public.review_assignments(cycle_id, reviewee_id);
CREATE INDEX IF NOT EXISTS review_assignments_cycle_status_idx
  ON public.review_assignments(cycle_id, status);

-- development_plans: ja existe (company_id, status) na migration FT-4.
-- Falta (employee_id, status) — listagens "minhas" filtradas por status.
CREATE INDEX IF NOT EXISTS development_plans_employee_status_idx
  ON public.development_plans(employee_id, status);

-- feedbacks: FT-3 tem (recipient_id, created_at DESC). Falta o composto
-- com company_id usado pelo dashboard "sem feedback recente".
CREATE INDEX IF NOT EXISTS feedbacks_company_recipient_created_idx
  ON public.feedbacks(company_id, recipient_id, created_at DESC);

-- employees: init tem apenas (company_id) e (manager_id). Filtros por
-- status e department_id em listagens disparam seq scan sem estes.
CREATE INDEX IF NOT EXISTS employees_company_status_idx
  ON public.employees(company_id, status);
CREATE INDEX IF NOT EXISTS employees_company_department_idx
  ON public.employees(company_id, department_id);
