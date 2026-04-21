-- FT-7 · Histórico sintético de etapas
-- Spec: docs/dev/18-ft-7-candidate-quick-sheet.md não tem, este é novo ajuste pós-V1.
--
-- Quando o usuário pula etapas no Kanban (ex.: move de "Cadastrado" direto pra
-- "Proposta"), o funil de relatórios ficava com etapas intermediárias zeradas.
-- Solução: inserir entries automáticas em candidate_stage_history pras etapas
-- puladas, marcadas como `synthetic = true`. Essas entries:
--  - ALIMENTAM o funil de conversão (contagem por etapa)
--  - NÃO APARECEM no timeline do perfil do candidato
--  - NÃO ENTRAM no cálculo de tempo mediano por etapa (seriam 0 dias, distorcem)

-- ============================================================
-- Coluna nova
-- ============================================================

ALTER TABLE candidate_stage_history
  ADD COLUMN IF NOT EXISTS synthetic boolean NOT NULL DEFAULT false;

-- Index parcial para queries que filtram synthetic=false (frequente)
CREATE INDEX IF NOT EXISTS idx_stage_history_non_synthetic
  ON candidate_stage_history (application_id, changed_at DESC)
  WHERE synthetic = false;

COMMENT ON COLUMN candidate_stage_history.synthetic IS
  'true = entrada criada automaticamente para representar etapa pulada no funil. Excluída do timeline do candidato e do cálculo de tempo mediano por etapa.';
