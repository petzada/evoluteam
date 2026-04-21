-- FT-7 Onda 1 (retroativo) — flag notifies_hiring_manager em recruitment_stages
-- Spec: docs/dev/14-ft-7-onda1-vagas-candidatos.md §4
-- Correção: docs/dev/17-ft-7-correcoes-pos-auditoria.md §4

-- ============================================================
-- Coluna nova
-- ============================================================

ALTER TABLE recruitment_stages
  ADD COLUMN IF NOT EXISTS notifies_hiring_manager boolean NOT NULL DEFAULT false;

-- ============================================================
-- Backfill: etapa default "Entrevista Gestor" passa a notificar
-- (empresas que renomearam a etapa precisam ligar manualmente via
--  Configurações > Etapas de recrutamento)
-- ============================================================

UPDATE recruitment_stages
   SET notifies_hiring_manager = true
 WHERE name = 'Entrevista Gestor'
   AND kind = 'intermediate';

-- ============================================================
-- Atualiza função de seed para novas companies incluir a flag
-- ============================================================

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
