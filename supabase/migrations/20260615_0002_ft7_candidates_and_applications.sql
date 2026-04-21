-- FT-7 — Recrutamento: candidates + job_applications + candidate_stage_history
-- Spec: docs/dev/13-ft-7-fundacao.md §4.4, §4.5, §4.6

-- ============================================================
-- Enums restantes
-- ============================================================

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

-- ============================================================
-- candidates — banco global por empresa (sem user_id)
-- ============================================================

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

-- ============================================================
-- job_applications — candidato x vaga
-- ============================================================

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

-- ============================================================
-- candidate_stage_history — histórico operacional append-only
-- ============================================================

CREATE TABLE candidate_stage_history (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id   uuid NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  from_stage_id    uuid REFERENCES recruitment_stages(id),
  to_stage_id      uuid REFERENCES recruitment_stages(id),
  status_change    jsonb,
  reason_code      text,
  reason_notes     text,
  changed_at       timestamptz NOT NULL DEFAULT now(),
  changed_by       uuid REFERENCES auth.users(id)
);

CREATE INDEX candidate_stage_history_app_time
  ON candidate_stage_history (application_id, changed_at DESC);

CREATE INDEX candidate_stage_history_to_stage_time
  ON candidate_stage_history (to_stage_id, changed_at);
