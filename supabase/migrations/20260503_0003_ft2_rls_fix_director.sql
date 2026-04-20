-- FT-2 — Fix: incluir director em answers_select
-- Aplica após 20260503_0002 (idempotente).

DROP POLICY IF EXISTS answers_select ON review_answers;

CREATE POLICY answers_select ON review_answers FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM review_assignments a
    WHERE a.id = review_answers.assignment_id
      AND a.company_id = public.my_company_id()
      AND (
        public.my_role() IN ('admin_rh','director')
        OR a.reviewer_id = public.my_employee_id()
        OR (
          a.reviewee_id = public.my_employee_id()
          AND EXISTS (
            SELECT 1 FROM review_cycle_participants p
            WHERE p.cycle_id = a.cycle_id
              AND p.employee_id = a.reviewee_id
              AND p.result_released_at IS NOT NULL
          )
        )
        OR a.reviewee_id IN (
          SELECT id FROM get_employee_descendants(public.my_employee_id())
        )
      )
  )
);
