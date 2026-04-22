-- FT-9 — Redesign de acessos: permissoes por tela (view/edit).
-- Spec: docs/dev/21-ft-9-redesign-acessos.md
-- Fatia 1 — Backend base, ADITIVA. Nao remove rh_permissions nem altera
-- role CHECK. Fases subsequentes migram app layer + RLS; Fase 4 remove
-- rh_permissions e converte role 'rh' em 'user'.

-- =============================================================
-- 1. Tabela user_screen_permissions
-- =============================================================

CREATE TABLE public.user_screen_permissions (
  profile_id    uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id    uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  permissions   jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX usp_company_idx ON public.user_screen_permissions (company_id);

-- =============================================================
-- 2. Validator de shape do JSONB
-- =============================================================
-- Chaves validas: <screen>.<action>. Screens e acoes fixos conforme spec.
-- Todos os valores precisam ser boolean. Retorna true para {} (vazio).

CREATE OR REPLACE FUNCTION public.validate_screen_permissions(p jsonb)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  valid_keys text[] := ARRAY[
    'dashboard.view',
    'colaboradores.view',          'colaboradores.edit',
    'avaliacoes.view',             'avaliacoes.edit',
    'feedbacks.view',              'feedbacks.edit',
    'pdi.view',                    'pdi.edit',
    'recrutamento_vagas.view',     'recrutamento_vagas.edit',
    'recrutamento_candidatos.view','recrutamento_candidatos.edit',
    'recrutamento_etapas.view',    'recrutamento_etapas.edit',
    'recrutamento_relatorios.view',
    'empresa.view',                'empresa.edit',
    'cargos.view',                 'cargos.edit',
    'departamentos.view',          'departamentos.edit',
    'competencias.view',           'competencias.edit',
    'auditoria.view'
  ];
  kv record;
BEGIN
  IF p IS NULL THEN RETURN false; END IF;
  IF jsonb_typeof(p) IS DISTINCT FROM 'object' THEN RETURN false; END IF;

  FOR kv IN SELECT key, value FROM jsonb_each(p) LOOP
    IF NOT (kv.key = ANY(valid_keys)) THEN RETURN false; END IF;
    IF jsonb_typeof(kv.value) IS DISTINCT FROM 'boolean' THEN RETURN false; END IF;
  END LOOP;

  RETURN true;
END $$;

ALTER TABLE public.user_screen_permissions
  ADD CONSTRAINT usp_permissions_shape
  CHECK (public.validate_screen_permissions(permissions));

-- =============================================================
-- 3. Trigger de consistencia: so user/rh tem registro
-- =============================================================
-- Durante Fase 1-3, role 'rh' ainda existe (coexistencia com rh_permissions).
-- A partir da Fase 4, role 'rh' e removido; trigger continua valido para 'user'.

CREATE OR REPLACE FUNCTION public.enforce_screen_permissions_role() RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  r text;
BEGIN
  SELECT role INTO r FROM public.profiles WHERE id = NEW.profile_id;
  IF r IS DISTINCT FROM 'user' AND r IS DISTINCT FROM 'rh' THEN
    RAISE EXCEPTION 'user_screen_permissions so pode existir para role in (user, rh); encontrado: %', r;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER usp_role_check
  BEFORE INSERT OR UPDATE ON public.user_screen_permissions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_screen_permissions_role();

-- =============================================================
-- 4. Trigger em profiles: sincroniza registro na mudanca de role
-- =============================================================
-- Quando role vira 'user' (vindo de qualquer outro), cria registro vazio
-- se ainda nao existir. Quando sai de user/rh, apaga.
-- Durante Fase 1-3, 'rh' tambem popula (mantido pelo backfill de §6).

CREATE OR REPLACE FUNCTION public.sync_screen_permissions_on_role_change() RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.role IN ('user', 'rh') AND OLD.role NOT IN ('user', 'rh') THEN
    INSERT INTO public.user_screen_permissions (profile_id, company_id, permissions)
      VALUES (NEW.id, NEW.company_id, '{}'::jsonb)
      ON CONFLICT (profile_id) DO NOTHING;
  ELSIF NEW.role NOT IN ('user', 'rh') AND OLD.role IN ('user', 'rh') THEN
    DELETE FROM public.user_screen_permissions WHERE profile_id = NEW.id;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER profiles_role_change_sync_screen_permissions
  AFTER UPDATE OF role ON public.profiles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION public.sync_screen_permissions_on_role_change();

-- =============================================================
-- 5. updated_at: atualizado via app (padrao do repo; nenhuma
--    tabela usa trigger para isso).
-- =============================================================

-- =============================================================
-- 6. Helper SQL has_screen_permission(screen, action)
-- =============================================================
-- SECURITY DEFINER para poder ler user_screen_permissions mesmo em policies
-- onde RLS da tabela nao permitiria leitura direta. Mapeia o key composto
-- <screen>.<action> e retorna false se nao existir.

CREATE OR REPLACE FUNCTION public.has_screen_permission(screen text, action text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT (usp.permissions -> (screen || '.' || action))::boolean
    FROM public.user_screen_permissions usp
    WHERE usp.profile_id = auth.uid()
  ), false)
$$;

-- =============================================================
-- 7. Backfill a partir de rh_permissions
-- =============================================================
-- Para cada profile com role='rh' e registro em rh_permissions, cria entrada
-- equivalente em user_screen_permissions. Nao toca rh_permissions em si.
-- Mapeamento documentado em docs/dev/21-ft-9-redesign-acessos.md §5.

INSERT INTO public.user_screen_permissions (profile_id, company_id, permissions)
SELECT
  p.id,
  p.company_id,
  jsonb_strip_nulls(jsonb_build_object(
    'colaboradores.view',           rp.can_employees,
    'colaboradores.edit',           rp.can_employees,
    'cargos.view',                  rp.can_employees,
    'cargos.edit',                  rp.can_employees,
    'departamentos.view',           rp.can_employees,
    'departamentos.edit',           rp.can_employees,
    'competencias.view',            rp.can_employees,
    'competencias.edit',            rp.can_employees,
    'avaliacoes.view',              rp.can_reviews,
    'avaliacoes.edit',              rp.can_reviews,
    'pdi.view',                     rp.can_pdi_feedback,
    'pdi.edit',                     rp.can_pdi_feedback,
    'feedbacks.view',               rp.can_pdi_feedback,
    'feedbacks.edit',               rp.can_pdi_feedback,
    'recrutamento_vagas.view',      rp.can_recruitment,
    'recrutamento_vagas.edit',      rp.can_recruitment,
    'recrutamento_candidatos.view', rp.can_recruitment,
    'recrutamento_candidatos.edit', rp.can_recruitment,
    'recrutamento_etapas.view',     rp.can_recruitment,
    'recrutamento_etapas.edit',     rp.can_recruitment,
    'recrutamento_relatorios.view', rp.can_recruitment,
    'empresa.view',                 rp.can_audit,
    'auditoria.view',               rp.can_audit
  ))
FROM public.profiles p
JOIN public.rh_permissions rp ON rp.profile_id = p.id
WHERE p.role = 'rh'
ON CONFLICT (profile_id) DO NOTHING;

-- Profiles 'user' sem registro tambem ganham linha vazia (baseline limpo).
-- Evita edge case de trigger nao pegar usuarios ja existentes.
INSERT INTO public.user_screen_permissions (profile_id, company_id, permissions)
SELECT p.id, p.company_id, '{}'::jsonb
FROM public.profiles p
WHERE p.role = 'user'
ON CONFLICT (profile_id) DO NOTHING;

-- =============================================================
-- 8. RLS
-- =============================================================

ALTER TABLE public.user_screen_permissions ENABLE ROW LEVEL SECURITY;

-- SELECT: admin_rh le tudo do tenant; cada usuario le o proprio.
CREATE POLICY usp_select_admin ON public.user_screen_permissions
  FOR SELECT USING (
    company_id = public.my_company_id()
    AND public.my_role() = 'admin_rh'
  );

CREATE POLICY usp_select_self ON public.user_screen_permissions
  FOR SELECT USING (
    company_id = public.my_company_id()
    AND profile_id = auth.uid()
  );

-- WRITE: apenas admin_rh. Escalacao restrita (um colaborador com
-- colaboradores.edit que conceder subset dos proprios toggles) e validada
-- na server action, nao via RLS (complexidade fora de escopo de policy).
CREATE POLICY usp_write_admin ON public.user_screen_permissions
  FOR ALL
  USING (
    company_id = public.my_company_id()
    AND public.my_role() = 'admin_rh'
  )
  WITH CHECK (
    company_id = public.my_company_id()
    AND public.my_role() = 'admin_rh'
  );
