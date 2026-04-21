-- FT-7 — Recrutamento: recruitment_stages + job_openings
-- Spec: docs/dev/13-ft-7-fundacao.md §4.2 e §4.3

-- ============================================================
-- Enums
-- ============================================================

CREATE TYPE recruitment_stage_kind AS ENUM ('entry', 'intermediate', 'hired_terminal');

CREATE TYPE job_opening_employment_type AS ENUM
  ('clt', 'pj', 'estagio', 'temporario', 'freelancer');

CREATE TYPE job_opening_workplace_type AS ENUM
  ('presencial', 'remoto', 'hibrido');

CREATE TYPE job_opening_status AS ENUM
  ('open', 'paused', 'closed', 'cancelled');

-- ============================================================
-- recruitment_stages — etapas globais por empresa
-- ============================================================

CREATE TABLE recruitment_stages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name         text NOT NULL,
  position     int  NOT NULL,
  kind         recruitment_stage_kind NOT NULL DEFAULT 'intermediate',
  archived_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Apenas uma etapa 'entry' e uma 'hired_terminal' ativas por empresa
CREATE UNIQUE INDEX recruitment_stages_company_entry_active
  ON recruitment_stages (company_id)
  WHERE kind = 'entry' AND archived_at IS NULL;

CREATE UNIQUE INDEX recruitment_stages_company_hired_active
  ON recruitment_stages (company_id)
  WHERE kind = 'hired_terminal' AND archived_at IS NULL;

CREATE INDEX recruitment_stages_company_position
  ON recruitment_stages (company_id, position);

-- ============================================================
-- job_openings — vagas
-- ============================================================

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
  closed_at          timestamptz,
  created_by         uuid REFERENCES auth.users(id),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX job_openings_company_status     ON job_openings (company_id, status);
CREATE INDEX job_openings_company_manager    ON job_openings (company_id, hiring_manager_id);
CREATE INDEX job_openings_company_department ON job_openings (company_id, department_id);
