-- Fase 0 — Tabelas operacionais (init)
-- Spec: docs/dev/01-fase-0-fundacao.md §5

-- 1) companies
CREATE TABLE companies (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  cnpj       text,
  segment    text NOT NULL,
  team_size  text NOT NULL,
  logo_url   text,
  status     text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) profiles (extensão 1:1 de auth.users)
CREATE TABLE profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  role       text NOT NULL DEFAULT 'user' CHECK (role IN ('admin_rh','director','user')),
  full_name  text NOT NULL,
  phone      text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_profiles_company ON profiles(company_id);

-- 3) departments
CREATE TABLE departments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        text NOT NULL,
  is_archived boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, name)
);
CREATE INDEX idx_departments_company ON departments(company_id);

-- 4) positions (4 seeds inseridos no onboarding pelo createCompany)
CREATE TABLE positions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        text NOT NULL,
  is_archived boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, name)
);
CREATE INDEX idx_positions_company ON positions(company_id);

-- 5) competencies (7 seeds inseridos no onboarding)
CREATE TABLE competencies (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        text NOT NULL,
  description text,
  is_archived boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, name)
);
CREATE INDEX idx_competencies_company ON competencies(company_id);

-- 6) employees (ficha de RH; user_id NULL quando ainda não aceitou convite)
CREATE TABLE employees (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name     text NOT NULL,
  email         text NOT NULL,
  phone         text,
  position_id   uuid REFERENCES positions(id) ON DELETE SET NULL,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  manager_id    uuid REFERENCES employees(id) ON DELETE SET NULL,
  hire_date     date NOT NULL,
  status        text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','terminated')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, email)
);
CREATE INDEX idx_employees_company ON employees(company_id);
CREATE INDEX idx_employees_user    ON employees(user_id);
CREATE INDEX idx_employees_manager ON employees(manager_id);

-- 7) invites
CREATE TABLE invites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  email       text NOT NULL,
  token       text NOT NULL UNIQUE,
  role        text NOT NULL CHECK (role IN ('admin_rh','director','user')),
  invited_by  uuid NOT NULL REFERENCES auth.users(id),
  expires_at  timestamptz NOT NULL,
  accepted_at timestamptz,
  revoked_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_invites_company  ON invites(company_id);
CREATE INDEX idx_invites_employee ON invites(employee_id);
CREATE INDEX idx_invites_token    ON invites(token);

-- 8) notifications
CREATE TABLE notifications (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        text NOT NULL,
  title       text NOT NULL,
  body        text,
  link_url    text,
  entity_type text,
  entity_id   uuid,
  read_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE read_at IS NULL;

-- 9) activity_logs
CREATE TABLE activity_logs (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  company_id     uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  actor_user_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action         text NOT NULL,
  entity_type    text,
  entity_id      uuid,
  metadata       jsonb NOT NULL DEFAULT '{}',
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_activity_logs_company_date ON activity_logs(company_id, created_at DESC);
