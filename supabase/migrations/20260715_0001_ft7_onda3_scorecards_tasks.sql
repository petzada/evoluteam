-- FT-7 Onda 3 — candidate_scorecards + candidate_tasks
-- Spec: docs/dev/16-ft-7-onda3-metricas-scorecard-tarefas.md §4

-- ============================================================
-- candidate_scorecards
-- ============================================================

CREATE TABLE candidate_scorecards (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id             uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  application_id         uuid NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  stage_id               uuid NOT NULL REFERENCES recruitment_stages(id),
  author_id              uuid NOT NULL REFERENCES employees(id),

  rating_communication   smallint NOT NULL CHECK (rating_communication BETWEEN 1 AND 5),
  rating_experience      smallint NOT NULL CHECK (rating_experience BETWEEN 1 AND 5),
  rating_role_fit        smallint NOT NULL CHECK (rating_role_fit BETWEEN 1 AND 5),
  rating_culture_fit     smallint NOT NULL CHECK (rating_culture_fit BETWEEN 1 AND 5),
  salary_expectation     text CHECK (salary_expectation IN ('compatible', 'incompatible')),
  comment                text CHECK (comment IS NULL OR char_length(comment) <= 2000),
  recommendation         text NOT NULL CHECK (recommendation IN ('advance','doubt','reject')),

  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  deleted_at             timestamptz
);

CREATE UNIQUE INDEX candidate_scorecards_unique_per_author_stage
  ON candidate_scorecards (application_id, stage_id, author_id)
  WHERE deleted_at IS NULL;

CREATE INDEX candidate_scorecards_application_time
  ON candidate_scorecards (application_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX candidate_scorecards_stage_recommendation
  ON candidate_scorecards (stage_id, recommendation)
  WHERE deleted_at IS NULL;

CREATE INDEX candidate_scorecards_company_time
  ON candidate_scorecards (company_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- ============================================================
-- candidate_tasks
-- ============================================================

CREATE TABLE candidate_tasks (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  application_id    uuid NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,

  title             text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 140),
  due_date          date,
  responsible_id    uuid NOT NULL REFERENCES employees(id),
  created_by        uuid NOT NULL REFERENCES employees(id),
  completed_at      timestamptz,
  completed_by      uuid REFERENCES employees(id),

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz
);

CREATE INDEX candidate_tasks_application_pending
  ON candidate_tasks (application_id, due_date)
  WHERE deleted_at IS NULL AND completed_at IS NULL;

CREATE INDEX candidate_tasks_responsible_pending
  ON candidate_tasks (responsible_id, due_date)
  WHERE deleted_at IS NULL AND completed_at IS NULL;

CREATE INDEX candidate_tasks_company_time
  ON candidate_tasks (company_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX candidate_tasks_overdue
  ON candidate_tasks (company_id, due_date)
  WHERE deleted_at IS NULL AND completed_at IS NULL AND due_date IS NOT NULL;

-- ============================================================
-- RLS — scorecards
-- ============================================================

ALTER TABLE candidate_scorecards ENABLE ROW LEVEL SECURITY;

CREATE POLICY candidate_scorecards_select ON candidate_scorecards
FOR SELECT USING (
  company_id = public.my_company_id()
  AND deleted_at IS NULL
  AND (
    public.my_role() IN ('admin_rh', 'director')
    OR author_id = public.my_employee_id()
    OR EXISTS (
      SELECT 1 FROM job_applications ja
      JOIN job_openings jo ON ja.job_opening_id = jo.id
      WHERE ja.id = candidate_scorecards.application_id
        AND jo.hiring_manager_id = public.my_employee_id()
    )
  )
);

CREATE POLICY candidate_scorecards_insert ON candidate_scorecards
FOR INSERT WITH CHECK (
  company_id = public.my_company_id()
  AND author_id = public.my_employee_id()
  AND (
    public.my_role() = 'admin_rh'
    OR EXISTS (
      SELECT 1 FROM job_applications ja
      JOIN job_openings jo ON ja.job_opening_id = jo.id
      WHERE ja.id = candidate_scorecards.application_id
        AND jo.hiring_manager_id = public.my_employee_id()
    )
  )
);

CREATE POLICY candidate_scorecards_update_author ON candidate_scorecards
FOR UPDATE USING (
  company_id = public.my_company_id()
  AND author_id = public.my_employee_id()
  AND created_at > (now() - interval '2 hours')
  AND deleted_at IS NULL
);

CREATE POLICY candidate_scorecards_soft_delete_admin ON candidate_scorecards
FOR UPDATE USING (
  company_id = public.my_company_id()
  AND public.my_role() = 'admin_rh'
  AND deleted_at IS NULL
) WITH CHECK (
  company_id = public.my_company_id()
);

-- ============================================================
-- RLS — tasks
-- ============================================================

ALTER TABLE candidate_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY candidate_tasks_select ON candidate_tasks
FOR SELECT USING (
  company_id = public.my_company_id()
  AND deleted_at IS NULL
  AND (
    public.my_role() IN ('admin_rh', 'director')
    OR created_by = public.my_employee_id()
    OR responsible_id = public.my_employee_id()
    OR EXISTS (
      SELECT 1 FROM job_applications ja
      JOIN job_openings jo ON ja.job_opening_id = jo.id
      WHERE ja.id = candidate_tasks.application_id
        AND jo.hiring_manager_id = public.my_employee_id()
    )
  )
);

CREATE POLICY candidate_tasks_insert ON candidate_tasks
FOR INSERT WITH CHECK (
  company_id = public.my_company_id()
  AND created_by = public.my_employee_id()
  AND (
    public.my_role() = 'admin_rh'
    OR EXISTS (
      SELECT 1 FROM job_applications ja
      JOIN job_openings jo ON ja.job_opening_id = jo.id
      WHERE ja.id = candidate_tasks.application_id
        AND jo.hiring_manager_id = public.my_employee_id()
    )
  )
);

CREATE POLICY candidate_tasks_update ON candidate_tasks
FOR UPDATE USING (
  company_id = public.my_company_id()
  AND deleted_at IS NULL
  AND (
    public.my_role() = 'admin_rh'
    OR created_by = public.my_employee_id()
    OR responsible_id = public.my_employee_id()
    OR EXISTS (
      SELECT 1 FROM job_applications ja
      JOIN job_openings jo ON ja.job_opening_id = jo.id
      WHERE ja.id = candidate_tasks.application_id
        AND jo.hiring_manager_id = public.my_employee_id()
    )
  )
);
