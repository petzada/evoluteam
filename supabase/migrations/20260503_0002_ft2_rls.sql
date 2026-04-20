-- FT-2 — RLS policies
-- Spec: docs/dev/03-ft-2-avaliacoes.md §5 e §10

-- Helper: retorna o employee_id do auth.uid() atual
CREATE OR REPLACE FUNCTION public.my_employee_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id FROM employees
  WHERE user_id = auth.uid()
    AND company_id = public.my_company_id()
$$;

-- review_cycles
ALTER TABLE review_cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY cycles_select ON review_cycles FOR SELECT
USING ( company_id = public.my_company_id() );
CREATE POLICY cycles_write_admin ON review_cycles FOR ALL
USING ( company_id = public.my_company_id() AND public.my_role() = 'admin_rh' )
WITH CHECK ( company_id = public.my_company_id() AND public.my_role() = 'admin_rh' );

-- review_cycle_participants
ALTER TABLE review_cycle_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY participants_select ON review_cycle_participants FOR SELECT
USING ( company_id = public.my_company_id() );
CREATE POLICY participants_write_admin ON review_cycle_participants FOR ALL
USING ( company_id = public.my_company_id() AND public.my_role() = 'admin_rh' )
WITH CHECK ( company_id = public.my_company_id() AND public.my_role() = 'admin_rh' );

-- review_forms
ALTER TABLE review_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY forms_select ON review_forms FOR SELECT
USING ( company_id = public.my_company_id() );
CREATE POLICY forms_write_admin ON review_forms FOR ALL
USING ( company_id = public.my_company_id() AND public.my_role() = 'admin_rh' )
WITH CHECK ( company_id = public.my_company_id() AND public.my_role() = 'admin_rh' );

-- review_questions
ALTER TABLE review_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY questions_select ON review_questions FOR SELECT
USING ( company_id = public.my_company_id() );
CREATE POLICY questions_write_admin ON review_questions FOR ALL
USING ( company_id = public.my_company_id() AND public.my_role() = 'admin_rh' )
WITH CHECK ( company_id = public.my_company_id() AND public.my_role() = 'admin_rh' );

-- review_assignments: reviewer/reviewee/admin lê; admin escreve (reviewer faz via action)
ALTER TABLE review_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY assignments_select ON review_assignments FOR SELECT USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() IN ('admin_rh','director')
    OR reviewer_id = public.my_employee_id()
    OR reviewee_id = public.my_employee_id()
    OR reviewee_id IN (
      SELECT id FROM get_employee_descendants(public.my_employee_id())
    )
  )
);
CREATE POLICY assignments_write_admin ON review_assignments FOR ALL
USING ( company_id = public.my_company_id() AND public.my_role() = 'admin_rh' )
WITH CHECK ( company_id = public.my_company_id() AND public.my_role() = 'admin_rh' );

-- review_answers: reviewer escreve no próprio assignment enquanto aberto;
-- admin/gestor/self liberado lê.
ALTER TABLE review_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY answers_select ON review_answers FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM review_assignments a
    WHERE a.id = review_answers.assignment_id
      AND a.company_id = public.my_company_id()
      AND (
        public.my_role() = 'admin_rh'
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
CREATE POLICY answers_write_own ON review_answers FOR ALL USING (
  EXISTS (
    SELECT 1 FROM review_assignments a
    WHERE a.id = review_answers.assignment_id
      AND a.reviewer_id = public.my_employee_id()
      AND a.status IN ('pending','in_progress')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM review_assignments a
    WHERE a.id = review_answers.assignment_id
      AND a.reviewer_id = public.my_employee_id()
      AND a.status IN ('pending','in_progress')
  )
);
