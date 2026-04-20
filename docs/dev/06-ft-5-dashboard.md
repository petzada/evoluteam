# FT-5 — Dashboard de gestão de pessoas

Spec da feature de Dashboard básico (People Analytics MVP).
Equivale ao **Sprint 8** de `docs/ESTRUTURA.md` §18.
Depende de Fase 0 + FT-1 + FT-2 + FT-3 + FT-4.
Última atualização: 2026-04-20.

> **Leia antes:** `docs/dev/00-decisoes-transversais.md` + `docs/dev/01-fase-0-fundacao.md` + `docs/dev/02-ft-1-colaboradores.md` + `docs/dev/03-ft-2-avaliacoes.md` + `docs/dev/04-ft-3-feedbacks.md` + `docs/dev/05-ft-4-pdi.md`.

---

## 1. Objetivo

Substituir o stub da Fase 0 (`/dashboard`) por uma tela de indicadores reais que permita a `admin_rh`, `director` e gestores acompanharem o estado da gestão de pessoas da empresa (ou da equipe, no caso do gestor) em uma única visualização consolidada.

## 2. Escopo

### Dentro do MVP 1.0

- Página única scrollável com 3 seções: **Visão Geral** · **Desempenho** · **PDI & Feedbacks**.
- Header com filtro de ciclo (pré-selecionado = último ciclo ativo/encerrado) e filtro de departamento (`admin_rh` e `director` apenas).
- 10 KPIs distribuídos nas seções (ver §6 para fórmulas completas).
- Gráfico de barras horizontais por departamento + radar de competências (Recharts).
- Drill-down: KPIs clicáveis redirecionam para listas filtradas nas telas existentes.
- Gestor vê mesma estrutura com dados filtrados para sua equipe via escopo da query.
- Colaborador não acessa `/dashboard` — redirect para `/colaboradores/[self_id]`.
- Queries on-the-fly com `revalidatePath('/dashboard')` nas Server Actions relevantes.
- Substitui completamente o stub da Fase 0 (sem checklist de primeiros passos, sem saudação).
- Filtro `?filter=sem_feedback` adicionado a `/colaboradores` para suportar drill-down do KPI correspondente.

### Fora do MVP 1.0

- Filtro por gestor.
- People analytics avançado (previsões, risco de turnover).
- Matriz 9-box.
- Comparação histórica entre ciclos.
- Dashboards customizáveis.
- Export CSV/PDF do dashboard.
- Drill-down inline (listas dentro da própria página).
- Heatmap de competências.
- Notificações geradas pelo dashboard.

---

## 3. User stories

### Admin_rh / Director

- Users with permission should be able to ver o total de colaboradores ativos da empresa.
- Users with permission should be able to ver quantos ciclos de avaliação estão ativos.
- Users with permission should be able to ver quantas avaliações estão pendentes no ciclo selecionado.
- Users with permission should be able to ver a taxa de conclusão do ciclo selecionado.
- Users with permission should be able to ver a média geral de desempenho do ciclo selecionado.
- Users with permission should be able to ver a média de desempenho por departamento.
- Users with permission should be able to ver o radar de competências com médias do ciclo selecionado.
- Users with permission should be able to ver quantos PDIs estão ativos e quantos estão atrasados.
- Users with permission should be able to ver quantos colaboradores não receberam feedback nos últimos 90 dias.
- Users with permission should be able to filtrar todos os indicadores por ciclo de avaliação.
- Users with permission should be able to filtrar todos os indicadores por departamento.
- Users with permission should be able to clicar em KPIs para navegar às listas filtradas correspondentes.

### Gestor

- Gestores should be able to ver os mesmos indicadores acima, porém filtrados apenas para seus liderados diretos e indiretos.
- Gestores should not be able to ver o filtro de departamento (vê só a própria equipe).

---

## 4. Rota

```
/dashboard    (admin_rh, director, gestor — colaborador é redirecionado)
```

Sem sub-rotas. Stub da Fase 0 em `app/(app)/dashboard/page.tsx` é substituído integralmente.

---

## 5. Sem novas migrations

FT-5 não cria tabelas. Todas as queries leem de tabelas existentes:
`employees`, `departments`, `review_cycles`, `review_assignments`, `review_answers`, `review_questions`, `competencies`, `feedbacks`, `development_plans`.

---

## 6. Queries e KPIs

### Escopo dinâmico por papel

Todas as queries recebem um `scope` calculado no Server Component a partir do papel do usuário logado:

```typescript
// src/features/dashboard/queries.ts

type DashboardScope = {
  companyId: string;
  employeeIds: string[] | 'all'; // 'all' = admin_rh/director; array = gestor
  departmentId?: string;         // filtro de departamento selecionado
  cycleId: string;               // ciclo selecionado no filtro
};

async function buildScope(user: AuthUser, departmentId?: string, cycleId?: string): Promise<DashboardScope> {
  const companyId = user.companyId;
  const resolvedCycleId = cycleId ?? await getLastActiveCycleId(companyId);

  if (user.role === 'gestor') {
    const employeeIds = await getEmployeeDescendants(user.employeeId, companyId);
    return { companyId, employeeIds, cycleId: resolvedCycleId, departmentId: undefined };
  }

  return { companyId, employeeIds: 'all', cycleId: resolvedCycleId, departmentId };
}
```

### KPIs — fórmulas

| # | KPI | Seção | Fórmula |
|---|---|---|---|
| 1 | Colaboradores ativos | Visão Geral | `COUNT(employees WHERE status='active' AND [scope])` |
| 2 | Ciclos ativos | Visão Geral | `COUNT(review_cycles WHERE status='published' AND company_id=$1)` — não sofre filtro de departamento nem de gestor |
| 3 | Avaliações pendentes | Visão Geral | `COUNT(review_assignments WHERE cycle_id=$cycleId AND status IN ('pending','in_progress') AND reviewee_id IN [scope.employeeIds])` |
| 4 | Taxa de conclusão | Visão Geral | `COUNT(submitted) / NULLIF(COUNT(*),0) * 100` nos assignments do ciclo e escopo |
| 5 | Média geral | Desempenho | `AVG(review_answers.score) WHERE assignment.cycle_id=$cycleId AND answer.question_type='rating' AND reviewee_id IN [scope]` |
| 6 | Média por departamento | Desempenho | KPI 5 com `GROUP BY employee.department_id`; exibido como barras horizontais |
| 7 | Radar de competências | Desempenho | `AVG(score) GROUP BY question.competency_id` no ciclo e escopo; exibido como RadarChart |
| 8 | PDIs ativos | PDI & Feedbacks | `COUNT(development_plans WHERE status IN ('nao_iniciado','em_andamento') AND deleted_at IS NULL AND employee_id IN [scope])` |
| 9 | PDIs atrasados | PDI & Feedbacks | `COUNT(development_plans WHERE due_date < CURRENT_DATE AND status NOT IN ('concluido','cancelado') AND deleted_at IS NULL AND employee_id IN [scope])` |
| 10 | Sem feedback (90d) | PDI & Feedbacks | `COUNT(employees active IN [scope] WHERE NOT EXISTS feedback recebido nos últimos 90 dias)` |

### Drill-down — destinos dos KPIs clicáveis

| KPI | Destino do click |
|---|---|
| Colaboradores ativos | `/colaboradores?status=active` |
| Ciclos ativos | `/avaliacoes?status=published` |
| Avaliações pendentes | `/avaliacoes` (usuário vê as suas pendentes) |
| Taxa de conclusão | `/avaliacoes/[cycleId]` (aba de progresso) |
| PDIs ativos | `/pdi?status=em_andamento` |
| PDIs atrasados | `/pdi?status=atrasado` |
| Sem feedback (90d) | `/colaboradores?filter=sem_feedback` |
| Barra de departamento | `/colaboradores?department_id=[id]` |
| Segmento do radar | `/avaliacoes/[cycleId]/resultados` pré-filtrado por competência (se suportado) ou `/avaliacoes/[cycleId]` |

---

## 7. Componentes e telas

### 7.1. `/dashboard` (página completa)

**Header:**
- Título "Dashboard".
- Filtro de ciclo: dropdown com ciclos `published` e `closed` da empresa, pré-selecionado no último. Persiste em `searchParams` (`?cycle_id=...`).
- Filtro de departamento: dropdown com deptos da empresa + "Todos"; visível apenas para `admin_rh` e `director`. Persiste em `searchParams` (`?dept_id=...`).
- Gestor: nenhum filtro extra — dados já vêm filtrados pelo escopo.

**Seção 1 — Visão Geral:**
4 KPI cards em grid 2×2 (mobile) / 4×1 (desktop):
- Colaboradores ativos · Ciclos ativos · Avaliações pendentes · Taxa de conclusão (%).
- Cada card: número grande em destaque + label abaixo + ícone Lucide.
- Cor semântica: taxa de conclusão verde se ≥80%, amarelo 50–79%, vermelho <50%.
- Clicável: click no card inteiro navega para o destino de drill-down.

**Seção 2 — Desempenho:**
Layout de 2 colunas:
- **Coluna esquerda — Média por departamento:** barras horizontais (Recharts `BarChart` horizontal). Eixo X = score 0–5. Cada barra é clicável (drill-down para `/colaboradores?department_id=X`). Se ciclo sem dados: `<EmptyState>` "Nenhuma avaliação concluída neste ciclo ainda".
- **Coluna direita — Média geral + Radar de competências:** card com número grande (média geral) + `RadarChart` abaixo com as 7 competências. Radar exibe label de cada competência. Se menos de 3 competências com dados, exibe barras em vez de radar (Recharts `RadarChart` precisa de ≥3 pontos). Se sem dados: `<EmptyState>`.

**Seção 3 — PDI & Feedbacks:**
3 KPI cards em grid 3×1:
- PDIs ativos · PDIs atrasados (vermelho se >0) · Sem feedback 90d (amarelo se >0).
- Clicáveis conforme tabela de drill-down.

### 7.2. Comportamento do filtro de ciclo sem dados

Quando empresa não tem nenhum ciclo:
- Dropdown de ciclo: desabilitado, placeholder "Nenhum ciclo criado".
- Seção Desempenho: `<EmptyState>` com CTA "Criar primeiro ciclo" → `/avaliacoes/nova`.
- KPIs de avaliação mostram `—`.

### 7.3. Filtro `?filter=sem_feedback` em `/colaboradores`

Nova opção no filtro de status/tipo da listagem de colaboradores (FT-1):
- Exibe colaboradores ativos que não receberam feedback nos últimos 90 dias.
- Query: `employees active WHERE NOT EXISTS (SELECT 1 FROM feedbacks WHERE recipient_id = e.id AND created_at > NOW() - INTERVAL '90 days' AND deleted_at IS NULL)`.
- Label no chip: "Sem feedback (90d)".

### 7.4. `revalidatePath('/dashboard')` — quando disparar

Adicionar `revalidatePath('/dashboard')` nas Server Actions existentes:

| Action | Motivo |
|---|---|
| `createEmployee`, `updateEmployee` | Altera contagem de ativos |
| `publishCycle`, `closeCycle`, `archiveCycle` | Altera ciclos ativos/taxa |
| `submitAssignment` | Altera pendentes/taxa/médias |
| `releaseResult` | Altera médias visíveis |
| `sendFeedback` | Altera KPI de sem feedback |
| `createPdi`, `concludePdi`, `cancelPdi` | Altera PDIs ativos/atrasados |

---

## 8. Permissions

```typescript
// src/features/dashboard/permissions.ts

export function canAccessDashboard(actor: Actor): boolean {
  return ['admin_rh', 'director', 'gestor'].includes(actor.role)
    || isManager(actor.employeeId); // gestor derivado de manager_id
}

export function canFilterByDepartment(actor: Actor): boolean {
  return ['admin_rh', 'director'].includes(actor.role);
}

export function canClickDrillDown(actor: Actor): boolean {
  return canAccessDashboard(actor);
}
```

Middleware já existente redireciona colaborador sem papel de gestão para `/colaboradores/[self_id]`.

---

## 9. Notifications

Nenhuma. Dashboard é leitura pura — não gera notificações.

---

## 10. Error states e edge cases

| Situação | Tratamento |
|---|---|
| Empresa sem ciclos | Dropdown desabilitado; seção Desempenho com `<EmptyState>` + CTA criar ciclo |
| Ciclo selecionado sem respostas | Médias e radar exibem `<EmptyState>` "Nenhuma avaliação concluída neste ciclo" |
| Gestor sem liderados | Todos os KPIs mostram `0`; sem empty state (zero é informação válida) |
| Departamento selecionado sem colaboradores avaliados | Barra correspondente não aparece no gráfico (filtrada da query) |
| Competência sem questões no ciclo | Não aparece no radar (excluída do GROUP BY) |
| Menos de 3 competências com dados | Exibe barras horizontais em vez de RadarChart |
| Ciclo arquivado selecionado no filtro | Dados históricos exibidos normalmente (ciclos `archived` aparecem no dropdown com label "(arquivado)") |
| Colaborador acessa `/dashboard` | Middleware redireciona para `/colaboradores/[self_id]` |
| Query de agregação retorna NULL (divisão por zero na taxa) | `NULLIF(COUNT(*), 0)` previne divisão; UI exibe `—` |
| `revalidatePath` falha silenciosamente | Dashboard pode exibir dado defasado por até 1 request cycle; sem impacto crítico |

---

## 11. Critérios de aceite

- [ ] Stub da Fase 0 (`/dashboard`) substituído integralmente; checklist de primeiros passos removido.
- [ ] `admin_rh` e `director` veem dados de toda a empresa.
- [ ] Gestor vê apenas dados dos seus liderados diretos e indiretos.
- [ ] Colaborador sem papel de gestão é redirecionado para `/colaboradores/[self_id]`.
- [ ] Filtro de ciclo pré-seleciona o último ciclo ativo/encerrado; troca de ciclo atualiza todos os KPIs.
- [ ] Filtro de departamento visível apenas para `admin_rh` e `director`; gestor não vê.
- [ ] 10 KPIs calculados corretamente conforme fórmulas do §6.
- [ ] Taxa de conclusão exibe cor semântica (verde/amarelo/vermelho).
- [ ] Barras horizontais por departamento renderizadas com Recharts; cada barra clicável.
- [ ] Radar de competências renderizado com Recharts; fallback para barras se <3 competências.
- [ ] Todos os KPIs com drill-down clicáveis redirecionam para a tela correta com filtro aplicado.
- [ ] KPI "Sem feedback (90d)" drilla para `/colaboradores?filter=sem_feedback` funcionando.
- [ ] Empty state correto quando empresa não tem ciclos criados (CTA criar ciclo).
- [ ] Empty state correto quando ciclo não tem respostas.
- [ ] `revalidatePath('/dashboard')` adicionado nas Server Actions listadas no §7.4.
- [ ] Vitest cobre: `buildScope` (admin_rh, director, gestor com liderados, gestor sem liderados), `canAccessDashboard`, `canFilterByDepartment`.
- [ ] Playwright smoke: admin_rh vê dashboard completo → troca ciclo → filtra por departamento → clica KPI de PDIs atrasados → aterrissa em /pdi filtrado.

---

## 12. Plano de implementação

1. **Substituir stub** — reescrever `app/(app)/dashboard/page.tsx`; remover checklist e saudação.
2. **`buildScope`** — `src/features/dashboard/queries.ts`; implementar escopo dinâmico por papel.
3. **Queries de KPIs** — implementar as 10 funções de aggregação com filtros de escopo, ciclo e departamento.
4. **KPI cards** — componente `<KpiCard>` reutilizável (número, label, ícone, cor semântica, link de drill-down).
5. **Barras de departamento** — `<DepartmentBarsChart>` com Recharts `BarChart` horizontal; clicável.
6. **Radar de competências** — `<CompetencyRadarChart>` com Recharts `RadarChart`; fallback para barras se <3 pontos.
7. **Filtros no header** — dropdowns de ciclo e departamento com `searchParams` (URL state); Server Component re-renderiza com novos params.
8. **Empty states** — `<EmptyState>` com CTAs contextuais para os dois cenários (sem ciclo, sem respostas).
9. **Drill-down** — envolver cada KPI card e barra em `<Link>` com href parametrizado.
10. **Filtro `sem_feedback` em `/colaboradores`** — adicionar opção de filtro e query correspondente em `src/features/employees/queries.ts`.
11. **`revalidatePath`** — adicionar `revalidatePath('/dashboard')` nas Server Actions listadas no §7.4.
12. **Permissions** — `src/features/dashboard/permissions.ts`; atualizar middleware se necessário.
13. **Testes** — Vitest (scope + permissions) + Playwright (fluxo completo).

---

## 13. Não-funcionais

- **Performance:** todas as queries respondem em <200ms para empresa de 300 colaboradores (queries simples de agregação com índices já existentes em `company_id`, `status`, `cycle_id`, `employee_id`). Se necessário, adicionar índices pontuais detectados em profiling.
- **Segurança:** escopo de gestor calculado no servidor (nunca via query param); admin_rh nunca recebe dados de outra empresa.
- **Acessibilidade:** cards com `role="link"` ou `<a>`; gráficos com `aria-label` descritivo; empty states com `role="status"`.
- **Observabilidade:** Sentry captura erros de queries de aggregação; nenhum log de atividade (dashboard é somente leitura).
- **Responsividade:** grid de KPI cards adapta de 4 colunas (desktop) para 2 (tablet) e 1 (mobile); gráficos com `ResponsiveContainer` do Recharts.

---

## 14. Referências

- `docs/ESTRUTURA.md` §18 Sprint 8
- `features/FT-5.md`
- `docs/USERS-ABLE.md` §12
- `docs/MVP.md` §5
- `docs/dev/00-decisoes-transversais.md`
- `docs/dev/01-fase-0-fundacao.md` §8.7 (stub substituído)
- `docs/dev/02-ft-1-colaboradores.md`
- `docs/dev/03-ft-2-avaliacoes.md`
- `docs/dev/04-ft-3-feedbacks.md`
- `docs/dev/05-ft-4-pdi.md`
