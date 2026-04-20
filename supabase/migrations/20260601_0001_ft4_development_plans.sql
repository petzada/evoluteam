-- FT-4 — PDI: development_plans
-- Spec: docs/dev/05-ft-4-pdi.md §5

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
