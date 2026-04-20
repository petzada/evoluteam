# FT-1 — Colaboradores, Departamentos e Cargos

Spec completa da feature **operacional** do Evoluteam: expandir a base de `/colaboradores` (lançada em Fase 0) para cobrir o CRUD completo de colaboradores com perfil detalhado, filtros avançados, regras de hierarquia, e as telas de CRUD de departamentos e cargos.
Equivale ao **Sprint 2** de `docs/ESTRUTURA.md` §18.
Depende de Fase 0.
Última atualização: 2026-04-19.

> **Leia antes:** `docs/dev/00-decisoes-transversais.md` + `docs/dev/01-fase-0-fundacao.md`.

---

## 1. Objetivo

Transformar a base mínima de `/colaboradores` (entregue em Fase 0) em uma tela operacional completa de gestão de pessoas da empresa, e entregar as CRUDs de departamentos e cargos que ficaram como stubs.

## 2. Escopo

### O que Fase 0 já entregou (base)
- `/colaboradores` com listagem, busca, filtro básico de status/papel, cadastro via side sheet (com/sem convite), kebab com ações simples (editar, reenviar, revogar, desativar).
- `employees` table com `status IN ('active','inactive','terminated')`.

### O que FT-1 acrescenta

**Em `/colaboradores`:**
- Filtros de cargo, departamento e gestor direto (multi-select).
- Mais status derivados na UI: Ativo · Inativo · Desligado · Convite pendente · Convite expirado · Sem acesso.
- Checkbox "Mostrar desligados" (default off).
- Banner de métricas (ativos · pendentes · desligados ocultos).
- Colunas expandidas e toggleáveis via `⚙ Colunas`.
- Botão "⬇ Exportar" disabled com "Em breve" (MVP 1.5).

**Nova rota `/colaboradores/[id]`:**
- Perfil detalhado com header (avatar + pills) + 6 abas.
- Abas ativas em FT-1: **Dados, Acesso, Histórico**.
- Abas "em breve" (não clicáveis): **Avaliações** (FT-2), **Feedbacks** (FT-3), **PDI** (FT-4).
- Bloco lateral "Liderados diretos" (só aparece se a pessoa tem liderados).
- `internal_notes` visível apenas para `admin_rh`.

**CRUD de departamentos e cargos** (substitui os stubs):
- `/configuracoes/departamentos` — listagem, criar, editar, arquivar, deletar (se vazio), buscar, mostrar arquivados.
- `/configuracoes/cargos` — idem.

**Regras de hierarquia:**
- Validação: `manager_id != id`.
- Prevenção de ciclos (A → B → A) via CTE recursiva.
- Autocomplete de gestor exclui self + descendentes.

**Transições de status:**
- Modal de confirmação em **ativar / inativar / desligar**.
- Desativar ou desligar gestor → modal obriga transferir liderados para outro gestor OU aceitar `manager_id = NULL`.
- Desligar (`terminated`) força logout, cancela PDIs em andamento (nada acontece com PDIs em FT-1 porque PDI é FT-4 — a regra só entra em vigor quando FT-4 lança).

### Fora do MVP 1.0 (continua fora)
- Importação CSV.
- Organograma visual.
- Histórico completo de movimentações (troca de cargo, depto, gestor) como timeline dedicada.
- Integração com folha de pagamento.
- Múltiplos vínculos (ex: colaborador atua em 2 deptos).
- Exportação CSV (adia para MVP 1.5).
- Delegação temporária de gestor (ausências).

## 3. User stories

Baseadas em `features/FT-1.md §9.3` e refinamentos do brainstorm:

### Cadastro e edição
- Admins should be able to cadastrar colaboradores (via side sheet em `/colaboradores`).
- Admins should be able to editar dados de colaboradores (side sheet com modo edit).
- Admins should be able to adicionar observações internas (visíveis só para admin_rh).
- Admins should be able to definir o gestor direto via autocomplete (excluindo self + descendentes).

### Status
- Admins should be able to desativar colaboradores (status = `inactive`, mantém login).
- Admins should be able to reativar colaboradores (inactive → active).
- Admins should be able to desligar colaboradores (status = `terminated`, força logout, registra `terminated_at`).
- Admins should be able to transferir liderados quando desativar/desligar um gestor.

### Listagem
- Users with permission should be able to listar colaboradores da empresa.
- Users with permission should be able to buscar por nome ou e-mail.
- Users with permission should be able to filtrar por departamento, cargo, gestor direto e status.
- Users with permission should be able to alternar colunas visíveis (⚙ Colunas).
- Users with permission should be able to mostrar/esconder desligados.

### Perfil
- Users with permission should be able to visualizar o perfil completo de um colaborador em `/colaboradores/[id]`.
- Gestores should be able to visualizar o perfil dos seus liderados diretos e indiretos (skip-level read).
- Colaboradores should be able to visualizar apenas o próprio perfil.
- Admin_rh should be able to visualizar observações internas no perfil.

### Departamentos
- Admins should be able to criar departamentos.
- Admins should be able to editar nome de departamentos.
- Admins should be able to arquivar departamentos (`is_archived = true`).
- Admins should be able to desarquivar departamentos.
- Admins should be able to deletar permanentemente departamentos vazios (0 employees vinculados).
- Users with permission should be able to ver contagem de colaboradores por departamento.

### Cargos
- Admins should be able to criar, editar, arquivar, desarquivar, deletar (quando vazio) cargos.
- Users with permission should be able to ver contagem de colaboradores por cargo.

## 4. Rotas

**Adicionadas/promovidas a CRUD completo em FT-1:**

```
/colaboradores/[id]                    (todos os roles; admin_rh vê internal_notes)
/configuracoes/departamentos           (admin_rh, CRUD completo — substitui stub)
/configuracoes/cargos                  (admin_rh, CRUD completo — substitui stub)
```

**Já existentes em Fase 0 (com expansão):**
```
/colaboradores                         (filtros avançados, banner, ⚙ Colunas)
/colaboradores/novo                    (mesma deep link; side sheet agora suporta internal_notes)
```

## 5. Schema — migrations de FT-1

```sql
-- 20260426_0001_ft1_employee_fields.sql

-- Observações internas, visíveis apenas para admin_rh (filtro na camada de queries)
ALTER TABLE employees
  ADD COLUMN internal_notes text,
  ADD COLUMN terminated_at  timestamptz;

-- terminated_at preenchido automaticamente na transição para status = 'terminated'
-- (via trigger ou Server Action — veja §7)
```

```sql
-- 20260426_0002_ft1_helper_descendants.sql

CREATE OR REPLACE FUNCTION get_employee_descendants(root_id uuid)
RETURNS SETOF uuid
LANGUAGE sql STABLE AS $$
  WITH RECURSIVE descendants AS (
    SELECT id FROM employees WHERE manager_id = root_id AND company_id = auth.company_id()
    UNION ALL
    SELECT e.id
    FROM employees e
    INNER JOIN descendants d ON e.manager_id = d.id
    WHERE e.company_id = auth.company_id()
  )
  SELECT id FROM descendants
$$;
```

### Índices adicionais (se ainda não presentes)
```sql
-- Já existem em Fase 0:
--   idx_employees_manager ON employees(manager_id)
--   idx_employees_company ON employees(company_id)
-- Nada a adicionar.
```

### RLS — nenhuma policy nova
`internal_notes` não precisa de policy específica. A filtragem acontece na **camada de queries** do app:

```typescript
// src/features/employees/queries.ts
export async function getEmployee(id: string) {
  const supabase = createServerClient();
  const { data: session } = await getCurrentSession();
  const baseColumns = 'id, full_name, email, phone, position_id, department_id, manager_id, hire_date, status, terminated_at';
  const columns = session.role === 'admin_rh'
    ? `${baseColumns}, internal_notes`
    : baseColumns;
  return supabase.from('employees').select(columns).eq('id', id).single();
}
```

## 6. Componentes principais — UI detalhada

### 6.1. `/colaboradores` (evolução da base)

**Header:**
- Título "Colaboradores" + subtitle "Ficha de RH + gerenciamento de acesso ao sistema."
- Botões à direita: **"⬇ Exportar"** (disabled com tooltip "Em breve"), **"+ Novo colaborador"** (abre side sheet).

**Filtros** (em ordem):
1. Input busca (nome/e-mail).
2. Select **Status** — opções: Todos · Ativos · Inativos · Desligados · Convite pendente · Convite expirado · Sem acesso.
3. Select **Cargo** — multi-select com as opções de `positions` não arquivadas.
4. Select **Departamento** — multi-select com `departments` não arquivados. Linka `/colaboradores?department=X`.
5. Select **Gestor** — autocomplete de employees ativos.
6. Botão **⚙ Colunas** — popover com checkboxes das colunas toggleáveis.

**Banner de métricas** (acima da tabela):
> `{ativos} colaboradores · {pendentes} convites pendentes · {desligados} desligado(s) oculto(s)`  ← checkbox "Mostrar desligados" ao lado.

**Tabela (TanStack):**
- Colunas **default**: Nome/E-mail, Cargo (com micro-pill de papel se não for `user`), Departamento, Gestor direto, Status.
- Colunas **toggleáveis ocultas por default**: E-mail (separado), Papel (coluna dedicada), Admissão, Telefone.
- Linha do próprio user logado: tag "(você)"; kebab com ações restritas (sem desativar/desligar).
- Clicar em linha → `/colaboradores/[id]`.

**Kebab (⋯) por linha:**
- Ver perfil (abre `/colaboradores/[id]`).
- Editar (abre side sheet em modo edit).
- Reenviar convite (se pendente/expirado/sem acesso).
- Revogar convite (se pendente).
- Desativar (se ativo, abre modal).
- Reativar (se inativo).
- Desligar (se ativo/inativo, modal de confirmação permanente).

### 6.2. `/colaboradores/[id]` — perfil detalhado

**Header fixo:**
- Avatar circular (foto ou iniciais) 56px.
- Breadcrumb: `Colaboradores › {nome}`.
- Nome em `font-size: 18px; font-weight: 700`.
- Linha de pills com: **Cargo · Departamento · Status · Papel** (separadas por ponto-médio).
- Botões: **Editar** (side sheet modo edit), **⋯** (kebab com mesmas ações da listagem).

**Tabs (6 no total):**
```
[Dados] [Acesso] [Histórico] [Avaliações em breve] [Feedbacks em breve] [PDI em breve]
```
- Abas "em breve": cinza, não clicáveis, tooltip "Disponível quando FT-X for implementada".

#### Aba **Dados** (FT-1, default)
Layout em 2 colunas (2fr / 1fr):

**Coluna esquerda — Ficha RH:**
```
Nome completo:     Ana Rocha
E-mail:            ana@acme.com.br
Telefone:          (11) 98765-4321
Cargo:             Coordenador
Departamento:      RH
Gestor direto:     Marcio Silva (Administrativo/RH)  (ou "—" se topo)
Data de admissão:  03/01/2024
Status:            ● Ativa  (ou outro)
```

E **abaixo**, bloco OBSERVAÇÕES INTERNAS (só renderiza se `auth.role_name() = 'admin_rh'`):
```
OBSERVAÇÕES INTERNAS — visível só para RH
┌──────────────────────────────────────────┐
│ texto da internal_notes                  │
└──────────────────────────────────────────┘
```

**Coluna direita — Sidebar:**
- Bloco **"Liderados diretos ({N})"** — só aparece se N > 0. Lista com nome + cargo, clicável para o perfil de cada um.
- Bloco **"Acesso ao sistema":**
  - Papel: `user` / `admin_rh` / `director`
  - Último login: datetime
  - Convite: ✓ Aceito em DD/MM/YYYY (ou pendente/expirado/revogado com botão "Reenviar")

#### Aba **Acesso** (FT-1)
- Info atual: Papel, último login, e-mail (read-only).
- Histórico de logins (últimos 10 via Supabase Auth; se não disponível, só mostra "Último login").
- Troca de papel (dropdown + confirmação).
- Ações: Reenviar convite (se pendente/expirado), Revogar acesso.

#### Aba **Histórico** (FT-1)
- Lista cronológica de `activity_logs` filtrada por `entity_type = 'employee' AND entity_id = [id]`.
- Eventos registrados no MVP: `employee.created`, `employee.updated`, `employee.deactivated`, `employee.terminated`, `employee.reactivated`, `invite.sent`, `invite.accepted`, `invite.revoked`, `role.changed`.
- Cada item: timestamp + ator + descrição formatada.

### 6.3. Side sheet `EmployeeSheet` (evolução da Fase 0)

**Modos:**
- `create` (abre com "+ Novo colaborador" em `/colaboradores`).
- `edit` (abre com "Editar" em perfil ou kebab).

**Campos adicionados em FT-1:**
- **Observações internas** (textarea, opcional). Só editável se `auth.role_name() = 'admin_rh'`. Para outros roles, campo não aparece.

**Campos alterados em FT-1:**
- Gestor direto: autocomplete agora **exclui** self + descendentes (via `get_employee_descendants()`).
- Departamento: dropdown agora mostra só não-arquivados; opção "+ Criar novo" abre mini-dialog.

**Validações extras:**
- `manager_id != id`.
- `manager_id` não está em `get_employee_descendants(id)`.
- Email único por company (já existe via UNIQUE constraint).

### 6.4. Modais de confirmação de status

#### `ConfirmDeactivateDialog` (active → inactive)
```
Desativar {nome}?
— {nome} não aparecerá em novos ciclos de avaliação.
— Pode ser reativado a qualquer momento.
— Continua com acesso ao sistema.

[Cancelar]  [Desativar]
```

Se `{nome}` é gestor de alguém, o dialog EXPANDE:
```
⚠️ {nome} é gestor direto de {N} pessoa(s).
Escolha o que fazer com os liderados:

( ) Transferir todos para outro gestor  [ autocomplete ]
( ) Deixar sem gestor (manager_id = NULL)

[Cancelar]  [Confirmar]
```

#### `ConfirmTerminateDialog` (active/inactive → terminated)
```
⚠️ Desligar {nome}?
Esta ação é PERMANENTE.
— {nome} perderá acesso imediato (força logout).
— PDIs em andamento serão cancelados.
— Dados históricos (avaliações passadas, feedbacks) são preservados.
— Data de desligamento: {hoje}

[Cancelar]  [Desligar]
```

Se gestor de liderados, inclui a mesma escolha do Desativar.

#### `ConfirmReactivateDialog` (inactive → active)
```
Reativar {nome}?
— Voltará a aparecer em novos ciclos.

[Cancelar]  [Reativar]
```

### 6.5. `/configuracoes/departamentos` e `/configuracoes/cargos`

Mesma estrutura (só muda tabela subjacente e copy):

**Header:** Título + "+ Novo departamento" (ou cargo).

**Busca + toggle "Mostrar arquivados".**

**Tabela (4 colunas):**
- Nome
- Colaboradores (contagem clicável → `/colaboradores?department=X`)
- Status (● Ativo / ● Arquivado cinza)
- Ações (kebab)

**Kebab:**
- Editar (modal com campo nome)
- Arquivar / Desarquivar
- Deletar (disabled com tooltip se N > 0)

**Modais:**
- **Criar**: dialog pequeno com campo `Nome *` + validação `UNIQUE(company_id, name)`.
- **Editar**: mesmo dialog, pré-preenchido.
- **Arquivar**: confirmação simples. Se N > 0: "{N} colaboradores estão neste departamento. Eles continuarão vinculados, mas o departamento não aparecerá em novos cadastros. Confirma?"
- **Deletar**: só disponível se N = 0. Confirmação "Esta ação é permanente. Confirma?".

**Rodapé:** contagem "{ativos} ativos · {arquivados} arquivado(s) oculto(s)".

## 7. Regras e server logic

### 7.1. Validação de hierarquia (no `updateEmployee()` / `createEmployee()`)

```typescript
// Pseudocódigo
async function assertValidManager(employeeId: string | null, proposedManagerId: string | null) {
  if (!proposedManagerId) return;  // NULL sempre permitido

  if (employeeId && employeeId === proposedManagerId) {
    throw new ValidationError('Um colaborador não pode ser gestor de si mesmo.');
  }

  if (employeeId) {
    const descendants = await supabase.rpc('get_employee_descendants', { root_id: employeeId });
    if (descendants.includes(proposedManagerId)) {
      throw new ValidationError('Não é possível: criaria uma hierarquia circular.');
    }
  }
}
```

### 7.2. Transição de status e side effects

```typescript
// src/features/employees/actions.ts
export async function deactivateEmployee(id: string, transferOption: { mode: 'transfer' | 'null', newManagerId?: string }) {
  // 1. Update status
  // 2. Transferir ou anular liderados
  // 3. logActivity employee.deactivated
  // 4. Notification (opcional — avisar o próprio employee? admin? decide depois)
}

export async function terminateEmployee(id: string, transferOption) {
  // 1. Update status = 'terminated', terminated_at = now()
  // 2. Transferir ou anular liderados (mesma lógica)
  // 3. Revogar sessão Supabase (se user_id != null)
  //    supabase.auth.admin.signOut(user_id) — usa client admin
  // 4. logActivity employee.terminated
  // 5. [FT-4] cancelar PDIs em andamento (quando FT-4 existir)
}

export async function reactivateEmployee(id: string) {
  // 1. Update status = 'active'
  // 2. logActivity employee.reactivated
}
```

### 7.3. Transferência de liderados

```typescript
async function transferSubordinates(managerId: string, mode: 'transfer' | 'null', newManagerId?: string) {
  const targetManagerId = mode === 'transfer' ? newManagerId : null;
  await supabase.from('employees')
    .update({ manager_id: targetManagerId })
    .eq('manager_id', managerId)
    .eq('company_id', auth.company_id());

  await logActivity({
    action: 'employees.managers_transferred',
    metadata: { fromManagerId: managerId, toManagerId: targetManagerId }
  });
}
```

### 7.4. Deletar departamento/cargo

```typescript
export async function deleteDepartment(id: string) {
  // 1. SELECT COUNT(*) FROM employees WHERE department_id = id
  // 2. Se > 0 → throw ValidationError('Não é possível deletar: há colaboradores vinculados.')
  // 3. DELETE FROM departments WHERE id = id
  // 4. logActivity
}
```

## 8. Permissions

```typescript
// src/features/employees/permissions.ts

export function canEditEmployee(actor, target): boolean {
  // admin_rh pode tudo
  if (actor.role === 'admin_rh') return true;
  return false;
}

export function canViewEmployee(actor, target): boolean {
  // Qualquer user vê a si mesmo
  if (actor.employeeId === target.id) return true;
  // admin_rh vê todos
  if (actor.role === 'admin_rh') return true;
  // director vê todos da empresa (read-only)
  if (actor.role === 'director') return true;
  // user vê descendentes diretos e indiretos (skip-level read)
  return isDescendantOf(target.id, actor.employeeId);
}

export function canSeeInternalNotes(actor): boolean {
  return actor.role === 'admin_rh';
}

export function canDeactivateEmployee(actor, target): boolean {
  if (actor.role !== 'admin_rh') return false;
  if (actor.employeeId === target.id) return false;  // não auto-desativar
  return true;
}

export function canTerminateEmployee(actor, target): boolean {
  if (actor.role !== 'admin_rh') return false;
  if (actor.employeeId === target.id) return false;
  // Não pode desligar o último admin_rh
  // (verificado server-side via COUNT de admins ativos)
  return true;
}
```

## 9. Error states e edge cases

| Categoria | Situação | Tratamento |
|---|---|---|
| Hierarquia | Auto-referência (`manager_id = self.id`) | Validação server; toast "Colaborador não pode ser gestor de si mesmo." |
| | Ciclo (descendente vira gestor) | Validação via `get_employee_descendants`; toast "Criaria hierarquia circular." |
| Status | Desativar gestor com liderados | Modal obriga escolher: transferir ou NULL |
| | Desligar gestor com liderados | Mesmo modal |
| | Último admin_rh tenta se rebaixar ou desligar | Erro "A empresa precisa de ao menos um administrador." |
| | Auto-desativar/desligar | Botão disabled + validação server |
| Departamentos | Arquivar com employees | Modal de confirmação; vínculo preservado, só oculta em seleções novas |
| | Deletar com employees | Bloqueado; tooltip "Remova os colaboradores vinculados antes." |
| | Criar com nome duplicado | Constraint UNIQUE; toast "Já existe um departamento com esse nome." |
| Cargos | Mesmos padrões de departamentos | — |
| Perfil | Acesso a perfil de alguém fora da hierarquia (user comum) | 403 |
| | `/colaboradores/[id]` com id inválido/apagado | 404 |
| | Internal notes vazado em queries | Filtro em camada de app (queries.ts); teste unitário cobre |

## 10. Critérios de aceite

- [ ] Migration FT-1 aplicada: colunas `internal_notes` e `terminated_at` em employees; função `get_employee_descendants` criada.
- [ ] `/colaboradores` lista todos os employees com filtros de cargo, depto, gestor funcionando.
- [ ] Banner mostra contagens corretas; "Mostrar desligados" filtra.
- [ ] `/colaboradores/[id]` renderiza 6 tabs, 3 ativas, 3 em breve.
- [ ] Observações internas aparecem só para admin_rh.
- [ ] Bloco "Liderados diretos" só aparece se existem liderados.
- [ ] Side sheet em modo edit preenche e atualiza.
- [ ] Autocomplete de gestor não mostra self nem descendentes.
- [ ] Tentar setar `manager_id = id` retorna erro.
- [ ] Tentar criar ciclo (A → B → A) retorna erro.
- [ ] Desativar gestor com liderados abre modal de transferência.
- [ ] Desligar gestor com liderados abre mesmo modal; terminated_at preenchido; sessão revogada.
- [ ] Reativar inativo volta para active.
- [ ] `/configuracoes/departamentos` permite criar, editar, arquivar, desarquivar.
- [ ] Deletar departamento com employees está disabled.
- [ ] `/configuracoes/cargos` funciona idêntico a departamentos.
- [ ] Contagem clicável leva à listagem filtrada.
- [ ] RLS de internal_notes testado: user não-admin não recebe a coluna no JSON de response.
- [ ] Activity logs registram todas as transições de FT-1.
- [ ] Vitest cobre `canEditEmployee`, `canSeeInternalNotes`, `assertValidManager`, validações de departamento/cargo.

## 11. Plano de implementação (ordem sugerida)

1. **Migration** — `20260426_0001_ft1_employee_fields.sql` (internal_notes, terminated_at) + `20260426_0002_ft1_helper_descendants.sql` (função recursiva).
2. **Types** — regenerar tipos Supabase (`supabase gen types`).
3. **Permissions** — expandir `src/features/employees/permissions.ts` com `canViewEmployee`, `canSeeInternalNotes`, validações.
4. **Queries** — `getEmployee` com filtro de `internal_notes`, `listEmployees` com filtros novos (cargo, depto, gestor), `getManagerCandidates` (exclui descendentes via RPC).
5. **Actions** — `deactivateEmployee`, `terminateEmployee`, `reactivateEmployee`, `updateEmployee` com validação de hierarquia, `deleteDepartment`, `deleteCargo`, `archiveDepartment`, `archiveCargo`, etc.
6. **`/colaboradores` — expansão** — adicionar filtros, banner, colunas toggleáveis.
7. **Side sheet — modo edit + internal_notes** — adicionar campo (só admin_rh), wire do modo edit.
8. **Modais de confirmação** — `ConfirmDeactivate`, `ConfirmTerminate`, `ConfirmReactivate` com lógica de transferência de liderados.
9. **`/colaboradores/[id]` — perfil detalhado** — header + 6 tabs + aba Dados com layout 2 colunas.
10. **Aba Acesso** — ações de reenvio/revogação/troca de papel (reaproveita server actions).
11. **Aba Histórico** — query de activity_logs com formatadores.
12. **`/configuracoes/departamentos`** — CRUD completo substituindo o stub.
13. **`/configuracoes/cargos`** — idem.
14. **Links clicáveis de contagem** — `/colaboradores?department=X` etc.
15. **Testes** — Vitest (permissions, validações de hierarquia, helpers).

## 12. Não-funcionais

- **Performance:** listagem com 500 colaboradores renderiza em <400ms (paginação 20/página, filtros server-side com índices).
- **Segurança:** `internal_notes` nunca enviada em response para quem não é admin_rh; teste automatizado cobre.
- **Acessibilidade:** modais de confirmação destructivos (`ConfirmTerminate`) têm foco no botão "Cancelar" por default + `aria-labelledby`.
- **Observabilidade:** `logActivity` registra todas as transições; Sentry captura erros.

## 13. Referências

- `docs/PRD-GERAL.md` §8
- `docs/MVP.md` §1
- `docs/USERS-ABLE.md` §2, §3
- `docs/ESTRUTURA.md` §18 Sprint 2
- `features/FT-1.md`
- `docs/dev/00-decisoes-transversais.md`
- `docs/dev/01-fase-0-fundacao.md`
