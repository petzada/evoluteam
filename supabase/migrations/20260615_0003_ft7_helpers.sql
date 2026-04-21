-- FT-7 — Recrutamento: helpers RLS
-- Spec: docs/dev/13-ft-7-fundacao.md §5.3

-- Verifica se o employee passado é o hiring_manager da vaga passada
CREATE OR REPLACE FUNCTION public.is_gestor_of_opening(
  p_employee_id uuid,
  p_opening_id  uuid
)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM job_openings jo
    WHERE jo.id = p_opening_id
      AND jo.hiring_manager_id = p_employee_id
  );
$$;
