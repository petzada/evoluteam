# FT-9 — Redesign do modelo de acesso: 3 roles + permissões por tela

Substitui o modelo FT-8 (4 roles × 6 toggles) por **3 roles + granularidade máxima por tela** como resposta às inconsistências identificadas em `docs/dev/20-ft-8-auditoria-acessos.md` e ao brainstorm de 2026-04-21.

---

## 1. Modelo final

### 1.1 Roles (3)

| Role no banco | Label UI | Quem cria | Escopo semântico |
|---|---|---|---|
| `admin_rh` | **Administrador** | Somente via painel Supabase (criação manual pelo dono do SaaS) | Tudo, inclusive editar Empresa, gerenciar acessos e escalar roles |
| `director` | **Diretor** | Admin (via app, sheet de Novo Colaborador) | Vê tudo em leitura; comenta em feedbacks, PDIs e resultados de ciclo; **não edita** |
| `user` | **Colaborador** | Admin OU Colaborador com toggle `Editar · Colaboradores` | Baseline pessoal + árvore descendente se gestor + toggles opcionais |

**Role `rh` é removido.** Usuários atuais com `role='rh'` viram `user` com toggles correspondentes populados (ver §5 Migração).

### 1.2 Supervisor é derivado, não role

"Supervisor" / "Gestor" = qualquer Colaborador que é `manager_id` de pelo menos 1 outro employee. A relação hierárquica dá visibilidade automática da árvore descendente, sem necessidade de toggle. UI mostra badge "Gestor" no perfil.

### 1.3 Permissões por tela (granularidade máxima)

Cada tela da sidebar tem 2 toggles independentes: `view` e `edit`. Total ~25 toggles por Colaborador.

| Seção | Tela | View | Edit |
|---|---|---|---|
| Geral | Dashboard | sim | — |
| Geral | Colaboradores | sim | sim |
| Geral | Avaliações | sim | sim |
| Geral | Feedbacks | sim | sim |
| Geral | PDI | sim | sim |
| Recrutamento | Vagas | sim | sim |
| Recrutamento | Candidatos | sim | sim |
| Recrutamento | Etapas | sim | sim |
| Recrutamento | Relatórios | sim | — |
| Configurações | Empresa | sim | sim |
| Configurações | Cargos | sim | sim |
| Configurações | Departamentos | sim | sim |
| Configurações | Competências | sim | sim |
| Configurações | Auditoria | sim | — |

**Regra transversal:** marcar `Edit` auto-marca `View`. `Edit` sem `View` é impossível (não salva esse estado).

### 1.4 Baseline (Colaborador sem nenhum toggle marcado)

Contexto próprio sempre visível, independente de toggles:

- **Próprio perfil** acessível via avatar (sem item na sidebar — só página).
- **Dashboard pessoal** (sempre na sidebar).
- **Avaliações** na sidebar se tiver ciclo aberto em que é participante ou reviewer.
- **Feedbacks** na sidebar — vê enviados e recebidos.
- **PDI** na sidebar — vê os próprios.
- **Recrutamento** na sidebar se for `hiring_manager` de pelo menos 1 vaga ativa — vê só as vagas próprias, move candidatos apenas delas, submete scorecards apenas delas.

Se gestor direto (`manager_id` de alguém), baseline amplifica:
- Sidebar ganha **Colaboradores** mostrando só a árvore descendente.
- **PDI** amplia pra PDIs dos liderados.
- **Feedbacks** amplia pra feedbacks marcados `visivel_para_gestor` dos liderados.
- **Avaliações** amplia pra ver resultados liberados dos liderados (+ comentar, se ciclo released).

### 1.5 Toggles aplicados (amplificação)

Cada toggle `view` concede **escopo global** (toda a empresa) da respectiva tela. Cada `edit` concede escrita correspondente.

Exemplos:
- Colaborador com `colaboradores.view=true`: sidebar mostra lista inteira da empresa (não só a árvore). Sem `edit`, só leitura.
- Colaborador com `colaboradores.edit=true`: cria, edita e **convida** outros Colaboradores. **Não pode escalar roles** (só Admin cria Diretor/Admin).
- Colaborador com `avaliacoes.edit=true`: cria, publica e arquiva ciclos; libera resultados.
- Colaborador com `pdi.edit=true`: cria/edita PDI de qualquer colaborador; modera feedbacks globais (deleta).
- Colaborador com `recrutamento/etapas.edit=true`: configura o funil da empresa.
- Colaborador com `empresa.edit=true`: edita dados da empresa.
- Colaborador com `auditoria.view=true`: lê activity_logs + vê dados da Empresa em leitura.

### 1.6 Quem concede o quê (escalação)

| Ator | Pode convidar como | Pode editar role/toggles de |
|---|---|---|
| `admin_rh` (Administrador) | Colaborador, Diretor | Qualquer usuário (exceto a si mesmo) |
| `user` com `colaboradores.edit=true` | Colaborador apenas | Colaborador apenas; **não pode escalar** pra Diretor nem Admin, **não pode escalar toggles** além dos dele próprios |
| demais | ninguém | ninguém |

**Regra de segurança (escalação restrita):** um Colaborador com toggles só consegue conceder toggles **iguais ou subconjuntos dos próprios** a outro Colaborador. Não pode "dar poder que ele mesmo não tem". Admin é o único com escalação livre.

### 1.7 UI do drawer "Gerenciar acesso"

Comportamento depende do Role selecionado:

- **Papel: Administrador** → drawer mostra só o Select de Papel + descritivo do pacote. Sem toggles.
- **Papel: Diretor** → idem, sem toggles.
- **Papel: Colaborador** → Select de Papel + ~25 toggles (agrupados por seção: Geral, Recrutamento, Configurações).

Mudar o Role no drawer esconde/mostra os toggles dinamicamente. Toggles persistem no estado do form se usuário trocar pra Admin/Diretor e voltar pra Colaborador (UX).

---

## 2. Schema

### 2.1 Tabela nova `user_screen_permissions`

Substitui `rh_permissions`. Uma linha por `user` com toggles marcados.

```sql
CREATE TABLE user_screen_permissions (
  profile_id            uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  company_id            uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  permissions           jsonb NOT NULL DEFAULT '{}',  -- { "colaboradores.view": true, "pdi.edit": true, ... }
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX usp_company_idx ON user_screen_permissions (company_id);
```

**Por que jsonb em vez de 28 colunas bool:**
- Adicionar tela nova = sem migration de schema.
- Leitura do JSON inteiro é ~1 query, sem overhead.
- Validação de shape via trigger + tipo TypeScript.

### 2.2 CHECK constraint de shape

```sql
CREATE OR REPLACE FUNCTION validate_screen_permissions(p jsonb)
RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE
  valid_keys text[] := ARRAY[
    'dashboard.view',
    'colaboradores.view', 'colaboradores.edit',
    'avaliacoes.view', 'avaliacoes.edit',
    'feedbacks.view', 'feedbacks.edit',
    'pdi.view', 'pdi.edit',
    'recrutamento_vagas.view', 'recrutamento_vagas.edit',
    'recrutamento_candidatos.view', 'recrutamento_candidatos.edit',
    'recrutamento_etapas.view', 'recrutamento_etapas.edit',
    'recrutamento_relatorios.view',
    'empresa.view', 'empresa.edit',
    'cargos.view', 'cargos.edit',
    'departamentos.view', 'departamentos.edit',
    'competencias.view', 'competencias.edit',
    'auditoria.view'
  ];
BEGIN
  -- todas as chaves devem pertencer ao conjunto; todos os valores devem ser booleanos
  RETURN (
    SELECT bool_and(k = ANY(valid_keys) AND jsonb_typeof(v) = 'boolean')
    FROM jsonb_each(p) AS kv(k, v)
  );
END $$;

ALTER TABLE user_screen_permissions
  ADD CONSTRAINT usp_permissions_shape CHECK (validate_screen_permissions(permissions));
```

### 2.3 Helper SQL

```sql
CREATE OR REPLACE FUNCTION public.has_screen_permission(screen text, action text)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT COALESCE((
    SELECT (permissions -> (screen || '.' || action))::boolean
    FROM user_screen_permissions
    WHERE profile_id = auth.uid()
  ), false)
$$;
```

Uso em RLS: `USING (public.my_role() = 'admin_rh' OR public.has_screen_permission('colaboradores', 'edit'))`.

### 2.4 Profile role CHECK

```sql
ALTER TABLE profiles
  DROP CONSTRAINT profiles_role_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin_rh', 'director', 'user'));
```

---

## 3. RLS — mudanças em policies existentes

Todas as policies que hoje checam `rh_permissions` ou `role='rh'` são reescritas pra usar `has_screen_permission`.

Exemplo `employees_write_admin`:

```sql
DROP POLICY employees_write_admin ON employees;

CREATE POLICY employees_write_admin ON employees
  FOR ALL USING (
    company_id = public.my_company_id()
    AND (
      public.my_role() = 'admin_rh'
      OR public.has_screen_permission('colaboradores', 'edit')
    )
  )
  WITH CHECK (same as above);
```

Lista de policies a reescrever (mapeamento toggle → tabela):

| Toggle | Tabelas/Policies afetadas |
|---|---|
| `colaboradores.edit` | employees (write), invites (insert, select) |
| `colaboradores.view` | employees (select global) — mas baseline já dá próprio+árvore |
| `avaliacoes.edit` | review_cycles (write), review_assignments (write), cycle_form_* (write) |
| `pdi.edit` | development_plans (write global), development_plan_actions (write), development_plan_comments (write) |
| `feedbacks.edit` | feedbacks (delete), policy de visibilidade `visivel_para_rh` |
| `recrutamento_vagas.edit` | job_openings (write) |
| `recrutamento_candidatos.edit` | candidates (write), job_applications (write) |
| `recrutamento_etapas.edit` | recruitment_stages (write) |
| `empresa.edit` | companies (update) |
| `cargos.edit` | positions (write) |
| `departamentos.edit` | departments (write) |
| `competencias.edit` | competencies (write) |
| `auditoria.view` | activity_logs (select), companies (select extra-baseline) |

Policies de SELECT globais passam a precisar branch `admin_rh OR has_screen_permission(...view)`.

---

## 4. App layer

### 4.1 Remove

- `src/features/permissions/types.ts` → `RhPermissions` vira `ScreenPermissions`. `RH_PERMISSION_MODULES` vira `SCREEN_PERMISSION_MODULES` com ~14 entradas.
- Role `'rh'` em todos os tipos (`Role` = `'admin_rh' | 'director' | 'user'`).
- `hasAdminPower(actor, area)` com 6 keys → `canDo(actor, screen, action)` com ~25 combinações.
- Componente `PermissionsToggles` refatorado pra agrupar por seção e mostrar coluna View/Edit.

### 4.2 Novo helper `canDo`

```ts
export function canDo(
  actor: Actor,
  screen: ScreenKey,
  action: 'view' | 'edit',
): boolean {
  if (actor.role === 'admin_rh') return true;
  if (actor.role === 'director' && action === 'view') return true;
  if (actor.role === 'user') {
    return actor.screenPermissions?.[`${screen}.${action}`] === true;
  }
  return false;
}
```

### 4.3 Baseline implícito no app

Cada `canView*` tem 3 branches:
1. `canDo(actor, screen, 'view')` — toggle global.
2. `actor.employeeId === target.id` — próprio.
3. `descendantsOf(actor).includes(target)` — árvore (se gestor).

Exemplo `canViewEmployee(actor, target)`:
```ts
if (canDo(actor, 'colaboradores', 'view')) return true;
if (actor.employeeId === target.id) return true;
if (descendantsOfActor.includes(target.employeeId)) return true;
return false;
```

### 4.4 Sidebar dinâmica

Item da sidebar aparece se:
- Admin/Diretor: sempre (com exceções — Configurações só Admin).
- Colaborador: aparece se `canView*` OU se tem conteúdo próprio/hierárquico visível por baseline.

Mapeamento:

```ts
const SIDEBAR_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', show: (a) => true }, // sempre (próprio)
  { href: '/colaboradores', label: 'Colaboradores',
    show: (a) => canDo(a, 'colaboradores', 'view') || isManager(a) },
  { href: '/avaliacoes', label: 'Avaliações',
    show: (a) => canDo(a, 'avaliacoes', 'view') || hasActiveCycle(a) },
  // ...
];
```

### 4.5 Sheet de Novo Colaborador

- Campo "Papel": dropdown com 2 opções (Colaborador, Diretor) se actor é Admin; **apenas Colaborador** se actor tem `colaboradores.edit` sem ser Admin.
- Se Papel = Colaborador, mostra **os 25 toggles** agrupados por seção.
- Se Papel = Diretor, mostra descritivo "Diretor vê tudo em leitura...".
- Regra de escalação: se actor tem `colaboradores.edit` (não Admin), ele só concede toggles que ele próprio tem marcados. Admin tem tudo por default.

### 4.6 Drawer "Gerenciar acesso"

- Header: Select de Papel (Administrador, Diretor, Colaborador).
- Se Colaborador: ~25 toggles agrupados por seção (Geral, Recrutamento, Configurações). Layout de tabela com colunas "Ver" e "Editar".
- Se Administrador/Diretor: descritivo do pacote.
- Ator com `colaboradores.edit` (não Admin) não consegue abrir drawer de Admin/Diretor (botão desabilitado).

### 4.7 Onboarding (já implementado na FT-8)

Admin escolhe próprio cargo (input livre) no Step 2. `positions` nasce com 1 linha, Admin default com tudo.

---

## 5. Migração de tenants atuais

A migration é **aditiva** e converte automaticamente:

```sql
-- 1. Cria tabela nova e popula
INSERT INTO user_screen_permissions (profile_id, company_id, permissions)
SELECT
  p.id,
  p.company_id,
  jsonb_build_object(
    'colaboradores.view', rp.can_employees,
    'colaboradores.edit', rp.can_employees,
    'cargos.view', rp.can_employees,
    'cargos.edit', rp.can_employees,
    'departamentos.view', rp.can_employees,
    'departamentos.edit', rp.can_employees,
    'competencias.view', rp.can_employees,
    'competencias.edit', rp.can_employees,
    'avaliacoes.view', rp.can_reviews,
    'avaliacoes.edit', rp.can_reviews,
    'pdi.view', rp.can_pdi_feedback,
    'pdi.edit', rp.can_pdi_feedback,
    'feedbacks.view', rp.can_pdi_feedback,
    'feedbacks.edit', rp.can_pdi_feedback,
    'recrutamento_vagas.view', rp.can_recruitment,
    'recrutamento_vagas.edit', rp.can_recruitment,
    'recrutamento_candidatos.view', rp.can_recruitment,
    'recrutamento_candidatos.edit', rp.can_recruitment,
    'recrutamento_etapas.view', rp.can_recruitment,
    'recrutamento_etapas.edit', rp.can_recruitment,
    'recrutamento_relatorios.view', rp.can_recruitment,
    'empresa.view', rp.can_audit,
    'auditoria.view', rp.can_audit
  )
FROM profiles p
JOIN rh_permissions rp ON rp.profile_id = p.id
WHERE p.role = 'rh';

-- 2. Converte role='rh' para 'user'
UPDATE profiles SET role = 'user' WHERE role = 'rh';

-- 3. Drop da tabela antiga após verificação
DROP TABLE rh_permissions CASCADE;  -- só após confirmar migração

-- 4. Atualiza CHECK
ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin_rh', 'director', 'user'));

-- 5. Drop tabela invites.rh_permissions (coluna jsonb)
ALTER TABLE invites DROP COLUMN IF EXISTS rh_permissions;
ALTER TABLE invites ADD COLUMN screen_permissions jsonb;
```

`can_invites=true` não tem equivalente — vira `colaboradores.edit=true` (que já inclui convite). `can_audit=true` mapeia pra `auditoria.view` + `empresa.view`.

---

## 6. Bugs da FT-8 que somem

| Bug | Como some |
|---|---|
| #1 Editar sheet não salva Acesso | Sheet de colaborador não tem campo Acesso. Só drawer faz isso. |
| #2 RH sem gestor não cria PDI próprio | Baseline: próprio PDI é sempre criado (sem exigência de manager_id pra self). |
| #3 RH com toggle convida Admin/Diretor | Sheet só habilita Colaborador pra não-Admin. Admin não existe como convite (só via Supabase). |
| #4 Órfão no banco | `createEmployee` valida escalação **antes** do INSERT. Colaborador com `colaboradores.edit` só pode dar toggles iguais/subconjunto dos próprios → regra simples de validar upfront. |
| Gap: `isAdmin` ambíguo | Sumiu. Único check especial é `role === 'admin_rh'`. |
| Gap: `canCommentOnResult` | Implementada via `canDo(actor, 'avaliacoes', 'view')` + regra do diretor/admin. |

---

## 7. Plano de implementação faseado

Não cabe em 1 commit. Recomendação: 4 fases.

### Fase 1 — Schema + types (1 sessão)
- Migration `20260822_0001_ft9_screen_permissions.sql`: cria tabela, helper SQL, migra dados, drop role `rh`.
- `src/lib/supabase/types.ts`: adiciona `user_screen_permissions`, remove `rh_permissions`, ajusta role enum.
- `src/features/permissions/types.ts`: `ScreenPermissions`, `SCREEN_PERMISSION_MODULES`, `canDo`.
- `src/features/permissions/actor.ts`: carrega `screen_permissions` em vez de `rh_permissions`.

### Fase 2 — RLS (1 sessão)
- Migration `20260822_0002_ft9_rls_screen_permissions.sql`: reescreve policies de SELECT/WRITE que hoje usam `rh_permissions`. ~15 pairs DROP+CREATE.

### Fase 3 — App layer (2 sessões)
- Substituir `hasAdminPower` por `canDo` em todos os módulos.
- Refatorar `permissions.ts` de cada feature.
- Substituir `isAdmin` prop por props semânticas (`canEdit`, `canView`) nos componentes.
- Baseline: garantir que `canView*` de cada módulo tem 3 branches (global/próprio/árvore).
- Sidebar dinâmica.

### Fase 4 — UI (1 sessão)
- `PermissionsToggles` refatorado com tabela View/Edit.
- Drawer "Gerenciar acesso" com 3 estados de UI (Admin/Diretor/Colaborador).
- Sheet de Novo Colaborador com toggles inline (só pra Colaborador) e Select com 2 opções (Colaborador, Diretor).
- Renomear `rh_permissions` pra `screen_permissions` em todos os lugares.

Após Fase 4, rodar smoke test completo (personas × actions) e declarar FT-8 fechada / FT-9 viva.

---

## 8. Próximas decisões (após aprovação desta spec)

Não bloqueantes, podem ir para fases:

1. Label "Papel" vs "Acesso" no drawer — hoje usamos "Acesso"; spec FT-8 usa "Papel". Manter uma convenção.
2. Badge visual de "Gestor" (derivado de `manager_id`) no perfil e nas listas.
3. Toast educativo no primeiro login pós-migração pra ex-RH: "Suas permissões foram convertidas; qualquer dúvida, contate seu Administrador".
4. Telemetria: log `activity_logs` cada mudança em `user_screen_permissions` com diff before/after.

---

## 9. Checklist de aprovação

- [ ] 3 roles (`admin_rh`, `director`, `user`), remove `rh`.
- [ ] Admin só via Supabase, Diretor/Colaborador via convite do app.
- [ ] ~25 toggles (14 telas × view/edit), regra "edit auto-marca view".
- [ ] Baseline implícito: próprio + árvore descendente automáticos.
- [ ] Supervisor derivado de `manager_id`.
- [ ] Admin/Diretor = pacotes fechados no drawer.
- [ ] Escalação restrita: Colaborador com `colaboradores.edit` só concede toggles subconjunto dos próprios.
- [ ] Schema: tabela `user_screen_permissions` com `permissions jsonb` + validator.
- [ ] Migração aditiva: RH existente vira Colaborador com toggles espelhados.
- [ ] 4 fases de implementação.

Revisado? Confirmar ou ajustar antes de começar Fase 1.
