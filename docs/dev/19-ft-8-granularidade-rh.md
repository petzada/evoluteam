# FT-8 — Granularidade de permissões do RH

Spec da separação dos papéis administrativos e da feature complementar de **Comentários da liderança em resultado de ciclo**.
Última atualização: 2026-04-21.

> **Leia antes:** `docs/dev/00-decisoes-transversais.md` + `docs/dev/01-fase-0-fundacao.md` (base de roles) + `docs/dev/03-ft-2-avaliacoes.md` (ResultDetail) + `docs/dev/04-ft-3-feedbacks.md` (visibilidades).
> **Brainstorm origem:** sessão `.superpowers/brainstorm/413-1776798050/` — HTMLs aprovados: `roles-permissoes-atual.html`, `p2-granularidade-rh.html`, `p3-escopo-diretor.html`, `p4-acoes-diretor.html`, `p6-fluxo-convite.html`, `p7-edicao-acesso.html`, `p8-escalacao-rh.html`, `p10-comentario-ciclo.html`, `p10-layout-resultado.html`.

---

## 1. Objetivo

Quebrar o tudo-ou-nada do `admin_rh` atual. Introduzir um novo role `rh` com permissões configuráveis em 6 módulos, dar ação ativa ao Diretor na empresa toda (CTO/CEO persona), manter `admin_rh` como "dono do tenant" sem mudar seu poder, e adicionar a feature de **Comentários da liderança** em resultado de ciclo (que surgiu como necessidade da ação ativa do Diretor).

O modelo passa de **3 roles tudo-ou-nada** para **4 roles + 6 permissões granulares no RH + papéis contextuais preservados (gestor, hiring_manager)**.

## 2. Escopo

### Dentro do FT-8

- Novo role `rh` no enum de `profiles.role` (CHECK constraint).
- Nova tabela `rh_permissions` com 6 booleanos por usuário `rh`.
- Director ganha ações ativas: enviar feedback contínuo, comentar PDI, feedback em candidato, comentar em resultado de ciclo.
- Nova tabela `review_result_comments` com RLS derivada de `answers_select`.
- Label "Administrador" na UI substitui "Admin RH" (slug no banco permanece `admin_rh`).
- Fluxo de convite com 4 cards de role + toggles inline do RH.
- Coluna e filtro "Acesso" em `/colaboradores`.
- Drawer "Gerenciar acesso" no perfil do colaborador.
- Layout do `ResultDetail.tsx` reorganizado: remove botão "Criar PDI" do aside, renomeia seção "Comentários" para "Observações dos avaliadores", adiciona seção "Comentários da liderança".
- Auditoria via `activity_logs` em toda mudança de role/permissões.
- Migração silenciosa em produção (conversão automática, aditiva).

### Fora do FT-8

- Réplica do avaliado em "Comentários da liderança" (diálogo público) — fica como v2 possível.
- Recorte por departamento do Diretor (opção B da P3 descartada) — fica como FT-9 possível.
- Visibilidade `visivel_para_diretor` em feedbacks contínuos — não proposta.
- Papéis de colaboração em recrutamento (entrevistador convidado, recrutador sem poder de contratar) — fora de escopo.
- Delegação temporária de permissões — fora de escopo.

---

## 3. Decisões do brainstorm

| # | Tema | Escolha | Rationale resumido |
|---|---|---|---|
| P1 | Dor a atacar | Granularidade dentro do RH | Tudo-ou-nada de `admin_rh` não cabe em PME com 2–4 pessoas de RH especializadas. |
| P2 | UX de permissões do RH | **B** — 6 toggles por módulo | Flag individual (A) é overkill; preset (C) exige dados de campo; 6 toggles cobre 90% dos casos. |
| P3 | Escopo de ação do Diretor | **A** — Empresa toda | CTO/CEO persona precisa agir em qualquer colaborador. Recorte por departamento (B) é feature futura. |
| P4 | Ações do Diretor | **B** — Contribuidor de Processos, com sub-escolha **(ii)** para "feedback em ciclo" = comentar no resultado liberado | Cobre exatamente o que o cliente pediu; preserva fronteira com Admin (Diretor opina, Admin decide). |
| P5 | Rename `admin_rh` | **A** — Só UI ("Administrador") | 83 ocorrências em 9 migrations já em produção; valor do rename é cosmético. |
| P6 | Fluxo de convite | **B** — Cards + toggles inline | Mostra impacto de cada role antes do clique; progressive disclosure resolve ruído. |
| P7 | Edição de acesso | **C'** — Reutiliza `/colaboradores` + drawer no perfil | Zero página nova, zero item de sidebar novo, UX contextual. |
| P8 | Escalação de privilégio do RH | **C** — RH com toggle Convites só convida Colaborador | Segurança máxima; qualquer role privilegiado (RH, Admin, Diretor) só Admin cria. |
| P9 | Migração de tenants existentes | **A** — Conversão automática silenciosa | Migration puramente aditiva, ninguém perde acesso. Toast informativo pro Diretor no primeiro login. |
| P10 | Comentário em resultado de ciclo | **B** — Admin + Diretor + cadeia de gestão do avaliado | Liderança comenta, RH fica fora (mantém papel de moderador de processo); avaliado lê mas não responde (canal de resposta é 1:1). |

### Regras corolárias validadas

- **`visivel_para_gestor` nunca é visto por cargo** — RH com toggle "PDIs e feedbacks" e Administrador só enxergam esse canal se forem ancestors reais do destinatário. Preserva a promessa do canal "gestão".
- **Toggle do RH é aditivo à baseline**: RH sempre vê o próprio + árvore descendente se for gestor; toggle adiciona superpoder administrativo na área.
- **Transições de role**: sair de `rh` apaga o registro em `rh_permissions`; entrar em `rh` cria com tudo `false`. Sair e voltar não "lembra" toggles anteriores.
- **Confirmação explícita para escalada a Administrador**: modal antes de salvar ("Carolina terá acesso total, incluindo convites e auditoria. Confirmar?"). Outras transições não exigem confirmação.
- **Auditoria em todas as mudanças**: `user.role_changed` (já existe) + `user.permissions_changed` (novo) com metadata de before/after.
- **RH não se auto-promove**: bloqueio em `permissions.ts` + RLS (não pode editar o próprio registro em `profiles.role` nem `rh_permissions`).

---

## 4. User stories

- **Administrador** should be able to convidar alguém como Colaborador, RH, Administrador ou Diretor; ao escolher RH, configurar os 6 toggles individualmente.
- **Administrador** should be able to acessar o drawer "Gerenciar acesso" no perfil de qualquer colaborador e mudar role/toggles, com audit log automático.
- **RH com toggle "Convites e acessos"** should be able to convidar novos Colaboradores, mas não pode convidar como RH/Administrador/Diretor.
- **RH com toggle "PDIs e feedbacks"** should be able to ver todos os PDIs da empresa + feedbacks marcados `visivel_para_rh` + feedbacks deletados; moderar via soft-delete.
- **RH sem toggle "PDIs e feedbacks"** should fall back to baseline: só PDIs/feedbacks da própria árvore descendente (se gestor) ou próprios.
- **Diretor** should be able to enviar feedback contínuo para qualquer colaborador da empresa.
- **Diretor** should be able to comentar em PDI de qualquer colaborador (bloqueio atual em `pdi_comments_insert` cai para director).
- **Diretor** should be able to dar feedback em candidato de qualquer vaga (mesmo que não seja hiring_manager).
- **Diretor, Administrador e gestores na cadeia ascendente do avaliado** should be able to comentar em resultado liberado de ciclo; próprio avaliado vê mas não responde; RH com toggle "Avaliações" vê mas não comenta (design deliberado).
- **Avaliado** should be able to ver os Comentários da liderança no próprio resultado (se ciclo `released`).
- **Administrador** should be able to filtrar `/colaboradores` por tipo de acesso (Colaborador / RH / Administrador / Diretor).
- **Todo colaborador** should continue to have baseline unchanged: vê o próprio, vê a árvore descendente se for gestor.

---

## 5. Schema

### 5.1 Migration

Arquivo: `supabase/migrations/20260815_0001_ft8_granularidade_rh.sql`

```sql
-- FT-8 — Granularidade de permissões do RH
-- Spec: docs/dev/19-ft-8-granularidade-rh.md

-- =============================================================
-- 1. Novo role 'rh' no CHECK de profiles.role
-- =============================================================

ALTER TABLE profiles
  DROP CONSTRAINT profiles_role_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin_rh', 'director', 'user', 'rh'));

-- Mesmo CHECK em invites (usado no convite antes do profile existir).
ALTER TABLE invites
  DROP CONSTRAINT invites_role_check;

ALTER TABLE invites
  ADD CONSTRAINT invites_role_check
  CHECK (role IN ('admin_rh', 'director', 'user', 'rh'));

-- =============================================================
-- 2. Tabela rh_permissions (6 booleans por usuário rh)
-- =============================================================

CREATE TABLE rh_permissions (
  profile_id            uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  company_id            uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  can_employees         boolean NOT NULL DEFAULT false,
  can_reviews           boolean NOT NULL DEFAULT false,
  can_recruitment       boolean NOT NULL DEFAULT false,
  can_pdi_feedback      boolean NOT NULL DEFAULT false,
  can_invites           boolean NOT NULL DEFAULT false,
  can_audit             boolean NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX rh_permissions_company_idx ON rh_permissions (company_id);

-- Trigger de consistência: só existe registro se profile.role = 'rh'.
CREATE OR REPLACE FUNCTION enforce_rh_permissions_role() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  r text;
BEGIN
  SELECT role INTO r FROM profiles WHERE id = NEW.profile_id;
  IF r <> 'rh' THEN
    RAISE EXCEPTION 'rh_permissions só pode existir para profiles.role = ''rh'' (encontrado: %)', r;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER rh_permissions_role_check
  BEFORE INSERT OR UPDATE ON rh_permissions
  FOR EACH ROW EXECUTE FUNCTION enforce_rh_permissions_role();

-- Quando profile.role muda, manter rh_permissions coerente.
CREATE OR REPLACE FUNCTION sync_rh_permissions_on_role_change() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.role = 'rh' AND OLD.role <> 'rh' THEN
    -- Entrou em rh: cria entrada vazia (tudo false).
    INSERT INTO rh_permissions (profile_id, company_id)
    VALUES (NEW.id, NEW.company_id)
    ON CONFLICT (profile_id) DO NOTHING;
  ELSIF NEW.role <> 'rh' AND OLD.role = 'rh' THEN
    -- Saiu de rh: apaga toggles. Decisão de brainstorm: não "lembra" se voltar.
    DELETE FROM rh_permissions WHERE profile_id = NEW.id;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER profiles_role_change_sync
  AFTER UPDATE OF role ON profiles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION sync_rh_permissions_on_role_change();

-- updated_at automático.
CREATE TRIGGER rh_permissions_updated_at
  BEFORE UPDATE ON rh_permissions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================
-- 3. Tabela review_result_comments (Comentários da liderança)
-- =============================================================

CREATE TABLE review_result_comments (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id              uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  cycle_id                uuid NOT NULL REFERENCES review_cycles(id) ON DELETE CASCADE,
  reviewee_employee_id    uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  author_employee_id      uuid NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  content                 text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 4000),
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  deleted_at              timestamptz NULL,
  deleted_by              uuid NULL REFERENCES profiles(id)
);

CREATE INDEX rrc_cycle_reviewee_idx
  ON review_result_comments (cycle_id, reviewee_employee_id)
  WHERE deleted_at IS NULL;

CREATE INDEX rrc_author_idx
  ON review_result_comments (author_employee_id)
  WHERE deleted_at IS NULL;

CREATE TRIGGER rrc_updated_at
  BEFORE UPDATE ON review_result_comments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Regra: só permite inserir se resultado está released para o avaliado.
-- Validada em server action (não em trigger, por clareza de erro).

-- =============================================================
-- 4. RLS nas novas tabelas
-- =============================================================

ALTER TABLE rh_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_result_comments ENABLE ROW LEVEL SECURITY;

-- rh_permissions: admin_rh CRUD; próprio rh lê o próprio registro; mais ninguém.
CREATE POLICY rh_permissions_select ON rh_permissions
  FOR SELECT USING (
    company_id = public.my_company_id()
    AND (
      public.my_role() = 'admin_rh'
      OR profile_id = auth.uid()
    )
  );

CREATE POLICY rh_permissions_write_admin ON rh_permissions
  FOR ALL
  USING (company_id = public.my_company_id() AND public.my_role() = 'admin_rh')
  WITH CHECK (company_id = public.my_company_id() AND public.my_role() = 'admin_rh');

-- review_result_comments: leitura segue regra de answers_select adaptada.
CREATE POLICY rrc_select ON review_result_comments
  FOR SELECT USING (
    company_id = public.my_company_id()
    AND deleted_at IS NULL
    AND (
      public.my_role() IN ('admin_rh','director')
      OR reviewee_employee_id = public.my_employee_id()
      OR public.my_employee_id() = ANY(public.get_employee_ancestors(reviewee_employee_id))
    )
  );

-- INSERT: apenas admin_rh, director, ou ancestor do avaliado.
-- Validação extra de "ciclo released" feita em server action.
CREATE POLICY rrc_insert ON review_result_comments
  FOR INSERT WITH CHECK (
    company_id = public.my_company_id()
    AND author_employee_id = public.my_employee_id()
    AND (
      public.my_role() IN ('admin_rh','director')
      OR public.my_employee_id() = ANY(public.get_employee_ancestors(reviewee_employee_id))
    )
  );

-- UPDATE (editar próprio até 2h): padrão FT-7 Onda 2.
CREATE POLICY rrc_update_author ON review_result_comments
  FOR UPDATE USING (
    company_id = public.my_company_id()
    AND author_employee_id = public.my_employee_id()
    AND deleted_at IS NULL
    AND created_at > (now() - interval '2 hours')
  ) WITH CHECK (author_employee_id = public.my_employee_id());

-- Soft-delete: autor (dentro da janela 2h) OU admin_rh (sempre).
CREATE POLICY rrc_soft_delete ON review_result_comments
  FOR UPDATE USING (
    company_id = public.my_company_id()
    AND (
      public.my_role() = 'admin_rh'
      OR (
        author_employee_id = public.my_employee_id()
        AND deleted_at IS NULL
        AND created_at > (now() - interval '2 hours')
      )
    )
  );
```

### 5.2 Tipos TypeScript

`src/lib/supabase/types.ts` ganha:

```ts
rh_permissions: {
  Row: {
    profile_id: string;
    company_id: string;
    can_employees: boolean;
    can_reviews: boolean;
    can_recruitment: boolean;
    can_pdi_feedback: boolean;
    can_invites: boolean;
    can_audit: boolean;
    created_at: string;
    updated_at: string;
  };
  Insert: { profile_id: string; company_id: string; /* demais opcionais com default false */ };
  Update: Partial<...>;
};

review_result_comments: {
  Row: {
    id: string;
    company_id: string;
    cycle_id: string;
    reviewee_employee_id: string;
    author_employee_id: string;
    content: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    deleted_by: string | null;
  };
  Insert: { cycle_id: string; reviewee_employee_id: string; author_employee_id: string; content: string; company_id: string; };
  Update: Partial<...>;
};
```

Role `'rh'` adicionado no tipo de `profiles.role` em `employees/schema.ts`:

```ts
export const RoleEnum = z.enum(['admin_rh', 'director', 'user', 'rh']);
```

---

## 6. RLS policies — ajustes em tabelas existentes

Todas as policies atuais que referenciam `role = 'admin_rh'` ou `role IN ('admin_rh','director')` precisam considerar o novo role `rh` quando o respectivo toggle estiver ativo. A regra é: **`admin_rh` continua igual**, `rh` entra condicionalmente.

### 6.1 employees (toggle `can_employees`)

Migration `20260419_0003_rls_policies.sql` tem:

```sql
CREATE POLICY employees_write_admin ON employees
  FOR ALL USING (public.my_role() = 'admin_rh')
  WITH CHECK (public.my_role() = 'admin_rh');
```

Vira:

```sql
DROP POLICY employees_write_admin ON employees;

CREATE POLICY employees_write_admin ON employees
  FOR ALL USING (
    company_id = public.my_company_id()
    AND (
      public.my_role() = 'admin_rh'
      OR (public.my_role() = 'rh' AND public.has_rh_permission('can_employees'))
    )
  )
  WITH CHECK (
    company_id = public.my_company_id()
    AND (
      public.my_role() = 'admin_rh'
      OR (public.my_role() = 'rh' AND public.has_rh_permission('can_employees'))
    )
  );
```

Helper novo:

```sql
CREATE OR REPLACE FUNCTION public.has_rh_permission(perm text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT CASE perm
    WHEN 'can_employees'    THEN COALESCE((SELECT can_employees    FROM rh_permissions WHERE profile_id = auth.uid()), false)
    WHEN 'can_reviews'      THEN COALESCE((SELECT can_reviews      FROM rh_permissions WHERE profile_id = auth.uid()), false)
    WHEN 'can_recruitment'  THEN COALESCE((SELECT can_recruitment  FROM rh_permissions WHERE profile_id = auth.uid()), false)
    WHEN 'can_pdi_feedback' THEN COALESCE((SELECT can_pdi_feedback FROM rh_permissions WHERE profile_id = auth.uid()), false)
    WHEN 'can_invites'      THEN COALESCE((SELECT can_invites      FROM rh_permissions WHERE profile_id = auth.uid()), false)
    WHEN 'can_audit'        THEN COALESCE((SELECT can_audit        FROM rh_permissions WHERE profile_id = auth.uid()), false)
    ELSE false
  END
$$;
```

### 6.2 Mapeamento toggle → policies tocadas

| Toggle | Policies a ajustar | Racional |
|---|---|---|
| `can_employees` | `employees_write_admin`, `departments_write_admin`, `positions_write_admin`, `competencies_write_admin` | CRUD de colaborador + estrutura organizacional |
| `can_reviews` | `cycles_write_admin`, `assignments_write_admin`, `answers_write_*` (reviewer), `review_result_released` (policy que gerencia flag) | Criar/publicar/arquivar ciclo, liberar resultado |
| `can_recruitment` | `recruitment_stages_*` (INSERT/UPDATE/DELETE), `job_openings_*`, `candidates_*`, `job_applications_update`, + ações de hire | Config de etapas, CRUD de vaga/candidato, contratar |
| `can_pdi_feedback` | `feedbacks_select` (ver `visivel_para_rh` + deletados), `feedbacks_update_delete_admin`, `pdi_insert` (criar pra qualquer um), `pdi_update`, `pdi_actions_*` | Moderação + acesso global de leitura |
| `can_invites` | `invites_admin` (restrita a role=user), `profiles_update_self` (role change — ver regra de escalação P8) | Convidar como Colaborador apenas |
| `can_audit` | `logs_admin_select`, `companies_update_admin` (read-only nesse toggle; escrita continua só admin_rh) | Ler activity_logs + ver (não editar) dados da empresa |

### 6.3 Director ganha ações ativas (P4 · B)

#### 6.3.1 Feedback contínuo

`feedbacks_insert` (migration `20260517_0003_ft3_rls.sql`) já permite qualquer employee enviar — director já pode. **Sem mudança** nessa policy.

#### 6.3.2 Comentar em PDI

Policy atual `pdi_comments_insert` (migration `20260601_0004_ft4_pdi_rls.sql`) explicitamente bloqueia director:

```sql
AND public.my_role() <> 'director'
```

Vira:

```sql
DROP POLICY pdi_comments_insert ON development_plan_comments;

CREATE POLICY pdi_comments_insert ON development_plan_comments
  FOR INSERT WITH CHECK (
    author_id = public.my_employee_id()
    AND EXISTS (
      SELECT 1 FROM development_plans dp
      WHERE dp.id = plan_id
        AND dp.company_id = public.my_company_id()
        AND (
          dp.employee_id = public.my_employee_id()
          OR public.my_employee_id() = ANY(public.get_employee_ancestors(dp.employee_id))
          OR public.my_role() IN ('admin_rh', 'director')
          OR (public.my_role() = 'rh' AND public.has_rh_permission('can_pdi_feedback'))
        )
    )
  );
```

#### 6.3.3 Feedback em candidato

Policy atual `candidate_feedbacks_insert` (migration `20260630_0001_ft7_onda2_candidate_feedbacks.sql`) permite admin_rh ou hiring_manager da vaga. **Ganha director**:

```sql
-- Antes
(public.my_role() = 'admin_rh' OR <hiring_manager check>)

-- Depois
(public.my_role() IN ('admin_rh', 'director') OR <hiring_manager check>)
```

A leitura de `candidate_feedbacks_select` também precisa incluir director (hoje admin_rh/director já veem todos pela policy `candidates_select`, mas o feedback individual é restrito). Adicionar branch `director`:

```sql
public.my_role() IN ('admin_rh', 'director')
OR author_id = public.my_employee_id()
OR <hiring_manager check>
```

#### 6.3.4 Comentar em resultado de ciclo

Coberto pelas policies de `review_result_comments` criadas em §5.1.

---

## 7. Permissions no app

### 7.1 Tipo `Actor` estendido

Hoje `Actor` em cada `permissions.ts` módulo tem `role`, `userId`, `employeeId`. Adicionar:

```ts
export type RhPermissions = {
  can_employees: boolean;
  can_reviews: boolean;
  can_recruitment: boolean;
  can_pdi_feedback: boolean;
  can_invites: boolean;
  can_audit: boolean;
};

export type Actor = {
  role: 'admin_rh' | 'director' | 'user' | 'rh' | string;
  userId: string;
  employeeId: string | null;
  rhPermissions?: RhPermissions | null;  // só populado se role='rh'
  // ... campos existentes
};
```

Loader central em `src/lib/auth/actor.ts` (ou equivalente que já existe) faz join de `profiles` com `rh_permissions` quando `role='rh'`.

### 7.2 Helper `hasAdminPower`

Padrão usado em todas as funções `can*`:

```ts
// src/lib/auth/permissions.ts (novo)
export function hasAdminPower(
  actor: Actor,
  area: keyof RhPermissions,
): boolean {
  if (actor.role === 'admin_rh') return true;
  if (actor.role === 'rh' && actor.rhPermissions?.[area]) return true;
  return false;
}
```

### 7.3 Ajustes por módulo

Cada `can*` em `src/features/*/permissions.ts` que hoje checa `role === 'admin_rh'` passa a chamar `hasAdminPower(actor, '<área>')`.

Exemplos principais:

```ts
// employees/permissions.ts
canManageEmployee(actor) → hasAdminPower(actor, 'can_employees')
canEditEmployee(actor) → hasAdminPower(actor, 'can_employees')
canTerminateEmployee(actor, target) → hasAdminPower(actor, 'can_employees') && actor.userId !== target.userId
canSeeInternalNotes(actor) → hasAdminPower(actor, 'can_employees')

// reviews/permissions.ts
canCreateCycle(actor) → hasAdminPower(actor, 'can_reviews')
canEditCycle(actor, cycle) → hasAdminPower(actor, 'can_reviews') && cycle.status !== 'archived'
canReleaseResult(actor) → hasAdminPower(actor, 'can_reviews')

// recruitment/permissions.ts
canManageStages(actor) → hasAdminPower(actor, 'can_recruitment')
canManageJobOpenings(actor) → hasAdminPower(actor, 'can_recruitment')
canManageCandidates(actor) → hasAdminPower(actor, 'can_recruitment')
canHireCandidate(actor) → hasAdminPower(actor, 'can_recruitment')

// feedbacks/permissions.ts
canDeleteFeedback(actor) → hasAdminPower(actor, 'can_pdi_feedback')
// canViewFeedback ganha branch: rh com can_pdi_feedback vê 'visivel_para_rh'

// pdi/permissions.ts
canCreatePdi(actor, target) — admin power OR manager direto
canEditPdiHeader(actor, plan) — admin power OR criador
canDeletePdi(actor) → hasAdminPower(actor, 'can_pdi_feedback')

// invite + role changes (novos)
canInviteAs(actor, targetRole): boolean
  - Se actor.role === 'admin_rh' → qualquer role
  - Se actor.role === 'rh' && can_invites → somente 'user' (P8 · C)
  - Caso contrário → false

canChangeUserRole(actor, targetUser, newRole): boolean
  - Se actor.role === 'admin_rh' → qualquer transição (com confirmação pra admin)
  - Se actor.role === 'rh' && can_invites → pode editar role de 'user' para 'user' (ou seja, não pode escalar ninguém)
  - actor não pode alterar o próprio role (nenhum)
```

### 7.4 Regras do Diretor (P4 · B)

```ts
// feedbacks/permissions.ts
canSendFeedback(actor) — inalterado (todo employee envia)

// pdi/permissions.ts
canCommentOnPdi(actor, plan, ancestorsOfEmployee):
  - director: sempre true se pode ver o plano
  - admin_rh e rh (can_pdi_feedback): sempre true
  - actor employeeId === plan.employee_id: true
  - actor em ancestorsOfEmployee: true

// recruitment/permissions.ts
canGiveFeedback(actor):
  - admin_rh, director: sempre true
  - user com employeeId: true (HM verificado por RLS)

// reviews/permissions.ts (novo)
canCommentOnResult(actor, reviewee, ancestorsOfReviewee):
  - admin_rh, director: sempre true
  - actor em ancestorsOfReviewee: true
  - caso contrário: false

canViewResultComments(actor, reviewee, ancestorsOfReviewee, isReleased):
  - admin_rh, director: sempre true
  - actor.employeeId === reviewee.id: isReleased
  - actor em ancestorsOfReviewee: isReleased
```

---

## 8. UX

### 8.1 Fluxo de convite (P6 · B)

Componente: novo `src/features/permissions/components/AccessForm.tsx` — reutilizado em 2 contextos (convite e edição).

Estrutura:

```
<AccessForm mode="invite" | "edit" initialRole={...} initialPermissions={...}>
  <Field label="Nome completo" />        // só em mode=invite
  <Field label="E-mail" />                // só em mode=invite
  <RoleCards value={role} onChange={...} options={['user','rh','admin_rh','director']} />
  {role === 'rh' && <PermissionsToggles value={permissions} onChange={...} />}
  <SubmitButton />
</AccessForm>
```

Regras da UI:

- **Default** em mode=invite: `role='user'` (Colaborador).
- **Toggles em mode=invite**: todos `false` no state inicial.
- **Validação submit**: se `role === 'rh'` e todos os toggles `false`, disparar `window.confirm('Este RH não terá nenhuma permissão além das de Colaborador. Continuar?')`.
- **Escalação para admin_rh**: se `initialRole !== 'admin_rh'` e submit com `role === 'admin_rh'`, disparar confirm ("Carolina terá acesso total, incluindo convites e auditoria. Confirmar?").
- **RH convidando** (P8 · C): se actor.role === 'rh', os cards `rh`, `admin_rh`, `director` vêm desabilitados com tooltip "Apenas Administrador pode conceder este acesso".
- **Label "Administrador"**: chip e texto nos cards dizem "Administrador", mas o value interno é `admin_rh` (P5).

### 8.2 Cards de role

Arquivo: `src/features/permissions/components/RoleCards.tsx`.

```
┌─────────────────────┐ ┌─────────────────────┐
│ ○ Colaborador       │ │ ○ RH                │
│ Acesso ao próprio   │ │ Você escolhe as     │
│ perfil, feedbacks e │ │ áreas de atuação.   │
│ PDI.                │ │                     │
└─────────────────────┘ └─────────────────────┘
┌─────────────────────┐ ┌─────────────────────┐
│ ○ Administrador     │ │ ○ Diretor           │
│ Acesso total,       │ │ Vê tudo e comenta   │
│ incluindo           │ │ PDI, ciclo e        │
│ configurações.      │ │ candidato.          │
└─────────────────────┘ └─────────────────────┘
```

Padrão visual: mesmo estilo dos cards selecionáveis do wizard de contratação (radio grande + título + descrição em 1 linha).

### 8.3 Toggles de permissão

Arquivo: `src/features/permissions/components/PermissionsToggles.tsx`.

Aparece inline sob os cards quando `role === 'rh'`.

```
Permissões de Carolina (RH)
─────────────────────────────────────────────────
[toggle] Colaboradores e estrutura
         CRUD de colaboradores, departamentos,
         cargos e competências. Ver notas internas.
─────────────────────────────────────────────────
[toggle] Avaliações
         Criar e publicar ciclos · liberar
         resultados · ver consolidados.
─────────────────────────────────────────────────
[toggle] Recrutamento
         Configurar etapas · criar vagas ·
         gerenciar candidatos · contratar.
─────────────────────────────────────────────────
[toggle] PDIs e feedbacks
         Moderar feedbacks (soft-delete) ·
         criar PDI para qualquer colaborador.
─────────────────────────────────────────────────
[toggle] Convites e acessos
         Enviar convites (apenas como
         Colaborador). Não pode escalar roles.
─────────────────────────────────────────────────
[toggle] Auditoria
         Ver activity_logs · ver dados da
         empresa (CNPJ, logo) — sem editar.
```

### 8.4 Coluna "Acesso" em `/colaboradores` (P7 · C')

Arquivo: `src/features/employees/components/EmployeesList.tsx` — já é Client Component com filtros.

- Adicionar coluna `Acesso` ao array de colunas existente. Default: **oculta** (opt-in via popover "Colunas", padrão atual da tabela).
- Valores: badge colorido. `Colaborador` (cinza), `RH` (laranja), `Administrador` (vermelho claro), `Diretor` (azul).
- Filtro: `MultiSelect` no header, label "Acesso". Opções: os 4 roles. Seguindo padrão de `MultiSelect` já usado em filtros de recrutamento (P3a pós-auditoria).
- Query `listEmployees` (em `src/features/employees/queries.ts`) passa a trazer `profile.role` e — se `role='rh'` — não trazer toggles (não cabem na lista; aparecem só na edição).

### 8.5 Drawer "Gerenciar acesso" no perfil (P7 · C')

Arquivo: novo `src/features/permissions/components/AccessSheet.tsx`. Padrão visual herdado de `EmployeeSheet` / `CandidateQuickSheet`.

Abertura:

- Em `EmployeeProfile.tsx` (header, ao lado de "Editar perfil" que já existe): botão secundário **"Gerenciar acesso"**, visível apenas se `canChangeUserRole(actor, target, any)` retornar true pra qualquer newRole. Em termos práticos: Administrador vê sempre; RH com `can_invites` vê só se target é Colaborador.
- Drawer abre lateral, reutiliza `AccessForm` em `mode="edit"`.
- Campos "Nome" e "E-mail" são read-only em mode=edit (só role + toggles são editáveis).

Salvamento:

- Server action `updateUserAccess({ profileId, newRole, newPermissions })`.
- Regras P6/P7/P8:
  - Se `actor.role === 'admin_rh'`: permite tudo (com modal de confirmação pra escalada a admin).
  - Se `actor.role === 'rh' && actor.rhPermissions?.can_invites`:
    - Só edita profiles com `role='user'`.
    - `newRole` só pode ser `'user'` (não escala).
  - `actor.userId === profileId`: bloqueado (RH não se auto-edita, Admin não muda o próprio role).
- Grava em `activity_logs`:
  - `user.role_changed` (já existe) se role mudou.
  - `user.permissions_changed` (novo) se toggles mudaram.
  - Metadata: `{ before: { role, permissions }, after: { role, permissions } }`.

### 8.6 Layout final do ResultDetail (decisão confirmada)

Arquivo: `src/features/reviews/components/ResultDetail.tsx`.

**Aside (lado esquerdo, inalterado exceto pela remoção):**
1. Card "Média geral" (primary)
2. Card "Pontos fortes" (emerald)
3. Card "Pontos a desenvolver" (amber)
4. ~~Botão "Criar PDI com este resultado"~~ **REMOVIDO** (linhas atuais 160-168)

**Main (direita, reordenada):**
1. Banner "Liberado/Oculto" (sem mudança)
2. **Notas por competência** (sem mudança)
3. **Observações dos avaliadores** — seção hoje chamada "Comentários" (linhas 270+). **Renomeada** para evitar conflito com a nova feature.
4. **PDI gerado** — placeholder CTA "Criar PDI com base nesta avaliação" continua. É o único ponto de criar PDI a partir do resultado após esta entrega.
5. **Comentários da liderança** ★ — seção nova (ver §9).

### 8.7 Toast informativo no primeiro login do Diretor pós-deploy (P9)

Componente: reutiliza o sistema de notificações in-app (`notifications` table + feature `/src/features/notifications/`).

- Trigger: ao rodar a migration, inserir uma notification `system.feature_announcement` para cada profile com `role='director'` ativo.
- Conteúdo: "Novas ações disponíveis no seu perfil de Diretor — você pode enviar feedback, comentar em PDI, deixar feedback em candidato e comentar em resultados de ciclo. Explore no seu dashboard."
- Fluxo default de notification (sino da header) cuida do display.

---

## 9. Feature nova — Comentários da liderança

### 9.1 Schema

Já coberto em §5.1 (`review_result_comments`).

### 9.2 UI — seção na `ResultDetail.tsx`

Componente: novo `src/features/reviews/components/ResultCommentsSection.tsx`.

```
┌──────────────────────────────────────────────────┐
│  Comentários da liderança                   [2]  │
├──────────────────────────────────────────────────┤
│                                                  │
│  [avatar] Roberto Pinto  [Diretor]    há 2 dias  │
│           Forte salto em execução técnica neste  │
│           ciclo. Vale conversar sobre próximos   │
│           passos de carreira na próxima 1:1 —    │
│           tenho algumas ideias.                  │
│                                                  │
│  ──────────────────────────────────────────────  │
│                                                  │
│  [avatar] João Silva  [Gestor direto]  há 4h     │
│           Concordo com o Roberto. Carol assumiu  │
│           dois projetos fora do escopo — vamos   │
│           formalizar isso no PDI.                │
│                                                  │
├──────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────┐    │
│  │ Escreva um comentário visível para…      │    │
│  │                                          │    │
│  └──────────────────────────────────────────┘    │
│  Visível para: Carolina · cadeia de gestão ·     │
│  Administrador · Diretores       [Publicar]      │
└──────────────────────────────────────────────────┘
```

Regras visuais:

- Só renderiza se `cycle.is_released === true` para o avaliado.
- Lista cronológica ascendente (mais antigo no topo, mais recente embaixo — padrão de thread).
- Cada comentário: avatar + nome + role badge (Administrador · Diretor · Gestor direto · Gestor) + timestamp relativo.
- Role badge "Gestor direto" quando `author.id === reviewee.manager_id`; "Gestor" para outros ancestors.
- Composer só aparece se `canCommentOnResult(actor, reviewee, ancestors)` retornar true.
- Edição/remoção (2h janela): cada comentário próprio ganha menu `···` com "Editar" e "Excluir" se `createdAt > now - 2h`.
- Empty state se lista vazia e pode comentar: "Seja o primeiro a comentar neste resultado."
- Empty state se lista vazia e não pode comentar: oculta a seção inteira (sem ruído visual).

### 9.3 Server actions

Arquivo: `src/features/reviews/actions/result-comments.ts` (novo).

```ts
export async function createResultComment({
  cycleId, revieweeEmployeeId, content
}: {...}): Promise<{ data?: ResultComment; error?: string; code?: string }> {
  // 1. Carrega actor (profile + rh_permissions + employeeId).
  // 2. Valida canCommentOnResult(actor, reviewee, ancestors).
  // 3. Valida ciclo está released pro avaliado (consulta answers released flag).
  // 4. Insert em review_result_comments.
  // 5. Notification in-app pro avaliado: "Novo comentário no seu resultado do Ciclo X por [autor]".
  // 6. logActivity('review_result_comment.created').
  // 7. revalidatePath de /avaliacoes/[cycleId]/resultados/[employeeId].
}

export async function updateResultComment({ id, content }) {
  // 1. Carrega comentário.
  // 2. Valida autor + dentro de 2h.
  // 3. Update content.
  // 4. logActivity('review_result_comment.updated').
  // 5. revalidatePath.
}

export async function deleteResultComment({ id }) {
  // 1. Carrega comentário.
  // 2. Valida (autor + 2h) OR admin_rh.
  // 3. Set deleted_at, deleted_by.
  // 4. logActivity('review_result_comment.deleted').
  // 5. revalidatePath.
}
```

### 9.4 Auditoria — novos ActivityAction

Arquivo: `src/lib/activity.ts`.

Adicionar ao type union:

```ts
| 'user.permissions_changed'
| 'review_result_comment.created'
| 'review_result_comment.updated'
| 'review_result_comment.deleted'
```

Labels em `ACTIVITY_LABELS`:

```ts
'user.permissions_changed': 'Permissões alteradas',
'review_result_comment.created': 'Comentário em resultado criado',
'review_result_comment.updated': 'Comentário em resultado editado',
'review_result_comment.deleted': 'Comentário em resultado removido',
```

---

## 10. Migração de dados

### 10.1 Conversão automática silenciosa (P9 · A)

A migration em §5.1 é **puramente aditiva**:

- Nenhum `UPDATE` em `profiles` existentes — todos continuam com seus roles atuais (`admin_rh`, `director`, `user`).
- `rh_permissions` começa vazia (nenhum usuário existente é `rh`).
- `review_result_comments` começa vazia.
- CHECK constraint é expandido, não restringido → zero risco de violação em dados existentes.

### 10.2 Notificações retroativas

Após migration aplicada, rodar seed de notificações para directors ativos (P9 · toast informativo). Pode ser:

- Script manual rodado uma vez via `scripts/ft8-notify-directors.ts`:
  ```ts
  INSERT INTO notifications (profile_id, type, title, body, created_at)
  SELECT id,
         'system.feature_announcement',
         'Novas ações disponíveis',
         'Você agora pode enviar feedback contínuo...',
         now()
  FROM profiles
  WHERE role = 'director';
  ```

- Ou incluído no final da migration SQL (se o tipo `system.feature_announcement` já existir em `notifications`).

### 10.3 Director ganhando ações (P4)

- Sem necessidade de backfill — a partir da migration aplicada, as policies de `candidate_feedbacks`, `pdi_comments`, `review_result_comments` passam a aceitar director, e os hooks do app expõem os CTAs.
- Directors não precisam fazer nada para "ativar" — é transparente no próximo login.

---

## 11. Rollout

### 11.1 Ordem recomendada

1. **Deploy da migration SQL** no Supabase: cria types, tabelas, policies, triggers, helpers. Aditiva, não derruba nada.
2. **Deploy do código Next.js**: novos componentes, actions, layout do `ResultDetail`, ajustes em `permissions.ts` por módulo.
3. **Script de notificação de directors** (§10.2).
4. **Smoke test em produção** (§11.2).

### 11.2 Smoke test checklist (rodar em ambiente de staging antes de prod)

- [ ] Login como `admin_rh` existente: não perde nenhum acesso, convite funciona, ve "Administrador" na UI no lugar de "Admin RH".
- [ ] Login como `director`: vê toast de "Novas ações disponíveis"; envia feedback contínuo; comenta em PDI de alguém fora da árvore; dá feedback em candidato; comenta em resultado de ciclo liberado.
- [ ] Login como `user` comum: sem mudanças visíveis.
- [ ] Admin cria novo usuário `rh` com `can_employees=true, can_reviews=true`: novo RH consegue CRUD de colaborador + criar ciclo; não consegue criar vaga (can_recruitment=false).
- [ ] RH com `can_invites=true` convida um Colaborador: funciona; tenta convidar como Administrador: card desabilitado.
- [ ] Admin promove RH para Administrador: modal de confirmação aparece.
- [ ] Admin rebaixa RH para Colaborador: `rh_permissions` apagada automaticamente (trigger).
- [ ] Admin promove Colaborador para RH e volta para Colaborador e novamente para RH: toggles começam `false` em cada entrada (não "lembra").
- [ ] Gestor (não-diretor, não-RH) comenta em resultado liberado de um subordinado direto: OK.
- [ ] Gestor tenta comentar em resultado de alguém fora da árvore: composer não aparece.
- [ ] Avaliado vê resultado liberado com 2 comentários da liderança: OK.
- [ ] Avaliado tenta comentar: composer não aparece.
- [ ] Autor edita o próprio comentário 1h após criação: OK.
- [ ] Autor tenta editar 3h após criação: bloqueado.

### 11.3 Rollback plan

Se precisar reverter (catástrofe):

1. `DROP POLICY` nas policies adicionadas/modificadas, recriar as antigas via cópia das migrations anteriores.
2. `DROP TABLE review_result_comments, rh_permissions;` (cascade seguro, ninguém referencia).
3. `ALTER TABLE profiles DROP CONSTRAINT, ADD CONSTRAINT ... CHECK (role IN ('admin_rh','director','user'));` — seguro porque migration aditiva, nenhum `rh` existe ainda em prod real.
4. Revert do código Next.js (git revert do merge).

Janela de rollback seguro: **enquanto nenhum `rh` foi criado em prod**. Após o primeiro admin criar um RH, rollback requer rebaixar o(s) RH(s) para `user` antes do DROP CONSTRAINT.

---

## 12. Arquivos tocados

### Novos

- `supabase/migrations/20260815_0001_ft8_granularidade_rh.sql`
- `src/features/permissions/` (nova feature)
  - `permissions/schema.ts` — Zod schema de `RhPermissions`, `RoleEnum` estendido
  - `permissions/actions.ts` — `updateUserAccess`, `inviteUser` (ou integra ao de convite existente)
  - `permissions/queries.ts` — `getRhPermissions(profileId)`, `listUsersWithAccess()`
  - `permissions/components/AccessForm.tsx`
  - `permissions/components/RoleCards.tsx`
  - `permissions/components/PermissionsToggles.tsx`
  - `permissions/components/AccessSheet.tsx`
- `src/features/reviews/components/ResultCommentsSection.tsx`
- `src/features/reviews/actions/result-comments.ts`
- `src/features/reviews/queries/result-comments.ts`
- `src/lib/auth/permissions.ts` — `hasAdminPower` helper
- `scripts/ft8-notify-directors.ts` (opcional, se usar script em vez de SQL)

### Modificados

- `src/lib/supabase/types.ts` — tipos `rh_permissions` e `review_result_comments`.
- `src/lib/activity.ts` — novos ActivityAction + labels.
- `src/features/employees/schema.ts` — `RoleEnum` inclui `'rh'`.
- `src/features/employees/components/EmployeesList.tsx` — coluna + filtro "Acesso".
- `src/features/employees/components/EmployeeProfile.tsx` — botão "Gerenciar acesso" no header.
- `src/features/employees/queries.ts` — listEmployees traz role do profile.
- `src/features/reviews/components/ResultDetail.tsx` — remove botão Criar PDI do aside, renomeia "Comentários" para "Observações dos avaliadores", adiciona `<ResultCommentsSection>`.
- `src/features/*/permissions.ts` (todos os módulos) — substituir checks `role === 'admin_rh'` por `hasAdminPower(actor, 'can_X')`.
- `src/features/*/permissions.test.ts` — atualizar mocks de Actor com `rhPermissions`.
- `src/app/(app)/colaboradores/[id]/page.tsx` — carrega rhPermissions se role='rh'.
- Labels PT-BR de role: procurar "Admin RH" / "admin_rh" nos arquivos `.tsx` (exceto lógica) e substituir label por "Administrador". Lista de arquivos com labels a atualizar:
  - `src/features/employees/components/EmployeesList.tsx`
  - `src/features/employees/components/EmployeeSheet.tsx`
  - `src/features/employees/components/EmployeeProfile.tsx`
  - Qualquer i18n/constant map existente.

### RLS policies a reescrever (9 migrations tocadas)

Não são reescritas na migration do FT-8 (pra não conflitar com histórico). A migration do FT-8 faz `DROP POLICY ... ON ...; CREATE POLICY ...` para cada uma das policies afetadas listadas em §6.2 + §6.3. Total estimado: ~15 `DROP+CREATE` pairs.

---

## 13. Checklist de implementação

### Backend (migration + RLS)

- [ ] Migration `20260815_0001_ft8_granularidade_rh.sql` escrita e aplicada em staging.
- [ ] Helper `has_rh_permission(text)` criado.
- [ ] Triggers `enforce_rh_permissions_role` e `sync_rh_permissions_on_role_change` criados.
- [ ] 15 policies reescritas cobrindo todos os toggles.
- [ ] Policies de `director` atualizadas (pdi_comments, candidate_feedbacks).
- [ ] Policies de `review_result_comments` criadas (select/insert/update/soft-delete).

### Tipos e permissions

- [ ] `rh_permissions` e `review_result_comments` em `types.ts`.
- [ ] `RoleEnum` em `employees/schema.ts` inclui `'rh'`.
- [ ] `hasAdminPower` em `src/lib/auth/permissions.ts`.
- [ ] Loader de Actor popula `rhPermissions` quando role='rh'.
- [ ] Todas as `can*` em `permissions.ts` de cada módulo atualizadas.
- [ ] `canCommentOnResult`, `canViewResultComments` em `reviews/permissions.ts`.
- [ ] `canInviteAs`, `canChangeUserRole` em `permissions/permissions.ts`.

### UI

- [ ] `AccessForm` + `RoleCards` + `PermissionsToggles` + `AccessSheet`.
- [ ] Coluna e filtro "Acesso" em `EmployeesList`.
- [ ] Botão "Gerenciar acesso" em `EmployeeProfile`.
- [ ] Label "Administrador" em todos os lugares que hoje mostram "Admin RH".
- [ ] `ResultDetail`: remover botão Criar PDI do aside, renomear seção, integrar `ResultCommentsSection`.
- [ ] `ResultCommentsSection` implementado com composer + lista + menu de edição.
- [ ] Modal de confirmação pra escalada a Administrador.
- [ ] Aviso pra RH sem toggle.

### Testes

- [ ] Testes de `hasAdminPower` com cada toggle e cada role.
- [ ] Testes de `canInviteAs` para os 4 roles + matriz de escalação.
- [ ] Testes de `canCommentOnResult` cobrindo: admin, director, ancestor direto, ancestor skip-level, o próprio avaliado, user fora da árvore.
- [ ] Testes de janela de 2h em `updateResultComment`.
- [ ] Testes E2E (ou integração): cria RH com toggles, RH tenta ação permitida (OK) e ação bloqueada (403).

### Rollout

- [ ] Smoke test em staging (§11.2).
- [ ] Deploy migration em prod.
- [ ] Deploy código em prod.
- [ ] Script/SQL de notificação de directors rodado.
- [ ] Monitoramento por 24h — atento a erros novos em `permissions.ts` e RLS.

---

## 14. Notas finais

- **Fora de escopo mas vale registrar:** durante o brainstorm, discutimos que recorte por departamento (direção "filtrada") é a próxima dor mais provável. Pode virar FT-9 se o cliente pedir.
- **`rh_permissions` tem apenas 6 colunas pela intencionalidade do P2 · B:** cobrir 90% dos casos com UX limpa. Se cliente pedir granularidade maior depois, cada toggle pode virar sub-grupo (progressive disclosure) sem mudar o schema — basta adicionar colunas novas na tabela.
- **Comentários da liderança podem virar feature standalone:** a tabela `review_result_comments` já está projetada pra receber `@mentions`, threads ou reações no futuro sem migration adicional (campos suficientes).

---

**Fim da spec. Gate de revisão:** revise este arquivo e me diga **"Revisado, seguir para implementação"** ou **"Ajustar X"**.
