-- FT-3 — Helper recursivo: ancestrais na hierarquia
-- Spec: docs/dev/04-ft-3-feedbacks.md §5

CREATE OR REPLACE FUNCTION get_employee_ancestors(emp_id uuid)
RETURNS TABLE (id uuid)
LANGUAGE sql STABLE AS $$
  WITH RECURSIVE ancestors AS (
    SELECT e.manager_id AS id FROM employees e
      WHERE e.id = emp_id
        AND e.manager_id IS NOT NULL
        AND e.company_id = public.my_company_id()
    UNION ALL
    SELECT e.manager_id
      FROM employees e
      INNER JOIN ancestors a ON e.id = a.id
      WHERE e.manager_id IS NOT NULL
        AND e.company_id = public.my_company_id()
  )
  SELECT id FROM ancestors
$$;
