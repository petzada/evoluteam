-- FT-3 — Feedbacks contínuos
-- Spec: docs/dev/04-ft-3-feedbacks.md §5

CREATE TABLE feedbacks (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  sender_id      uuid NOT NULL REFERENCES employees(id),
  recipient_id   uuid NOT NULL REFERENCES employees(id),
  type           text NOT NULL CHECK (type IN
                   ('elogio','reconhecimento','ponto_de_melhoria','orientacao','observacao_privada')),
  competency_id  uuid REFERENCES competencies(id) ON DELETE SET NULL,
  message        text NOT NULL CHECK (length(message) >= 20 AND length(message) <= 10000),
  visibility     text NOT NULL CHECK (visibility IN ('privado','visivel_para_gestor','visivel_para_rh')),
  read_at        timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  deleted_at     timestamptz,
  deleted_by     uuid REFERENCES auth.users(id),
  CHECK (sender_id != recipient_id),
  CHECK (type != 'observacao_privada' OR visibility = 'privado')
);

CREATE INDEX idx_feedbacks_recipient_created ON feedbacks(recipient_id, created_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_feedbacks_sender_created ON feedbacks(sender_id, created_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_feedbacks_competency ON feedbacks(competency_id)
  WHERE deleted_at IS NULL;
