# FT-9 — Ajustes de Alinhamento RBAC

Data: 2026-04-22
Status: Aprovado (aguarda plano de implementação)
Doc de referência: `permissoes.md`, `docs/dev/21-ft-9-redesign-acessos.md`

## Contexto

Auditoria do sistema de permissões (FT-9) em 2026-04-22 cruzou `permissoes.md` com a codebase e encontrou 2 bugs + 4 ambiguidades. Após brainstorming, 3 mudanças foram aprovadas (duas UI/canDo, uma de RLS). Dois pontos permanecem como estão (PDI e feedback privado) por decisão explícita.

## Decisões confirmadas sem alteração de código

### 1. PDI — criar apenas para subordinados diretos

`canCreatePdi` mantém o gate atual: gestor só cria PDI para colaborador com `manager_id === actor.employeeId`. Admin_rh e user com toggle `pdi.edit` criam para qualquer um da empresa.

**Racional:** clareza de responsabilidade na cadeia de gestão. Visualizar é árvore inteira (`canViewPdi`), criar é direto. Toggle é a válvula para casos excepcionais.

### 2. Feedback "somente pessoas envolvidas" = visibility `privado`

RLS de `feedbacks_select` continua sem expor feedbacks `privado` para ninguém além de sender + recipient. Admin_rh e director não veem.

### 3. Feedback deletado acessível para moderação

RLS `feedbacks_select` caminho 2 mantém: `admin_rh` ou quem tem `feedbacks.edit` lê feedbacks com `deleted_at IS NOT NULL`, inclusive `privado`. Função: moderação post-hoc em caso de abuso reportado.

## Mudança 1 — Director sem acesso a Configurações

**Problema:** hoje `canDo(director, X, 'view')` retorna `true` para todas as telas, incluindo Configurações (empresa, cargos, departamentos, competencias, auditoria). `permissoes.md` não menciona Configurações no escopo do director.

**Solução:** ajuste localizado em `src/features/permissions/permissions.ts`:

```typescript
const CONFIG_SCREENS: ScreenKey[] = [
  'empresa', 'cargos', 'departamentos', 'competencias', 'auditoria',
];

export function canDo(actor, screen, action) {
  if (!actor) return false;
  if (actor.role === 'admin_rh') return true;
  if (actor.role === 'director') {
    if (action === 'edit') return false;
    if (CONFIG_SCREENS.includes(screen)) return false;
    return true;
  }
  // ...user / demais inalterado
}
```

**Escopo da mudança:**
- Sidebar: `isItemVisible` usa `canDo(director, 'empresa', 'view') = false` → seção Configurações some automaticamente para director (se todos os 5 items retornarem false, `showConfigSection` é false).
- Páginas de configuração (`/configuracoes/empresa`, `/cargos`, `/departamentos`, `/competencias`, `/auditoria`): todas já têm `if (!canDo(..., 'view')) redirect(...)`. Passa a redirecionar director também. Zero mudança nas pages.

**O que NÃO muda:**
- RLS de SELECT em `companies`, `positions`, `departments`, `competencies`: director continua lendo porque essas tabelas alimentam dropdowns em toda a app (Dashboard, Colaboradores, Avaliações). A restrição é puramente de UI.
- RLS de `activity_logs` (auditoria) já nunca liberou director (`logs_admin_select` exige admin_rh/rh/toggle). Zero mudança.
- Director continua vendo `/configuracoes/perfil` (perfil próprio não tem gate de tela).

## Mudança 2 — Sidebar de Recrutamento para hiring_manager

**Problema:** user marcado como `hiring_manager` de uma vaga sem toggle `recrutamento_vagas.view` não vê links de Recrutamento na sidebar, apesar de `permissoes.md` linha 35 exigir esse acesso.

**Solução em duas partes:**

### 2a. Layout calcula flag

Em `src/app/(app)/layout.tsx`, além de `isManager`, calcular:

```typescript
let isHiringManager = false;
if (actorEmployee?.id) {
  const { count } = await supabase
    .from('job_openings')
    .select('id', { count: 'exact', head: true })
    .eq('hiring_manager_id', actorEmployee.id)
    .neq('status', 'closed');
  isHiringManager = (count ?? 0) > 0;
}
```

Passa `isHiringManager` como prop para `<Sidebar />`.

### 2b. Sidebar libera itens

`src/features/shell/components/Sidebar.tsx` recebe a prop e ajusta `isItemVisible`:

```typescript
const isItemVisible = (item: NavItem): boolean => {
  if (item.adminOnly) return isAdmin;
  if (item.screen === 'recrutamento_etapas') {
    return canDo(actorForGate, item.screen, 'view');
  }
  if (item.screen?.startsWith('recrutamento_')) {
    return canDo(actorForGate, item.screen, 'view') || isHiringManager;
  }
  if (item.screen) return canDo(actorForGate, item.screen, 'view');
  return true;
};
```

Telas liberadas por `isHiringManager`: `recrutamento_vagas`, `recrutamento_candidatos`, `recrutamento_relatorios`.
Tela **não** liberada (continua exigindo toggle): `recrutamento_etapas`.

### 2c. Validar escopo do Relatórios

`src/features/recruitment/queries/metrics.ts` — confirmar que `viewerRole='gestor'` escopa todas as queries (`getMetricsKpis`, `getFunnel`, etc.) por `hiring_manager_id === viewerEmployeeId`. Se houver query sem esse filtro, corrigir junto.

### 2d. Páginas já estão corretas

- `/recrutamento/vagas`: gate `canViewAllJobOpenings || canViewAssignedJobOpenings` — o segundo retorna true para user com employeeId.
- `/recrutamento/candidatos`: verificar que tem gate equivalente.
- `/recrutamento/relatorios`: `canAccessRecruitmentModule` já aceita user com employeeId.

## Mudança 3 — RLS SELECT de Recrutamento (Bug A)

**Problema:** `job_openings_select`, `candidates_select`, `job_applications_select`, `candidate_stage_history_select` só liberam admin_rh/director/hiring_manager. User com toggle `recrutamento_vagas.view=true` ou `recrutamento_candidatos.view=true` passa em `canDo` mas o Postgres retorna 0 linhas. A Fase 2 do FT-9 só cobriu INSERT/UPDATE/DELETE.

**Solução:** nova migration `supabase/migrations/20260822_0006_ft9_recruitment_select_rls.sql`:

```sql
DROP POLICY IF EXISTS job_openings_select ON public.job_openings;
CREATE POLICY job_openings_select ON public.job_openings FOR SELECT USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() IN ('admin_rh','director')
    OR hiring_manager_id = public.my_employee_id()
    OR public.has_screen_permission('recrutamento_vagas','view')
  )
);

DROP POLICY IF EXISTS candidates_select ON public.candidates;
CREATE POLICY candidates_select ON public.candidates FOR SELECT USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() IN ('admin_rh','director')
    OR EXISTS (
      SELECT 1 FROM public.job_applications ja
      JOIN public.job_openings jo ON ja.job_opening_id = jo.id
      WHERE ja.candidate_id = candidates.id
        AND jo.hiring_manager_id = public.my_employee_id()
    )
    OR public.has_screen_permission('recrutamento_candidatos','view')
  )
);

DROP POLICY IF EXISTS job_applications_select ON public.job_applications;
CREATE POLICY job_applications_select ON public.job_applications FOR SELECT USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() IN ('admin_rh','director')
    OR public.is_gestor_of_opening(public.my_employee_id(), job_opening_id)
    OR public.has_screen_permission('recrutamento_candidatos','view')
  )
);

DROP POLICY IF EXISTS candidate_stage_history_select ON public.candidate_stage_history;
CREATE POLICY candidate_stage_history_select ON public.candidate_stage_history FOR SELECT USING (
  application_id IN (
    SELECT id FROM public.job_applications
    WHERE company_id = public.my_company_id()
      AND (
        public.my_role() IN ('admin_rh','director')
        OR public.is_gestor_of_opening(public.my_employee_id(), job_opening_id)
        OR public.has_screen_permission('recrutamento_candidatos','view')
      )
  )
);
```

## Testes

### Automatizados

**`src/features/permissions/permissions.test.ts`**
- Adicionar matriz director × config screens: `canDo(director, 'empresa', 'view') === false`, idem para `cargos`, `departamentos`, `competencias`, `auditoria`.
- Manter casos existentes: director × outras telas (`dashboard`, `colaboradores`, `avaliacoes`, `feedbacks`, `pdi`, `recrutamento_*`) continuam `true`.

**`src/features/recruitment/permissions.test.ts`**
- Confirmar que matriz user-com-toggle continua passando.

### Manuais

1. Login como director:
   - Sidebar não mostra seção Configurações.
   - `/configuracoes/empresa`, `/cargos`, `/departamentos`, `/competencias`, `/auditoria` → redirect para `/dashboard`.
   - Dashboard, Colaboradores, Avaliações, Feedbacks, PDI, Recrutamento continuam acessíveis em read-only.

2. Login como user hiring_manager sem toggle:
   - Sidebar mostra Recrutamento > Vagas, Candidatos, Relatórios.
   - Sidebar **não** mostra Recrutamento > Etapas.
   - `/recrutamento/vagas` lista apenas vagas onde ele é hiring_manager.
   - `/recrutamento/relatorios` mostra KPIs/funnel restritos às vagas dele (hideManagerFilter ativo).

3. Login como user com toggle `recrutamento_vagas.view`:
   - `/recrutamento/vagas` lista **todas** as vagas da empresa (bug A resolvido).
   - `/recrutamento/candidatos` lista todos os candidatos (se `recrutamento_candidatos.view` também).

## Risco e migração

- **Director que hoje gerencia config**: ao aplicar Mudança 1, perde acesso. Mitigação: antes do deploy, rodar `SELECT id, full_name FROM profiles WHERE role='director'` e confirmar com o cliente se algum precisa virar admin_rh.
- **Migration recrutamento**: aditiva, não destrutiva. Aplicar com `supabase db push`.
- **Existing migration pendente**: `20260822_0005_ft9_empresa_rls.sql` ainda precisa ser aplicada no banco (pendência da auditoria de 2026-04-22). Incluir no mesmo push.

## Arquivos afetados

| Arquivo | Tipo | Mudança |
|---|---|---|
| `src/features/permissions/permissions.ts` | canDo | Restringir director em CONFIG_SCREENS |
| `src/features/permissions/permissions.test.ts` | teste | +5 casos director × config |
| `src/app/(app)/layout.tsx` | layout | Calcular `isHiringManager` |
| `src/features/shell/components/Sidebar.tsx` | sidebar | Prop + logic `isItemVisible` |
| `src/features/recruitment/queries/metrics.ts` | validação | Confirmar escopo gestor (auditar, corrigir se necessário) |
| `supabase/migrations/20260822_0006_ft9_recruitment_select_rls.sql` | RLS | Nova migration |

## Decisões fora de escopo

- Feedback privado visível para admin: rejeitado. Mantém privacidade forte.
- Director com acesso parcial a Configurações (auditoria-only): rejeitado. Regra única "director não entra em config".
- Admin escolher entre toggle e hiring_manager como fonte de verdade para sidebar: não aplicável — são caminhos aditivos, não concorrentes.
