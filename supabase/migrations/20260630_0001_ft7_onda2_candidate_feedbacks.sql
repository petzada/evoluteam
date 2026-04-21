-- FT-7 Onda 2 — candidate_feedbacks
-- Spec: docs/dev/15-ft-7-onda2-feedback-contratacao.md §4

CREATE TABLE candidate_feedbacks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  application_id  uuid NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  stage_id        uuid NOT NULL REFERENCES recruitment_stages(id),
  author_id       uuid NOT NULL REFERENCES employees(id),
  content         text NOT NULL,
  recommendation  text CHECK (recommendation IN ('advance','doubt','reject')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,

  CONSTRAINT candidate_feedbacks_content_length
    CHECK (char_length(content) BETWEEN 10 AND 3000)
);

CREATE INDEX candidate_feedbacks_application_time
  ON candidate_feedbacks (application_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX candidate_feedbacks_author
  ON candidate_feedbacks (author_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX candidate_feedbacks_company
  ON candidate_feedbacks (company_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE candidate_feedbacks ENABLE ROW LEVEL SECURITY;

-- SELECT: admin_rh/director; gestor da vaga; próprio autor
CREATE POLICY candidate_feedbacks_select ON candidate_feedbacks
FOR SELECT USING (
  company_id = public.my_company_id()
  AND deleted_at IS NULL
  AND (
    public.my_role() IN ('admin_rh', 'director')
    OR author_id = public.my_employee_id()
    OR EXISTS (
      SELECT 1 FROM job_applications ja
      JOIN job_openings jo ON ja.job_opening_id = jo.id
      WHERE ja.id = candidate_feedbacks.application_id
        AND jo.hiring_manager_id = public.my_employee_id()
    )
  )
);

-- INSERT: admin_rh OR hiring_manager da vaga; author_id deve ser o próprio
CREATE POLICY candidate_feedbacks_insert ON candidate_feedbacks
FOR INSERT WITH CHECK (
  company_id = public.my_company_id()
  AND author_id = public.my_employee_id()
  AND (
    public.my_role() = 'admin_rh'
    OR EXISTS (
      SELECT 1 FROM job_applications ja
      JOIN job_openings jo ON ja.job_opening_id = jo.id
      WHERE ja.id = candidate_feedbacks.application_id
        AND jo.hiring_manager_id = public.my_employee_id()
    )
  )
);

-- UPDATE: só o autor, dentro da janela de 2h, não deletado
CREATE POLICY candidate_feedbacks_update_author ON candidate_feedbacks
FOR UPDATE USING (
  company_id = public.my_company_id()
  AND author_id = public.my_employee_id()
  AND created_at > (now() - interval '2 hours')
  AND deleted_at IS NULL
);

-- UPDATE pra admin poder soft-delete de qualquer feedback
-- (controle fino de qual coluna atualiza fica na server action)
CREATE POLICY candidate_feedbacks_soft_delete_admin ON candidate_feedbacks
FOR UPDATE USING (
  company_id = public.my_company_id()
  AND public.my_role() = 'admin_rh'
  AND deleted_at IS NULL
) WITH CHECK (
  company_id = public.my_company_id()
);

-- DELETE bloqueado; soft delete via UPDATE.
