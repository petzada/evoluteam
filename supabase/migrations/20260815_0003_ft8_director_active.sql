-- FT-8 — Director ganha acao ativa na empresa toda (P3 A + P4 B).
-- Spec: docs/dev/19-ft-8-granularidade-rh.md §6.3.
-- Fatia 3 de 5.
-- Destrava as 2 RLS que hoje bloqueiam/limitam director em comentarios
-- de PDI e feedback de candidato. Nao mexe em scorecard nem tasks
-- (P4 B limitou director a feedback nesses contextos).

-- =============================================================
-- pdi_comments_insert: remove bloqueio explicito de director e
-- permite director comentar em qualquer PDI da empresa. Tambem
-- inclui rh com can_pdi_feedback.
-- =============================================================

DROP POLICY IF EXISTS pdi_comments_insert ON public.development_plan_comments;

CREATE POLICY pdi_comments_insert ON public.development_plan_comments
FOR INSERT WITH CHECK (
  company_id = public.my_company_id()
  AND author_id = public.my_employee_id()
  AND plan_id IN (
    SELECT id FROM public.development_plans
    WHERE company_id = public.my_company_id()
      AND deleted_at IS NULL
      AND (
        employee_id = public.my_employee_id()
        OR public.my_employee_id() IN (SELECT id FROM public.get_employee_ancestors(employee_id))
        OR public.my_role() IN ('admin_rh', 'director')
        OR (public.my_role() = 'rh' AND public.has_rh_permission('can_pdi_feedback'))
      )
  )
);

-- =============================================================
-- candidate_feedbacks_insert: permite director + rh-can_recruitment
-- alem de admin_rh e hiring_manager da vaga.
-- =============================================================

DROP POLICY IF EXISTS candidate_feedbacks_insert ON public.candidate_feedbacks;

CREATE POLICY candidate_feedbacks_insert ON public.candidate_feedbacks
FOR INSERT WITH CHECK (
  company_id = public.my_company_id()
  AND author_id = public.my_employee_id()
  AND (
    public.my_role() IN ('admin_rh', 'director')
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_recruitment'))
    OR EXISTS (
      SELECT 1 FROM public.job_applications ja
      JOIN public.job_openings jo ON ja.job_opening_id = jo.id
      WHERE ja.id = candidate_feedbacks.application_id
        AND jo.hiring_manager_id = public.my_employee_id()
    )
  )
);

-- =============================================================
-- candidate_feedbacks_select ja permitia director. Estendemos para
-- rh com can_recruitment ver feedbacks de qualquer candidato.
-- =============================================================

DROP POLICY IF EXISTS candidate_feedbacks_select ON public.candidate_feedbacks;

CREATE POLICY candidate_feedbacks_select ON public.candidate_feedbacks
FOR SELECT USING (
  company_id = public.my_company_id()
  AND deleted_at IS NULL
  AND (
    public.my_role() IN ('admin_rh', 'director')
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_recruitment'))
    OR author_id = public.my_employee_id()
    OR EXISTS (
      SELECT 1 FROM public.job_applications ja
      JOIN public.job_openings jo ON ja.job_opening_id = jo.id
      WHERE ja.id = candidate_feedbacks.application_id
        AND jo.hiring_manager_id = public.my_employee_id()
    )
  )
);

-- Nota: scorecards e tasks nao recebem director aqui. P4 B limita
-- director a "feedback" no contexto de recrutamento (opina, nao decide).
-- Scorecard tem nota e peso de decisao; task tem compromisso operacional.
