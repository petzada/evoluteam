-- FT-7 — Recrutamento: RLS policies
-- Spec: docs/dev/13-ft-7-fundacao.md §5.2
--
-- Nota: o banco tem role ∈ ('admin_rh','director','user'). O conceito
-- de "gestor" do spec vira "is hiring_manager da vaga específica",
-- verificado via public.my_employee_id() contra job_openings.

ALTER TABLE recruitment_stages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_openings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates              ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_stage_history ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- recruitment_stages
-- SELECT: qualquer membro da company (inclui user/colaborador —
--   nomes de etapa aparecem em múltiplas UIs)
-- INSERT/UPDATE/DELETE: admin_rh apenas
-- ============================================================

CREATE POLICY recruitment_stages_select ON recruitment_stages
FOR SELECT USING (company_id = public.my_company_id());

CREATE POLICY recruitment_stages_insert ON recruitment_stages
FOR INSERT WITH CHECK (
  company_id = public.my_company_id()
  AND public.my_role() = 'admin_rh'
);

CREATE POLICY recruitment_stages_update ON recruitment_stages
FOR UPDATE USING (
  company_id = public.my_company_id()
  AND public.my_role() = 'admin_rh'
);

CREATE POLICY recruitment_stages_delete ON recruitment_stages
FOR DELETE USING (
  company_id = public.my_company_id()
  AND public.my_role() = 'admin_rh'
);

-- ============================================================
-- job_openings
-- SELECT: admin_rh e director veem todas da company; qualquer employee
--   vê vagas onde é hiring_manager; colaborador sem vaga não vê.
-- INSERT/UPDATE/DELETE: admin_rh apenas
-- ============================================================

CREATE POLICY job_openings_select ON job_openings
FOR SELECT USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() IN ('admin_rh', 'director')
    OR hiring_manager_id = public.my_employee_id()
  )
);

CREATE POLICY job_openings_insert ON job_openings
FOR INSERT WITH CHECK (
  company_id = public.my_company_id()
  AND public.my_role() = 'admin_rh'
);

CREATE POLICY job_openings_update ON job_openings
FOR UPDATE USING (
  company_id = public.my_company_id()
  AND public.my_role() = 'admin_rh'
);

CREATE POLICY job_openings_delete ON job_openings
FOR DELETE USING (
  company_id = public.my_company_id()
  AND public.my_role() = 'admin_rh'
);

-- ============================================================
-- candidates
-- SELECT: admin/director veem todos; hiring_manager de alguma vaga
--   vê candidatos que têm aplicação na vaga dele.
-- INSERT/UPDATE/DELETE: admin_rh apenas
-- ============================================================

CREATE POLICY candidates_select ON candidates
FOR SELECT USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() IN ('admin_rh', 'director')
    OR EXISTS (
      SELECT 1 FROM job_applications ja
      JOIN job_openings jo ON ja.job_opening_id = jo.id
      WHERE ja.candidate_id = candidates.id
        AND jo.hiring_manager_id = public.my_employee_id()
    )
  )
);

CREATE POLICY candidates_insert ON candidates
FOR INSERT WITH CHECK (
  company_id = public.my_company_id()
  AND public.my_role() = 'admin_rh'
);

CREATE POLICY candidates_update ON candidates
FOR UPDATE USING (
  company_id = public.my_company_id()
  AND public.my_role() = 'admin_rh'
);

CREATE POLICY candidates_delete ON candidates
FOR DELETE USING (
  company_id = public.my_company_id()
  AND public.my_role() = 'admin_rh'
);

-- ============================================================
-- job_applications
-- SELECT: admin/director todos; hiring_manager nas suas vagas.
-- INSERT: admin_rh
-- UPDATE: admin_rh total; hiring_manager na sua vaga (virar 'hired'
--   é bloqueado pela server action, não pela policy)
-- DELETE: ninguém (arquivamento é mudança de status)
-- ============================================================

CREATE POLICY job_applications_select ON job_applications
FOR SELECT USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() IN ('admin_rh', 'director')
    OR public.is_gestor_of_opening(public.my_employee_id(), job_opening_id)
  )
);

CREATE POLICY job_applications_insert ON job_applications
FOR INSERT WITH CHECK (
  company_id = public.my_company_id()
  AND public.my_role() = 'admin_rh'
);

CREATE POLICY job_applications_update ON job_applications
FOR UPDATE USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.is_gestor_of_opening(public.my_employee_id(), job_opening_id)
  )
);

-- ============================================================
-- candidate_stage_history
-- SELECT: herda da job_applications (quem vê a aplicação vê o histórico)
-- INSERT: quem pode atualizar a aplicação pode inserir
-- UPDATE/DELETE: ninguém (append-only)
-- ============================================================

CREATE POLICY candidate_stage_history_select ON candidate_stage_history
FOR SELECT USING (
  application_id IN (
    SELECT id FROM job_applications
    WHERE company_id = public.my_company_id()
      AND (
        public.my_role() IN ('admin_rh', 'director')
        OR public.is_gestor_of_opening(public.my_employee_id(), job_opening_id)
      )
  )
);

CREATE POLICY candidate_stage_history_insert ON candidate_stage_history
FOR INSERT WITH CHECK (
  application_id IN (
    SELECT id FROM job_applications
    WHERE company_id = public.my_company_id()
      AND (
        public.my_role() = 'admin_rh'
        OR public.is_gestor_of_opening(public.my_employee_id(), job_opening_id)
      )
  )
);

-- Sem policies de UPDATE/DELETE → append-only
