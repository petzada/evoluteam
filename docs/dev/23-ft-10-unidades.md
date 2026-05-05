# FT-10 — Unidades (grupo de empresas)

Spec da FT-10. Adiciona o conceito de **Unidade** ao tenant existente: uma tag organizacional opcional que separa colaboradores em sub-empresas, filiais ou marcas dentro de um mesmo grupo (ex.: Grupo Unific contém Hugs, ACR, Hope).

Última atualização: 2026-05-05.

> **Leia antes:** `docs/dev/00-decisoes-transversais.md`, `docs/dev/02-ft-1-colaboradores.md` (padrão de listagem/perfil), `docs/dev/15-ft-7-onda2-feedback-contratacao.md` (wizard de contratação).
> **Não depende** de nenhuma FT em aberto. Pode ser implementada em ordem livre relativa a outras melhorias.

---

## 1. Objetivo

Permitir que empresas-mãe que operam como grupo de sub-empresas separem seus colaboradores por unidade do grupo, sem alterar o modelo multi-tenant atual (uma `companies` continua sendo o tenant). A Unidade é uma **tag opcional** em colaboradores, configurável no convite, no perfil e no wizard de contratação, e usada como filtro/coluna em `/colaboradores`.

Cliente que não é grupo (não cria nenhuma unidade) não vê nenhuma fricção: o campo aparece como "—" em todos os lugares, sem ruído.

## 2. Escopo

### Dentro da FT-10

- **Migration** aditiva: tabela `business_units` + colunas `unit_id` em `employees` e `invites`.
- Tela `/configuracoes/unidades`: CRUD de unidades (replica `/configuracoes/departamentos`).
- Nova tela `unidades` no FT-9: chaves planas `unidades.view` e `unidades.edit` em `ScreenPermissions` (tipo `Partial<Record<ScreenPermissionKey, boolean>>` — **sem** objeto aninhado `unidades.manage`).
- Entrada "Unidades" no `CONFIG_NAV` da Sidebar (abaixo de Empresa, acima de Departamentos).
- Filtro **Unidades** (MultiSelectFilter) na lista `/colaboradores`, posicionado após Departamentos.
- Coluna **Unidade** sempre visível em `/colaboradores`, posicionada após Departamento.
- Campo **Unidade** na aba "Dados" do `EmployeeProfile`, posicionado após Departamento.
- Campo **Unidade** no `EmployeeSheet` (convite + edit), posicionado após Departamento, com inline-create paritário a Cargo/Departamento.
- Campo **Unidade** no `HireCandidateDialog` (wizard de contratação), no bloco "Dados do colaborador", lado a lado com Gestor direto.
- Extensão de `createTaxonomy` para aceitar `kind = 'unit'`.
- Cópia de `invites.unit_id → employees.unit_id` em `acceptInvite`.
- Testes de schema Zod, permissões e queries para a nova feature; estende testes existentes em `employees` e `recruitment` que tocam `unit_id`.

### Fora da FT-10

- **Atribuição em massa** via lista (selecionar N colaboradores → atribuir Unidade): adiada — sem cliente ativo justificando agora. A edição individual via perfil cobre o caso.
- **Filtro por unidade** em `/avaliacoes`, `/feedbacks`, `/pdi`, dashboards: adiado. A coluna `employees.unit_id` já existe e qualquer filtro futuro é apenas um JOIN incremental.
- **Tag de unidade em `job_openings` / `candidates` / `job_applications`**: rejeitada como design (vaga é neutra; alocação é decidida no momento da contratação ou após).
- **Visibilidade restrita por unidade** (RLS multi-level dentro do tenant): sem demanda; risco de complicar permissões já consolidadas no FT-9.
- **Página pública / convite externo** com seleção de unidade pelo convidado: o `unit_id` é metadado interno; o convidado não vê/escolhe nada no `AcceptInviteForm`.

## 3. Decisões fundadoras

| # | Decisão | Justificativa-chave |
|---|---|---|
| 1 | Termo: **Unidade** | Cobre grupo de empresas, filiais e marcas sem amarrar a CNPJ; uma palavra, encaixa em label/coluna. |
| 2 | Escopo: somente `employees` + `invites` + wizard de contratação | Vagas são abertas neutras; alocação é decisão pós-avaliação do candidato. |
| 3 | Modelo de dados: tabela CRUD `business_units` | Consistência com `departments`/`positions`/`competencies`. Renomear/arquivar sem perder histórico. |
| 4 | Gestão em rota dedicada `/configuracoes/unidades` | Padrão da casa; permissão isolada via `unidades.view` / `unidades.edit` (mesmo modelo das outras telas de Configurações). |
| 5 | Permissão de **atribuir/editar** unidade espelha `colaboradores.edit` | Unidade é metadado organizacional como Departamento — não merece toggle dedicado. |
| 6 | Migração: `unit_id NULL` para todos os existentes; sem bulk-action no MVP | Sem cliente ativo; simplicidade > rigor. |
| 7 | Filtro/coluna apenas em `/colaboradores` | YAGNI; extensível depois sem refactor. |
| 8 | FieldRow no perfil e coluna na lista posicionados **após Departamento** | Agrupa "Cargo → Departamento → Unidade" como bloco organizacional (do interno ao externo). |
| 9 | Campo no wizard de contratação ao lado de Gestor direto, no bloco existente | Par natural "onde fica · a quem reporta". Sem step extra, sem bloco isolado. |
| 10 | Sem destaques visuais especiais (badges coloridas, blocos azul) | Coluna/campo seguem o padrão neutro da casa. |
| 11 | Arquivar unidade não bloqueia colaboradores ativos vinculados | Mesmo comportamento de Departamentos. Vínculo histórico preservado; render "(arquivada)" muted no perfil. |
| 12 | Inline-create `+ Nova unidade` em todos os selects de Unidade | Paridade com Cargo/Departamento; reduz fricção mid-flow. |

## 4. Schema & migration

**Arquivo:** `supabase/migrations/20260505_0001_ft10_unidades.sql`.

```sql
-- 1. business_units (lookup table)
CREATE TABLE business_units (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        text NOT NULL,
  is_archived boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, name)
);
CREATE INDEX idx_business_units_company ON business_units(company_id);

-- 2. employees.unit_id (FK opcional)
ALTER TABLE employees
  ADD COLUMN unit_id uuid REFERENCES business_units(id) ON DELETE SET NULL;
CREATE INDEX idx_employees_unit ON employees(unit_id);

-- 3. invites.unit_id (FK opcional, copiada para employees no aceite)
ALTER TABLE invites
  ADD COLUMN unit_id uuid REFERENCES business_units(id) ON DELETE SET NULL;

-- 4. RLS — herda do tenant via company_id
ALTER TABLE business_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY business_units_tenant_select ON business_units
  FOR SELECT
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY business_units_tenant_modify ON business_units
  FOR ALL
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));
```

**Pontos importantes:**

- `ON DELETE SET NULL` em ambas as FKs: deletar (não arquivar) uma unidade preserva colaboradores/convites — só perdem a tag.
- `UNIQUE (company_id, name)` impede duplicatas no mesmo tenant; permite mesmas strings em tenants distintos.
- `is_archived` segue o padrão `departments`/`positions`/`competencies` — nenhum CHECK adicional.
- Sem backfill: todos os colaboradores e convites ficam com `unit_id = NULL` ao migrar.

## 5. Backend

### 5.1 Novos arquivos

```
src/features/units/
├─ index.ts             // barrel
├─ schema.ts            // BusinessUnitSchema (Zod): name 2-80 trim, rejeita vazio
├─ schema.test.ts
├─ permissions.ts       // canManageUnits(actor)
├─ permissions.test.ts
├─ queries.ts           // listUnits({ includeArchived }), getUnitById
├─ queries.test.ts
├─ actions.ts           // createUnit, updateUnit, archiveUnit, unarchiveUnit, deleteUnit (hard delete; só sem colaboradores vinculados)
└─ components/
   └─ UnitsManager.tsx  // tela /configuracoes/unidades
```

### 5.2 Permissões

> **Nota de modelo:** `ScreenPermissions` no código é `Partial<Record<ScreenPermissionKey, boolean>>` (chaves `'<tela>.view'` / `'<tela>.edit'`). Não existe `screenPermissions.unidades.manage` nem objeto aninhado — isso evitaria tipagem e quebraria o padrão do FT-9 (`docs/dev/21-ft-9-redesign-acessos.md`).

- Em `src/features/permissions/types.ts`: incluir `unidades` em `ScreenKey`; em `ScreenPermissionKey`, `unidades.view` e `unidades.edit`; registrar a tela em `SCREEN_PERMISSION_MODULES` (ordem: Empresa → **Unidades** → Departamentos → …).
- `EMPTY_SCREEN_PERMISSIONS` permanece `{}` (mapa parcial; ausência de chave = false).
- `canManageUnits(actor)` implementa `canDo(actor, 'unidades', 'edit')` (admin_rh sempre; `director` bloqueado nas telas de Configurações; `user` só com toggle `unidades.edit`).
- `canViewUnits` / gate da página: `canDo(actor, 'unidades', 'view')` — alinhado a `/configuracoes/cargos` (sem view → `redirect('/dashboard')`; com view e sem edit → lista somente leitura).
- Actions de escrita (`createUnit`, `updateUnit`, `archiveUnit`, `unarchiveUnit`, `deleteUnit`) gateadas por `canManageUnits`. Atribuir/editar `unit_id` em `employees` segue o gate de `colaboradores.edit` já existente.

### 5.3 Extensões de arquivos existentes

- **`src/features/taxonomies/actions.ts`** — `createTaxonomy` ganha case `'unit'` que delega para `createUnit`. Mantém assinatura `(kind, { name }) → { id?, error? }` paritária com `'department'`/`'position'`.
- **`src/features/employees/schema.ts`** — `EmployeeSchema` ganha `unitId: z.string().uuid().nullable().optional()`.
- **`src/features/employees/queries.ts`** — `listEmployees(...)`:
  - JOIN com `business_units`: `unit:unit_id (id, name, is_archived)` (alias por coluna, NUNCA `business_units!unit_id` — anti-padrão FT-7).
  - Aceita filtro `unitIds?: string[]` que filtra `unit_id IN (...)`. Valor especial `'__none__'` traduz para `unit_id IS NULL`.
  - Retorna `unit: { id, name, is_archived } | null` por colaborador.
- **`src/features/employees/actions.ts`**
  - `createEmployee(input)` (cria employee + invite atomicamente) aceita `input.unitId`. Grava em `employees.unit_id` E em `invites.unit_id` (snapshot do invite). Validado via `EmployeeSchema` estendido.
  - `updateEmployee(employeeId, input)` aceita `input.unitId` (UUID válido do tenant ou `null`); atualiza `employees.unit_id` e emite `employee.unit_changed` em `activity_logs` se mudou.
  - `acceptInvite(token, data)` (linha 543 do arquivo atual) lê `invites.unit_id` e copia para `employees.unit_id` no `INSERT` do colaborador. O AcceptInviteForm não expõe nem aceita esse campo — é cópia silenciosa.
  - `resendInvite` / `revokeInvite`: nenhuma mudança (não tocam `unit_id`).
- **`src/features/recruitment/actions/hire.ts`** — `hireCandidate(applicationId, input)` aceita `input.unitId: string | null` opcional, grava em `employees.unit_id` no insert. Default `null`.
- **`src/features/recruitment/schema.ts`** — `HireCandidateInputSchema` ganha `unitId: z.string().uuid().nullable().optional()`.
- **`src/features/shell/components/Sidebar.tsx`** — `CONFIG_NAV` ganha `{ label: 'Unidades', href: '/configuracoes/unidades', icon: Building, screen: 'unidades' }`, **abaixo de Empresa e acima de Departamentos**.

## 6. UI

### 6.1 `/configuracoes/unidades`

```
src/app/(app)/configuracoes/unidades/
├─ page.tsx     // server: canDo('unidades','view'); lista; UnitsManager com canEdit = canDo('unidades','edit')
├─ loading.tsx  // skeleton padrão
```

Componente principal: `UnitsManager` (replica visual e estrutural do `DepartmentsManager`).

- `<PageHeader title="Unidades" description="Empresas/unidades do grupo." actions={<Button>+ Nova unidade</Button>} />`
- Toggle "Mostrar arquivadas" no padrão `/colaboradores`.
- Tabela: Nome · Status (Ativa / Arquivada badge muted) · Criada em · Ações (DropdownMenu: Editar / Arquivar / Desarquivar).
- Dialog "Nova/Editar unidade": campo único `name` (Zod 2-80, trim).
- Confirm dialog "Arquivar Unidade X": "Colaboradores vinculados a esta unidade continuam com o vínculo. A unidade não aparecerá mais em filtros/selects ativos."
- Empty state inicial:
  > "Nenhuma unidade cadastrada. Use unidades para separar colaboradores em sub-empresas, filiais ou marcas dentro do grupo. Atribuição é opcional."
  > [+ Nova unidade]
- Sem `canDo(..., 'unidades', 'view')`: redireciona para `/dashboard` (mesmo guard que `/configuracoes/cargos`).

### 6.2 `EmployeeProfile.tsx` — aba "Dados"

- Adicionar `<FieldRow label="Unidade" value={renderUnit(employee.unit)} />` **após** o FieldRow "Departamento" e **antes** de "Gestor direto".
- `renderUnit(unit)`:
  - `null` → `'—'`
  - `unit.is_archived === false` → `unit.name`
  - `unit.is_archived === true` → `<>{unit.name} <span className="text-muted-foreground italic">(arquivada)</span></>`
- Sem mudanças de espaçamento ou novo container (mantém `<section className="rounded-md border divide-y">`).

### 6.3 `EmployeesList.tsx` — listagem

**Tipos / props:**

- `Employee.unit: { id: string; name: string; is_archived: boolean } | null`
- Nova prop `units?: { id, name, is_archived }[]` (do server: `getUnits(..., { includeArchived: true })`). Se omitida, o componente assume `[]` (evita `.map` em `undefined` no SSR).

**Estado novo:** `const [unitFilter, setUnitFilter] = useState<string[]>([])`.

**Barra de filtros (ordem):**

1. Search
2. Status (Select)
3. Cargos (MultiSelectFilter)
4. Departamentos (MultiSelectFilter)
5. **Unidades** (MultiSelectFilter) — novo
6. Gestores (MultiSelectFilter)
7. Popover "Colunas" (margin-left: auto)

**Options do filtro de Unidades:**

```ts
const unitOptions = [
  { value: '__none__', label: 'Sem unidade' },
  ...units.map(u => ({
    value: u.id,
    label: u.is_archived ? `${u.name} (arquivada)` : u.name,
  })),
];
```

**Filtro lógico:**

```ts
const matchUnit =
  unitFilter.length === 0 ||
  unitFilter.includes(emp.unit?.id ?? '__none__');
```

Inclui `unitFilter.length > 0` na condicional `hasFilters` do `EmptyState description`.

**Tabela — colunas fixas (default visíveis):**

| Nome | Cargo | Departamento | **Unidade** *(novo)* | Gestor direto | Status |

Render da célula Unidade: `emp.unit?.name ?? '—'` — texto neutro, sem badge colorida (decisão "segue padrão da casa"). Para unidade arquivada, usar `<>{name} <span className="text-muted-foreground italic">(arquivada)</span></>`.

**Popover "Colunas adicionais"** (`COLUMN_LABELS`): mantém E-mail, Telefone, Admissão. Gestor direto **continua coluna fixa** (não migra para opt-in).

### 6.4 `EmployeeSheet.tsx` — convite + edit

- Nova prop `units: BusinessUnit[]` (apenas ativas + a unidade vinculada do colaborador, mesmo arquivada — para preservar visibilidade na edição).
- Novo `<FormField name="unitId">` posicionado **logo após** o FormField de Departamento, na mesma `grid grid-cols-2` que já agrupa "Cargo / Departamento".
- Estrutura sugerida: linha 1 = Cargo + Departamento (já existe); linha 2 = **Unidade + Gestor direto** (novo); linha 3 = Data de admissão sozinha ou agrupada conforme layout atual.
- Label "Unidade" sem asterisco; default `null`.
- Items do `Select`: `[{ value: '__none__', label: 'Sem unidade' }, ...units.map(...)]`.
- Rodapé do dropdown: `+ Nova unidade` (paridade com Cargo/Departamento). Abre o mesmo **Dialog inline** já usado para novo departamento/cargo, chamando `createTaxonomy('unit', { name })`. Após criar com sucesso, auto-seleciona o item criado.
- Em modo edit, se `employee.unit_id` aponta para unidade arquivada:
  - Item da unidade arquivada renderiza com sufixo `(arquivada)` muted.
  - Permite manter ou trocar; nunca remove o vínculo automaticamente.
- `defaultValues` em modo edit: `unitId: employee.unitId ?? null`. Re-sincronizar via `useEffect` quando a prop `employee` mudar (evita o `useState(initialProp)` trap documentado em FT-7).

### 6.5 `HireCandidateDialog.tsx` — wizard de contratação

- Nova prop `units: BusinessUnit[]` (apenas ativas).
- Novo `<FormField name="unitId">` no bloco "Dados do colaborador", **na mesma row 2-cols** que "Gestor direto" (par "onde fica · a quem reporta"). Estrutura:
  - row "Cargo + Departamento" (já existe)
  - row "**Unidade + Gestor direto**" (novo: substitui a row atual de Gestor direto sozinho)
  - row "Data de admissão + Nível" (já existe)
- `defaultValues.unitId = null` — sem pré-preenchimento da vaga (vaga é neutra).
- Rodapé do dropdown com `+ Nova unidade` (mesmo dialog).
- Toast pós-submit:
  - Com unit: `Candidato contratado e colaborador criado em <unit.name>`.
  - Sem unit: `Candidato contratado e colaborador criado` (mantém texto atual).

### 6.6 `AcceptInviteForm.tsx`

Sem mudanças visíveis. O `acceptInvite` (server action) lê `invites.unit_id` e copia para `employees.unit_id` na criação do employee.

## 7. Schema Zod

```ts
// src/features/units/schema.ts
export const BusinessUnitSchema = z.object({
  name: z.string().trim().min(2, 'Nome muito curto').max(80, 'Nome muito longo'),
});
export type BusinessUnitInput = z.infer<typeof BusinessUnitSchema>;
```

```ts
// extensão em src/features/employees/schema.ts
unitId: z.string().uuid().nullable().optional(),
```

```ts
// extensão em src/features/recruitment/schema.ts
// dentro de HireCandidateInputSchema
unitId: z.string().uuid().nullable().optional(),
```

## 8. Permissões consolidadas

| Ação | Quem hoje | Quem após FT-10 |
|---|---|---|
| Criar/editar/arquivar/excluir unidade | n/a | `canManageUnits(actor)` → `canDo(actor, 'unidades', 'edit')` |
| Convidar colaborador (com Unidade opcional) | `canInviteEmployee` | igual; campo Unidade visível para todos que veem o form |
| Editar Unidade no perfil de colaborador | n/a | `canEditEmployee` (igual a editar Departamento) |
| Definir Unidade no wizard de contratação | quem move para etapa "contratado" | igual; campo opcional |
| Visualizar Unidade (filtro/coluna/perfil) | n/a | qualquer membro do tenant |

Nenhuma das permissões existentes é alterada. As chaves `unidades.view` / `unidades.edit` seguem o mesmo padrão FT-9 das demais telas de Configurações.

## 9. Testes

**Adicionar:**

- `src/features/units/schema.test.ts` — `name` 2-80, trim, rejeita vazio/whitespace.
- `src/features/units/permissions.test.ts` — `canManageUnits` por role + screen_permissions; admin_rh ignora toggle.
- `src/features/units/queries.test.ts` — `listUnits({ includeArchived: false })` filtra arquivadas; `includeArchived: true` retorna todas; ordenação alfabética por nome.

**Estender:**

- `src/features/employees/queries.test.ts` — `listEmployees` retorna `unit` populado quando `unit_id` set; filtro `unitIds: ['__none__']` filtra apenas `unit_id IS NULL`; combinação `unitIds + departmentIds` aplica AND.
- `src/features/employees/schema.test.ts` — `EmployeeSchema` aceita `unitId: null`, `unitId: undefined`, UUID válido; rejeita string não-UUID.
- `src/features/recruitment/schema.test.ts` — `HireCandidateInputSchema` aceita `unitId` null/undefined/UUID.

**Integração (smoke manual ou test e2e leve):**

- Criar unidade → convidar colaborador com `unit_id` definido → aceitar convite → confirmar `employees.unit_id` igual ao do convite.
- Mover candidato para etapa "contratado" → preencher Unidade → confirmar `employees.unit_id` no insert.
- Arquivar unidade vinculada a colaborador ativo → confirmar que colaborador permanece visível e o perfil renderiza "(arquivada)".

## 10. Lições aplicadas (FT-7)

- **PostgREST + JOIN:** sempre `unit:unit_id (id, name, is_archived)`. Nunca `business_units!unit_id` (resolve na direção errada em FK simples).
- **`useState(initialProp)` trap:** o `EmployeeSheet` em modo edit precisa de `useEffect` ressincronizando `defaultValues.unitId` com `employee.unitId` quando a prop muda após `router.refresh()`.
- **Filtro "ovo-e-galinha":** N/A aqui — o select de Unidades no formulário lê de `units` (lookup table independente), não do conjunto de colaboradores existentes.

## 11. Activity logs

Eventos novos em `activity_logs`:

- `business_unit.created` { unit_id, name }
- `business_unit.updated` { unit_id, name_before, name_after }
- `business_unit.archived` { unit_id, name }
- `business_unit.unarchived` { unit_id, name }
- `business_unit.deleted` { unit_id, name } — exclusão permanente (UI só quando não há colaboradores na unidade)
- `employee.unit_changed` { employee_id, unit_id_before, unit_id_after } — emitido em `updateEmployee`, `acceptInvite` (se vinha do invite com unidade), `hireCandidate`.

## 12. Rollout

1. Migration aplicada em staging; smoke manual: criar/arquivar unidade, atribuir, filtrar, contratar.
2. Cliente teste interno valida o fluxo completo: convite com unidade → aceite → perfil mostra unidade → wizard de contratação cria com unidade → filtro funciona → arquivamento preserva vínculo.
3. Bug bash de ~30 min focando em: `unit_id NULL`, unidade arquivada, inline-create concorrente (UNIQUE protege), tenant que ainda não criou nenhuma unidade.
4. Merge em `main` com mensagem `feat(units): FT-10 unidades de grupo` listando schema + UI + permissions.

## 13. Dependências e impacto cruzado

- **Avaliações / Feedbacks / PDIs:** zero impacto — não consultam `unit_id`. Continuam funcionando idênticos.
- **Recrutamento (vagas / candidatos / Kanban):** zero impacto na vaga/candidato; apenas o `HireCandidateDialog` ganha um campo opcional.
- **Dashboard de Pessoas:** zero impacto — sem segmentação por unidade nesta FT.
- **Permissões (FT-9):** adita uma chave (`unidades`) ao `screen_permissions`; nenhuma chave existente é alterada ou removida.
- **Sidebar:** apenas inclui nova entrada em `CONFIG_NAV` atrás do gate `screen: 'unidades'`.

## 14. Critérios de aceite (UI)

| Rota / Ação | Resultado esperado |
|---|---|
| `/configuracoes/unidades` (admin_rh) | Lista vazia inicialmente; botão "Nova unidade" abre dialog; criar adiciona à tabela. |
| `/configuracoes/unidades` (user sem `unidades.view`) | Redireciona para `/dashboard`. |
| `/colaboradores` | Filtro "Unidades" presente após "Departamentos"; coluna "Unidade" entre "Departamento" e "Gestor direto"; texto neutro ou "—". |
| `/colaboradores` filtro = "Sem unidade" | Lista mostra apenas colaboradores com `unit_id IS NULL`. |
| `/colaboradores/[id]` aba "Dados" | FieldRow "Unidade" presente após "Departamento". |
| `/colaboradores` botão "Convidar colaborador" | Sheet abre com campo "Unidade" no bloco organizacional, opcional, com inline-create. |
| `/recrutamento/vagas/[id]` Kanban → mover para "Contratado" | Wizard abre com campo "Unidade" no bloco "Dados do colaborador", default vazio, opcional. |
| Convite enviado com `unit_id` → aceito | `employees.unit_id` igual ao do convite após criação. |
| Arquivar unidade com colaboradores ativos | Operação concluída; perfil dos colaboradores mostra "(arquivada)" muted; filtro/select ativos não listam mais. |
