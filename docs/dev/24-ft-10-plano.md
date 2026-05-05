# FT-10 — Plano de implementação

Plano detalhado de implementação da FT-10 (Unidades de grupo). Acompanha o spec `23-ft-10-unidades.md`.

Última atualização: 2026-05-05.

> **Como usar:** trabalhar em fases sequenciais. Cada fase tem entregáveis, arquivos tocados e critérios de aceite. Commits granulares por fase (1 commit = 1 fase consolidada). Não pular fases — a ordem reflete dependências reais.

---

## Resumo das fases

| # | Fase | Tempo estimado | Entregável |
|---|---|---|---|
| 1 | Schema & migration | 30 min | Tabela `business_units` + colunas `unit_id` + RLS |
| 2 | Feature `units/` (backend) | 1h30 | Schema Zod, permissions, queries, actions + tests |
| 3 | Extensões backend (employees + recruitment + taxonomies) | 1h | createTaxonomy, EmployeeSchema, queries, actions, hire |
| 4 | Tipos & permissões (`screen_permissions.unidades`) | 20 min | Type extensions, EMPTY default, Sidebar nav |
| 5 | UI: `/configuracoes/unidades` | 1h | Page + UnitsManager + dialogs |
| 6 | UI: `EmployeeProfile` (aba Dados) | 15 min | FieldRow Unidade |
| 7 | UI: `EmployeeSheet` (convite + edit) | 45 min | FormField + inline-create + ressync |
| 8 | UI: `HireCandidateDialog` (wizard) | 30 min | FormField na row de Gestor direto |
| 9 | UI: `EmployeesList` | 45 min | Filtro + coluna + empty state |
| 10 | Activity logs | 20 min | Eventos `business_unit.*` e `employee.unit_changed` |
| 11 | Testes finais e smoke manual | 30 min | Suite verde + checklist manual |

**Total estimado:** ~7h de implementação concentrada.

---

## Fase 1 — Schema & migration

**Objetivo:** ter a estrutura de dados pronta para qualquer código consumir.

**Arquivos:**
- `supabase/migrations/20260505_0001_ft10_unidades.sql` (novo)
- `src/lib/supabase/types.ts` (estender com `business_units` row + colunas `unit_id`)

**Passo a passo:**

1. Criar `supabase/migrations/20260505_0001_ft10_unidades.sql` com o conteúdo da §4 do spec (tabela, FKs, indexes, RLS).
2. Rodar `supabase db reset` localmente (ou `supabase migration up`) e confirmar:
   - `\d business_units` retorna a tabela com `id, company_id, name, is_archived, created_at`.
   - `\d employees` mostra a coluna `unit_id` com FK para `business_units`.
   - `\d invites` mostra a coluna `unit_id` com FK para `business_units`.
3. Atualizar `src/lib/supabase/types.ts`:
   - Adicionar `business_units` em `Database.public.Tables` com `Row`, `Insert`, `Update`.
   - Adicionar `unit_id: string | null` em `employees.Row`/`Insert`/`Update` e `invites.Row`/`Insert`/`Update`.
   - Adicionar relação FK em `employees.Relationships` para PostgREST embed.

**Critério de aceite:**
- `npm run typecheck` passa sem erros relacionados a `unit_id`.
- Insert manual de uma `business_unit` em SQL funciona; insert/update em `employees` aceita `unit_id` UUID válido.

**Commit:** `feat(units): migration FT-10 (business_units + unit_id em employees/invites)`

---

## Fase 2 — Feature `units/` (backend)

**Objetivo:** módulo isolado e testado para criar/listar/atualizar/arquivar unidades.

**Arquivos novos:**
- `src/features/units/index.ts`
- `src/features/units/schema.ts`
- `src/features/units/schema.test.ts`
- `src/features/units/permissions.ts`
- `src/features/units/permissions.test.ts`
- `src/features/units/queries.ts`
- `src/features/units/queries.test.ts`
- `src/features/units/actions.ts`

**Passo a passo:**

1. **`schema.ts`** — Zod:
   ```ts
   export const BusinessUnitSchema = z.object({
     name: z.string().trim().min(2, 'Nome muito curto').max(80, 'Nome muito longo'),
   });
   export type BusinessUnitInput = z.infer<typeof BusinessUnitSchema>;
   ```
2. **`schema.test.ts`** — casos: válido, vazio, whitespace-only, 1 char, 81 chars, trim funciona.
3. **`permissions.ts`** — `canManageUnits(actor)`: implementar com `canDo(actor, 'unidades', 'edit')` (não usar `screenPermissions?.unidades?.manage` — o tipo `ScreenPermissions` só admite chaves planas `unidades.view` / `unidades.edit`).
4. **`permissions.test.ts`** — admin_rh sempre `true`; director bloqueado; `user` com `unidades.edit` → `true`; com toggles off → `false`.
5. **`queries.ts`** — funções:
   - `listUnits(supabase, companyId, { includeArchived })` — `SELECT * FROM business_units WHERE company_id = ? AND (is_archived = false OR ?) ORDER BY name`.
   - `getUnitById(supabase, unitId)` — single row, valida `company_id` na RLS automaticamente.
6. **`queries.test.ts`** — casos: filtro `includeArchived=false` exclui; `true` inclui; ordenação por nome.
7. **`actions.ts`** — server actions:
   - `createUnit(input: BusinessUnitInput)` — gateado por `canManageUnits`; UNIQUE constraint trata duplicata; retorna `{ id?, error? }`.
   - `updateUnit(id, input)` — gateado.
   - `archiveUnit(id)` / `unarchiveUnit(id)` — togglam `is_archived`; gateados.
   - `deleteUnit(id)` opcional — hard delete quando não há colaboradores vinculados; log `business_unit.deleted`.
   - Cada action emite log em `activity_logs` (`business_unit.created`, etc — fase 10).
8. **`index.ts`** — barrel exports.

**Critério de aceite:**
- `npm run test src/features/units/` verde.
- Action `createUnit` rejeitada se actor não tem permissão.

**Commit:** `feat(units): feature module units (schema, queries, actions, permissions)`

---

## Fase 3 — Extensões backend (employees + recruitment + taxonomies)

**Objetivo:** propagar a coluna `unit_id` por todas as queries/actions que tocam employees.

**Arquivos:**
- `src/features/taxonomies/actions.ts`
- `src/features/employees/schema.ts` + `schema.test.ts`
- `src/features/employees/queries.ts` + `queries.test.ts`
- `src/features/employees/actions.ts` (createEmployee, updateEmployee, acceptInvite)
- `src/features/recruitment/schema.ts` + `schema.test.ts`
- `src/features/recruitment/actions/hire.ts`

**Passo a passo:**

1. **`taxonomies/actions.ts`** — `createTaxonomy`:
   - Adicionar case `'unit'` que delega para `createUnit` da feature units.
   - Manter assinatura `(kind, { name }) → { id?, error? }`.
2. **`employees/schema.ts`** — adicionar `unitId: z.string().uuid().nullable().optional()` em `EmployeeSchema`.
3. **`employees/schema.test.ts`** — testes: `unitId: null` OK, `undefined` OK, UUID válido OK, string não-UUID rejeitado.
4. **`employees/queries.ts`** — `listEmployees`:
   - JOIN: `unit:unit_id (id, name, is_archived)` (alias por coluna — ANTI-PADRÃO usar `business_units!unit_id`).
   - Aceitar parâmetro novo `unitIds?: string[]`. Se contém `'__none__'`, traduz para `OR unit_id IS NULL`.
   - Retornar `unit: { id, name, is_archived } | null` em cada employee.
5. **`employees/queries.test.ts`** — testes:
   - `listEmployees` retorna `unit` populado.
   - Filtro `unitIds: ['__none__']` retorna apenas com `unit_id IS NULL`.
   - Filtro `unitIds: [unitA, '__none__']` retorna `unit_id = unitA OR unit_id IS NULL`.
   - Filtro `unitIds + departmentIds` aplica AND.
6. **`employees/actions.ts`**:
   - `createEmployee(input)` — passar `unit_id: input.unitId ?? null` para o INSERT em `employees` E em `invites` (já que o convite é criado junto).
   - `updateEmployee(employeeId, input)` — incluir `unit_id` no UPDATE; comparar antigo vs novo e emitir log `employee.unit_changed` se mudou (Fase 10).
   - `acceptInvite(token, data)` — após o `SELECT * FROM invites WHERE token = ?`, copiar `invite.unit_id` para o `INSERT INTO employees`. AcceptInviteForm não muda.
7. **`recruitment/schema.ts`** — `HireCandidateInputSchema` ganha `unitId: z.string().uuid().nullable().optional()`.
8. **`recruitment/schema.test.ts`** — testes do `unitId` nos cenários null/undefined/UUID/inválido.
9. **`recruitment/actions/hire.ts`** — `hireCandidate`:
   - Passar `unit_id: input.unitId ?? null` no INSERT em `employees`.
   - Default no input handler: `null` (sem pré-preencher da vaga).

**Critério de aceite:**
- `npm run test src/features/employees/` e `src/features/recruitment/` verdes.
- Manual: criar employee via Sheet com `unit_id` definido → confere no banco.

**Commit:** `feat(units): backend extensions (employees, recruitment, taxonomies)`

---

## Fase 4 — Tipos & permissões (`unidades.view` / `unidades.edit`) + Sidebar

**Arquivos:**
- `src/features/permissions/types.ts`
- `src/features/permissions/permissions.ts` (se necessário)
- `src/features/shell/components/Sidebar.tsx`

**Passo a passo:**

1. **`permissions/types.ts`** — seguir o modelo FT-9 já existente:
   - `ScreenKey` inclui `'unidades'`.
   - `ScreenPermissionKey` inclui `'unidades.view'` e `'unidades.edit'`.
   - `SCREEN_PERMISSION_MODULES` (Configurações): ordem **Empresa → Unidades → Departamentos → Cargos → …** (paridade com a Sidebar).
   - `EMPTY_SCREEN_PERMISSIONS` permanece `{}` (parcial; chave ausente = false).
2. Atualizar `getRoleDisplayLabel`/`canDo` se aplicável (provavelmente automático via lookup / módulos).
3. **`Sidebar.tsx`** — `CONFIG_NAV`: item Unidades **abaixo de Empresa e acima de Departamentos**:
   ```ts
   { label: 'Unidades', href: '/configuracoes/unidades', icon: Building, screen: 'unidades' },
   ```
   Importar `Building` de `lucide-react`.
4. Verificar se `ScreenPermissionsToggles` renderiza automaticamente Unidades com view + edit (data-driven a partir de `SCREEN_PERMISSION_MODULES`).

**Critério de aceite:**
- Sidebar mostra "Unidades" na posição acima para admin_rh.
- Tela de gestão de permissões (FT-9) mostra toggles `unidades.view` e `unidades.edit` quando `hasEdit: true`.

**Commit:** `feat(units): screen_permissions unidades + sidebar nav`

---

## Fase 5 — UI: `/configuracoes/unidades`

**Arquivos novos:**
- `src/app/(app)/configuracoes/unidades/page.tsx`
- `src/app/(app)/configuracoes/unidades/loading.tsx`
- `src/features/units/components/UnitsManager.tsx`

**Passo a passo:**

1. Copiar estrutura de `/configuracoes/departamentos` como base.
2. **`page.tsx`** (server):
   - `getActorContext`.
   - Se `!canDo(actor, 'unidades', 'view')` → `redirect('/dashboard')` (paridade com `/configuracoes/cargos`).
   - Buscar unidades (ex.: `listUnitsWithCounts` ou equivalente).
   - Renderiza `<UnitsManager units={units} canEdit={canDo(actor, 'unidades', 'edit')} />`.
3. **`loading.tsx`** — skeleton replicando `departamentos/loading.tsx`.
4. **`UnitsManager.tsx`** (client):
   - PageHeader com title "Unidades", description "Empresas/unidades do grupo.", action button "+ Nova unidade".
   - Toggle "Mostrar arquivadas" (default off).
   - Tabela: Nome · Status (Ativa badge success / Arquivada badge muted) · Criada em · Ações (DropdownMenu).
   - Dialog "Nova/Editar unidade" reutilizando padrão de Departamentos.
   - Confirm dialog "Arquivar Unidade" com texto neutro do spec (§6.1).
   - Empty state da §6.1 do spec.

**Critério de aceite:**
- Rota acessível para quem tem `unidades.view`; redireciona para `/dashboard` sem view.
- Com view e sem `unidades.edit`, lista em modo leitura.
- Criar/editar/arquivar/desarquivar/excluir (quando aplicável) funciona end-to-end para quem tem edit.
- Empty state aparece quando lista vazia.
- Visual idêntico a `/configuracoes/departamentos`.

**Commit:** `feat(units): UI /configuracoes/unidades (CRUD)`

---

## Fase 6 — UI: `EmployeeProfile` (aba Dados)

**Arquivo:**
- `src/features/employees/components/EmployeeProfile.tsx`

**Passo a passo:**

1. Adicionar `<FieldRow label="Unidade" value={renderUnit(employee.unit)} />` entre `<FieldRow label="Departamento" />` e `<FieldRow label="Gestor direto" />`.
2. Função local `renderUnit(unit)`:
   ```tsx
   if (!unit) return '—';
   if (!unit.is_archived) return unit.name;
   return (
     <>
       {unit.name}{' '}
       <span className="text-muted-foreground italic">(arquivada)</span>
     </>
   );
   ```
3. Atualizar tipo `Employee` (ou `props`) do componente para incluir `unit: { id, name, is_archived } | null`.

**Critério de aceite:**
- Perfil de colaborador mostra Unidade após Departamento.
- "—" quando NULL; nome neutro quando ativa; nome + "(arquivada)" muted quando arquivada.

**Commit:** parte do commit consolidado da Fase 9 (UI listagem) ou avulso `feat(units): UI perfil de colaborador`.

---

## Fase 7 — UI: `EmployeeSheet` (convite + edit)

**Arquivo:**
- `src/features/employees/components/EmployeeSheet.tsx`

**Passo a passo:**

1. Adicionar prop `units: BusinessUnit[]` (vinda do server, contém ativas; em modo edit, INCLUI a unidade vinculada do colaborador mesmo se arquivada).
2. Estender `EmployeeInput` form types com `unitId: string | null`.
3. Adicionar `<FormField name="unitId">` em uma nova `grid grid-cols-2`:
   - Linha 1 (já existe): Cargo + Departamento.
   - **Linha 2 (novo): Unidade + Gestor direto**.
   - Linha 3: Data de admissão (sozinha ou junto com algum campo existente).
4. Items do Select: `[{ value: '__none__', label: 'Sem unidade' }, ...units.map(u => ({ value: u.id, label: u.is_archived ? `${u.name} (arquivada)` : u.name, disabled: u.is_archived && u.id !== employee?.unitId }))]`.
5. Rodapé do dropdown com `+ Nova unidade` que abre dialog reutilizando o componente já usado para Cargo/Departamento (`TaxonomyCreateDialog` ou equivalente). Após criar, auto-seleciona o id retornado.
6. **Ressync via `useEffect`** (evita `useState(initialProp)` trap):
   ```tsx
   useEffect(() => {
     if (employee) form.reset({ ..., unitId: employee.unitId ?? null });
   }, [employee, form]);
   ```
7. `defaultValues.unitId` em modo create: `null`.

**Critério de aceite:**
- Convite com unidade definida persiste em `invites.unit_id`.
- Edit em colaborador propaga para `employees.unit_id` (e dispara `employee.unit_changed`).
- Inline-create cria unidade nova e auto-seleciona.
- Em modo edit de colaborador com unidade arquivada, item aparece marcado e disabled (não pode re-selecionar outra arquivada, mas pode trocar pra ativa).

**Commit:** `feat(units): UI EmployeeSheet (convite + edit) com inline-create`

---

## Fase 8 — UI: `HireCandidateDialog` (wizard de contratação)

**Arquivo:**
- `src/features/recruitment/components/HireCandidateDialog.tsx`
- `src/app/(app)/recrutamento/vagas/[id]/page.tsx` (ou onde o dialog é montado) — passar `units`.

**Passo a passo:**

1. Adicionar prop `units: BusinessUnit[]` (apenas ativas).
2. Adicionar `unitId: z.string().uuid().nullable().optional()` ao form (já adicionado ao `HireCandidateInputSchema` na Fase 3).
3. Reorganizar bloco "Dados do colaborador":
   - Row 1 (já existe): Cargo + Departamento.
   - Row 2 (novo layout): **Unidade + Gestor direto**. Substitui a row atual de Gestor sozinho.
   - Row 3 (já existe): Data de admissão + Nível.
4. `defaultValues.unitId = null` (sem pré-preencher da vaga).
5. Items do Select com inline-create (mesmo padrão do EmployeeSheet).
6. Toast pós-contratação:
   - Se `result.unitName` (action retorna o name): `Candidato contratado e colaborador criado em ${result.unitName}`.
   - Senão: `Candidato contratado e colaborador criado` (texto atual).

**Critério de aceite:**
- Wizard abre com Unidade vazia.
- Submit com Unidade definida grava em `employees.unit_id`.
- Inline-create funciona dentro do wizard.

**Commit:** `feat(units): UI wizard de contratação com Unidade`

---

## Fase 9 — UI: `EmployeesList` (filtro + coluna)

**Arquivo:**
- `src/features/employees/components/EmployeesList.tsx`
- `src/app/(app)/colaboradores/page.tsx` (server: passar `units` como prop).

**Passo a passo:**

1. Estender tipo `Employee` com `unit: { id, name, is_archived } | null`.
2. Adicionar prop `units` em `EmployeesList` (servidor: `getUnits(companyId, { includeArchived: true })`). No destructuring do componente usar `units = []` como default para evitar `.map` em `undefined` durante SSR / chamadas legadas.
3. Adicionar state `const [unitFilter, setUnitFilter] = useState<string[]>([])`.
4. Adicionar URL param sync se a lista usa `useSearchParams` para outros filtros.
5. Adicionar `MultiSelectFilter` "Unidades" entre "Departamentos" e "Gestores":
   ```tsx
   const unitOptions = [
     { value: '__none__', label: 'Sem unidade' },
     ...units.map(u => ({
       value: u.id,
       label: u.is_archived ? `${u.name} (arquivada)` : u.name,
     })),
   ];
   ```
6. Adicionar `matchUnit` no `useMemo` filtered:
   ```ts
   const matchUnit = unitFilter.length === 0
     || unitFilter.includes(emp.unit?.id ?? '__none__');
   ```
7. Atualizar `hasFilters` no `EmptyState` para incluir `unitFilter.length > 0`.
8. Adicionar `<TableHead>Unidade</TableHead>` entre Departamento e Gestor direto (ambas continuam fixas).
9. Adicionar `<TableCell>{emp.unit?.name ?? '—'}</TableCell>` na mesma posição na renderização de cada linha. Para unidade arquivada: `<>{emp.unit.name} <span className="text-muted-foreground italic">(arquivada)</span></>`.
10. **Não** adicionar Gestor direto ao popover de Colunas. Mantém fixa.
11. Atualizar deps do `useMemo` para incluir `unitFilter`.

**Critério de aceite:**
- Filtro "Unidades" funciona (multi-select, inclui "Sem unidade").
- Coluna "Unidade" aparece após Departamento, sempre visível.
- Empty state com filtros considera Unidade.
- Layout/espaçamentos idênticos ao padrão atual (sem destaques azuis, etc).

**Commit:** `feat(units): UI EmployeesList (filtro + coluna)`

---

## Fase 10 — Activity logs

**Arquivo:**
- `src/features/units/actions.ts` (logs em create/update/archive/unarchive).
- `src/features/employees/actions.ts` (`employee.unit_changed` em createEmployee/updateEmployee/acceptInvite quando aplicável).
- `src/features/recruitment/actions/hire.ts` (log em hire se unitId definido).

**Eventos:**

| Action | log | metadata |
|---|---|---|
| `createUnit` | `business_unit.created` | `{ unit_id, name }` |
| `updateUnit` | `business_unit.updated` | `{ unit_id, name_before, name_after }` |
| `archiveUnit` | `business_unit.archived` | `{ unit_id, name }` |
| `unarchiveUnit` | `business_unit.unarchived` | `{ unit_id, name }` |
| `deleteUnit` | `business_unit.deleted` | `{ unit_id, name }` |
| `updateEmployee` (com mudança) | `employee.unit_changed` | `{ employee_id, unit_id_before, unit_id_after }` |
| `acceptInvite` (invite tinha unit) | `employee.unit_changed` | `{ employee_id, unit_id_before: null, unit_id_after }` |
| `hireCandidate` (com unit) | `employee.unit_changed` | `{ employee_id, unit_id_before: null, unit_id_after }` |

**Critério de aceite:**
- Aba `/configuracoes/auditoria` lista os novos eventos.
- Renderização do log usa label legível (extender o switch/lookup de tipos de evento).

**Commit:** `feat(units): activity logs business_unit.* + employee.unit_changed`

---

## Fase 11 — Testes finais e smoke manual

**Passo a passo:**

1. Rodar suite completa: `npm run test`.
2. Rodar build: `npm run build` para garantir typecheck + lint.
3. **Smoke test manual** (cliente teste interno):
   - [ ] `/configuracoes/unidades` aparece para admin_rh; oculta para user sem permissão.
   - [ ] Criar 3 unidades (Hugs, ACR, Hope).
   - [ ] Convidar colaborador com unidade "Hugs"; aceitar convite com outro browser; conferir que perfil mostra "Hugs".
   - [ ] Editar colaborador, mudar unidade; conferir activity log `employee.unit_changed`.
   - [ ] Ir em `/colaboradores`: filtro "Unidades" funciona com `[Hugs, ACR]`; com `[Sem unidade]`; coluna Unidade aparece.
   - [ ] Abrir vaga, mover candidato para Contratado, definir unidade no wizard; conferir que colaborador criado tem `unit_id`.
   - [ ] Inline-create `+ Nova unidade` no convite; criar "Hope Tech"; conferir que aparece no select.
   - [ ] Arquivar "Hope" em `/configuracoes/unidades`; conferir que perfil de colaborador da Hope mostra "Hope (arquivada)" muted; filtro ativo não lista mais "Hope" (mas ainda pode filtrar por id se digitado em URL — ok).
   - [ ] Tenant sem nenhuma unidade: lista mostra "—" em todas as linhas; filtro fica disponível mas só com opção "Sem unidade"; sem fricção.
4. Ajustar bugs encontrados antes do PR.

**Critério de aceite:**
- Todos checkboxes do smoke test marcados.
- `npm run test` e `npm run build` verdes.

**Commit:** `chore(units): smoke test fixes (se houver)`.

---

## Ordem de revisão antes do merge

1. Migration aplicada e revertível (`supabase migration down` funciona).
2. RLS testada com user de outro tenant (não consegue listar `business_units` alheia).
3. Visual: lado-a-lado com `/configuracoes/departamentos` para confirmar paridade.
4. Visual: aba Dados do perfil bate com FT-1 (sem Cards extras, divide-y mantido).
5. Acessibilidade: labels nos selects, aria-* nos dialogs.
6. Performance: `listEmployees` com JOIN não regrediu (bench rápido em dataset de 100+ employees).

## Mensagem do PR (rascunho)

```
feat(units): FT-10 unidades de grupo

Adiciona Unidade como tag organizacional opcional em colaboradores,
permitindo separar sub-empresas dentro de um mesmo tenant
(ex: Grupo Unific contém Hugs, ACR, Hope).

- Tabela business_units (CRUD em /configuracoes/unidades)
- Coluna employees.unit_id e invites.unit_id (cópia no aceite)
- Filtro + coluna em /colaboradores (após Departamentos/Departamento)
- FieldRow no perfil + select no convite + select no wizard de contratação
- Inline-create '+ Nova unidade' paritário com Cargo/Departamento
- screen_permissions: `unidades.view` / `unidades.edit` (padrão FT-9) para a lista em /configuracoes/unidades
- Activity logs business_unit.* + employee.unit_changed

Spec: docs/dev/23-ft-10-unidades.md
Plano: docs/dev/24-ft-10-plano.md
```
