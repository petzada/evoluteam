-- Fase 0 — Políticas RLS
-- Spec: docs/dev/01-fase-0-fundacao.md §5 (Policies)

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_select ON profiles FOR SELECT
USING ( id = auth.uid() OR (company_id = public.my_company_id() AND public.my_role() = 'admin_rh') );
CREATE POLICY profiles_update_self ON profiles FOR UPDATE
USING ( id = auth.uid() );
CREATE POLICY profiles_update_admin ON profiles FOR UPDATE
USING ( company_id = public.my_company_id() AND public.my_role() = 'admin_rh' );

-- companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY companies_select ON companies FOR SELECT
USING ( id = public.my_company_id() );
CREATE POLICY companies_update_admin ON companies FOR UPDATE
USING ( id = public.my_company_id() AND public.my_role() = 'admin_rh' );

-- departments
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY departments_select ON departments FOR SELECT
USING ( company_id = public.my_company_id() );
CREATE POLICY departments_write_admin ON departments FOR ALL
USING ( company_id = public.my_company_id() AND public.my_role() = 'admin_rh' )
WITH CHECK ( company_id = public.my_company_id() AND public.my_role() = 'admin_rh' );

-- positions
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY positions_select ON positions FOR SELECT
USING ( company_id = public.my_company_id() );
CREATE POLICY positions_write_admin ON positions FOR ALL
USING ( company_id = public.my_company_id() AND public.my_role() = 'admin_rh' )
WITH CHECK ( company_id = public.my_company_id() AND public.my_role() = 'admin_rh' );

-- competencies
ALTER TABLE competencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY competencies_select ON competencies FOR SELECT
USING ( company_id = public.my_company_id() );
CREATE POLICY competencies_write_admin ON competencies FOR ALL
USING ( company_id = public.my_company_id() AND public.my_role() = 'admin_rh' )
WITH CHECK ( company_id = public.my_company_id() AND public.my_role() = 'admin_rh' );

-- employees
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY employees_select ON employees FOR SELECT
USING ( company_id = public.my_company_id() );
CREATE POLICY employees_write_admin ON employees FOR ALL
USING ( company_id = public.my_company_id() AND public.my_role() = 'admin_rh' )
WITH CHECK ( company_id = public.my_company_id() AND public.my_role() = 'admin_rh' );

-- invites (apenas admin_rh)
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY invites_admin ON invites FOR ALL
USING ( company_id = public.my_company_id() AND public.my_role() = 'admin_rh' )
WITH CHECK ( company_id = public.my_company_id() AND public.my_role() = 'admin_rh' );

-- notifications (cada user vê só as próprias)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_own ON notifications FOR SELECT
USING ( user_id = auth.uid() );
CREATE POLICY notifications_update_own ON notifications FOR UPDATE
USING ( user_id = auth.uid() );

-- activity_logs (INSERT só via service_role; SELECT apenas admin_rh)
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY logs_admin_select ON activity_logs FOR SELECT
USING ( company_id = public.my_company_id() AND public.my_role() = 'admin_rh' );
