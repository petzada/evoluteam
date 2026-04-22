-- FT-9 — Fase 2: RLS aditiva com has_screen_permission.
-- Spec: docs/dev/21-ft-9-redesign-acessos.md §3.
--
-- Estrategia: cada policy ganha branch OR public.has_screen_permission(...)
-- preservando os branches FT-8 (admin_rh + has_rh_permission). Isso permite:
--   - RH legado continua passando via rh_permissions (FT-8)
--   - user/rh com user_screen_permissions populado tambem passa (FT-9)
-- Fase 4 limpa os branches FT-8 quando role 'rh' for removido.
--
-- Mapeamento ScreenPermission -> policy:
--   colaboradores.edit   -> profiles_update_admin, employees_write_admin
--   cargos.edit          -> positions_write_admin
--   departamentos.edit   -> departments_write_admin
--   competencias.edit    -> competencies_write_admin
--   avaliacoes.edit      -> cycles_* / forms_* / questions_* / assignments_* / participants_*
--   recrutamento_etapas.edit         -> recruitment_stages_*
--   recrutamento_vagas.edit          -> job_openings_*
--   recrutamento_candidatos.edit     -> candidates_*, job_applications_insert
--   pdi.edit                         -> pdi_* e pdi_actions_* e pdi_comments_insert
--   feedbacks.edit                   -> feedbacks_select (deletados), feedbacks_update_delete_admin
--   recrutamento_candidatos.edit     -> candidate_feedbacks_insert
--   recrutamento_candidatos.view     -> candidate_feedbacks_select
--   auditoria.view                   -> logs_admin_select
--   colaboradores.edit               -> invites_user_colab_edit (NOVA: so concede role=user)

-- =============================================================
-- colaboradores (employees + profiles)
-- =============================================================

DROP POLICY IF EXISTS profiles_update_admin ON public.profiles;
CREATE POLICY profiles_update_admin ON public.profiles FOR UPDATE
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_employees'))
    OR public.has_screen_permission('colaboradores', 'edit')
  )
);

DROP POLICY IF EXISTS employees_write_admin ON public.employees;
CREATE POLICY employees_write_admin ON public.employees FOR ALL
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_employees'))
    OR public.has_screen_permission('colaboradores', 'edit')
  )
)
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_employees'))
    OR public.has_screen_permission('colaboradores', 'edit')
  )
);

-- =============================================================
-- estrutura organizacional (cargos / departamentos / competencias)
-- =============================================================

DROP POLICY IF EXISTS departments_write_admin ON public.departments;
CREATE POLICY departments_write_admin ON public.departments FOR ALL
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_employees'))
    OR public.has_screen_permission('departamentos', 'edit')
  )
)
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_employees'))
    OR public.has_screen_permission('departamentos', 'edit')
  )
);

DROP POLICY IF EXISTS positions_write_admin ON public.positions;
CREATE POLICY positions_write_admin ON public.positions FOR ALL
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_employees'))
    OR public.has_screen_permission('cargos', 'edit')
  )
)
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_employees'))
    OR public.has_screen_permission('cargos', 'edit')
  )
);

DROP POLICY IF EXISTS competencies_write_admin ON public.competencies;
CREATE POLICY competencies_write_admin ON public.competencies FOR ALL
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_employees'))
    OR public.has_screen_permission('competencias', 'edit')
  )
)
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_employees'))
    OR public.has_screen_permission('competencias', 'edit')
  )
);

-- =============================================================
-- avaliacoes
-- =============================================================

DROP POLICY IF EXISTS cycles_write_admin ON public.review_cycles;
CREATE POLICY cycles_write_admin ON public.review_cycles FOR ALL
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_reviews'))
    OR public.has_screen_permission('avaliacoes', 'edit')
  )
)
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_reviews'))
    OR public.has_screen_permission('avaliacoes', 'edit')
  )
);

DROP POLICY IF EXISTS participants_write_admin ON public.review_cycle_participants;
CREATE POLICY participants_write_admin ON public.review_cycle_participants FOR ALL
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_reviews'))
    OR public.has_screen_permission('avaliacoes', 'edit')
  )
)
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_reviews'))
    OR public.has_screen_permission('avaliacoes', 'edit')
  )
);

DROP POLICY IF EXISTS forms_write_admin ON public.review_forms;
CREATE POLICY forms_write_admin ON public.review_forms FOR ALL
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_reviews'))
    OR public.has_screen_permission('avaliacoes', 'edit')
  )
)
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_reviews'))
    OR public.has_screen_permission('avaliacoes', 'edit')
  )
);

DROP POLICY IF EXISTS questions_write_admin ON public.review_questions;
CREATE POLICY questions_write_admin ON public.review_questions FOR ALL
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_reviews'))
    OR public.has_screen_permission('avaliacoes', 'edit')
  )
)
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_reviews'))
    OR public.has_screen_permission('avaliacoes', 'edit')
  )
);

DROP POLICY IF EXISTS assignments_write_admin ON public.review_assignments;
CREATE POLICY assignments_write_admin ON public.review_assignments FOR ALL
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_reviews'))
    OR public.has_screen_permission('avaliacoes', 'edit')
  )
)
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_reviews'))
    OR public.has_screen_permission('avaliacoes', 'edit')
  )
);

-- =============================================================
-- recrutamento (etapas / vagas / candidatos / aplicacoes)
-- =============================================================

DROP POLICY IF EXISTS recruitment_stages_insert ON public.recruitment_stages;
CREATE POLICY recruitment_stages_insert ON public.recruitment_stages FOR INSERT
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_recruitment'))
    OR public.has_screen_permission('recrutamento_etapas', 'edit')
  )
);

DROP POLICY IF EXISTS recruitment_stages_update ON public.recruitment_stages;
CREATE POLICY recruitment_stages_update ON public.recruitment_stages FOR UPDATE
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_recruitment'))
    OR public.has_screen_permission('recrutamento_etapas', 'edit')
  )
);

DROP POLICY IF EXISTS recruitment_stages_delete ON public.recruitment_stages;
CREATE POLICY recruitment_stages_delete ON public.recruitment_stages FOR DELETE
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_recruitment'))
    OR public.has_screen_permission('recrutamento_etapas', 'edit')
  )
);

DROP POLICY IF EXISTS job_openings_insert ON public.job_openings;
CREATE POLICY job_openings_insert ON public.job_openings FOR INSERT
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_recruitment'))
    OR public.has_screen_permission('recrutamento_vagas', 'edit')
  )
);

DROP POLICY IF EXISTS job_openings_update ON public.job_openings;
CREATE POLICY job_openings_update ON public.job_openings FOR UPDATE
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_recruitment'))
    OR public.has_screen_permission('recrutamento_vagas', 'edit')
  )
);

DROP POLICY IF EXISTS job_openings_delete ON public.job_openings;
CREATE POLICY job_openings_delete ON public.job_openings FOR DELETE
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_recruitment'))
    OR public.has_screen_permission('recrutamento_vagas', 'edit')
  )
);

DROP POLICY IF EXISTS candidates_insert ON public.candidates;
CREATE POLICY candidates_insert ON public.candidates FOR INSERT
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_recruitment'))
    OR public.has_screen_permission('recrutamento_candidatos', 'edit')
  )
);

DROP POLICY IF EXISTS candidates_update ON public.candidates;
CREATE POLICY candidates_update ON public.candidates FOR UPDATE
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_recruitment'))
    OR public.has_screen_permission('recrutamento_candidatos', 'edit')
  )
);

DROP POLICY IF EXISTS candidates_delete ON public.candidates;
CREATE POLICY candidates_delete ON public.candidates FOR DELETE
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_recruitment'))
    OR public.has_screen_permission('recrutamento_candidatos', 'edit')
  )
);

DROP POLICY IF EXISTS job_applications_insert ON public.job_applications;
CREATE POLICY job_applications_insert ON public.job_applications FOR INSERT
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_recruitment'))
    OR public.has_screen_permission('recrutamento_candidatos', 'edit')
  )
);

-- =============================================================
-- feedbacks
-- =============================================================

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
            OR public.has_screen_permission('feedbacks', 'view')
          )
        )
      )
    )
    -- Caminho 2: deletado, so admin/moderador ve.
    OR (
      deleted_at IS NOT NULL
      AND (
        public.my_role() = 'admin_rh'
        OR (public.my_role() = 'rh' AND public.has_rh_permission('can_pdi_feedback'))
        OR public.has_screen_permission('feedbacks', 'edit')
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
    OR public.has_screen_permission('feedbacks', 'edit')
  )
);

-- =============================================================
-- pdi
-- =============================================================

DROP POLICY IF EXISTS pdi_insert ON public.development_plans;
CREATE POLICY pdi_insert ON public.development_plans FOR INSERT WITH CHECK (
  company_id = public.my_company_id()
  AND created_by = auth.uid()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_pdi_feedback'))
    OR public.has_screen_permission('pdi', 'edit')
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
    OR public.has_screen_permission('pdi', 'edit')
  )
);

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
        OR public.has_screen_permission('pdi', 'edit')
      )
  )
);

DROP POLICY IF EXISTS pdi_actions_update ON public.development_plan_actions;
CREATE POLICY pdi_actions_update ON public.development_plan_actions FOR UPDATE
USING (
  responsible_employee_id = public.my_employee_id()
  OR public.my_role() = 'admin_rh'
  OR (public.my_role() = 'rh' AND public.has_rh_permission('can_pdi_feedback'))
  OR public.has_screen_permission('pdi', 'edit')
);

-- pdi_comments_insert da FT-8 fatia 3: adiciona branch has_screen_permission.
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
        OR public.has_screen_permission('pdi', 'edit')
      )
  )
);

-- =============================================================
-- candidate_feedbacks (FT-8 fatia 3)
-- =============================================================

DROP POLICY IF EXISTS candidate_feedbacks_insert ON public.candidate_feedbacks;
CREATE POLICY candidate_feedbacks_insert ON public.candidate_feedbacks
FOR INSERT WITH CHECK (
  company_id = public.my_company_id()
  AND author_id = public.my_employee_id()
  AND (
    public.my_role() IN ('admin_rh', 'director')
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_recruitment'))
    OR public.has_screen_permission('recrutamento_candidatos', 'edit')
    OR EXISTS (
      SELECT 1 FROM public.job_applications ja
      JOIN public.job_openings jo ON ja.job_opening_id = jo.id
      WHERE ja.id = candidate_feedbacks.application_id
        AND jo.hiring_manager_id = public.my_employee_id()
    )
  )
);

DROP POLICY IF EXISTS candidate_feedbacks_select ON public.candidate_feedbacks;
CREATE POLICY candidate_feedbacks_select ON public.candidate_feedbacks
FOR SELECT USING (
  company_id = public.my_company_id()
  AND deleted_at IS NULL
  AND (
    public.my_role() IN ('admin_rh', 'director')
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_recruitment'))
    OR public.has_screen_permission('recrutamento_candidatos', 'view')
    OR author_id = public.my_employee_id()
    OR EXISTS (
      SELECT 1 FROM public.job_applications ja
      JOIN public.job_openings jo ON ja.job_opening_id = jo.id
      WHERE ja.id = candidate_feedbacks.application_id
        AND jo.hiring_manager_id = public.my_employee_id()
    )
  )
);

-- =============================================================
-- invites
-- =============================================================
-- admin_rh continua com tudo (policy inalterada). FT-9 adiciona nova
-- policy: user/rh com colaboradores.edit pode convidar mas apenas
-- como role='user' (nao escala), espelhando P8 C do FT-8.

CREATE POLICY invites_user_colab_edit ON public.invites FOR ALL
USING (
  company_id = public.my_company_id()
  AND public.has_screen_permission('colaboradores', 'edit')
  AND role = 'user'
)
WITH CHECK (
  company_id = public.my_company_id()
  AND public.has_screen_permission('colaboradores', 'edit')
  AND role = 'user'
);

-- =============================================================
-- auditoria (activity_logs) + empresa em leitura
-- =============================================================

DROP POLICY IF EXISTS logs_admin_select ON public.activity_logs;
CREATE POLICY logs_admin_select ON public.activity_logs FOR SELECT
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (public.my_role() = 'rh' AND public.has_rh_permission('can_audit'))
    OR public.has_screen_permission('auditoria', 'view')
  )
);

-- =============================================================
-- user_screen_permissions: read self para todos, write so admin.
-- Ja criado na migration 0001. Nenhuma mudanca aqui.
-- =============================================================
