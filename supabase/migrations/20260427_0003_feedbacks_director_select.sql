-- FT-9 follow-up: director deve enxergar feedbacks visiveis para RH
-- sem depender de JSON em user_screen_permissions.

DROP POLICY IF EXISTS feedbacks_select ON feedbacks;

CREATE POLICY feedbacks_select ON feedbacks FOR SELECT USING (
  company_id = public.my_company_id()
  AND (
    (
      deleted_at IS NULL
      AND (
        sender_id = public.my_employee_id()
        OR recipient_id = public.my_employee_id()
        OR (
          visibility IN ('visivel_para_gestor','visivel_para_rh')
          AND public.my_employee_id() IN (
            SELECT id FROM public.get_employee_ancestors(recipient_id)
          )
        )
        OR (
          visibility = 'visivel_para_rh'
          AND (
            public.my_role() IN ('admin_rh', 'director')
            OR public.has_screen_permission('feedbacks', 'view')
          )
        )
      )
    )
    OR (
      deleted_at IS NOT NULL
      AND (
        public.my_role() = 'admin_rh'
        OR public.has_screen_permission('feedbacks', 'edit')
      )
    )
  )
);
