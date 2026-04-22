-- FT-9 — Fase 5: limpeza do legado FT-8.
-- Spec: docs/dev/21-ft-9-redesign-acessos.md §11.3.
--
-- Remove a tabela rh_permissions, a funcao has_rh_permission, triggers
-- de sync/enforce, a coluna invites.rh_permissions, e retira 'rh' do
-- CHECK constraint de profiles.role / invites.role. Todas as policies RLS
-- sao reescritas sem o branch has_rh_permission; apenas admin_rh e
-- has_screen_permission permanecem.
--
-- IMPORTANTE: antes deste drop, o admin deve ter convertido todos os
-- users com role='rh' para 'user' via updateUserAccess. A migration faz
-- um safeguard que converte automaticamente (e o screenPermissions deles
-- ja foi populado na migration 0001 por backfill).

-- =============================================================
-- 0. Safeguard: converte qualquer role='rh' remanescente em 'user'
-- =============================================================
-- O screenPermissions ja foi backfillado em 20260822_0001. Ao mudar role
-- pra 'user', o trigger sync_screen_permissions_on_role_change NAO apaga
-- (user e aceito). rh_permissions sera dropada logo abaixo.
-- Primeiro suspendemos o trigger que ainda valida role='rh' em rh_permissions
-- (senao a atualizacao cascata bate no enforce). Como vamos dropar a tabela
-- inteira em seguida, remover o trigger aqui e seguro.

DROP TRIGGER IF EXISTS rh_permissions_role_check ON public.rh_permissions;
DROP TRIGGER IF EXISTS profiles_role_change_sync ON public.profiles;

UPDATE public.profiles SET role = 'user' WHERE role = 'rh';
UPDATE public.invites   SET role = 'user' WHERE role = 'rh';

-- =============================================================
-- 1. Reescreve policies sem o branch has_rh_permission
-- =============================================================
-- Mantem admin_rh + has_screen_permission.

-- colaboradores / estrutura
DROP POLICY IF EXISTS profiles_update_admin ON public.profiles;
CREATE POLICY profiles_update_admin ON public.profiles FOR UPDATE
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('colaboradores', 'edit')
  )
);

DROP POLICY IF EXISTS employees_write_admin ON public.employees;
CREATE POLICY employees_write_admin ON public.employees FOR ALL
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('colaboradores', 'edit')
  )
)
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('colaboradores', 'edit')
  )
);

DROP POLICY IF EXISTS departments_write_admin ON public.departments;
CREATE POLICY departments_write_admin ON public.departments FOR ALL
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('departamentos', 'edit')
  )
)
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('departamentos', 'edit')
  )
);

DROP POLICY IF EXISTS positions_write_admin ON public.positions;
CREATE POLICY positions_write_admin ON public.positions FOR ALL
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('cargos', 'edit')
  )
)
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('cargos', 'edit')
  )
);

DROP POLICY IF EXISTS competencies_write_admin ON public.competencies;
CREATE POLICY competencies_write_admin ON public.competencies FOR ALL
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('competencias', 'edit')
  )
)
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('competencias', 'edit')
  )
);

-- avaliacoes
DROP POLICY IF EXISTS cycles_write_admin ON public.review_cycles;
CREATE POLICY cycles_write_admin ON public.review_cycles FOR ALL
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('avaliacoes', 'edit')
  )
)
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('avaliacoes', 'edit')
  )
);

DROP POLICY IF EXISTS participants_write_admin ON public.review_cycle_participants;
CREATE POLICY participants_write_admin ON public.review_cycle_participants FOR ALL
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('avaliacoes', 'edit')
  )
)
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('avaliacoes', 'edit')
  )
);

DROP POLICY IF EXISTS forms_write_admin ON public.review_forms;
CREATE POLICY forms_write_admin ON public.review_forms FOR ALL
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('avaliacoes', 'edit')
  )
)
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('avaliacoes', 'edit')
  )
);

DROP POLICY IF EXISTS questions_write_admin ON public.review_questions;
CREATE POLICY questions_write_admin ON public.review_questions FOR ALL
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('avaliacoes', 'edit')
  )
)
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('avaliacoes', 'edit')
  )
);

DROP POLICY IF EXISTS assignments_write_admin ON public.review_assignments;
CREATE POLICY assignments_write_admin ON public.review_assignments FOR ALL
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('avaliacoes', 'edit')
  )
)
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('avaliacoes', 'edit')
  )
);

-- recrutamento
DROP POLICY IF EXISTS recruitment_stages_insert ON public.recruitment_stages;
CREATE POLICY recruitment_stages_insert ON public.recruitment_stages FOR INSERT
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('recrutamento_etapas', 'edit')
  )
);

DROP POLICY IF EXISTS recruitment_stages_update ON public.recruitment_stages;
CREATE POLICY recruitment_stages_update ON public.recruitment_stages FOR UPDATE
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('recrutamento_etapas', 'edit')
  )
);

DROP POLICY IF EXISTS recruitment_stages_delete ON public.recruitment_stages;
CREATE POLICY recruitment_stages_delete ON public.recruitment_stages FOR DELETE
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('recrutamento_etapas', 'edit')
  )
);

DROP POLICY IF EXISTS job_openings_insert ON public.job_openings;
CREATE POLICY job_openings_insert ON public.job_openings FOR INSERT
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('recrutamento_vagas', 'edit')
  )
);

DROP POLICY IF EXISTS job_openings_update ON public.job_openings;
CREATE POLICY job_openings_update ON public.job_openings FOR UPDATE
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('recrutamento_vagas', 'edit')
  )
);

DROP POLICY IF EXISTS job_openings_delete ON public.job_openings;
CREATE POLICY job_openings_delete ON public.job_openings FOR DELETE
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('recrutamento_vagas', 'edit')
  )
);

DROP POLICY IF EXISTS candidates_insert ON public.candidates;
CREATE POLICY candidates_insert ON public.candidates FOR INSERT
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('recrutamento_candidatos', 'edit')
  )
);

DROP POLICY IF EXISTS candidates_update ON public.candidates;
CREATE POLICY candidates_update ON public.candidates FOR UPDATE
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('recrutamento_candidatos', 'edit')
  )
);

DROP POLICY IF EXISTS candidates_delete ON public.candidates;
CREATE POLICY candidates_delete ON public.candidates FOR DELETE
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('recrutamento_candidatos', 'edit')
  )
);

DROP POLICY IF EXISTS job_applications_insert ON public.job_applications;
CREATE POLICY job_applications_insert ON public.job_applications FOR INSERT
WITH CHECK (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('recrutamento_candidatos', 'edit')
  )
);

-- feedbacks
DROP POLICY IF EXISTS feedbacks_select ON public.feedbacks;
CREATE POLICY feedbacks_select ON public.feedbacks FOR SELECT USING (
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
            public.my_role() = 'admin_rh'
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

DROP POLICY IF EXISTS feedbacks_update_delete_admin ON public.feedbacks;
CREATE POLICY feedbacks_update_delete_admin ON public.feedbacks FOR UPDATE
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('feedbacks', 'edit')
  )
);

-- pdi
DROP POLICY IF EXISTS pdi_insert ON public.development_plans;
CREATE POLICY pdi_insert ON public.development_plans FOR INSERT WITH CHECK (
  company_id = public.my_company_id()
  AND created_by = auth.uid()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('pdi', 'edit')
    OR employee_id IN (
      SELECT e.id FROM employees e
      JOIN employees mgr ON mgr.id = e.manager_id
      WHERE mgr.user_id = auth.uid()
        AND e.company_id = public.my_company_id()
    )
  )
);

DROP POLICY IF EXISTS pdi_update ON public.development_plans;
CREATE POLICY pdi_update ON public.development_plans FOR UPDATE USING (
  company_id = public.my_company_id()
  AND deleted_at IS NULL
  AND (
    created_by = auth.uid()
    OR public.my_role() = 'admin_rh'
    OR public.has_screen_permission('pdi', 'edit')
  )
);

DROP POLICY IF EXISTS pdi_actions_insert ON public.development_plan_actions;
CREATE POLICY pdi_actions_insert ON public.development_plan_actions FOR INSERT
WITH CHECK (
  plan_id IN (
    SELECT id FROM public.development_plans
    WHERE company_id = public.my_company_id()
      AND (
        created_by = auth.uid()
        OR public.my_role() = 'admin_rh'
        OR public.has_screen_permission('pdi', 'edit')
      )
  )
);

DROP POLICY IF EXISTS pdi_actions_update ON public.development_plan_actions;
CREATE POLICY pdi_actions_update ON public.development_plan_actions FOR UPDATE
USING (
  responsible_employee_id = public.my_employee_id()
  OR public.my_role() = 'admin_rh'
  OR public.has_screen_permission('pdi', 'edit')
);

DROP POLICY IF EXISTS pdi_comments_insert ON public.development_plan_comments;
CREATE POLICY pdi_comments_insert ON public.development_plan_comments
FOR INSERT WITH CHECK (
  company_id = public.my_company_id()
  AND author_id = public.my_employee_id()
  AND plan_id IN (
    SELECT id FROM public.development_plans
    WHERE company_id = public.my_company_id()
      AND deleted_at IS NULL
      AND (
        employee_id = public.my_employee_id()
        OR public.my_employee_id() IN (SELECT id FROM public.get_employee_ancestors(employee_id))
        OR public.my_role() IN ('admin_rh', 'director')
        OR public.has_screen_permission('pdi', 'edit')
      )
  )
);

-- candidate_feedbacks
DROP POLICY IF EXISTS candidate_feedbacks_insert ON public.candidate_feedbacks;
CREATE POLICY candidate_feedbacks_insert ON public.candidate_feedbacks
FOR INSERT WITH CHECK (
  company_id = public.my_company_id()
  AND author_id = public.my_employee_id()
  AND (
    public.my_role() IN ('admin_rh', 'director')
    OR public.has_screen_permission('recrutamento_candidatos', 'edit')
    OR EXISTS (
      SELECT 1 FROM public.job_applications ja
      JOIN public.job_openings jo ON ja.job_opening_id = jo.id
      WHERE ja.id = candidate_feedbacks.application_id
        AND jo.hiring_manager_id = public.my_employee_id()
    )
  )
);

DROP POLICY IF EXISTS candidate_feedbacks_select ON public.candidate_feedbacks;
CREATE POLICY candidate_feedbacks_select ON public.candidate_feedbacks
FOR SELECT USING (
  company_id = public.my_company_id()
  AND deleted_at IS NULL
  AND (
    public.my_role() IN ('admin_rh', 'director')
    OR public.has_screen_permission('recrutamento_candidatos', 'view')
    OR author_id = public.my_employee_id()
    OR EXISTS (
      SELECT 1 FROM public.job_applications ja
      JOIN public.job_openings jo ON ja.job_opening_id = jo.id
      WHERE ja.id = candidate_feedbacks.application_id
        AND jo.hiring_manager_id = public.my_employee_id()
    )
  )
);

-- invites: drop da policy rh-only legada (invites_rh_user_only); mantem
-- admin_rh e user_colab_edit do FT-9.
DROP POLICY IF EXISTS invites_rh_user_only ON public.invites;

-- auditoria
DROP POLICY IF EXISTS logs_admin_select ON public.activity_logs;
CREATE POLICY logs_admin_select ON public.activity_logs FOR SELECT
USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR public.has_screen_permission('auditoria', 'view')
  )
);

-- =============================================================
-- 2. Drop has_rh_permission (seguro agora que nenhuma policy usa)
-- =============================================================

DROP FUNCTION IF EXISTS public.has_rh_permission(text);

-- =============================================================
-- 3. Drop triggers legados + funcoes
-- =============================================================

DROP FUNCTION IF EXISTS public.enforce_rh_permissions_role() CASCADE;
DROP FUNCTION IF EXISTS public.sync_rh_permissions_on_role_change() CASCADE;

-- =============================================================
-- 4. Drop tabela rh_permissions (CASCADE para RLS policies da propria tabela)
-- =============================================================

DROP TABLE IF EXISTS public.rh_permissions CASCADE;

-- =============================================================
-- 5. Drop coluna invites.rh_permissions
-- =============================================================

ALTER TABLE public.invites DROP COLUMN IF EXISTS rh_permissions;

-- =============================================================
-- 6. Atualiza CHECK constraint de role (sem 'rh')
-- =============================================================

DO $$
DECLARE cname text;
BEGIN
  SELECT conname INTO cname FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%rh%';
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', cname);
  END IF;
END $$;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin_rh', 'director', 'user'));

DO $$
DECLARE cname text;
BEGIN
  SELECT conname INTO cname FROM pg_constraint
    WHERE conrelid = 'public.invites'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%rh%';
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.invites DROP CONSTRAINT %I', cname);
  END IF;
END $$;

ALTER TABLE public.invites
  ADD CONSTRAINT invites_role_check
  CHECK (role IN ('admin_rh', 'director', 'user'));

-- =============================================================
-- 7. Atualiza triggers FT-9 para aceitar apenas 'user' (sem 'rh')
-- =============================================================

CREATE OR REPLACE FUNCTION public.enforce_screen_permissions_role() RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  r text;
BEGIN
  SELECT role INTO r FROM public.profiles WHERE id = NEW.profile_id;
  IF r IS DISTINCT FROM 'user' THEN
    RAISE EXCEPTION 'user_screen_permissions so pode existir para role = ''user''; encontrado: %', r;
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.sync_screen_permissions_on_role_change() RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'user' AND OLD.role IS DISTINCT FROM 'user' THEN
    INSERT INTO public.user_screen_permissions (profile_id, company_id, permissions)
      VALUES (NEW.id, NEW.company_id, '{}'::jsonb)
      ON CONFLICT (profile_id) DO NOTHING;
  ELSIF NEW.role IS DISTINCT FROM 'user' AND OLD.role = 'user' THEN
    DELETE FROM public.user_screen_permissions WHERE profile_id = NEW.id;
  END IF;
  RETURN NEW;
END $$;
