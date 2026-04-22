-- FT-9 — Fase 6: expandir RLS SELECT de recrutamento para toggles view.
-- Contexto: a Fase 2 (20260822_0002) adicionou `has_screen_permission(...,'edit')`
-- aos INSERT/UPDATE/DELETE de job_openings/candidates/job_applications/etc.,
-- mas deixou os SELECT apenas com admin_rh/director/hiring_manager. User com
-- toggle `recrutamento_vagas.view` passava em `canDo` mas recebia 0 linhas do
-- Postgres — quebrava o caso "RH operacional" descrito em permissoes.md.
--
-- Esta migration adiciona o branch view-toggle nos SELECT de:
--   - job_openings          (recrutamento_vagas.view)
--   - candidates            (recrutamento_candidatos.view)
--   - job_applications      (recrutamento_candidatos.view)
--   - candidate_stage_history (recrutamento_candidatos.view)

DROP POLICY IF EXISTS job_openings_select ON public.job_openings;
CREATE POLICY job_openings_select ON public.job_openings FOR SELECT USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() IN ('admin_rh', 'director')
    OR hiring_manager_id = public.my_employee_id()
    OR public.has_screen_permission('recrutamento_vagas', 'view')
  )
);

DROP POLICY IF EXISTS candidates_select ON public.candidates;
CREATE POLICY candidates_select ON public.candidates FOR SELECT USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() IN ('admin_rh', 'director')
    OR EXISTS (
      SELECT 1 FROM public.job_applications ja
      JOIN public.job_openings jo ON ja.job_opening_id = jo.id
      WHERE ja.candidate_id = candidates.id
        AND jo.hiring_manager_id = public.my_employee_id()
    )
    OR public.has_screen_permission('recrutamento_candidatos', 'view')
  )
);

DROP POLICY IF EXISTS job_applications_select ON public.job_applications;
CREATE POLICY job_applications_select ON public.job_applications FOR SELECT USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() IN ('admin_rh', 'director')
    OR public.is_gestor_of_opening(public.my_employee_id(), job_opening_id)
    OR public.has_screen_permission('recrutamento_candidatos', 'view')
  )
);

DROP POLICY IF EXISTS candidate_stage_history_select ON public.candidate_stage_history;
CREATE POLICY candidate_stage_history_select ON public.candidate_stage_history FOR SELECT USING (
  application_id IN (
    SELECT id FROM public.job_applications
    WHERE company_id = public.my_company_id()
      AND (
        public.my_role() IN ('admin_rh', 'director')
        OR public.is_gestor_of_opening(public.my_employee_id(), job_opening_id)
        OR public.has_screen_permission('recrutamento_candidatos', 'view')
      )
  )
);
