-- FT-10 Unidades (grupo de empresas)
-- Spec: docs/dev/23-ft-10-unidades.md §4
-- Plano: docs/dev/24-ft-10-plano.md Fase 1

-- 1. business_units (lookup table) -- mesmo padrao de departments/positions/competencies
CREATE TABLE business_units (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        text NOT NULL,
  is_archived boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, name)
);
CREATE INDEX idx_business_units_company ON business_units(company_id);

-- 2. employees.unit_id (FK opcional)
-- ON DELETE SET NULL: deletar uma unidade preserva colaboradores; so perdem a tag.
ALTER TABLE employees
  ADD COLUMN unit_id uuid REFERENCES business_units(id) ON DELETE SET NULL;
CREATE INDEX idx_employees_unit ON employees(unit_id);

-- 3. invites.unit_id (FK opcional, copiada para employees no aceite)
ALTER TABLE invites
  ADD COLUMN unit_id uuid REFERENCES business_units(id) ON DELETE SET NULL;

-- 4. RLS herda do tenant via company_id (mesmo padrao de departments)
ALTER TABLE business_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY business_units_tenant_select ON business_units
  FOR SELECT
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY business_units_tenant_modify ON business_units
  FOR ALL
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));
