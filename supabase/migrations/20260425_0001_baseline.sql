-- =========================================================================
-- BASELINE CONSOLIDADO — schema final
-- =========================================================================
--
-- Este arquivo substitui as 42 migrations anteriores. Representa o estado
-- final do schema depois de todas as fases FT-0 .. FT-9 + indices de perf,
-- com o legado ja removido:
--   - SEM role 'rh' (removida em FT-9 fase 5)
--   - SEM tabela rh_permissions, has_rh_permission, triggers de sync
--   - SEM webhook pg_net em auth.users (removido em 20260422_0001 e depois
--     substituido pelo /api/webhooks/auth-user-created)
--   - COM user_screen_permissions + has_screen_permission (FT-9)
--   - COM indices de performance (Fase 2)
--   - COM seed automatico de 7 etapas de recrutamento via trigger em companies
--
-- Como usar em projeto Supabase NOVO:
--   1. Crie projeto vazio no Supabase.
--   2. SQL Editor -> cole este arquivo inteiro -> Run.
--   3. Habilite a extensao pg_cron em Database > Extensions (schema "extensions")
--      se quiser o job diario de notificacao de acoes do PDI. Ele e chamado
--      condicionalmente no final; sem pg_cron, o schedule e pulado sem erro.
--   4. Atualize .env.local com NEXT_PUBLIC_SUPABASE_URL e ANON_KEY do novo projeto.
--   5. Adicione SUPABASE_SERVICE_ROLE_KEY e SUPABASE_WEBHOOK_SECRET se aplicavel.
-- =========================================================================


-- =========================================================================
-- 1. TABELAS
-- =========================================================================

-- companies
CREATE TABLE companies (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  cnpj       text,
  segment    text NOT NULL,
  team_size  text NOT NULL,
  logo_url   text,
  status     text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- profiles (extensao 1:1 de auth.users)
CREATE TABLE profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  role       text NOT NULL DEFAULT 'user',
  full_name  text NOT NULL,
  phone      text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_role_check CHECK (role IN ('admin_rh','director','user'))
);
CREATE INDEX idx_profiles_company ON profiles(company_id);

-- departments
CREATE TABLE departments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        text NOT NULL,
  is_archived boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, name)
);
CREATE INDEX idx_departments_company ON departments(company_id);

-- positions
CREATE TABLE positions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        text NOT NULL,
  is_archived boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, name)
);
CREATE INDEX idx_positions_company ON positions(company_id);

-- competencies
CREATE TABLE competencies (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        text NOT NULL,
  description text,
  is_archived boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, name)
);
CREATE INDEX idx_competencies_company ON competencies(company_id);

-- employees
CREATE TABLE employees (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name       text NOT NULL,
  email           text NOT NULL,
  phone           text,
  position_id     uuid REFERENCES positions(id) ON DELETE SET NULL,
  department_id   uuid REFERENCES departments(id) ON DELETE SET NULL,
  manager_id      uuid REFERENCES employees(id) ON DELETE SET NULL,
  hire_date       date NOT NULL,
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','terminated')),
  internal_notes  text,
  terminated_at   timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, email)
);
CREATE INDEX idx_employees_company ON employees(company_id);
CREATE INDEX idx_employees_user    ON employees(user_id);
CREATE INDEX idx_employees_manager ON employees(manager_id);
-- Indices de perf (Fase 2)
CREATE INDEX employees_company_status_idx     ON employees(company_id, status);
CREATE INDEX employees_company_department_idx ON employees(company_id, department_id);

-- invites
CREATE TABLE invites (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id         uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id        uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  email              text NOT NULL,
  token              text NOT NULL UNIQUE,
  role               text NOT NULL,
  invited_by         uuid NOT NULL REFERENCES auth.users(id),
  expires_at         timestamptz NOT NULL,
  accepted_at        timestamptz,
  revoked_at         timestamptz,
  screen_permissions jsonb,
  created_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT invites_role_check CHECK (role IN ('admin_rh','director','user'))
);
COMMENT ON COLUMN invites.screen_permissions IS
  'Snapshot dos toggles por tela (screen.action: boolean) pre-configurados no convite. Aplicado em user_screen_permissions ao aceitar.';
CREATE INDEX idx_invites_company  ON invites(company_id);
CREATE INDEX idx_invites_employee ON invites(employee_id);
CREATE INDEX idx_invites_token    ON invites(token);

-- notifications
CREATE TABLE notifications (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        text NOT NULL,
  title       text NOT NULL,
  body        text,
  link_url    text,
  entity_type text,
  entity_id   uuid,
  read_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE read_at IS NULL;
-- Indice de perf (Fase 2)
CREATE INDEX notifications_user_recent_idx ON notifications(user_id, created_at DESC);

-- activity_logs
CREATE TABLE activity_logs (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  company_id     uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  actor_user_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action         text NOT NULL,
  entity_type    text,
  entity_id      uuid,
  metadata       jsonb NOT NULL DEFAULT '{}',
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_activity_logs_company_date ON activity_logs(company_id, created_at DESC);

-- review_cycles
CREATE TABLE review_cycles (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name             text NOT NULL,
  description      text,
  period_start     date NOT NULL,
  period_end       date NOT NULL,
  response_start   date NOT NULL,
  response_end     date NOT NULL,
  status           text NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft','published','closed','archived')),
  include_self     boolean NOT NULL DEFAULT true,
  include_manager  boolean NOT NULL DEFAULT true,
  created_by       uuid REFERENCES auth.users(id),
  published_at     timestamptz,
  closed_at        timestamptz,
  archived_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_cycles_company_status ON review_cycles(company_id, status);

-- review_cycle_participants
CREATE TABLE review_cycle_participants (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  cycle_id            uuid NOT NULL REFERENCES review_cycles(id) ON DELETE CASCADE,
  employee_id         uuid NOT NULL REFERENCES employees(id),
  added_at            timestamptz NOT NULL DEFAULT now(),
  added_by            uuid REFERENCES auth.users(id),
  removed_at          timestamptz,
  result_released_at  timestamptz,
  result_released_by  uuid REFERENCES auth.users(id),
  UNIQUE (cycle_id, employee_id)
);
CREATE INDEX idx_participants_cycle ON review_cycle_participants(cycle_id);

-- review_forms
CREATE TABLE review_forms (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  cycle_id    uuid NOT NULL UNIQUE REFERENCES review_cycles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- review_questions
CREATE TABLE review_questions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  form_id        uuid NOT NULL REFERENCES review_forms(id) ON DELETE CASCADE,
  competency_id  uuid REFERENCES competencies(id) ON DELETE SET NULL,
  question_order int NOT NULL,
  type           text NOT NULL CHECK (type IN ('scale','text')),
  question_text  text NOT NULL,
  is_required    boolean NOT NULL DEFAULT true,
  scale_min      int,
  scale_max      int
);
CREATE INDEX idx_questions_form_order ON review_questions(form_id, question_order);

-- review_assignments
CREATE TABLE review_assignments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  cycle_id         uuid NOT NULL REFERENCES review_cycles(id) ON DELETE CASCADE,
  form_id          uuid NOT NULL REFERENCES review_forms(id),
  reviewee_id      uuid NOT NULL REFERENCES employees(id),
  reviewer_id      uuid NOT NULL REFERENCES employees(id),
  type             text NOT NULL CHECK (type IN ('self','manager')),
  status           text NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','in_progress','submitted','cancelled')),
  submitted_at     timestamptz,
  cancelled_at     timestamptz,
  cancelled_reason text,
  UNIQUE (cycle_id, reviewee_id, reviewer_id, type)
);
CREATE INDEX idx_assignments_reviewer_status ON review_assignments(reviewer_id, status);
CREATE INDEX idx_assignments_cycle ON review_assignments(cycle_id);
-- Indices de perf (Fase 2)
CREATE INDEX review_assignments_cycle_reviewee_idx ON review_assignments(cycle_id, reviewee_id);
CREATE INDEX review_assignments_cycle_status_idx   ON review_assignments(cycle_id, status);

-- review_answers
CREATE TABLE review_answers (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  assignment_id  uuid NOT NULL REFERENCES review_assignments(id) ON DELETE CASCADE,
  question_id    uuid NOT NULL REFERENCES review_questions(id),
  scale_value    int,
  text_value     text,
  answered_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, question_id),
  CHECK (
    (scale_value IS NOT NULL AND text_value IS NULL)
    OR
    (scale_value IS NULL AND text_value IS NOT NULL)
    OR
    (scale_value IS NULL AND text_value IS NULL)
  )
);
CREATE INDEX idx_answers_assignment ON review_answers(assignment_id);

-- feedbacks
CREATE TABLE feedbacks (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  sender_id      uuid NOT NULL REFERENCES employees(id),
  recipient_id   uuid NOT NULL REFERENCES employees(id),
  type           text NOT NULL CHECK (type IN
                   ('elogio','reconhecimento','ponto_de_melhoria','orientacao','observacao_privada')),
  competency_id  uuid REFERENCES competencies(id) ON DELETE SET NULL,
  message        text NOT NULL CHECK (length(message) >= 20 AND length(message) <= 10000),
  visibility     text NOT NULL CHECK (visibility IN ('privado','visivel_para_gestor','visivel_para_rh')),
  read_at        timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  deleted_at     timestamptz,
  deleted_by     uuid REFERENCES auth.users(id),
  CHECK (sender_id != recipient_id),
  CHECK (type != 'observacao_privada' OR visibility = 'privado')
);
CREATE INDEX idx_feedbacks_recipient_created ON feedbacks(recipient_id, created_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_feedbacks_sender_created ON feedbacks(sender_id, created_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_feedbacks_competency ON feedbacks(competency_id)
  WHERE deleted_at IS NULL;
-- Indice de perf (Fase 2)
CREATE INDEX feedbacks_company_recipient_created_idx
  ON feedbacks(company_id, recipient_id, created_at DESC);

-- development_plans
CREATE TABLE development_plans (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id     uuid NOT NULL REFERENCES employees(id),
  cycle_id        uuid REFERENCES review_cycles(id) ON DELETE SET NULL,
  competency_id   uuid REFERENCES competencies(id) ON DELETE SET NULL,
  objective       text NOT NULL CHECK (length(objective) >= 10 AND length(objective) <= 500),
  due_date        date NOT NULL,
  status          text NOT NULL DEFAULT 'nao_iniciado'
                    CHECK (status IN ('nao_iniciado','em_andamento','concluido','cancelado')),
  created_by      uuid NOT NULL REFERENCES auth.users(id),
  concluded_at    timestamptz,
  cancelled_at    timestamptz,
  deleted_at      timestamptz,
  deleted_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_development_plans_employee ON development_plans(employee_id)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_development_plans_company_status ON development_plans(company_id, status)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_development_plans_cycle ON development_plans(cycle_id)
  WHERE cycle_id IS NOT NULL AND deleted_at IS NULL;
-- Indice de perf (Fase 2)
CREATE INDEX development_plans_employee_status_idx ON development_plans(employee_id, status);

-- development_plan_actions
CREATE TABLE development_plan_actions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id                 uuid NOT NULL REFERENCES development_plans(id) ON DELETE CASCADE,
  company_id              uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title                   text NOT NULL CHECK (length(title) >= 3 AND length(title) <= 200),
  due_date                date NOT NULL,
  status                  text NOT NULL DEFAULT 'pendente'
                            CHECK (status IN ('pendente','em_andamento','concluida','cancelada')),
  responsible_employee_id uuid NOT NULL REFERENCES employees(id),
  sort_order              integer NOT NULL DEFAULT 0,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_plan_actions_plan ON development_plan_actions(plan_id);
CREATE INDEX idx_plan_actions_responsible ON development_plan_actions(responsible_employee_id);

-- development_plan_comments
CREATE TABLE development_plan_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id     uuid NOT NULL REFERENCES development_plans(id) ON DELETE CASCADE,
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  author_id   uuid NOT NULL REFERENCES employees(id),
  body        text NOT NULL CHECK (length(body) >= 1 AND length(body) <= 2000),
  created_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz,
  deleted_by  uuid REFERENCES auth.users(id)
);
CREATE INDEX idx_plan_comments_plan ON development_plan_comments(plan_id, created_at ASC)
  WHERE deleted_at IS NULL;


-- =========================================================================
-- 2. RECRUTAMENTO (FT-7)
-- =========================================================================

CREATE TYPE recruitment_stage_kind AS ENUM ('entry', 'intermediate', 'hired_terminal');

CREATE TYPE job_opening_employment_type AS ENUM
  ('clt', 'pj', 'estagio', 'temporario', 'freelancer');

CREATE TYPE job_opening_workplace_type AS ENUM
  ('presencial', 'remoto', 'hibrido');

CREATE TYPE job_opening_status AS ENUM
  ('open', 'paused', 'closed', 'cancelled');

CREATE TYPE application_status AS ENUM
  ('in_progress', 'hired', 'rejected', 'withdrawn', 'frozen');

CREATE TYPE candidate_source AS ENUM
  ('indicacao', 'linkedin', 'site_empresa', 'whatsapp',
   'instagram', 'indeed', 'gupy', 'manual', 'outro');

CREATE TYPE rejection_reason AS ENUM
  ('perfil_tecnico_insuficiente', 'experiencia_incompativel',
   'pretensao_salarial_incompativel', 'fit_cultural_insuficiente',
   'nao_compareceu', 'comunicacao_insuficiente',
   'indisponibilidade_de_horario', 'outro');

CREATE TYPE withdrawal_reason AS ENUM
  ('nao_respondeu_contato', 'aceitou_outra_proposta',
   'salario_incompativel', 'beneficios_incompativeis',
   'modelo_trabalho_incompativel', 'localizacao_incompativel',
   'perdeu_interesse', 'processo_muito_longo', 'outro');

CREATE TABLE recruitment_stages (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id              uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name                    text NOT NULL,
  position                int  NOT NULL,
  kind                    recruitment_stage_kind NOT NULL DEFAULT 'intermediate',
  notifies_hiring_manager boolean NOT NULL DEFAULT false,
  archived_at             timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX recruitment_stages_company_entry_active
  ON recruitment_stages (company_id)
  WHERE kind = 'entry' AND archived_at IS NULL;
CREATE UNIQUE INDEX recruitment_stages_company_hired_active
  ON recruitment_stages (company_id)
  WHERE kind = 'hired_terminal' AND archived_at IS NULL;
CREATE INDEX recruitment_stages_company_position
  ON recruitment_stages (company_id, position);

CREATE TABLE job_openings (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id         uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title              text NOT NULL,
  description        text,
  department_id      uuid REFERENCES departments(id) ON DELETE SET NULL,
  position_id        uuid REFERENCES positions(id)   ON DELETE SET NULL,
  hiring_manager_id  uuid REFERENCES employees(id)   ON DELETE SET NULL,
  employment_type    job_opening_employment_type NOT NULL,
  workplace_type     job_opening_workplace_type  NOT NULL,
  location           text,
  open_positions     int NOT NULL DEFAULT 1 CHECK (open_positions > 0),
  status             job_opening_status NOT NULL DEFAULT 'open',
  pipeline_snapshot  jsonb NOT NULL DEFAULT '[]'::jsonb,
  closed_at          timestamptz,
  created_by         uuid REFERENCES auth.users(id),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX job_openings_company_status     ON job_openings (company_id, status);
CREATE INDEX job_openings_company_manager    ON job_openings (company_id, hiring_manager_id);
CREATE INDEX job_openings_company_department ON job_openings (company_id, department_id);
CREATE INDEX job_openings_pipeline_snapshot_gin
  ON job_openings USING GIN (pipeline_snapshot jsonb_path_ops);

CREATE TABLE candidates (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name                text NOT NULL,
  email               text NOT NULL,
  phone               text,
  linkedin_url        text,
  resume_url          text,
  source              candidate_source NOT NULL DEFAULT 'manual',
  source_other        text,
  notes               text,
  hired_employee_id   uuid REFERENCES employees(id) ON DELETE SET NULL,
  archived_at         timestamptz,
  created_by          uuid REFERENCES auth.users(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT candidates_email_unique_per_company UNIQUE (company_id, email),
  CONSTRAINT candidates_source_other_consistency
    CHECK ((source = 'outro' AND source_other IS NOT NULL)
        OR (source <> 'outro' AND source_other IS NULL))
);
CREATE INDEX candidates_company_archived ON candidates (company_id, archived_at);
CREATE INDEX candidates_hired_employee   ON candidates (hired_employee_id)
  WHERE hired_employee_id IS NOT NULL;

CREATE TABLE job_applications (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  job_opening_id      uuid NOT NULL REFERENCES job_openings(id) ON DELETE CASCADE,
  candidate_id        uuid NOT NULL REFERENCES candidates(id)   ON DELETE CASCADE,
  current_stage_id    uuid NOT NULL REFERENCES recruitment_stages(id),
  status              application_status NOT NULL DEFAULT 'in_progress',
  rejection_reason    rejection_reason,
  withdrawal_reason   withdrawal_reason,
  reason_other        text,
  frozen_reason_notes text,
  stage_entered_at    timestamptz NOT NULL DEFAULT now(),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT job_applications_unique_active UNIQUE (job_opening_id, candidate_id),
  CONSTRAINT job_applications_reason_status_consistency CHECK (
    (status = 'rejected'  AND rejection_reason  IS NOT NULL AND withdrawal_reason IS NULL) OR
    (status = 'withdrawn' AND withdrawal_reason IS NOT NULL AND rejection_reason  IS NULL) OR
    (status NOT IN ('rejected', 'withdrawn') AND rejection_reason IS NULL AND withdrawal_reason IS NULL)
  )
);
CREATE INDEX job_applications_job_status       ON job_applications (job_opening_id, status);
CREATE INDEX job_applications_candidate        ON job_applications (candidate_id);
CREATE INDEX job_applications_stage_status     ON job_applications (current_stage_id, status);
CREATE INDEX job_applications_stage_entered_at ON job_applications (stage_entered_at);

CREATE TABLE candidate_stage_history (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id   uuid NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  from_stage_id    uuid REFERENCES recruitment_stages(id),
  to_stage_id      uuid REFERENCES recruitment_stages(id),
  status_change    jsonb,
  reason_code      text,
  reason_notes     text,
  synthetic        boolean NOT NULL DEFAULT false,
  changed_at       timestamptz NOT NULL DEFAULT now(),
  changed_by       uuid REFERENCES auth.users(id)
);
COMMENT ON COLUMN candidate_stage_history.synthetic IS
  'true = entrada criada automaticamente para representar etapa pulada no funil. Excluida do timeline do candidato e do calculo de tempo mediano por etapa.';
CREATE INDEX candidate_stage_history_app_time
  ON candidate_stage_history (application_id, changed_at DESC);
CREATE INDEX candidate_stage_history_to_stage_time
  ON candidate_stage_history (to_stage_id, changed_at);
CREATE INDEX idx_stage_history_non_synthetic
  ON candidate_stage_history (application_id, changed_at DESC)
  WHERE synthetic = false;

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
  ON candidate_feedbacks (application_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX candidate_feedbacks_author
  ON candidate_feedbacks (author_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX candidate_feedbacks_company
  ON candidate_feedbacks (company_id, created_at DESC) WHERE deleted_at IS NULL;

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
  ON candidate_scorecards (application_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX candidate_scorecards_stage_recommendation
  ON candidate_scorecards (stage_id, recommendation) WHERE deleted_at IS NULL;
CREATE INDEX candidate_scorecards_company_time
  ON candidate_scorecards (company_id, created_at DESC) WHERE deleted_at IS NULL;

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
  ON candidate_tasks (company_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX candidate_tasks_overdue
  ON candidate_tasks (company_id, due_date)
  WHERE deleted_at IS NULL AND completed_at IS NULL AND due_date IS NOT NULL;


-- =========================================================================
-- 3. FT-9: user_screen_permissions + review_result_comments
-- =========================================================================

CREATE TABLE user_screen_permissions (
  profile_id    uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  company_id    uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  permissions   jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX usp_company_idx ON user_screen_permissions (company_id);

CREATE TABLE review_result_comments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  cycle_id              uuid NOT NULL REFERENCES review_cycles(id) ON DELETE CASCADE,
  reviewee_employee_id  uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  author_employee_id    uuid NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  content               text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 4000),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  deleted_at            timestamptz NULL,
  deleted_by            uuid NULL REFERENCES profiles(id)
);
CREATE INDEX rrc_cycle_reviewee_idx
  ON review_result_comments (cycle_id, reviewee_employee_id) WHERE deleted_at IS NULL;
CREATE INDEX rrc_author_idx
  ON review_result_comments (author_employee_id) WHERE deleted_at IS NULL;


-- =========================================================================
-- 4. FUNCOES HELPER (RLS + negocio)
-- =========================================================================

CREATE OR REPLACE FUNCTION public.my_company_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.my_role() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.my_employee_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id FROM employees
  WHERE user_id = auth.uid()
    AND company_id = public.my_company_id()
$$;

CREATE OR REPLACE FUNCTION public.get_employee_descendants(root_id uuid)
RETURNS TABLE (id uuid)
LANGUAGE sql STABLE AS $$
  WITH RECURSIVE descendants AS (
    SELECT e.id FROM employees e
      WHERE e.manager_id = root_id
        AND e.company_id = public.my_company_id()
    UNION ALL
    SELECT e.id
      FROM employees e
      INNER JOIN descendants d ON e.manager_id = d.id
      WHERE e.company_id = public.my_company_id()
  )
  SELECT id FROM descendants
$$;

CREATE OR REPLACE FUNCTION public.get_employee_ancestors(emp_id uuid)
RETURNS TABLE (id uuid)
LANGUAGE sql STABLE AS $$
  WITH RECURSIVE ancestors AS (
    SELECT e.manager_id AS id FROM employees e
      WHERE e.id = emp_id
        AND e.manager_id IS NOT NULL
        AND e.company_id = public.my_company_id()
    UNION ALL
    SELECT e.manager_id
      FROM employees e
      INNER JOIN ancestors a ON e.id = a.id
      WHERE e.manager_id IS NOT NULL
        AND e.company_id = public.my_company_id()
  )
  SELECT id FROM ancestors
$$;

CREATE OR REPLACE FUNCTION public.is_gestor_of_opening(
  p_employee_id uuid,
  p_opening_id  uuid
)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM job_openings jo
    WHERE jo.id = p_opening_id
      AND jo.hiring_manager_id = p_employee_id
  );
$$;

CREATE OR REPLACE FUNCTION public.validate_screen_permissions(p jsonb)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  valid_keys text[] := ARRAY[
    'dashboard.view',
    'colaboradores.view',          'colaboradores.edit',
    'avaliacoes.view',             'avaliacoes.edit',
    'feedbacks.view',              'feedbacks.edit',
    'pdi.view',                    'pdi.edit',
    'recrutamento_vagas.view',     'recrutamento_vagas.edit',
    'recrutamento_candidatos.view','recrutamento_candidatos.edit',
    'recrutamento_etapas.view',    'recrutamento_etapas.edit',
    'recrutamento_relatorios.view',
    'empresa.view',                'empresa.edit',
    'cargos.view',                 'cargos.edit',
    'departamentos.view',          'departamentos.edit',
    'competencias.view',           'competencias.edit',
    'auditoria.view'
  ];
  kv record;
BEGIN
  IF p IS NULL THEN RETURN false; END IF;
  IF jsonb_typeof(p) IS DISTINCT FROM 'object' THEN RETURN false; END IF;
  FOR kv IN SELECT key, value FROM jsonb_each(p) LOOP
    IF NOT (kv.key = ANY(valid_keys)) THEN RETURN false; END IF;
    IF jsonb_typeof(kv.value) IS DISTINCT FROM 'boolean' THEN RETURN false; END IF;
  END LOOP;
  RETURN true;
END $$;

ALTER TABLE user_screen_permissions
  ADD CONSTRAINT usp_permissions_shape
  CHECK (public.validate_screen_permissions(permissions));

CREATE OR REPLACE FUNCTION public.has_screen_permission(screen text, action text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT (usp.permissions -> (screen || '.' || action))::boolean
    FROM public.user_screen_permissions usp
    WHERE usp.profile_id = auth.uid()
  ), false)
$$;

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


-- =========================================================================
-- 5. TRIGGERS
-- =========================================================================

-- Seed das 7 etapas de recrutamento quando company e criada.
CREATE OR REPLACE FUNCTION public.seed_recruitment_stages()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO recruitment_stages (company_id, name, position, kind, notifies_hiring_manager) VALUES
    (NEW.id, 'Cadastrado',        1, 'entry',          false),
    (NEW.id, 'Triagem',            2, 'intermediate',   false),
    (NEW.id, 'Entrevista RH',      3, 'intermediate',   false),
    (NEW.id, 'Entrevista Gestor',  4, 'intermediate',   true),
    (NEW.id, 'Teste / Case',       5, 'intermediate',   false),
    (NEW.id, 'Proposta',           6, 'intermediate',   false),
    (NEW.id, 'Contratado',         7, 'hired_terminal', false);
  RETURN NEW;
END;
$$;

CREATE TRIGGER companies_seed_recruitment_stages
AFTER INSERT ON companies
FOR EACH ROW EXECUTE FUNCTION public.seed_recruitment_stages();

-- FT-9: garantir que user_screen_permissions so existe para role='user'.
CREATE OR REPLACE FUNCTION public.enforce_screen_permissions_role() RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  r text;
BEGIN
  SELECT role INTO r FROM public.profiles WHERE id = NEW.profile_id;
  IF r IS DISTINCT FROM 'user' THEN
    RAISE EXCEPTION 'user_screen_permissions so pode existir para role = ''user''; encontrado: %', r;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER usp_role_check
  BEFORE INSERT OR UPDATE ON public.user_screen_permissions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_screen_permissions_role();

-- FT-9: sincroniza user_screen_permissions quando profile.role muda.
CREATE OR REPLACE FUNCTION public.sync_screen_permissions_on_role_change() RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'user' AND OLD.role IS DISTINCT FROM 'user' THEN
    INSERT INTO public.user_screen_permissions (profile_id, company_id, permissions)
      VALUES (NEW.id, NEW.company_id, '{}'::jsonb)
      ON CONFLICT (profile_id) DO NOTHING;
  ELSIF NEW.role IS DISTINCT FROM 'user' AND OLD.role = 'user' THEN
    DELETE FROM public.user_screen_permissions WHERE profile_id = NEW.id;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER profiles_role_change_sync_screen_permissions
  AFTER UPDATE OF role ON public.profiles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION public.sync_screen_permissions_on_role_change();


-- =========================================================================
-- 6. pg_cron: notificacao diaria de acoes do PDI proximas do prazo
-- =========================================================================
-- Habilite a extensao em Database > Extensions > pg_cron (schema "extensions")
-- antes de rodar este baseline; senao o schedule e pulado silenciosamente.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.notify_pdi_action_due() RETURNS void
LANGUAGE sql AS $$
  INSERT INTO notifications (company_id, user_id, type, title, body, link_url, entity_type, entity_id, created_at)
  SELECT
    p.company_id,
    e.user_id,
    'pdi_action_due',
    'Acao do PDI proxima do prazo',
    'A acao "' || a.title || '" vence em 7 dias.',
    '/pdi/' || a.plan_id::text,
    'development_plan',
    a.plan_id,
    now()
  FROM development_plan_actions a
  JOIN development_plans p ON p.id = a.plan_id
  JOIN employees e ON e.id = a.responsible_employee_id
  WHERE a.due_date = CURRENT_DATE + 7
    AND a.status NOT IN ('concluida', 'cancelada')
    AND p.deleted_at IS NULL
    AND p.status NOT IN ('concluido', 'cancelado')
    AND e.user_id IS NOT NULL
    AND e.status != 'terminated'
    AND e.company_id = p.company_id;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'pdi-action-due-notifications') THEN
      PERFORM cron.unschedule('pdi-action-due-notifications');
    END IF;
    PERFORM cron.schedule(
      'pdi-action-due-notifications',
      '0 12 * * *',
      $cron$ SELECT public.notify_pdi_action_due(); $cron$
    );
  ELSE
    RAISE NOTICE 'pg_cron nao esta instalado; job pdi-action-due-notifications nao agendado. Habilite a extensao e reexecute esta migration.';
  END IF;
END $$;


-- =========================================================================
-- 7. RLS — ENABLE + POLICIES (versao final pos FT-9)
-- =========================================================================

ALTER TABLE profiles                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE competencies                ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications               ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_cycles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_cycle_participants   ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_forms                ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_questions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_assignments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_answers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE development_plans           ENABLE ROW LEVEL SECURITY;
ALTER TABLE development_plan_actions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE development_plan_comments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_stages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_openings                ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications            ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_stage_history     ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_feedbacks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_scorecards        ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_tasks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_screen_permissions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_result_comments      ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY profiles_select ON profiles FOR SELECT
USING ( id = auth.uid() OR (company_id = public.my_company_id() AND public.my_role() = 'admin_rh') );
CREATE POLICY profiles_update_self ON profiles FOR UPDATE
USING ( id = auth.uid() );
CREATE POLICY profiles_update_admin ON profiles FOR UPDATE
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('colaboradores', 'edit')
  )
);

-- companies
CREATE POLICY companies_select ON companies FOR SELECT
USING ( id = public.my_company_id() );
CREATE POLICY companies_update_admin ON companies FOR UPDATE
USING (
  id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('empresa', 'edit')
  )
)
WITH CHECK (
  id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('empresa', 'edit')
  )
);

-- departments
CREATE POLICY departments_select ON departments FOR SELECT
USING ( company_id = public.my_company_id() );
CREATE POLICY departments_write_admin ON departments FOR ALL
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('departamentos', 'edit')
  )
)
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('departamentos', 'edit')
  )
);

-- positions
CREATE POLICY positions_select ON positions FOR SELECT
USING ( company_id = public.my_company_id() );
CREATE POLICY positions_write_admin ON positions FOR ALL
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('cargos', 'edit')
  )
)
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('cargos', 'edit')
  )
);

-- competencies
CREATE POLICY competencies_select ON competencies FOR SELECT
USING ( company_id = public.my_company_id() );
CREATE POLICY competencies_write_admin ON competencies FOR ALL
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('competencias', 'edit')
  )
)
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('competencias', 'edit')
  )
);

-- employees
CREATE POLICY employees_select ON employees FOR SELECT
USING ((select public.can_read_employee(id)));
CREATE POLICY employees_write_admin ON employees FOR ALL
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('colaboradores', 'edit')
  )
)
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('colaboradores', 'edit')
  )
);

-- invites
CREATE POLICY invites_admin_all ON invites FOR ALL
USING ( company_id = public.my_company_id() AND public.my_role() = 'admin_rh' )
WITH CHECK ( company_id = public.my_company_id() AND public.my_role() = 'admin_rh' );
CREATE POLICY invites_user_colab_edit ON invites FOR ALL
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

-- notifications
CREATE POLICY notifications_own ON notifications FOR SELECT
USING ( user_id = auth.uid() );
CREATE POLICY notifications_update_own ON notifications FOR UPDATE
USING ( user_id = auth.uid() );

-- activity_logs
CREATE POLICY logs_admin_select ON activity_logs FOR SELECT
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('auditoria', 'view')
  )
);

-- review_cycles
CREATE POLICY cycles_select ON review_cycles FOR SELECT
USING ( company_id = public.my_company_id() );
CREATE POLICY cycles_write_admin ON review_cycles FOR ALL
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('avaliacoes', 'edit')
  )
)
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('avaliacoes', 'edit')
  )
);

-- review_cycle_participants
CREATE POLICY participants_select ON review_cycle_participants FOR SELECT
USING ( company_id = public.my_company_id() );
CREATE POLICY participants_write_admin ON review_cycle_participants FOR ALL
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('avaliacoes', 'edit')
  )
)
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('avaliacoes', 'edit')
  )
);

-- review_forms
CREATE POLICY forms_select ON review_forms FOR SELECT
USING ( company_id = public.my_company_id() );
CREATE POLICY forms_write_admin ON review_forms FOR ALL
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('avaliacoes', 'edit')
  )
)
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('avaliacoes', 'edit')
  )
);

-- review_questions
CREATE POLICY questions_select ON review_questions FOR SELECT
USING ( company_id = public.my_company_id() );
CREATE POLICY questions_write_admin ON review_questions FOR ALL
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('avaliacoes', 'edit')
  )
)
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('avaliacoes', 'edit')
  )
);

-- review_assignments
CREATE POLICY assignments_select ON review_assignments FOR SELECT USING (
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
CREATE POLICY assignments_write_admin ON review_assignments FOR ALL
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('avaliacoes', 'edit')
  )
)
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('avaliacoes', 'edit')
  )
);

-- review_answers
CREATE POLICY answers_select ON review_answers FOR SELECT USING (
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
CREATE POLICY answers_write_own ON review_answers FOR ALL USING (
  EXISTS (
    SELECT 1 FROM review_assignments a
    WHERE a.id = review_answers.assignment_id
      AND a.reviewer_id = public.my_employee_id()
      AND a.status IN ('pending','in_progress')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM review_assignments a
    WHERE a.id = review_answers.assignment_id
      AND a.reviewer_id = public.my_employee_id()
      AND a.status IN ('pending','in_progress')
  )
);

-- feedbacks
CREATE POLICY feedbacks_select ON feedbacks FOR SELECT USING (
  company_id = public.my_company_id()
  AND (
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
            OR public.has_screen_permission('feedbacks', 'view')
          )
        )
      )
    )
    OR (
      deleted_at IS NOT NULL
      AND (
        public.my_role() = 'admin_rh'
        OR public.has_screen_permission('feedbacks', 'edit')
      )
    )
  )
);
CREATE POLICY feedbacks_insert ON feedbacks FOR INSERT WITH CHECK (
  company_id = public.my_company_id()
  AND sender_id = public.my_employee_id()
  AND recipient_id IN (
    SELECT id FROM employees
    WHERE company_id = public.my_company_id()
      AND status IN ('active','inactive')
  )
);
CREATE POLICY feedbacks_update_mark_read ON feedbacks FOR UPDATE USING (
  recipient_id = public.my_employee_id()
);
CREATE POLICY feedbacks_update_delete_admin ON feedbacks FOR UPDATE USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('feedbacks', 'edit')
  )
);

-- development_plans
CREATE POLICY pdi_select ON development_plans FOR SELECT USING (
  company_id = (select public.my_company_id())
  AND deleted_at IS NULL
  AND (
    employee_id = (select public.my_employee_id())
    OR (select public.my_employee_id()) IN (SELECT id FROM public.get_employee_ancestors(employee_id))
    OR (select public.my_role()) IN ('admin_rh', 'director')
    OR (select public.has_screen_permission('pdi', 'view'))
  )
);
CREATE POLICY pdi_insert ON development_plans FOR INSERT WITH CHECK (
  company_id = public.my_company_id()
  AND created_by = auth.uid()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('pdi', 'edit')
    OR employee_id IN (
      SELECT e.id FROM employees e
      JOIN employees mgr ON mgr.id = e.manager_id
      WHERE mgr.user_id = auth.uid()
        AND e.company_id = public.my_company_id()
    )
  )
);
CREATE POLICY pdi_update ON development_plans FOR UPDATE USING (
  company_id = public.my_company_id()
  AND deleted_at IS NULL
  AND (
    created_by = auth.uid()
    OR public.my_role() = 'admin_rh'
    OR public.has_screen_permission('pdi', 'edit')
  )
);

-- development_plan_actions
CREATE POLICY pdi_actions_select ON development_plan_actions FOR SELECT USING (
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
CREATE POLICY pdi_actions_insert ON development_plan_actions FOR INSERT
WITH CHECK (
  plan_id IN (
    SELECT id FROM public.development_plans
    WHERE company_id = public.my_company_id()
      AND (
        created_by = auth.uid()
        OR public.my_role() = 'admin_rh'
        OR public.has_screen_permission('pdi', 'edit')
      )
  )
);
CREATE POLICY pdi_actions_update ON development_plan_actions FOR UPDATE USING (
  responsible_employee_id = public.my_employee_id()
  OR public.my_role() = 'admin_rh'
  OR public.has_screen_permission('pdi', 'edit')
);

-- development_plan_comments
CREATE POLICY pdi_comments_select ON development_plan_comments FOR SELECT USING (
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
CREATE POLICY pdi_comments_insert ON development_plan_comments FOR INSERT
WITH CHECK (
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
        OR public.has_screen_permission('pdi', 'edit')
      )
  )
);
CREATE POLICY pdi_comments_update ON development_plan_comments FOR UPDATE USING (
  company_id = public.my_company_id()
  AND (author_id = public.my_employee_id() OR public.my_role() = 'admin_rh')
);

-- recruitment_stages
CREATE POLICY recruitment_stages_select ON recruitment_stages FOR SELECT
USING (company_id = public.my_company_id());
CREATE POLICY recruitment_stages_insert ON recruitment_stages FOR INSERT
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('recrutamento_etapas', 'edit')
  )
);
CREATE POLICY recruitment_stages_update ON recruitment_stages FOR UPDATE
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('recrutamento_etapas', 'edit')
  )
);
CREATE POLICY recruitment_stages_delete ON recruitment_stages FOR DELETE
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('recrutamento_etapas', 'edit')
  )
);

-- job_openings
CREATE POLICY job_openings_select ON job_openings FOR SELECT USING (
  company_id = (select public.my_company_id())
  AND (
    (select public.my_role()) IN ('admin_rh', 'director')
    OR hiring_manager_id = (select public.my_employee_id())
    OR (select public.has_screen_permission('recrutamento_vagas', 'view'))
  )
);
CREATE POLICY job_openings_insert ON job_openings FOR INSERT
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('recrutamento_vagas', 'edit')
  )
);
CREATE POLICY job_openings_update ON job_openings FOR UPDATE USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('recrutamento_vagas', 'edit')
  )
);
CREATE POLICY job_openings_delete ON job_openings FOR DELETE USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('recrutamento_vagas', 'edit')
  )
);

-- candidates
CREATE POLICY candidates_select ON candidates FOR SELECT USING (
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
CREATE POLICY candidates_insert ON candidates FOR INSERT
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('recrutamento_candidatos', 'edit')
  )
);
CREATE POLICY candidates_update ON candidates FOR UPDATE USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('recrutamento_candidatos', 'edit')
  )
);
CREATE POLICY candidates_delete ON candidates FOR DELETE USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('recrutamento_candidatos', 'edit')
  )
);

-- job_applications
CREATE POLICY job_applications_select ON job_applications FOR SELECT USING (
  company_id = (select public.my_company_id())
  AND (
    (select public.my_role()) IN ('admin_rh', 'director')
    OR (select public.has_screen_permission('recrutamento_candidatos', 'view'))
    OR public.is_gestor_of_opening((select public.my_employee_id()), job_opening_id)
  )
);
CREATE POLICY job_applications_insert ON job_applications FOR INSERT
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('recrutamento_candidatos', 'edit')
  )
);
CREATE POLICY job_applications_update ON job_applications FOR UPDATE USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.is_gestor_of_opening(public.my_employee_id(), job_opening_id)
  )
);

-- candidate_stage_history
CREATE POLICY candidate_stage_history_select ON candidate_stage_history FOR SELECT USING (
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
CREATE POLICY candidate_stage_history_insert ON candidate_stage_history FOR INSERT
WITH CHECK (
  application_id IN (
    SELECT id FROM job_applications
    WHERE company_id = public.my_company_id()
      AND (
        public.my_role() = 'admin_rh'
        OR public.is_gestor_of_opening(public.my_employee_id(), job_opening_id)
      )
  )
);

-- candidate_feedbacks
CREATE POLICY candidate_feedbacks_select ON candidate_feedbacks FOR SELECT USING (
  company_id = public.my_company_id()
  AND deleted_at IS NULL
  AND (
    public.my_role() IN ('admin_rh', 'director')
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
CREATE POLICY candidate_feedbacks_insert ON candidate_feedbacks FOR INSERT
WITH CHECK (
  company_id = public.my_company_id()
  AND author_id = public.my_employee_id()
  AND (
    public.my_role() IN ('admin_rh', 'director')
    OR public.has_screen_permission('recrutamento_candidatos', 'edit')
    OR EXISTS (
      SELECT 1 FROM public.job_applications ja
      JOIN public.job_openings jo ON ja.job_opening_id = jo.id
      WHERE ja.id = candidate_feedbacks.application_id
        AND jo.hiring_manager_id = public.my_employee_id()
    )
  )
);
CREATE POLICY candidate_feedbacks_update_author ON candidate_feedbacks FOR UPDATE USING (
  company_id = public.my_company_id()
  AND author_id = public.my_employee_id()
  AND created_at > (now() - interval '2 hours')
  AND deleted_at IS NULL
);
CREATE POLICY candidate_feedbacks_soft_delete_admin ON candidate_feedbacks FOR UPDATE USING (
  company_id = public.my_company_id()
  AND public.my_role() = 'admin_rh'
  AND deleted_at IS NULL
) WITH CHECK (
  company_id = public.my_company_id()
);

-- candidate_scorecards
CREATE POLICY candidate_scorecards_select ON candidate_scorecards FOR SELECT USING (
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
CREATE POLICY candidate_scorecards_insert ON candidate_scorecards FOR INSERT
WITH CHECK (
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
CREATE POLICY candidate_scorecards_update_author ON candidate_scorecards FOR UPDATE USING (
  company_id = public.my_company_id()
  AND author_id = public.my_employee_id()
  AND created_at > (now() - interval '2 hours')
  AND deleted_at IS NULL
);
CREATE POLICY candidate_scorecards_soft_delete_admin ON candidate_scorecards FOR UPDATE USING (
  company_id = public.my_company_id()
  AND public.my_role() = 'admin_rh'
  AND deleted_at IS NULL
) WITH CHECK (
  company_id = public.my_company_id()
);

-- candidate_tasks
CREATE POLICY candidate_tasks_select ON candidate_tasks FOR SELECT USING (
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
CREATE POLICY candidate_tasks_insert ON candidate_tasks FOR INSERT
WITH CHECK (
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
CREATE POLICY candidate_tasks_update ON candidate_tasks FOR UPDATE USING (
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

-- user_screen_permissions
CREATE POLICY usp_select_admin ON user_screen_permissions FOR SELECT USING (
  company_id = public.my_company_id()
  AND public.my_role() = 'admin_rh'
);
CREATE POLICY usp_select_self ON user_screen_permissions FOR SELECT USING (
  company_id = public.my_company_id()
  AND profile_id = auth.uid()
);
CREATE POLICY usp_write_admin ON user_screen_permissions FOR ALL
USING (
  company_id = public.my_company_id()
  AND public.my_role() = 'admin_rh'
)
WITH CHECK (
  company_id = public.my_company_id()
  AND public.my_role() = 'admin_rh'
);

-- review_result_comments
CREATE POLICY rrc_select ON review_result_comments FOR SELECT USING (
  company_id = public.my_company_id()
  AND deleted_at IS NULL
  AND (
    public.my_role() IN ('admin_rh','director')
    OR reviewee_employee_id = public.my_employee_id()
    OR public.my_employee_id() IN (SELECT id FROM public.get_employee_ancestors(reviewee_employee_id))
  )
);
CREATE POLICY rrc_insert ON review_result_comments FOR INSERT WITH CHECK (
  company_id = public.my_company_id()
  AND author_employee_id = public.my_employee_id()
  AND (
    public.my_role() IN ('admin_rh','director')
    OR public.my_employee_id() IN (SELECT id FROM public.get_employee_ancestors(reviewee_employee_id))
  )
);
CREATE POLICY rrc_update ON review_result_comments FOR UPDATE
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR (
      author_employee_id = public.my_employee_id()
      AND deleted_at IS NULL
      AND created_at > (now() - interval '2 hours')
    )
  )
)
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR author_employee_id = public.my_employee_id()
  )
);

-- =========================================================================
-- FIM DO BASELINE
-- =========================================================================
