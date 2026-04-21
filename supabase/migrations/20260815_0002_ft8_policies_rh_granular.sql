-- FT-8 — Expande policies RLS existentes para aceitar role='rh' + toggle.
-- Spec: docs/dev/19-ft-8-granularidade-rh.md §6.2.
-- Fatia 2 de 5. Nao toca em Director (fatia 3 cuida) nem cria features
-- novas (fatia 5). Apenas substitui `role = 'admin_rh'` por
-- `role = 'admin_rh' OR (role = 'rh' AND has_rh_permission('can_X'))`
-- onde aplicavel.

-- =============================================================
-- can_employees
-- =============================================================

DROP POLICY IF EXISTS profiles_update_admin ON public.profiles;
CREATE POLICY profiles_update_admin ON public.profiles FOR UPDATE
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_employees'))
  )
);

DROP POLICY IF EXISTS departments_write_admin ON public.departments;
CREATE POLICY departments_write_admin ON public.departments FOR ALL
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_employees'))
  )
)
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_employees'))
  )
);

DROP POLICY IF EXISTS positions_write_admin ON public.positions;
CREATE POLICY positions_write_admin ON public.positions FOR ALL
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_employees'))
  )
)
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_employees'))
  )
);

DROP POLICY IF EXISTS competencies_write_admin ON public.competencies;
CREATE POLICY competencies_write_admin ON public.competencies FOR ALL
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_employees'))
  )
)
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_employees'))
  )
);

DROP POLICY IF EXISTS employees_write_admin ON public.employees;
CREATE POLICY employees_write_admin ON public.employees FOR ALL
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_employees'))
  )
)
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_employees'))
  )
);

-- =============================================================
-- can_reviews
-- =============================================================

DROP POLICY IF EXISTS cycles_write_admin ON public.review_cycles;
CREATE POLICY cycles_write_admin ON public.review_cycles FOR ALL
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_reviews'))
  )
)
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_reviews'))
  )
);

DROP POLICY IF EXISTS participants_write_admin ON public.review_cycle_participants;
CREATE POLICY participants_write_admin ON public.review_cycle_participants FOR ALL
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_reviews'))
  )
)
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_reviews'))
  )
);

DROP POLICY IF EXISTS forms_write_admin ON public.review_forms;
CREATE POLICY forms_write_admin ON public.review_forms FOR ALL
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_reviews'))
  )
)
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_reviews'))
  )
);

DROP POLICY IF EXISTS questions_write_admin ON public.review_questions;
CREATE POLICY questions_write_admin ON public.review_questions FOR ALL
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_reviews'))
  )
)
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_reviews'))
  )
);

DROP POLICY IF EXISTS assignments_write_admin ON public.review_assignments;
CREATE POLICY assignments_write_admin ON public.review_assignments FOR ALL
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_reviews'))
  )
)
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_reviews'))
  )
);

-- =============================================================
-- can_recruitment
-- =============================================================

DROP POLICY IF EXISTS recruitment_stages_insert ON public.recruitment_stages;
CREATE POLICY recruitment_stages_insert ON public.recruitment_stages FOR INSERT
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_recruitment'))
  )
);

DROP POLICY IF EXISTS recruitment_stages_update ON public.recruitment_stages;
CREATE POLICY recruitment_stages_update ON public.recruitment_stages FOR UPDATE
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_recruitment'))
  )
);

DROP POLICY IF EXISTS recruitment_stages_delete ON public.recruitment_stages;
CREATE POLICY recruitment_stages_delete ON public.recruitment_stages FOR DELETE
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_recruitment'))
  )
);

DROP POLICY IF EXISTS job_openings_insert ON public.job_openings;
CREATE POLICY job_openings_insert ON public.job_openings FOR INSERT
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_recruitment'))
  )
);

DROP POLICY IF EXISTS job_openings_update ON public.job_openings;
CREATE POLICY job_openings_update ON public.job_openings FOR UPDATE
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_recruitment'))
  )
);

DROP POLICY IF EXISTS job_openings_delete ON public.job_openings;
CREATE POLICY job_openings_delete ON public.job_openings FOR DELETE
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_recruitment'))
  )
);

DROP POLICY IF EXISTS candidates_insert ON public.candidates;
CREATE POLICY candidates_insert ON public.candidates FOR INSERT
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_recruitment'))
  )
);

DROP POLICY IF EXISTS candidates_update ON public.candidates;
CREATE POLICY candidates_update ON public.candidates FOR UPDATE
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_recruitment'))
  )
);

DROP POLICY IF EXISTS candidates_delete ON public.candidates;
CREATE POLICY candidates_delete ON public.candidates FOR DELETE
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_recruitment'))
  )
);

DROP POLICY IF EXISTS job_applications_insert ON public.job_applications;
CREATE POLICY job_applications_insert ON public.job_applications FOR INSERT
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_recruitment'))
  )
);

-- =============================================================
-- can_pdi_feedback
-- =============================================================

-- feedbacks_select: admin_rh e rh-can_pdi passam a ver deletados.
-- Spec §6.2 — "ver visivel_para_rh + deletados".
DROP POLICY IF EXISTS feedbacks_select ON public.feedbacks;
CREATE POLICY feedbacks_select ON public.feedbacks FOR SELECT USING (
  company_id = public.my_company_id()
  AND (
    -- Caminho 1: feedback ativo, regra normal (baseline + canais).
    (
      deleted_at IS NULL
      AND (
        sender_id = public.my_employee_id()
        OR recipient_id = public.my_employee_id()
        OR (
          visibility IN ('visivel_para_gestor','visivel_para_rh')
          AND public.my_employee_id() IN (
            SELECT id FROM public.get_employee_ancestors(recipient_id)
          )
        )
        OR (
          visibility = 'visivel_para_rh'
          AND (
            public.my_role() = 'admin_rh'
            OR (public.my_role() = 'rh' AND public.has_rh_permission('can_pdi_feedback'))
          )
        )
      )
    )
    -- Caminho 2: deletado, so admin_rh + rh-can_pdi (moderacao).
    OR (
      deleted_at IS NOT NULL
      AND (
        public.my_role() = 'admin_rh'
        OR (public.my_role() = 'rh' AND public.has_rh_permission('can_pdi_feedback'))
      )
    )
  )
);

DROP POLICY IF EXISTS feedbacks_update_delete_admin ON public.feedbacks;
CREATE POLICY feedbacks_update_delete_admin ON public.feedbacks FOR UPDATE
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_pdi_feedback'))
  )
);

-- pdi_insert: adiciona rh-can_pdi alem de admin_rh e gestor direto.
DROP POLICY IF EXISTS pdi_insert ON public.development_plans;
CREATE POLICY pdi_insert ON public.development_plans FOR INSERT WITH CHECK (
  company_id = public.my_company_id()
  AND created_by = auth.uid()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_pdi_feedback'))
    OR employee_id IN (
      SELECT e.id FROM employees e
      JOIN employees mgr ON mgr.id = e.manager_id
      WHERE mgr.user_id = auth.uid()
        AND e.company_id = public.my_company_id()
    )
  )
);

DROP POLICY IF EXISTS pdi_update ON public.development_plans;
CREATE POLICY pdi_update ON public.development_plans FOR UPDATE USING (
  company_id = public.my_company_id()
  AND deleted_at IS NULL
  AND (
    created_by = auth.uid()
    OR public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_pdi_feedback'))
  )
);

-- pdi_actions_insert / pdi_actions_update seguem a mesma ideia.
DROP POLICY IF EXISTS pdi_actions_insert ON public.development_plan_actions;
CREATE POLICY pdi_actions_insert ON public.development_plan_actions FOR INSERT
WITH CHECK (
  plan_id IN (
    SELECT id FROM public.development_plans
    WHERE company_id = public.my_company_id()
      AND (
        created_by = auth.uid()
        OR public.my_role() = 'admin_rh'
        OR (public.my_role() = 'rh' AND public.has_rh_permission('can_pdi_feedback'))
      )
  )
);

DROP POLICY IF EXISTS pdi_actions_update ON public.development_plan_actions;
CREATE POLICY pdi_actions_update ON public.development_plan_actions FOR UPDATE
USING (
  responsible_employee_id = public.my_employee_id()
  OR public.my_role() = 'admin_rh'
  OR (public.my_role() = 'rh' AND public.has_rh_permission('can_pdi_feedback'))
);

-- =============================================================
-- can_invites
-- =============================================================

-- invites: admin_rh faz tudo; rh com can_invites tambem faz, mas
-- restrito a role = 'user' no WITH CHECK (P8 · C).
DROP POLICY IF EXISTS invites_admin ON public.invites;

CREATE POLICY invites_admin_all ON public.invites FOR ALL
USING (
  company_id = public.my_company_id()
  AND public.my_role() = 'admin_rh'
)
WITH CHECK (
  company_id = public.my_company_id()
  AND public.my_role() = 'admin_rh'
);

CREATE POLICY invites_rh_user_only ON public.invites FOR ALL
USING (
  company_id = public.my_company_id()
  AND public.my_role() = 'rh'
  AND public.has_rh_permission('can_invites')
  AND role = 'user'
)
WITH CHECK (
  company_id = public.my_company_id()
  AND public.my_role() = 'rh'
  AND public.has_rh_permission('can_invites')
  AND role = 'user'
);

-- =============================================================
-- can_audit
-- =============================================================

DROP POLICY IF EXISTS logs_admin_select ON public.activity_logs;
CREATE POLICY logs_admin_select ON public.activity_logs FOR SELECT
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_audit'))
  )
);
