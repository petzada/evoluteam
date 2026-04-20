-- FT-4 — PDI: development_plan_comments
-- Spec: docs/dev/05-ft-4-pdi.md §5

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
