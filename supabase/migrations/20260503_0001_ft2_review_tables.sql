-- FT-2 — Ciclos de avaliação (tabelas)
-- Spec: docs/dev/03-ft-2-avaliacoes.md §5

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

CREATE TABLE review_forms (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  cycle_id    uuid NOT NULL UNIQUE REFERENCES review_cycles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

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
