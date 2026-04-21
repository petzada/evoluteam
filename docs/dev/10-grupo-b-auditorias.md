# Grupo B — Auditorias / diagnósticos — 2026-04-20

Relatórios de divergência do código atual contra as specs decididas em
`docs/dev/09-brainstorm-correcoes.md`. **Sem aplicar correções ainda** — este documento é o
que o usuário vai revisar para priorizar os fixes.

Três auditorias independentes:

- **#6** — 10 KPIs do dashboard
- **#8 (parte 2)** — filtros em colaboradores, avaliações, PDI, feedbacks
- **#12** — código real × matriz de permissões

Legenda: ✅ ok · ⚠ suspeito (decidir se corrige) · ❌ divergente (precisa corrigir)

---

## #6 — KPIs e gráficos do dashboard

Fonte: `src/features/dashboard/queries.ts` · consumido por
`src/app/(app)/dashboard/page.tsx` e `src/features/dashboard/components/*`.

### Sumário por indicador

| # | Indicador | Query | Status | Observação |
|---|---|---|---|---|
| 1 | Colaboradores ativos | `countActiveEmployees(scope)` | ✅ | Respeita scope (admin → empresa, gestor → descendentes) |
| 2 | Ciclos ativos | `countActiveCycles(companyId)` | ⚠ | **Não usa scope** — gestor vê número da empresa inteira |
| 3 | Avaliações pendentes | `getAssignmentStats(scope).pending + inProgress` | ✅ | Filtra por `reviewee_id in scope` |
| 4 | Taxa de conclusão | `getAssignmentStats(scope).completionRate` | ⚠ | Denominador inclui `cancelled` → taxa fica artificialmente baixa |
| 5 | Média geral | `getOverallAverage(scope)` | ✅ | Ponderação per-reviewee consciente (evita viés por nº de perguntas) |
| 6 | Média por depto (bar chart) | `getAveragePerDepartment(scope)` | ✅ | Mesma lógica do #5, agrupado — bem estruturado |
| 7 | Radar de competências | `getCompetencyAverages(scope)` | ⚠ | **Média flat** (todas as respostas) — inconsistente com #5/#6 que ponderam per-reviewee |
| 8 | PDIs ativos | `countActivePdis(scope)` | ⚠ | Pode sobrepor com #9 (PDI atrasado ainda é contado como ativo) |
| 9 | PDIs atrasados | `countOverduePdis(scope)` | ✅ | `due_date < today` + status not in `(concluído, cancelado)` — sólido |
| 10 | Sem feedback (90d) | `countEmployeesWithoutRecentFeedback(scope)` | ✅ | Conta recipients ativos que não receberam feedback nos últimos 90d |

### Detalhe dos ⚠

#### ⚠ #2 — Ciclos ativos não respeita scope

`queries.ts:144-152` — só filtra por `company_id` + `status='published'`. Um gestor vê "3 ciclos
ativos" mesmo que seus subordinados estejam em apenas 1.

**Interpretações:**
- **Intencional** → "ciclo é artefato organizacional; é informativo saber quantos existem".
  Nesse caso, o label deveria deixar explícito: ~~"Ciclos ativos"~~ → "Ciclos ativos na empresa".
- **Bug** → filtrar por ciclos em que pelo menos um `reviewee_id` do scope tem assignment.

**Recomendação para discussão:** se a intenção é "o gestor saber quais ciclos afetam a equipe dele",
adotar a segunda leitura. Se é "painel de contexto organizacional", primeira.

#### ⚠ #4 — Taxa de conclusão com `cancelled` no denominador

`queries.ts:187-193`:

```ts
const total = rows.length;          // inclui cancelled
const submitted = rows.filter(r => r.status === 'submitted').length;
const completionRate = total > 0 ? (submitted / total) * 100 : null;
```

Exemplo real: ciclo com 10 assignments, 2 cancelados, 8 submitted → taxa exibida = **80%**.
Mas todos os assignments "vivos" foram respondidos — taxa real de conclusão = **100%**.

**Recomendação:** `submitted / (total - cancelled)`. Se `total - cancelled === 0`, retornar `null`.

#### ⚠ #7 — Radar usa média flat vs. #5/#6 usam per-reviewee

`queries.ts:414-430`:

```ts
for (const [compId, values] of data.answersByCompetency) {
  const a = avg(values);  // média direta de TODAS as respostas (scale_value)
  ...
}
```

Comparado a `#5 getOverallAverage` que calcula per-competência → per-reviewee → global,
o radar mistura respostas de todos os reviewees numa única média por competência.

**Impacto:** colaboradores com mais perguntas pesam mais no radar, mas não no "Média geral".
O gráfico radar pode mostrar um valor "maior" que a média geral em alguns cenários — confuso
para o usuário que vê os dois ao lado.

**Recomendação:** normalizar o radar para usar mesma ponderação (média das médias per-reviewee).
Implementação: iterar `answersByReviewee_Competency` em vez de `answersByCompetency`.

#### ⚠ #8 — "PDIs ativos" inclui atrasados

`queries.ts:433-455` — filtra `status in ['nao_iniciado', 'em_andamento']`. Um PDI
"em andamento" com `due_date` passada é **atrasado** mas também é contado como **ativo**.

**Resultado:** um mesmo PDI aparece em `ativos` E em `atrasados` → o usuário lendo os dois cards
pode pensar que são duas coisas distintas.

**Interpretações:**
- **Intencional** → "atrasados é subset de ativos". Labels deveriam expor: ~~PDIs ativos~~ →
  "PDIs em andamento", com "Atrasados" como refino (subset). Seria até útil mostrar como ratio:
  "3 atrasados de 12 ativos".
- **Bug** → "PDIs ativos" deveria excluir atrasados (serem mutuamente exclusivos no dashboard).

**Recomendação:** manter a inclusão (é a verdade operacional), mas **renomear** "PDIs ativos" →
"PDIs em andamento" e talvez exibir inline: "12 (3 atrasados)" usando o hint do card.

---

## #8 (parte 2) — Auditoria dos filtros

### /colaboradores (`EmployeesList.tsx`)

| Filtro | Fonte das opções | Comportamento | Status |
|---|---|---|---|
| Busca texto | `search` state | `full_name.toLowerCase().includes()` OR `email.toLowerCase().includes()` | ✅ |
| Status | `STATUS_FILTER_ITEMS` (estático) | Compara contra `deriveStatus(emp)` | ✅ |
| Cargos | `getPositions(companyId)` com `includeArchived: false` | Match por `emp.position.id ∈ positionFilter` | ✅ |
| Departamentos | `getDepartments(companyId)` com `includeArchived: false` | Match por `emp.department?.id ∈ departmentFilter` (aceita `__none__` para "Sem departamento") | ✅ |
| Gestor | `activeManagers` (fixado em #8 parte 1) | Match por `emp.manager_id ∈ managerFilter` | ✅ (após fix) |

**Observação:** como os dropdowns usam cargos/departamentos **não-arquivados**, um colaborador
com cargo/depto arquivado **não pode ser filtrado por esse cargo/depto**. Ele continua aparecendo
na lista geral, mas invisível ao filtro correspondente. **Comportamento razoável** — arquivar
significa ocultar o registro. Se o cliente quiser ver listas de pessoas em cargos arquivados,
precisamos adicionar um toggle "Incluir arquivados".

### /avaliacoes (`CyclesList.tsx`)

| Filtro | Fonte | Comportamento | Status |
|---|---|---|---|
| Busca | `search` | Match por `c.name.toLowerCase().includes()` | ✅ |
| Status | Estático: all, published, draft, scheduled, in_progress, closed, archived | Compara com `c.status` (raw) ou `deriveStatus(c)` (derivado) | ⚠ |

**⚠** — o filtro "Publicados" faz match direto em `c.status === 'published'`, mas os demais
(scheduled, in_progress, closed, archived) usam `deriveStatus(c)` que considera datas + status.
**Inconsistência:** um ciclo publicado cuja janela de resposta já acabou pode ter `deriveStatus`
= `closed` (por data) mas `c.status` = `published` (por DB). O filtro "Publicados" inclui esse
caso; "Encerrado" também → aparece em dois filtros.

**Recomendação:** documentar a decisão (o filtro "Publicados" é "ciclos que estão na fase
pública, mesmo que já vencida") ou harmonizar (sempre usar `deriveStatus`).

### /pdi (`PdisPage.tsx`)

| Filtro | Fonte | Comportamento | Status |
|---|---|---|---|
| Status | `FILTER_STATUSES` (const) | Compara com `computePdiStatus(r)` — derivado | ✅ |
| Competências | `competencies` (prop da página) + opção "Sem competência" | Match por `r.competency_id ∈ competencyFilter` | ✅ |
| Período (due_date) | Estático: all, 30d, 90d, 6m, 1y | Filtra `due_date >= today + N` | ✅ |

**Observação:** não há busca por texto. Se a lista ficar grande, um `search` por título de PDI
seria útil, mas **fora do escopo** da #8.

### /feedbacks (`FeedbacksPage.tsx`)

| Filtro | Fonte | Comportamento | Status |
|---|---|---|---|
| Tipos | `FEEDBACK_TYPES` (const) | Match por `r.type ∈ typeFilter` | ✅ |
| Competências | `competencies` + "Sem competência" | Match por `r.competency_id ∈ competencyFilter` | ✅ |
| Período (created_at) | Estático: all, 30d, 6m, 1y | Filtra `created_at >= today - N` | ✅ |

**Observação:** idem PDI — sem busca por texto. Out of scope.

### Achados globais

- ✅ Cargo e Departamento corretamente filtram arquivados.
- ✅ Gestor corrigido (parte 1 do Grupo A).
- ⚠ Avaliações — inconsistência `c.status` vs `deriveStatus(c)` no filtro "Publicados". Decidir.
- Busca por texto ausente em PDI e Feedbacks — anotar como possível melhoria futura.

---

## #12 — Código real × matriz de permissões

Fontes de verdade de permissão:

- `src/proxy.ts` (middleware) — gate de rotas
- `src/features/dashboard/permissions.ts` — dashboard + filtro departamento
- `src/features/employees/permissions.ts` — colaboradores
- `src/features/reviews/permissions.ts` — ciclos + resultados
- `src/features/pdi/permissions.ts` — PDI + ações + comentários
- `src/features/feedbacks/permissions.ts` — feedbacks
- Gates inline em server actions (employees, reviews, pdi, taxonomies, feedbacks)

### Sumário por área × role

Itens marcados com ✅ batem com a matriz #12 aprovada. ❌ divergem.

#### Dashboard

| Ação | Admin RH | Diretor | User gestor | User comum | Status |
|---|---|---|---|---|---|
| Acessar dashboard | ✓ | ✓ | ◐ escopo | ✗ redirect | ✅ (proxy + `canAccessDashboard`) |
| Filtrar por depto | ✓ | ✓ | ✗ | ✗ | ✅ (`canFilterByDepartment`) |

#### Colaboradores

| Ação | Spec | Código | Status |
|---|---|---|---|
| Ver lista | admin ✓ / dir ✓ / gestor ◐ / user ✗ | **`/colaboradores/page.tsx` não tem gate por role** — tudo é filtrado em query com RLS | ❓ VERIFICAR RLS |
| Ver ficha | admin ✓ / dir ✓ / gestor ◐ / user próprio | `canViewEmployee` correto | ✅ |
| Criar/convidar | admin ✓ / demais ✗ | `employees/actions.ts:62` admin-only | ✅ |
| Editar | admin ✓ / demais ✗ | `canEditEmployee`: só admin | ✅ |
| Alterar role | admin ✓ / demais ✗ | `employees/actions.ts:285` admin-only + guards anti-auto-mudança | ✅ |
| Desligar / reativar | admin ✓ / demais ✗ | `canTerminate`, `canDeactivate` admin-only + anti-self | ✅ |

**❓** — precisa conferir as RLS policies da tabela `employees` no Supabase. Se a lista de
colaboradores estiver "tudo público para quem está autenticado na company", estamos OK porque
o filtro de escopo vem via UI + actions. Mas é prudente validar as policies antes de afirmar.

#### Avaliações

| Ação | Spec | Código | Status |
|---|---|---|---|
| Ver ciclos | admin ✓ / dir ✓ / user ◐ onde participa | `canSeeCycle` | ✅ |
| Criar/editar ciclo | admin ✓ / demais ✗ | `canCreateCycle`, `canEditCycle` | ✅ |
| Publicar/encerrar | admin ✓ / demais ✗ | `reviews/actions.ts` `requireAdmin` | ✅ |
| Responder (designado) | todos ✓ (se reviewer) | `canAnswerAssignment` | ✅ |
| Ver resultados | admin ✓ / dir ✓ / gestor ◐ / user próprio se liberado | `canSeeResultOf` | ✅ |
| Liberar resultado | admin ✓ / demais ✗ | `canReleaseResult` | ✅ |

#### PDI

| Ação | Spec | Código | Status |
|---|---|---|---|
| Ver PDI | admin ✓ / dir ✓ / gestor ◐ / user próprio | `canViewPdi` | ✅ |
| Criar PDI | admin ✓ / dir ✗ / gestor ◐ só subordinados / user ◐ auto-PDI | `canCreatePdi` — **user sem subordinados NÃO pode criar auto-PDI** hoje: `targetEmployee.manager_id === actor.employeeId` falha se `targetEmployee === actor` | ❌ |
| Editar PDI | admin ✓ / dir ✗ / quem criou ◐ | `canEditPdiHeader` | ✅ |
| Editar ações | admin ✓ / dir ✗ / quem criou ◐ | `canAddAction` = `canEditPdiHeader` | ✅ |
| Atualizar status (responsável) | todos ✓ | `canUpdateActionStatus` | ✅ |
| Concluir/cancelar PDI | admin ✓ / quem criou | `canConcludePdi` / `canCancelPdi` | ✅ |
| Deletar PDI | admin ✓ / demais ✗ | `canDeletePdi` admin-only | ✅ |
| Comentar no PDI | admin ✓ / **dir ✗** / gestor ◐ / user próprio | `canCommentOnPdi` explicitamente nega director | ⚠ |

**❌ #PDI-1 (divergência clara):** `canCreatePdi` exige `targetEmployee.manager_id ===
actor.employeeId`. Como `actor.employeeId` é o próprio user comum e `targetEmployee.manager_id`
aponta para **outro** employee (o gestor dele), o auto-PDI do user comum está **bloqueado** hoje.

**Fix:** permitir também `targetEmployee.id === actor.employeeId` (auto-PDI) no `canCreatePdi`.
Isso é exatamente a decisão da **#11**.

**⚠ #PDI-2 (comentários):** `canCommentOnPdi` nega director. Mas a matriz #12 não é explícita
sobre comentar em PDI. Decisão pendente — **director pode comentar em PDIs que ele visualiza?**
Meu palpite: deveria poder (se vê, comenta).

#### Feedbacks

| Ação | Spec | Código | Status |
|---|---|---|---|
| Ver feedbacks empresa | admin ✓ / dir ✓ / gestor ◐ / user ◐ | Via RLS + queries específicas por `recipient/sender_id` | ❓ VERIFICAR RLS |
| Enviar feedback | todos ✓ | Ação sem gate de role, só valida sender=actor | ✅ |
| Remover feedback | admin ✓ / demais ◐ quem enviou | `feedbacks/permissions.ts` | ✅ (precisa confirmar que delete só funciona para author ou admin) |

**❓** — mesma consideração do `employees`: RLS policies devem bater com a spec.

#### Configurações

| Ação | Spec | Código | Status |
|---|---|---|---|
| Acessar `/configuracoes` | admin ✓ / demais ✗ | `proxy.ts:91` gate 403 se não admin (exceto `/perfil`) | ⚠ |
| Editar empresa | admin ✓ | page `redirect('/dashboard')` se não admin + action gate | ✅ |
| Cargos/depts/competências | admin ✓ | pages + `taxonomies/actions.ts` todos admin-only | ✅ |
| Auditoria | admin ✓ | page redirect se não admin | ✅ |
| Editar próprio perfil | todos ✓ | `/configuracoes/perfil` liberado | ✅ |

**⚠ proxy gate #CONFIG-1:** o gate `pathname !== '/configuracoes/perfil'` presume que **Meu
perfil fica dentro de Configurações**. Mas pela decisão da **#13**, "Meu perfil" sai de
`/configuracoes/` e vai viver só no dropdown do UserCard. Precisa reavaliar: ou
(a) manter a rota `/configuracoes/perfil` pra todos e redirecionar a partir do UserCard para lá,
ou (b) mover a rota para `/perfil` (sem `configuracoes/`) e ajustar o proxy pra permitir qualquer
user. Encaminhamento natural: (a) — rota não muda, só a navegação.

#### Sidebar (visibilidade de itens)

| Item sidebar | Regra atual | Regra esperada #12+#13 | Status |
|---|---|---|---|
| Dashboard | Todos | Todos (user comum mantido por #17 futuro) | ✅ |
| Colaboradores, Avaliações, Feedbacks, PDI | Todos | Todos | ✅ |
| Empresa/Depts/Cargos/Competências/Auditoria | `adminOnly: true` | `adminOnly: true` | ✅ |
| Perfil | Todos (hoje em CONFIG_NAV) | **Deve sair da sidebar** (acessível só via UserCard dropdown) | ❌ |

**❌ #SIDEBAR-1 (da #13):** Sidebar.tsx linha 35 ainda tem `{ label: 'Perfil', href:
'/configuracoes/perfil', icon: UserCircle }` no `CONFIG_NAV`. Precisa ser removido na
implementação da #13 (Grupo C).

### Achados priorizáveis

| ID | Divergência | Origem | Prioridade |
|---|---|---|---|
| #PDI-1 | Auto-PDI bloqueado por `canCreatePdi` | spec #11 | Alta — trava funcionalidade core |
| #CONFIG-1 | Proxy presume `/configuracoes/perfil` acessível a todos | spec #13 | Média — resolve naturalmente na #13 |
| #SIDEBAR-1 | "Perfil" ainda em CONFIG_NAV | spec #13 | Média — resolve na #13 |
| #PDI-2 | Director não comenta em PDI | esclarecer na #12 ampliada | Baixa — decidir se liberar |
| RLS-EMPLOYEES | Policies não verificadas contra scope | spec #12 | Alta — confirmar antes de declarar #12 ok |
| RLS-FEEDBACKS | Policies não verificadas | spec #12 | Alta |

### Recomendações de ordem

1. **Antes de qualquer ação:** examinar as RLS policies (migrations `20260419_0003_rls_policies.sql`
   e as de FT-2, FT-3, FT-4) e bater com a matriz #12. Se divergirem, a correção de PDI-1 não
   resolve nada sozinha.
2. Fixar **#PDI-1** antes do Grupo C (é bloqueio funcional).
3. **#SIDEBAR-1** e **#CONFIG-1** serão resolvidos como parte natural da implementação da #13 no
   Grupo C.
4. **#PDI-2** e as ambiguidades do #6 (KPIs ⚠) esperam sua decisão antes de virar fix.

---

## Decisões tomadas (2026-04-20)

| # | Ponto | Decisão |
|---|---|---|
| #6-KPI2 | Ciclos ativos sem scope | **Corrigir** — gestor vê só ciclos onde há assignment para reviewees do scope |
| #6-KPI4 | Taxa de conclusão inclui cancelled | **Corrigir** — fórmula: `submitted / (total - cancelled)` |
| #6-KPI7 | Radar flat × per-reviewee | **Corrigir** — normalizar para ponderação per-reviewee (mesma lógica de #5/#6) |
| #6-KPI8 | PDIs ativos inclui atrasados | **Manter inclusão**, **renomear** para "PDIs em andamento" + hint inline "(N atrasados)" |
| #8-Avaliacoes | "Publicados" usa `c.status` | **Harmonizar** — usar `deriveStatus(c)` para todos |
| #PDI-1 | `canCreatePdi` bloqueia auto-PDI | **Fix incluído no Grupo C** |
| #PDI-2 | Director não comenta em PDI | **Liberar** — director passa a comentar |
| RLS | Auditoria de policies | **Adiada** — não agora |

## Grupo C (consolidado)

O Grupo C agora absorve os fixes acima + os itens originais de UX estrutural:

1. Query fixes — KPI2, KPI4, KPI7, KPI8 (label), #PDI-1, #PDI-2, filtro Publicados
2. #5 Toolbar de filtros (consolidar padrão)
3. #13 Accordion sidebar + remover mini-sidebar + Perfil sai de CONFIG_NAV + `/configuracoes/page.tsx` redirect
4. #16 Breadcrumbs híbridos (Context Provider + regex UUID fallback)
5. #2+#15 Auditoria: labels completos + metadata whitelist + paginação
