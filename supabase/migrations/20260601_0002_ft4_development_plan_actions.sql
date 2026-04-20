-- FT-4 — PDI: development_plan_actions
-- Spec: docs/dev/05-ft-4-pdi.md §5

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
