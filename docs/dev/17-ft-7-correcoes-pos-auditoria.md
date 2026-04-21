# FT-7 — Recrutamento — Correções pós-auditoria

Spec de correção do módulo de Recrutamento, derivada de auditoria do código commitado contra as 4 specs de produto (13 Fundação, 14 Onda 1, 15 Onda 2, 16 Onda 3).
Última atualização: 2026-04-21.

> **Leia antes:** `docs/dev/13-ft-7-fundacao.md` + `docs/dev/14-ft-7-onda1-vagas-candidatos.md` + `docs/dev/15-ft-7-onda2-feedback-contratacao.md` + `docs/dev/16-ft-7-onda3-metricas-scorecard-tarefas.md`.
> **Mockups aprovados (fonte visual):** `.superpowers/brainstorm/1308-1776739536/content/dashboard-final-integrado.html` + auxiliares (`dashboard-period-filter-v3.html`, `dashboard-filters-aligned-v2.html`, `origem-contratados-v2.html`, `chart-orientation.html`).

---

## 1. Objetivo

Fechar as lacunas entre a implementação atual do FT-7 (commits `979edb4`, `6ef3c99`, `c4cb6ee`, `7c3f2c2`, `6b7b3d3`) e as specs/mockups aprovados em brainstorm. São 4 correções independentes e sequenciadas em commits próprios.

## 2. Divergências confirmadas e descartadas

### 2.1 Descartadas durante a auditoria

- **Rota de Etapas em `/recrutamento/etapas`** em vez de `/configuracoes/etapas-recrutamento` — não é divergência. Commit `6137145` registra "fix(recruitment): move Etapas para dentro de Recrutamento e corrige breadcrumbs" como ajuste consciente de UX, coerente com o prefixo `/recrutamento/` do módulo. Specs 13 §6.1/§6.2 e 14 §5.11 ficam desatualizadas; a implementação é a fonte de verdade neste ponto.

### 2.2 Confirmadas (escopo deste spec)

| # | Divergência | Spec violada | Commit alvo |
|---|---|---|---|
| #4 | `moveApplicationStage` mantém guard com mensagem "Contratação disponível em breve" e code `HIRING_NOT_AVAILABLE_IN_ONDA_1` | 15 §6.1 | único |
| #1 | Coluna `notifies_hiring_manager` nunca foi adicionada; código usa heurística `target.name === 'Entrevista Gestor'` | 14 §4, §5.11, §6.5, §9 | único |
| #3a | Dashboard sem chips de período interativos, sem barra de filtros (busca + vaga + responsável) | 16 §7.2, §7.3 | único |
| #3b | Dashboard sem donuts gêmeos, sem lollipop vertical, sem tooltips ricos | 16 §7.6, §7.7, §7.10 | único |

---

## 3. Correção #4 — Refina guard de `hired_terminal`

### 3.1 Situação

`src/features/recruitment/actions/applications.ts:262,298-299` bloqueia movimentos para `stage.kind='hired_terminal'` com `code: 'HIRING_NOT_AVAILABLE_IN_ONDA_1'` e mensagem "Contratação disponível em breve." — texto e código mentem sobre o estado do produto. Onda 2 já está commitada e o wizard de contratação existe.

Na prática o usuário nunca vê a mensagem: `Kanban.tsx:149,188` intercepta drop em `hired_terminal` e abre `HireCandidateDialog` antes de chamar `moveApplicationStage`. **Mas** o guard continua sendo defesa-em-profundidade legítima da invariante spec 13 §4.5 (status='hired' só via `hireCandidate` que cria `employee`).

### 3.2 Mudança

```ts
// Antes
// Bloqueio pro MVP Onda 1: não permite mover para stage kind='hired_terminal'.
if (target.kind === 'hired_terminal') {
  return { error: 'Contratação disponível em breve.', code: 'HIRING_NOT_AVAILABLE_IN_ONDA_1' };
}

// Depois
// Invariante do schema (spec 13 §4.5): status='hired' implica stage kind='hired_terminal'
// e só é atingido via hireCandidate (que cria o employee). Drop direto aqui seria um bypass.
if (target.kind === 'hired_terminal') {
  return {
    error: 'Para contratar use o assistente (drop em "Contratado" abre o wizard).',
    code: 'USE_HIRE_ACTION',
  };
}
```

### 3.3 Testes

- `actions/applications.test.ts` — ajustar assert que valida `code` do error retornado ao mover para `hired_terminal`.

### 3.4 Arquivos tocados

- `src/features/recruitment/actions/applications.ts` (2-3 linhas)
- `src/features/recruitment/actions/applications.test.ts` (se existir assert do código antigo)

---

## 4. Correção #1 — Flag `notifies_hiring_manager`

### 4.1 Situação

Spec 14 §4 exige migration aditiva com `ALTER TABLE recruitment_stages ADD COLUMN notifies_hiring_manager boolean NOT NULL DEFAULT false`, UPDATE para etapa default "Entrevista Gestor", e `CREATE OR REPLACE FUNCTION seed_recruitment_stages()` incluindo a coluna. Spec 14 §5.11 exige toggle na UI de Configurações > Etapas. Spec 14 §6.5 diz que `moveApplicationStage` deve disparar a notificação quando `target.notifies_hiring_manager=true`.

A coluna nunca foi criada (grep em `supabase/migrations/` por `notifies_hiring_manager` retorna zero matches). O código em `applications.ts:347` usa heurística `target.name === 'Entrevista Gestor'`, com comentário autoconfessando o débito: "Na Onda 3 isso virá da flag `notifies_hiring_manager`". `RecruitmentStagesManager.tsx` também não tem toggle.

Consequência: empresas com etapas renomeadas/customizadas não recebem a notificação.

### 4.2 Migration

Arquivo: `supabase/migrations/20260620_0001_ft7_onda1_notifies_hiring_manager.sql`

```sql
-- FT-7 Onda 1 (retroativo) — flag notifies_hiring_manager
-- Spec: docs/dev/14-ft-7-onda1-vagas-candidatos.md §4
-- Correção: docs/dev/17-ft-7-correcoes-pos-auditoria.md §4

ALTER TABLE recruitment_stages
  ADD COLUMN notifies_hiring_manager boolean NOT NULL DEFAULT false;

-- Empresas que mantiveram o nome default da etapa ganham a flag automaticamente.
-- Empresas que renomearam precisam ligar manualmente via Configurações > Etapas.
UPDATE recruitment_stages
  SET notifies_hiring_manager = true
  WHERE name = 'Entrevista Gestor' AND kind = 'intermediate';

-- Seed para novas companies passa a incluir a flag.
CREATE OR REPLACE FUNCTION seed_recruitment_stages() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO recruitment_stages (company_id, name, position, kind, notifies_hiring_manager) VALUES
    (NEW.id, 'Cadastrado',        1, 'entry',          false),
    (NEW.id, 'Triagem',           2, 'intermediate',   false),
    (NEW.id, 'Entrevista RH',     3, 'intermediate',   false),
    (NEW.id, 'Entrevista Gestor', 4, 'intermediate',   true),
    (NEW.id, 'Teste / Case',      5, 'intermediate',   false),
    (NEW.id, 'Proposta',          6, 'intermediate',   false),
    (NEW.id, 'Contratado',        7, 'hired_terminal', false);
  RETURN NEW;
END;
$$;
```

A policy UPDATE de `recruitment_stages` já é `admin_rh only` e cobre a flag sem mudança (Fundação §5.2).

### 4.3 Código

- `src/lib/supabase/types.ts` — adicionar `notifies_hiring_manager: boolean` em `recruitment_stages.Row/Insert/Update`.
- `src/features/recruitment/schema.ts` — estender `RecruitmentStageSchema` e `UpdateRecruitmentStageInputSchema` com `notifies_hiring_manager: z.boolean().optional()`.
- `src/features/recruitment/queries/stages.ts` — garantir que o SELECT devolve o campo.
- `src/features/recruitment/actions/stages.ts` — `updateRecruitmentStage` passa a aceitar e persistir o campo; rejeita mudança quando `stage.kind ≠ 'intermediate'` (spec 14 §5.11: entry e hired_terminal não aceitam toggle).
- `src/features/recruitment/actions/applications.ts` — trocar `target.name === 'Entrevista Gestor'` por `target.notifies_hiring_manager === true`; remover comentário que indica débito técnico.
- `src/features/recruitment/components/RecruitmentStagesManager.tsx` — nova coluna "Notifica gestor" na tabela, checkbox editável só em linhas com `kind='intermediate'`, com update otimista chamando `updateRecruitmentStage({id, notifies_hiring_manager})`.

### 4.4 Auditoria (reuso)

Nenhum novo `ActivityAction`. O evento `recruitment_stage.updated` existente absorve a mudança de `notifies_hiring_manager`.

### 4.5 Testes

- `actions/stages.test.ts` — `updateRecruitmentStage` aceita o campo; bloqueia para `kind='entry'` e `kind='hired_terminal'`.
- `actions/applications.test.ts` — `moveApplicationStage` dispara notificação `recruitment.candidate_in_manager_stage` quando target.notifies_hiring_manager=true; não dispara quando false.

### 4.6 Arquivos tocados

- `supabase/migrations/20260620_0001_ft7_onda1_notifies_hiring_manager.sql` (novo)
- `src/lib/supabase/types.ts`
- `src/features/recruitment/schema.ts`
- `src/features/recruitment/queries/stages.ts`
- `src/features/recruitment/actions/stages.ts`
- `src/features/recruitment/actions/applications.ts`
- `src/features/recruitment/components/RecruitmentStagesManager.tsx`
- testes correspondentes

---

## 5. Correção #3a — Filtros do dashboard

### 5.1 Situação

O dashboard atual (`/recrutamento/relatorios`) só lê `?period=` da URL e exibe métricas globais. Falta: chips interativos, popover de calendário para "Personalizado", busca de candidato, MultiSelect de Vaga e de Responsável — tudo especificado em spec 16 §7.2/§7.3 e no mockup `dashboard-final-integrado.html` aprovado em brainstorm.

### 5.2 Arquitetura

```
src/app/(app)/recrutamento/relatorios/page.tsx           (Server Component)
  ├── Carrega searchParams e constrói MetricsFilter
  ├── Promise.all: 6 queries de métricas + jobsForFilter + employeesForFilter
  │      (jobsForFilter respeita RLS — gestor vê só suas vagas)
  └── <RelatoriosDashboard data={...} filterOptions={{jobs, employees}} />

src/features/recruitment/components/RelatoriosDashboard.tsx    ('use client')
  ├── <DashboardFilters filterOptions={filterOptions} />
  ├── <KpiRow kpis={data.kpis} />
  ├── <FunnelChart funnel={data.funnel} />
  ├── <OriginsChart origins={data.origins} />             (#3a: mantém; muda em #3b)
  ├── <StageDurationsList durations={data.durations} />   (#3a: mantém; muda em #3b)
  ├── <StalledTable stalled={data.stalled} />
  └── <OverdueTasksTable overdue={data.overdue} />

src/features/recruitment/components/dashboard/DashboardFilters.tsx    ('use client', novo)
  ├── <PeriodChips value={...} onChange={...} />   (7d / 30d / 90d / 📅 Personalizado)
  │    └── <CustomPeriodPopover ... />             (só abre se chip Personalizado selecionado)
  ├── <SearchInput />                              (debounce 300ms)
  ├── <MultiSelectFilter label="Vaga" items={filterOptions.jobs} />
  └── <MultiSelectFilter label="Responsável" items={filterOptions.employees} />
```

**Decisão de arquitetura:** page.tsx continua Server (gráficos renderizam no server); só `RelatoriosDashboard` e `DashboardFilters` viram client — este último lê/escreve URL via `useSearchParams` + `useRouter`.

### 5.3 MetricsFilter estendido

```ts
// src/features/recruitment/queries/metrics.ts
export interface MetricsFilter {
  companyId: string;
  from: Date | null;
  to: Date | null;
  jobIds: string[] | null;        // null = todas visíveis
  ownerIds: string[] | null;      // null = todos
  candidateQuery: string | null;  // null = sem busca
  viewerEmployeeId: string | null;
  viewerRole: 'admin_rh' | 'director' | 'gestor';
}
```

Regra para `viewerRole='gestor'`:
- Se `jobIds=null`, a query internamente restringe a "vagas onde o employee é hiring_manager".
- Se `jobIds!=null`, a query intersecta com as vagas dele (nunca expande).
- `ownerIds` similarmente restrito.

Todas as 6 queries existentes (`getMetricsKpis`, `getFunnel`, `getOriginsBreakdown`, `getStageDurations`, `getStalledCandidates`, `getOverdueTasks`) passam a aplicar WHERE clauses derivadas do filter estendido.

### 5.4 Novas queries auxiliares

Mesmo arquivo `metrics.ts`:

```ts
export async function getJobsForFilter(
  companyId: string, viewer: { role: string; employeeId: string | null },
): Promise<Array<{ id: string; title: string }>>;

export async function getManagersForFilter(
  companyId: string, viewer: { role: string; employeeId: string | null },
): Promise<Array<{ id: string; name: string }>>;
```

Ambas respeitam RLS e o escopo do viewer (gestor não vê vagas de outros no MultiSelect).

### 5.5 Popover "Personalizado"

- Dependência nova: `react-day-picker` + `date-fns` (peer).
- Novo arquivo: `src/components/ui/calendar.tsx` (boilerplate shadcn oficial).
- Componente: `src/features/recruitment/components/dashboard/CustomPeriodPopover.tsx` — usa `<Popover>` shadcn existente; dentro, 2 meses lado a lado via `<Calendar mode="range" numberOfMonths={2}>`; footer com botão "Tudo" (ghost, seta `?period=all`) e "Aplicar" (primary, seta `?from=...&to=...`); "Aplicar" desabilitado se range incompleto ou `from > to`.

### 5.6 URL state

Shape: `?period=30d` (preset) OU `?from=YYYY-MM-DD&to=YYYY-MM-DD` (custom) OU `?period=all`. Opcional: `&job_ids=uuid1,uuid2&owner_ids=uuid3&q=maria`. Default quando tudo vazio: `?period=30d`.

`DashboardFilters` constrói nova URL a cada mudança e chama `router.replace(url, {scroll: false})` para atualizar sem recarregar.

### 5.7 Testes

- `DashboardFilters.test.tsx` — clique em chip atualiza URL; debounce da busca; MultiSelect atualiza `job_ids`.
- `CustomPeriodPopover.test.tsx` — seleção de range chama `onApply({from, to})`; "Tudo" chama `onApply({all:true})`.
- `queries/metrics.test.ts` — gestor filtrado para suas vagas; `ownerIds` restringe corretamente; `candidateQuery` aplica `ILIKE`.

### 5.8 Arquivos tocados

- `package.json` + lockfile (react-day-picker + date-fns)
- `src/components/ui/calendar.tsx` (novo)
- `src/features/recruitment/components/dashboard/DashboardFilters.tsx` (novo)
- `src/features/recruitment/components/dashboard/PeriodChips.tsx` (novo)
- `src/features/recruitment/components/dashboard/CustomPeriodPopover.tsx` (novo)
- `src/features/recruitment/components/RelatoriosDashboard.tsx` (refactor para client + orquestração)
- `src/app/(app)/recrutamento/relatorios/page.tsx` (parse de searchParams estendido + carrega filter options)
- `src/features/recruitment/queries/metrics.ts` (MetricsFilter estendido + WHERE clauses + 2 queries novas)
- testes correspondentes

---

## 6. Correção #3b — Gráficos e tooltips ricos

### 6.1 Situação

Spec 16 §7.6 (donuts gêmeos) e §7.7 (lollipop) e §7.10 (tooltips ricos) são os componentes visuais centrais do dashboard. A implementação atual usa bar chart horizontal para origens + lista simples para tempo por etapa, tudo com tooltip default do Recharts.

Decisão P47/P51 da spec 16 validada em `.superpowers/brainstorm/1308-1776739536/content/dashboard-final-integrado.html`: origens como donuts gêmeos (candidatos × contratados) com legenda compartilhada; tempo como lollipop vertical com gargalo (>5d) em vermelho.

### 6.2 Decisão de biblioteca (híbrido, ratificado P4)

- **Donuts gêmeos** → `<PieChart>` do Recharts × 2, legenda externa compartilhada. Tooltip via `content={<CustomTooltip/>}`.
- **Lollipop** → SVG/divs custom (tradução direta do mockup), `<HoverCard>` do shadcn em cada dot para tooltip rico.
- **Funil** → mantém as divs atuais; envolve cada linha em `<HoverCard>` do shadcn para tooltip rico. Nenhuma reescrita da estrutura.

### 6.3 Componentes novos

#### `src/features/recruitment/components/dashboard/OriginsDualDonut.tsx`

Props: `{candidates: Array<{source, label, count, percent, color}>, hired: Array<{...}>}`. Renderiza grid 1:1 com 2 `<PieChart>` (Recharts), cada um com `<Pie innerRadius={40} outerRadius={60}>` + Cells coloridas. Legenda compartilhada em grid de 5 colunas abaixo dos donuts. Custom tooltip:

```
LinkedIn
──────────
Candidatos  54
Contratados 0
Taxa        0%
```

#### `src/features/recruitment/components/dashboard/StageDurationsLollipop.tsx`

Props: `{durations: StageDuration[]}`. Renderiza uma `<div>` com `display:flex items-end` de altura fixa (~180px); cada coluna = barra fina (linha) + círculo com número. Cor laranja default; vermelho se `isBottleneck=true`. `<HoverCard>` do shadcn em cada dot:

```
Entrevista Gestor
──────────────────
Mediana      8d
Média       11d
Mínimo       2d
Máximo      21d
Ativos      34
⚠ gargalo (> 5d)
```

#### `FunnelChart` (modificado, não reescrito)

Envolve cada `.funil-bar` em `<HoverCard>`:

```
Entrevista Gestor
──────────────────
Candidatos na etapa    34
Conversão da anterior  67%
Avançaram              20 (59%)
Reprovados/desistiram  14 (41%)
Mediana na etapa        8d
```

### 6.4 Queries estendidas (`metrics.ts`)

```ts
// getFunnel retorna agora, por linha:
{
  stageId: string;
  stageName: string;
  stagePosition: number;
  count: number;
  conversionFromFirst: number;      // já existe
  conversionFromPrev: number;        // NOVO
  advancedCount: number;             // NOVO (candidates que passaram desta etapa adiante)
  rejectedOrWithdrawnCount: number;  // NOVO
  medianDaysInStage: number | null;  // NOVO
}

// getOriginsDualDonut — NOVA (substitui getOriginsBreakdown no uso do componente)
{
  candidates: Array<{ source: string; label: string; count: number; percent: number; color: string }>;
  hired:      Array<{ source: string; label: string; count: number; percent: number; color: string }>;
}

// getStageDurations — verificar em implementação atual se devolve { medianDays, meanDays, minDays, maxDays, activeCount, isBottleneck } conforme spec 16 §7.7.
// Se faltar qualquer campo (especialmente meanDays/minDays/maxDays/activeCount), estender a query nesta correção.
```

### 6.5 Componentes removidos

- Bar chart de origens + lista "Contratados por origem" no `RelatoriosDashboard.tsx` atual → substituído por `OriginsDualDonut`.
- Lista "Tempo mediano por etapa" no `RelatoriosDashboard.tsx` atual → substituído por `StageDurationsLollipop`.

### 6.6 Testes

- `OriginsDualDonut.test.tsx` (render) — renderiza 2 PieCharts + legenda compartilhada; tooltip custom monta labels esperadas.
- `StageDurationsLollipop.test.tsx` (render) — gargalos renderizam em vermelho; HoverCard mostra campos.
- `queries/metrics.test.ts` — `getOriginsDualDonut` separa corretamente candidates e hired; `getFunnel` calcula `conversionFromPrev` com base na etapa anterior.

### 6.7 Arquivos tocados

- `src/features/recruitment/queries/metrics.ts` (getFunnel estendido; getOriginsDualDonut novo)
- `src/features/recruitment/components/dashboard/OriginsDualDonut.tsx` (novo)
- `src/features/recruitment/components/dashboard/StageDurationsLollipop.tsx` (novo)
- `src/features/recruitment/components/RelatoriosDashboard.tsx` (troca dos dois blocos)
- `src/features/recruitment/components/dashboard/FunnelChart.tsx` (extraído do dashboard ou modificado in-place com HoverCard)
- testes correspondentes

---

## 7. Dependências entre commits

```
#4  ── independente ──────────────────────────►
#1  ── independente ──────────────────────────►
#3a ── independente ──────────────────────────►
#3b ── depende de #3a (MetricsFilter estendido)
```

Recomendação de ordem (também refletida no plan): #4 → #1 → #3a → #3b.

A ordem #4 → #1 é só conveniência (pequeno antes de médio); nada técnico impede invertê-las. #3b depende do #3a estar merged para reutilizar o MetricsFilter estendido.

---

## 8. Critérios de aceite consolidados

**Correção #4**
1. `moveApplicationStage` retornando target de `kind='hired_terminal'` devolve `code: 'USE_HIRE_ACTION'` e a nova mensagem.
2. Assert do teste antigo de `HIRING_NOT_AVAILABLE_IN_ONDA_1` foi atualizado e passa.
3. Drop no Kanban em "Contratado" continua abrindo o wizard normalmente (não passa pela action).

**Correção #1**
4. Migration aplica sem erro em company existente; coluna criada com default `false`.
5. Empresas que mantiveram nome default da etapa "Entrevista Gestor" têm `notifies_hiring_manager=true` após o UPDATE.
6. Seed de nova company cria 7 etapas com a flag `true` apenas em "Entrevista Gestor".
7. Admin acessa `/recrutamento/etapas`, vê coluna "Notifica gestor" com checkbox; edita em etapa `intermediate`; persiste; toggle em `entry`/`hired_terminal` é impossível (checkbox desabilitado e server rejeita).
8. Mover candidato para etapa com `notifies_hiring_manager=true` (que não seja "Entrevista Gestor") dispara `recruitment.candidate_in_manager_stage`.
9. Comentário de débito técnico removido de `applications.ts:346`.

**Correção #3a**
10. `/recrutamento/relatorios` renderiza chips 7d/30d/90d/📅 Personalizado no PageHeader; chip selecionado tem destaque laranja; default `30d`.
11. Clique em "📅 Personalizado" abre popover com calendário duplo; range se preenche conforme cliques; botões "Tudo" e "Aplicar" no rodapé; "Aplicar" desabilitado se range inválido.
12. Barra de filtros abaixo do header com Buscar candidato (debounce 300ms) + MultiSelect Vaga + MultiSelect Responsável.
13. URL reflete estado: `?period=30d&job_ids=a,b&owner_ids=c&q=maria`. Recarregar a página preserva o estado.
14. Gestor vê no MultiSelect Vaga apenas vagas onde é hiring_manager.
15. Todas as 6 queries existentes aplicam filtros combinadamente (período + vaga + responsável + busca).

**Correção #3b**
16. Origens renderizam como 2 donuts (Candidatos · Contratados) com legenda compartilhada em 5 colunas abaixo.
17. Tempo por etapa renderiza como lollipop vertical; etapas com mediana >5d ficam em vermelho.
18. Hover em cada dot do lollipop mostra HoverCard com mediana/média/min/max/ativos/flag gargalo.
19. Hover em cada linha do funil mostra HoverCard com count/conversão geral/conversão vs etapa anterior/avançados/reprovados-desistentes/mediana na etapa.
20. Hover em cada fatia do donut mostra tooltip com origem/candidatos/contratados/taxa.

**Regressão**
21. Os 226 testes existentes + todos os novos passam.
22. `pnpm lint` e `pnpm typecheck` zero erros.
23. Nenhum comportamento já validado (Kanban DnD, saídas laterais, feedback, wizard, scorecard, tarefas) quebra.

---

## 9. Fora de escopo deste spec

- Cross-filter entre gráficos do dashboard (clicar numa etapa filtra os outros) — postponed spec 16.
- Tela global `/recrutamento/tarefas` — postponed spec 16.
- Exportação CSV/XLSX dos relatórios — postponed spec 16.
- Notificação `recruitment.feedback_requested` (continua dormente).
- Reativação de candidato contratado — postponed spec 15.
- Reescrita/alinhamento retroativo dos specs 13–16 quanto à rota `/configuracoes/etapas-recrutamento` → `/recrutamento/etapas`.

---

## 10. Decisões do brainstorm desta auditoria

| # | Pergunta | Escolha |
|---|---|---|
| P1 | Alvo da reconstrução do dashboard | A — seguir fielmente `dashboard-final-integrado.html` |
| P2 | Escopo do commit da correção #1 | A — tudo junto (migration + action + UI do toggle) |
| P3 | Popover "📅 Personalizado" | A — instalar `react-day-picker` + shadcn `Calendar` |
| P4 | Implementação dos gráficos | C — híbrido (Recharts nos donuts; SVG no lollipop; `HoverCard` nos tooltips) |
| P5 | Faseamento dos commits | B — 4 commits (#4, #1, #3a filtros, #3b gráficos) |

---

## 11. Referências

- Specs: `docs/dev/13-ft-7-fundacao.md` · `14-ft-7-onda1-vagas-candidatos.md` · `15-ft-7-onda2-feedback-contratacao.md` · `16-ft-7-onda3-metricas-scorecard-tarefas.md`
- Relatório de auditoria: gerado nesta sessão (consolidado neste spec §2).
- Mockups aprovados: `.superpowers/brainstorm/1308-1776739536/content/` (14 arquivos).
- Transversais: `docs/dev/00-decisoes-transversais.md`.
