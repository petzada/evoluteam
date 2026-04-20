-- FT-3 — RLS policies
-- Spec: docs/dev/04-ft-3-feedbacks.md §6

ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY feedbacks_select ON feedbacks FOR SELECT USING (
  company_id = public.my_company_id()
  AND deleted_at IS NULL
  AND (
    sender_id = public.my_employee_id()
    OR recipient_id = public.my_employee_id()
    OR (
      visibility IN ('visivel_para_gestor','visivel_para_rh')
      AND public.my_employee_id() IN (
        SELECT id FROM get_employee_ancestors(recipient_id)
      )
    )
    OR (
      visibility = 'visivel_para_rh'
      AND public.my_role() = 'admin_rh'
    )
  )
);

CREATE POLICY feedbacks_insert ON feedbacks FOR INSERT WITH CHECK (
  company_id = public.my_company_id()
  AND sender_id = public.my_employee_id()
  AND recipient_id IN (
    SELECT id FROM employees
    WHERE company_id = public.my_company_id()
      AND status IN ('active','inactive')
  )
);

CREATE POLICY feedbacks_update_mark_read ON feedbacks FOR UPDATE USING (
  recipient_id = public.my_employee_id()
);

CREATE POLICY feedbacks_update_delete_admin ON feedbacks FOR UPDATE USING (
  company_id = public.my_company_id()
  AND public.my_role() = 'admin_rh'
);
