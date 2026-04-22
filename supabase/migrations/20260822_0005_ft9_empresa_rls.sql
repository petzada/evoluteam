-- FT-9 fase 6 — Expandir RLS de companies para incluir has_screen_permission('empresa','edit').
-- Contexto: toggles empresa.view/edit existem no modelo de dados e na UI desde a fase 1,
-- mas a policy companies_update_admin só liberava admin_rh. Users com empresa.edit
-- eram bloqueados pelo RLS mesmo que canDo + action validassem corretamente.

DROP POLICY IF EXISTS companies_update_admin ON public.companies;

CREATE POLICY companies_update_admin ON public.companies
  FOR UPDATE
  USING (
    id = public.my_company_id()
    AND (
      public.my_role() = 'admin_rh'
      OR public.has_screen_permission('empresa', 'edit')
    )
  )
  WITH CHECK (
    id = public.my_company_id()
    AND (
      public.my_role() = 'admin_rh'
      OR public.has_screen_permission('empresa', 'edit')
    )
  );
