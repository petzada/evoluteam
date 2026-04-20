-- Fase 0 — Helpers RLS
-- Spec: docs/dev/01-fase-0-fundacao.md §5 (Helpers RLS)

CREATE OR REPLACE FUNCTION public.my_company_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.my_role() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;
