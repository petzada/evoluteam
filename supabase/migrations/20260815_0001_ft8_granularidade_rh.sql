-- FT-8 — Granularidade de permissoes do RH
-- Spec: docs/dev/19-ft-8-granularidade-rh.md
-- Fatia 1 — Backend base (migration + helpers). Ajustes de policies em fatias seguintes.

-- =============================================================
-- 1. Novo role 'rh' no CHECK de profiles.role e invites.role
-- =============================================================
-- Usa DO block para descobrir o nome do constraint (inline constraints
-- geram nomes auto) e dropar com seguranca.

DO $$
DECLARE
  cname text;
BEGIN
  SELECT conname INTO cname
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%admin_rh%director%user%';
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', cname);
  END IF;
END $$;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin_rh', 'director', 'user', 'rh'));

DO $$
DECLARE
  cname text;
BEGIN
  SELECT conname INTO cname
    FROM pg_constraint
    WHERE conrelid = 'public.invites'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%admin_rh%director%user%';
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.invites DROP CONSTRAINT %I', cname);
  END IF;
END $$;

ALTER TABLE public.invites
  ADD CONSTRAINT invites_role_check
  CHECK (role IN ('admin_rh', 'director', 'user', 'rh'));

-- =============================================================
-- 2. Tabela rh_permissions (6 booleans por usuario rh)
-- =============================================================

CREATE TABLE public.rh_permissions (
  profile_id        uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id        uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  can_employees     boolean NOT NULL DEFAULT false,
  can_reviews       boolean NOT NULL DEFAULT false,
  can_recruitment   boolean NOT NULL DEFAULT false,
  can_pdi_feedback  boolean NOT NULL DEFAULT false,
  can_invites       boolean NOT NULL DEFAULT false,
  can_audit         boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX rh_permissions_company_idx ON public.rh_permissions (company_id);

-- Trigger de consistencia: so existe registro se profile.role = 'rh'.
CREATE OR REPLACE FUNCTION public.enforce_rh_permissions_role() RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  r text;
BEGIN
  SELECT role INTO r FROM public.profiles WHERE id = NEW.profile_id;
  IF r IS DISTINCT FROM 'rh' THEN
    RAISE EXCEPTION 'rh_permissions so pode existir para profiles.role = ''rh'' (encontrado: %)', r;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER rh_permissions_role_check
  BEFORE INSERT OR UPDATE ON public.rh_permissions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_rh_permissions_role();

-- Trigger em profiles: sincroniza rh_permissions quando role muda.
CREATE OR REPLACE FUNCTION public.sync_rh_permissions_on_role_change() RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'rh' AND OLD.role IS DISTINCT FROM 'rh' THEN
    INSERT INTO public.rh_permissions (profile_id, company_id)
      VALUES (NEW.id, NEW.company_id)
      ON CONFLICT (profile_id) DO NOTHING;
  ELSIF NEW.role IS DISTINCT FROM 'rh' AND OLD.role = 'rh' THEN
    DELETE FROM public.rh_permissions WHERE profile_id = NEW.id;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER profiles_role_change_sync
  AFTER UPDATE OF role ON public.profiles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION public.sync_rh_permissions_on_role_change();

-- =============================================================
-- 3. Helper has_rh_permission(text)
-- =============================================================
-- Usa SECURITY DEFINER para conseguir ler rh_permissions mesmo quando
-- a RLS da tabela nao permitiria leitura direta.

CREATE OR REPLACE FUNCTION public.has_rh_permission(perm text) RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE perm
    WHEN 'can_employees'    THEN COALESCE((SELECT can_employees    FROM public.rh_permissions WHERE profile_id = auth.uid()), false)
    WHEN 'can_reviews'      THEN COALESCE((SELECT can_reviews      FROM public.rh_permissions WHERE profile_id = auth.uid()), false)
    WHEN 'can_recruitment'  THEN COALESCE((SELECT can_recruitment  FROM public.rh_permissions WHERE profile_id = auth.uid()), false)
    WHEN 'can_pdi_feedback' THEN COALESCE((SELECT can_pdi_feedback FROM public.rh_permissions WHERE profile_id = auth.uid()), false)
    WHEN 'can_invites'      THEN COALESCE((SELECT can_invites      FROM public.rh_permissions WHERE profile_id = auth.uid()), false)
    WHEN 'can_audit'        THEN COALESCE((SELECT can_audit        FROM public.rh_permissions WHERE profile_id = auth.uid()), false)
    ELSE false
  END
$$;

-- =============================================================
-- 4. Tabela review_result_comments (Comentarios da lideranca)
-- =============================================================

CREATE TABLE public.review_result_comments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  cycle_id              uuid NOT NULL REFERENCES public.review_cycles(id) ON DELETE CASCADE,
  reviewee_employee_id  uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  author_employee_id    uuid NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
  content               text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 4000),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  deleted_at            timestamptz NULL,
  deleted_by            uuid NULL REFERENCES public.profiles(id)
);

CREATE INDEX rrc_cycle_reviewee_idx
  ON public.review_result_comments (cycle_id, reviewee_employee_id)
  WHERE deleted_at IS NULL;

CREATE INDEX rrc_author_idx
  ON public.review_result_comments (author_employee_id)
  WHERE deleted_at IS NULL;

-- =============================================================
-- 5. RLS nas tabelas novas
-- =============================================================

ALTER TABLE public.rh_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_result_comments ENABLE ROW LEVEL SECURITY;

-- 5.1 rh_permissions
-- admin_rh: SELECT/INSERT/UPDATE/DELETE dentro do proprio tenant.
-- rh: SELECT apenas do proprio registro (para o app popular actor.rhPermissions).
-- Outros roles: nao veem nada.

CREATE POLICY rh_permissions_select_admin ON public.rh_permissions
  FOR SELECT USING (
    company_id = public.my_company_id()
    AND public.my_role() = 'admin_rh'
  );

CREATE POLICY rh_permissions_select_self ON public.rh_permissions
  FOR SELECT USING (
    company_id = public.my_company_id()
    AND profile_id = auth.uid()
  );

CREATE POLICY rh_permissions_write_admin ON public.rh_permissions
  FOR ALL
  USING (company_id = public.my_company_id() AND public.my_role() = 'admin_rh')
  WITH CHECK (company_id = public.my_company_id() AND public.my_role() = 'admin_rh');

-- 5.2 review_result_comments
-- Leitura segue regra de answers_select (admin_rh/director/proprio/ancestors),
-- restrita a comentarios nao deletados (soft-delete).
-- Insercao para admin_rh/director/ancestors com author = my_employee_id().
-- Validacao extra de "ciclo released" feita em server action
-- (nao em policy, para permitir mensagem de erro clara).

CREATE POLICY rrc_select ON public.review_result_comments
  FOR SELECT USING (
    company_id = public.my_company_id()
    AND deleted_at IS NULL
    AND (
      public.my_role() IN ('admin_rh','director')
      OR reviewee_employee_id = public.my_employee_id()
      OR public.my_employee_id() IN (SELECT id FROM public.get_employee_ancestors(reviewee_employee_id))
    )
  );

CREATE POLICY rrc_insert ON public.review_result_comments
  FOR INSERT WITH CHECK (
    company_id = public.my_company_id()
    AND author_employee_id = public.my_employee_id()
    AND (
      public.my_role() IN ('admin_rh','director')
      OR public.my_employee_id() IN (SELECT id FROM public.get_employee_ancestors(reviewee_employee_id))
    )
  );

-- UPDATE: autor dentro da janela de 2h OU admin_rh (para soft-delete a qualquer momento).
-- Uma unica policy permissiva cobre ambos; server action valida semantica (qual campo muda).
CREATE POLICY rrc_update ON public.review_result_comments
  FOR UPDATE
  USING (
    company_id = public.my_company_id()
    AND (
      public.my_role() = 'admin_rh'
      OR (
        author_employee_id = public.my_employee_id()
        AND deleted_at IS NULL
        AND created_at > (now() - interval '2 hours')
      )
    )
  )
  WITH CHECK (
    company_id = public.my_company_id()
    AND (
      public.my_role() = 'admin_rh'
      OR author_employee_id = public.my_employee_id()
    )
  );
