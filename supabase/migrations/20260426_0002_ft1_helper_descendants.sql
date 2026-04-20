-- FT-1 — Helper recursivo para validação de hierarquia
-- Spec: docs/dev/02-ft-1-colaboradores.md §5

CREATE OR REPLACE FUNCTION get_employee_descendants(root_id uuid)
RETURNS TABLE (id uuid)
LANGUAGE sql STABLE AS $$
  WITH RECURSIVE descendants AS (
    SELECT e.id FROM employees e
      WHERE e.manager_id = root_id
        AND e.company_id = public.my_company_id()
    UNION ALL
    SELECT e.id
      FROM employees e
      INNER JOIN descendants d ON e.manager_id = d.id
      WHERE e.company_id = public.my_company_id()
  )
  SELECT id FROM descendants
$$;
