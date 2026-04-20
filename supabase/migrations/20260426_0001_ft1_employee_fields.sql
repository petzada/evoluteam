-- FT-1 — Campos de RH adicionais em employees
-- Spec: docs/dev/02-ft-1-colaboradores.md §5

ALTER TABLE employees
  ADD COLUMN internal_notes text,
  ADD COLUMN terminated_at  timestamptz;
