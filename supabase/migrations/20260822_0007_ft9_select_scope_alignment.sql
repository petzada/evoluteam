-- FT-9 fase 7 - alinhar SELECT RLS com toggles *.view e baseline hierarquico.
-- Usa helper calls em subselect para evitar reavaliacao por linha onde aplicavel.

-- =============================================================
-- employees: baseline proprio + arvore descendente; toggle view = empresa inteira.
-- =============================================================

CREATE OR REPLACE FUNCTION public.can_read_employee(p_employee_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH RECURSIVE descendants AS (
    SELECT e.id
    FROM public.employees e
    WHERE e.manager_id = (select public.my_employee_id())
      AND e.company_id = (select public.my_company_id())
    UNION ALL
    SELECT e.id
    FROM public.employees e
    JOIN descendants d ON e.manager_id = d.id
    WHERE e.company_id = (select public.my_company_id())
  )
  SELECT EXISTS (
    SELECT 1
    FROM public.employees target
    WHERE target.id = p_employee_id
      AND target.company_id = (select public.my_company_id())
      AND (
        (select public.my_role()) IN ('admin_rh', 'director')
        OR (select public.has_screen_permission('colaboradores', 'view'))
        OR target.id = (select public.my_employee_id())
        OR target.id IN (SELECT id FROM descendants)
      )
  )
$$;

DROP POLICY IF EXISTS employees_select ON public.employees;
CREATE POLICY employees_select ON public.employees FOR SELECT
USING ((select public.can_read_employee(id)));

-- =============================================================
-- PDI: pdi.view concede leitura global dos planos, acoes e comentarios.
-- =============================================================

DROP POLICY IF EXISTS pdi_select ON public.development_plans;
CREATE POLICY pdi_select ON public.development_plans FOR SELECT USING (
  company_id = (select public.my_company_id())
  AND deleted_at IS NULL
  AND (
    employee_id = (select public.my_employee_id())
    OR (select public.my_employee_id()) IN (SELECT id FROM public.get_employee_ancestors(employee_id))
    OR (select public.my_role()) IN ('admin_rh', 'director')
    OR (select public.has_screen_permission('pdi', 'view'))
  )
);

DROP POLICY IF EXISTS pdi_actions_select ON public.development_plan_actions;
CREATE POLICY pdi_actions_select ON public.development_plan_actions FOR SELECT USING (
  plan_id IN (
    SELECT id FROM public.development_plans
    WHERE company_id = (select public.my_company_id())
      AND deleted_at IS NULL
      AND (
        employee_id = (select public.my_employee_id())
        OR (select public.my_employee_id()) IN (SELECT id FROM public.get_employee_ancestors(employee_id))
        OR (select public.my_role()) IN ('admin_rh', 'director')
        OR (select public.has_screen_permission('pdi', 'view'))
      )
  )
);

DROP POLICY IF EXISTS pdi_comments_select ON public.development_plan_comments;
CREATE POLICY pdi_comments_select ON public.development_plan_comments FOR SELECT USING (
  deleted_at IS NULL
  AND plan_id IN (
    SELECT id FROM public.development_plans
    WHERE company_id = (select public.my_company_id())
      AND deleted_at IS NULL
      AND (
        employee_id = (select public.my_employee_id())
        OR (select public.my_employee_id()) IN (SELECT id FROM public.get_employee_ancestors(employee_id))
        OR (select public.my_role()) IN ('admin_rh', 'director')
        OR (select public.has_screen_permission('pdi', 'view'))
      )
  )
);

-- =============================================================
-- Avaliacoes: avaliacoes.view concede leitura global de assignments/answers.
-- =============================================================

DROP POLICY IF EXISTS assignments_select ON public.review_assignments;
CREATE POLICY assignments_select ON public.review_assignments FOR SELECT USING (
  company_id = (select public.my_company_id())
  AND (
    (select public.my_role()) IN ('admin_rh', 'director')
    OR (select public.has_screen_permission('avaliacoes', 'view'))
    OR reviewer_id = (select public.my_employee_id())
    OR reviewee_id = (select public.my_employee_id())
    OR reviewee_id IN (
      SELECT id FROM public.get_employee_descendants((select public.my_employee_id()))
    )
  )
);

DROP POLICY IF EXISTS answers_select ON public.review_answers;
CREATE POLICY answers_select ON public.review_answers FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.review_assignments a
    WHERE a.id = review_answers.assignment_id
      AND a.company_id = (select public.my_company_id())
      AND (
        (select public.my_role()) IN ('admin_rh', 'director')
        OR (select public.has_screen_permission('avaliacoes', 'view'))
        OR a.reviewer_id = (select public.my_employee_id())
        OR (
          a.reviewee_id = (select public.my_employee_id())
          AND EXISTS (
            SELECT 1 FROM public.review_cycle_participants p
            WHERE p.cycle_id = a.cycle_id
              AND p.employee_id = a.reviewee_id
              AND p.result_released_at IS NOT NULL
          )
        )
        OR a.reviewee_id IN (
          SELECT id FROM public.get_employee_descendants((select public.my_employee_id()))
        )
      )
  )
);

-- =============================================================
-- Recrutamento: reescreve SELECT base com subselects e inclui Onda 3.
-- =============================================================

DROP POLICY IF EXISTS job_openings_select ON public.job_openings;
CREATE POLICY job_openings_select ON public.job_openings FOR SELECT USING (
  company_id = (select public.my_company_id())
  AND (
    (select public.my_role()) IN ('admin_rh', 'director')
    OR hiring_manager_id = (select public.my_employee_id())
    OR (select public.has_screen_permission('recrutamento_vagas', 'view'))
  )
);

DROP POLICY IF EXISTS candidates_select ON public.candidates;
CREATE POLICY candidates_select ON public.candidates FOR SELECT USING (
  company_id = (select public.my_company_id())
  AND (
    (select public.my_role()) IN ('admin_rh', 'director')
    OR (select public.has_screen_permission('recrutamento_candidatos', 'view'))
    OR EXISTS (
      SELECT 1 FROM public.job_applications ja
      JOIN public.job_openings jo ON ja.job_opening_id = jo.id
      WHERE ja.candidate_id = candidates.id
        AND jo.hiring_manager_id = (select public.my_employee_id())
    )
  )
);

DROP POLICY IF EXISTS job_applications_select ON public.job_applications;
CREATE POLICY job_applications_select ON public.job_applications FOR SELECT USING (
  company_id = (select public.my_company_id())
  AND (
    (select public.my_role()) IN ('admin_rh', 'director')
    OR (select public.has_screen_permission('recrutamento_candidatos', 'view'))
    OR public.is_gestor_of_opening((select public.my_employee_id()), job_opening_id)
  )
);

DROP POLICY IF EXISTS candidate_stage_history_select ON public.candidate_stage_history;
CREATE POLICY candidate_stage_history_select ON public.candidate_stage_history FOR SELECT USING (
  application_id IN (
    SELECT id FROM public.job_applications
    WHERE company_id = (select public.my_company_id())
      AND (
        (select public.my_role()) IN ('admin_rh', 'director')
        OR (select public.has_screen_permission('recrutamento_candidatos', 'view'))
        OR public.is_gestor_of_opening((select public.my_employee_id()), job_opening_id)
      )
  )
);

DROP POLICY IF EXISTS candidate_scorecards_select ON public.candidate_scorecards;
CREATE POLICY candidate_scorecards_select ON public.candidate_scorecards
FOR SELECT USING (
  company_id = (select public.my_company_id())
  AND deleted_at IS NULL
  AND (
    (select public.my_role()) IN ('admin_rh', 'director')
    OR (select public.has_screen_permission('recrutamento_candidatos', 'view'))
    OR author_id = (select public.my_employee_id())
    OR EXISTS (
      SELECT 1 FROM public.job_applications ja
      JOIN public.job_openings jo ON ja.job_opening_id = jo.id
      WHERE ja.id = candidate_scorecards.application_id
        AND jo.hiring_manager_id = (select public.my_employee_id())
    )
  )
);

DROP POLICY IF EXISTS candidate_tasks_select ON public.candidate_tasks;
CREATE POLICY candidate_tasks_select ON public.candidate_tasks
FOR SELECT USING (
  company_id = (select public.my_company_id())
  AND deleted_at IS NULL
  AND (
    (select public.my_role()) IN ('admin_rh', 'director')
    OR (select public.has_screen_permission('recrutamento_candidatos', 'view'))
    OR created_by = (select public.my_employee_id())
    OR responsible_id = (select public.my_employee_id())
    OR EXISTS (
      SELECT 1 FROM public.job_applications ja
      JOIN public.job_openings jo ON ja.job_opening_id = jo.id
      WHERE ja.id = candidate_tasks.application_id
        AND jo.hiring_manager_id = (select public.my_employee_id())
    )
  )
);
