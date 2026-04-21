-- Pipeline snapshot em job_openings: cada vaga congela o funil de quando foi criada.
-- Spec: correção #2 do bloco de bugs reportados em 2026-04-21 (Opção A1 + R3 + backfill b).

-- 1) Coluna nova
ALTER TABLE job_openings
  ADD COLUMN pipeline_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 2) Backfill: cada vaga existente ganha snapshot das etapas ativas atuais da sua empresa.
UPDATE job_openings jo
SET pipeline_snapshot = COALESCE(
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', rs.id,
        'name', rs.name,
        'position', rs.position,
        'kind', rs.kind,
        'notifies_hiring_manager', rs.notifies_hiring_manager
      )
      ORDER BY rs.position
    )
    FROM recruitment_stages rs
    WHERE rs.company_id = jo.company_id
      AND rs.archived_at IS NULL
  ),
  '[]'::jsonb
);

-- 3) Índice GIN para queries futuras que filtrem/agreguem por stage id no snapshot.
CREATE INDEX job_openings_pipeline_snapshot_gin
  ON job_openings USING GIN (pipeline_snapshot jsonb_path_ops);
