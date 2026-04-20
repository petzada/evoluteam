-- FT-4 — PDI: RLS policies
-- Spec: docs/dev/05-ft-4-pdi.md §6

ALTER TABLE development_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE development_plan_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE development_plan_comments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- development_plans
-- ============================================================

-- SELECT: colaborador, gestores na árvore ascendente, admin_rh, director
CREATE POLICY pdi_select ON development_plans FOR SELECT USING (
  company_id = public.my_company_id()
  AND deleted_at IS NULL
  AND (
    employee_id = public.my_employee_id()
    OR public.my_employee_id() IN (SELECT id FROM get_employee_ancestors(employee_id))
    OR public.my_role() IN ('admin_rh', 'director')
  )
);

-- INSERT: admin_rh ou gestor direto do employee_id
CREATE POLICY pdi_insert ON development_plans FOR INSERT WITH CHECK (
  company_id = public.my_company_id()
  AND created_by = auth.uid()
  AND (
    public.my_role() = 'admin_rh'
    OR employee_id IN (
      SELECT e.id FROM employees e
      JOIN employees mgr ON mgr.id = e.manager_id
      WHERE mgr.user_id = auth.uid()
        AND e.company_id = public.my_company_id()
    )
  )
);

-- UPDATE: criador do PDI ou admin_rh
CREATE POLICY pdi_update ON development_plans FOR UPDATE USING (
  company_id = public.my_company_id()
  AND deleted_at IS NULL
  AND (created_by = auth.uid() OR public.my_role() = 'admin_rh')
);

-- ============================================================
-- development_plan_actions
-- ============================================================

-- SELECT: herda acesso do PDI pai
CREATE POLICY pdi_actions_select ON development_plan_actions FOR SELECT USING (
  plan_id IN (
    SELECT id FROM development_plans
    WHERE company_id = public.my_company_id()
      AND deleted_at IS NULL
      AND (
        employee_id = public.my_employee_id()
        OR public.my_employee_id() IN (SELECT id FROM get_employee_ancestors(employee_id))
        OR public.my_role() IN ('admin_rh', 'director')
      )
  )
);

-- INSERT (adicionar ações): criador do PDI ou admin_rh
CREATE POLICY pdi_actions_insert ON development_plan_actions FOR INSERT WITH CHECK (
  company_id = public.my_company_id()
  AND plan_id IN (
    SELECT id FROM development_plans
    WHERE company_id = public.my_company_id()
      AND deleted_at IS NULL
      AND (created_by = auth.uid() OR public.my_role() = 'admin_rh')
  )
);

-- UPDATE de status: responsável pela ação ou admin_rh
CREATE POLICY pdi_actions_update ON development_plan_actions FOR UPDATE USING (
  responsible_employee_id = public.my_employee_id()
  OR (public.my_role() = 'admin_rh' AND company_id = public.my_company_id())
);

-- ============================================================
-- development_plan_comments
-- ============================================================

-- SELECT: herda acesso do PDI pai
CREATE POLICY pdi_comments_select ON development_plan_comments FOR SELECT USING (
  deleted_at IS NULL
  AND plan_id IN (
    SELECT id FROM development_plans
    WHERE company_id = public.my_company_id()
      AND deleted_at IS NULL
      AND (
        employee_id = public.my_employee_id()
        OR public.my_employee_id() IN (SELECT id FROM get_employee_ancestors(employee_id))
        OR public.my_role() IN ('admin_rh', 'director')
      )
  )
);

-- INSERT: admin_rh + gestores + colaborador do PDI (não director)
CREATE POLICY pdi_comments_insert ON development_plan_comments FOR INSERT WITH CHECK (
  company_id = public.my_company_id()
  AND author_id = public.my_employee_id()
  AND public.my_role() != 'director'
  AND plan_id IN (
    SELECT id FROM development_plans
    WHERE company_id = public.my_company_id()
      AND deleted_at IS NULL
      AND (
        employee_id = public.my_employee_id()
        OR public.my_employee_id() IN (SELECT id FROM get_employee_ancestors(employee_id))
        OR public.my_role() = 'admin_rh'
      )
  )
);

-- UPDATE (soft delete de comentário): autor ou admin_rh
CREATE POLICY pdi_comments_update ON development_plan_comments FOR UPDATE USING (
  company_id = public.my_company_id()
  AND (author_id = public.my_employee_id() OR public.my_role() = 'admin_rh')
);
