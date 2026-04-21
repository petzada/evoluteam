-- FT-7 — Recrutamento: seed das 7 etapas padrão + trigger + backfill
-- Spec: docs/dev/13-ft-7-fundacao.md §7

-- ============================================================
-- Função: cria as 7 etapas padrão para a company
-- ============================================================

CREATE OR REPLACE FUNCTION public.seed_recruitment_stages()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO recruitment_stages (company_id, name, position, kind) VALUES
    (NEW.id, 'Cadastrado',        1, 'entry'),
    (NEW.id, 'Triagem',            2, 'intermediate'),
    (NEW.id, 'Entrevista RH',      3, 'intermediate'),
    (NEW.id, 'Entrevista Gestor',  4, 'intermediate'),
    (NEW.id, 'Teste / Case',       5, 'intermediate'),
    (NEW.id, 'Proposta',           6, 'intermediate'),
    (NEW.id, 'Contratado',         7, 'hired_terminal');
  RETURN NEW;
END;
$$;

-- ============================================================
-- Trigger: dispara seed ao criar company
-- ============================================================

DROP TRIGGER IF EXISTS companies_seed_recruitment_stages ON companies;
CREATE TRIGGER companies_seed_recruitment_stages
AFTER INSERT ON companies
FOR EACH ROW EXECUTE FUNCTION public.seed_recruitment_stages();

-- ============================================================
-- Backfill: popula as 7 etapas para toda company existente
-- ============================================================

INSERT INTO recruitment_stages (company_id, name, position, kind)
SELECT c.id, v.name, v.position, v.kind::recruitment_stage_kind
FROM companies c,
LATERAL (VALUES
  ('Cadastrado',        1, 'entry'),
  ('Triagem',            2, 'intermediate'),
  ('Entrevista RH',      3, 'intermediate'),
  ('Entrevista Gestor',  4, 'intermediate'),
  ('Teste / Case',       5, 'intermediate'),
  ('Proposta',           6, 'intermediate'),
  ('Contratado',         7, 'hired_terminal')
) AS v(name, position, kind)
WHERE NOT EXISTS (
  SELECT 1 FROM recruitment_stages rs WHERE rs.company_id = c.id
);
