# Auditoria de Performance — Evoluteam

Data: 2026-04-22
Stack: Next.js 16.2.4 (App Router, RSC), React 19, Supabase SSR, Railway

---

## Diagnóstico geral

A aplicação sofre de um problema estrutural bem definido: **o mesmo trio de dados (user + profile + employee) é lido do Supabase várias vezes por request**, em camadas diferentes (proxy/middleware → (app) layout → TopBar → cada page). Não há deduplicação via `React.cache` nem cache no middleware. O resultado em produção (Railway → Supabase) são **8 a 15 round-trips serializados ao banco por navegação** — cada trip paga latência de rede entre o Node da Railway e o Postgres do Supabase. É exatamente o perfil de "trocar de aba demora" que você descreveu.

O código de dados em si (queries, joins, selects específicos) está razoável. O problema principal **não é** consulta lenta — é **quantidade de consultas redundantes** e **falta de cache/Suspense** para esconder a latência.

Secundariamente:
- Zero `loading.tsx`/`error.tsx` → a tela fica branca até o RSC resolver tudo.
- Zero `dynamic()`/lazy imports → componentes pesados (wizards, Recharts, Kanban) entram no bundle de rota mesmo sem uso imediato.
- Polling de notificações (2 queries a cada 30s em toda página logada).
- O handler `/icon` (favicon.ico rewrite) gera um render dinâmico em cada aba aberta.

---

## Principais suspeitas (ordem de impacto)

1. **`(app)/layout.tsx` faz 6+ queries Supabase em toda navegação** para montar o App Shell (profile, employee, direct-reports count, hasOpenJob, screenPermissions). O layout de área logada **não é cacheado** pelo Next — roda a cada request/navegação server. `src/app/(app)/layout.tsx:13-56`.
2. **`proxy.ts` (middleware) faz 2 queries Supabase a cada hit** da matcher (profile + employee + company join). Isso acontece **antes** do layout, na Edge/Node, em TODA página autenticada. `src/proxy.ts:52-65`.
3. **Cada `page.tsx` refaz `getUser` + `profiles` + `employees`** de novo em vez de receber do layout. Ver `dashboard/page.tsx:47-73`, `colaboradores/page.tsx:23-54`, `avaliacoes/page.tsx:12-23`, `recrutamento/vagas/page.tsx:14-30`, etc. São **mais 3 queries por page**.
4. **`TopBar` re-autentica** com `supabase.auth.getUser()` + 2 queries de notificações em vez de reusar o user do layout. `src/features/shell/components/TopBar.tsx:7-13`.
5. **`/recrutamento/layout.tsx` repete o bloco inteiro de auth+profile+employee+gate+hasOpenJob** que o `(app)/layout.tsx` já fez. Duplicação pura. `src/app/(app)/recrutamento/layout.tsx:12-34`.
6. **Ausência total de `loading.tsx`** → UX percebida ruim: branco/navegação "travada" enquanto o RSC serializa todas as chamadas.
7. **Polling do `NotificationBell` a cada 30s**, com 2 queries por cliente/aba aberta, sem visibilitychange. `src/features/notifications/components/NotificationBell.tsx:27-55`.
8. **Zero uso de `next/dynamic`** → wizards multi-step, Kanban, Recharts, tabelas pesadas carregam no bundle da rota mesmo fora de uso imediato.
9. **`colaboradores/[id]/page.tsx`** executa ~14 queries paralelas + 2–3 sequenciais; `getEmployeeDescendants` é chamado **duas vezes** (target + actor) quando poderia ser uma.
10. **`rewrites()` mapeia `/favicon.ico` → `/icon`**. Sentry `tunnelRoute: '/monitoring'` adiciona mais um rewrite. Nada de errado em si, mas `/icon` é uma rota dinâmica `tsx` — verificar se está sendo servida como estática.

---

## Problemas críticos

| # | Problema | Arquivo/rota | Impacto | Evidência | Correção sugerida | Prioridade |
|---|---|---|---|---|---|---|
| C1 | Middleware faz 2 queries Supabase por hit (profile+employee) | `src/proxy.ts:52-65` | Cada navegação paga 2× latência Supabase **antes** da página começar | Query `profiles` + `employees` sem cache, em TODO caminho autenticado | Mover lookup de profile/employee para o layout (já existe). No middleware, validar só `auth.getUser()` e usar um cookie leve com `company_status`/`terminated`/`has_company` atualizado na login action. | 🔴 Crítica |
| C2 | App Shell faz 5+ queries por navegação | `src/app/(app)/layout.tsx:13-56` | Troca de aba re-renderiza shell inteiro + 5 round-trips | `getUser`+`profiles`+`employees`+`count directReports`+`hasOpenJobAsHiringManager`+`loadActorGate` | Agrupar em **um único RPC/view** `get_actor_context(user_id)` que retorne `{profile, employee, isManager, isHiringManager, screenPermissions}` em 1 round-trip. Também envolver em `React.cache()` para deduplicar com a page. | 🔴 Crítica |
| C3 | Cada page server duplica o lookup de actor | Todas as `page.tsx` de `(app)/` | +3 queries por page em cima do shell | `getUser`+`profiles`+`employees` repetidos em 14 pages | Criar `getActorContext()` em `features/auth/context.ts` envolto em `React.cache()`. Pages chamam `await getActorContext()` e recebem o mesmo objeto que o layout. | 🔴 Crítica |
| C4 | TopBar chama `auth.getUser()` de novo | `src/features/shell/components/TopBar.tsx:8-13` | +1 round-trip Supabase por navegação | Layout já tem `user`; TopBar ignora | Passar `userId` como prop do layout, ou consumir via `getActorContext()` cacheado. | 🟠 Alta |
| C5 | Layout `/recrutamento` duplica auth/profile/employee | `src/app/(app)/recrutamento/layout.tsx:12-34` | +3 queries em TODO path `/recrutamento/*` | Mesmo bloco de `(app)/layout.tsx` | Usar `getActorContext()` cacheado. Gate (`canAccessRecruitmentModule`) roda sem re-queries. | 🟠 Alta |
| C6 | Zero `loading.tsx` em qualquer rota | `src/app/**` | UX percebida: tela em branco/travada durante RSC | `Glob src/app/**/loading.tsx` = 0 resultados | Adicionar `loading.tsx` em `(app)/`, `(app)/dashboard/`, `(app)/colaboradores/`, `(app)/avaliacoes/`, `(app)/recrutamento/`, `(app)/pdi/`, `(app)/feedbacks/`, `(app)/configuracoes/`. Skeletons simples. | 🟠 Alta |
| C7 | NotificationBell faz 2 queries a cada 30s | `src/features/notifications/components/NotificationBell.tsx:27-55` | Carga constante no banco, mesmo com aba inativa | `setInterval(fetchState, 30_000)` sem `document.visibilityState` | Pausar polling quando `document.hidden`; considerar Supabase Realtime para notificações em vez de polling; consolidar em um RPC retornando `{count, list}` em 1 query. | 🟠 Alta |
| C8 | Zero `dynamic()`/lazy import | Toda a árvore `features/**` | Bundle da rota carrega wizards, Kanban, Recharts mesmo sem uso | Grep `next/dynamic` = 0 resultados | `dynamic(() => import('...'), { ssr: false })` para: wizards de avaliações/recrutamento, Kanban, Recharts, dialogs raros. | 🟡 Média |
| C9 | `getEmployeeDescendants` chamado 2x em employee detail | `src/app/(app)/colaboradores/[id]/page.tsx:60-65` | 1 round-trip extra por abertura de perfil | `descendantIds` (target) + `actorDescendants` (actor) | Unificar via `React.cache()` ou paralelizar no `Promise.all` já existente. | 🟡 Média |
| C10 | Sem índices manuais nas FKs mais usadas (parcial) | `supabase/migrations/*` | Varredura em tabelas grandes (review_answers, review_assignments, employees) | 58 índices existem mas não é possível auditar cobertura sem `EXPLAIN` | Rodar `EXPLAIN ANALYZE` nas queries do dashboard e garantir índice em `review_answers(assignment_id)`, `review_assignments(cycle_id, reviewee_id)`, `review_assignments(reviewer_id)`, `employees(company_id, status)`, `notifications(user_id, read_at, created_at DESC)`, `profiles(id)` (já é PK), `employees(user_id, company_id)`, `job_applications(job_opening_id, status)`. | 🟡 Média |

---

## Quick wins (<1 dia)

1. **Criar `getActorContext()` com `React.cache`** em `src/features/auth/context.ts`. Substitui todas as ~14 triplas `getUser+profile+employee` por uma única chamada deduplicada pelo React dentro do mesmo request. Ganho imediato: ~40% das queries somem.
2. **Pausar polling do NotificationBell quando aba oculta** (4 linhas). Reduz carga de notifications em produção imediatamente.
3. **Adicionar `loading.tsx` no layout `(app)`** com skeleton de página. Elimina a sensação de "travado" em 100% das navegações.
4. **TopBar recebe `userId` do layout** como prop em vez de chamar `getUser()` — 1 query a menos por navegação.
5. **Remover o segundo `getEmployeeDescendants`** em `colaboradores/[id]/page.tsx` somando ao `Promise.all` existente.
6. **Simplificar `proxy.ts`** eliminando a query de `employees` — o caso `terminated` pode ser validado no layout com o contexto já carregado; a verificação crítica do middleware continua sendo só `auth.getUser()`.

Impacto conjunto esperado: **de ~12 queries/navegação para ~3–4**, sem refatoração de arquitetura.

---

## Refatorações recomendadas

1. **Unificar lookup de actor em RPC Supabase** (`get_actor_context(uid uuid) returns jsonb`) que devolve profile + employee + flags + screen_permissions em 1 round-trip. Dá para reduzir de 3–4 para 1 round-trip por navegação.
2. **Cookie de contexto leve** assinado e curto (ex. 60s) com `company_id`, `role`, `company_status`, `has_employee`. Middleware lê o cookie; só faz fallback de query quando cookie vence. Login action popula o cookie. Mantém segurança via `auth.getUser()` que continua sempre autoritativo, mas reduz lookups DB.
3. **Lazy loading de features pesadas**: wizards multi-step (`ReviewCycleWizard`, `OnboardingWizard`), Kanban, `RelatoriosDashboard`, Recharts, `CandidateProfile`, sheets/dialogs grandes.
4. **Dashboard: streaming com Suspense por KPI** — atualmente são 9 queries em `Promise.all`; com Suspense dá para renderizar a casca + KPIs conforme resolvem, em vez de esperar todos.
5. **NotificationBell via Supabase Realtime** (channel por `user_id`) em vez de polling. Remove carga sustentada.
6. **Índices compostos** — auditar com `EXPLAIN` as queries hot do dashboard e listar/revisar/criar.
7. **Avaliar `/icon` dinâmico** — conferir cabeçalhos de cache em produção; se estiver dinâmico, adicionar `export const dynamic = 'force-static'` ou `revalidate`.

---

## Melhorias no middleware (`src/proxy.ts`)

**Estado atual:** pesado. Faz `auth.getUser()` + 2 queries em toda requisição autenticada (inclusive `/dashboard`, `/colaboradores`, `/avaliacoes`, etc.), e mais no topo se o usuário clicar em qualquer aba.

**O que mudar:**
- **Remover a query de `employees`** do proxy. A checagem de `employee.status === 'terminated'` pode viver no `(app)/layout.tsx`, onde o `getActorContext()` já vai buscar essa info com cache por request. O proxy não deveria ter lógica de negócio específica de módulo.
- **Substituir query de `profiles`** por cookie assinado curto (`company_status`, `has_company`). Mantém o redirect "sem empresa → onboarding" e "empresa suspensa" rápidos, sem tocar o banco.
- **Garantir que o matcher não está varrendo rotas estáticas** — o atual parece bom (exclui `_next/static`, assets com extensão), mas confirmar que as rotas de `opengraph-image`, `icon` e o Sentry `tunnelRoute: '/monitoring'` estão cobertas (o `monitoring` está, os outros ficam de fora pelo `.*\\..*` — ok).
- **Zera redirects desnecessários**: a regra atual "rota pública `/reset-password|/convite|/auth/callback`" retorna `response` direto — bom. Mas se o `getUser()` dispara refresh de token silencioso toda request, isso também custa. Vale medir com logs do Sentry.

Versão ideal do proxy: `auth.getUser()` (para refresh de cookie) + leitura de cookie `ctx` para company status + redirects. Sem queries diretas.

---

## Melhorias no App Shell (`(app)/layout.tsx`)

**Estado atual:** layout server component que re-executa 5–6 queries em toda navegação. Como layouts App Router **são mantidos** entre navegações no cliente (a sidebar não "pisca"), o problema não é visual — é que o layout continua executando no servidor em cada RSC payload, e a sidebar esperando o payload.

**O que mudar:**
- **Extrair `getActorContext()`** envolto em `React.cache()`. Layout e pages chamam a mesma função; React deduplica dentro de um request.
- **Mover gates (`canAccessDashboard`, `isHiringManager`) para o contexto** — eles podem ser calculados uma vez com o contexto montado e reusados.
- **Considerar Parallel Routes** para `@notifications` (`TopBar`) com `loading.tsx` próprio, para que a main area renderize antes das notificações.
- **Sidebar estática**: os itens dependem só de `role + screenPermissions + isHiringManager`. Passe tudo como prop já está — ok. Mantenha.

---

## Melhorias no Supabase / data fetching

- **`React.cache` nas queries base** (`getActorContext`, `getDepartments`, `getPositions`, `listCycleOptions`, `getCompanyProfileRoles`) — dedupe por request.
- **`unstable_cache`/`revalidateTag`** para taxonomias estáveis (departamentos, cargos, competências, stages de recrutamento). São dados que mudam raramente, revalidados por tag nas mutations. Hoje a mutation já faz `revalidatePath` — fácil trocar para tag.
- **Consolidar `(count + list)` de notificações em 1 query** (trazer o count do cliente: `select count + list limitado a 20`, ou RPC `get_notifications_state`).
- **Paginação em `listEmployees` / `listJobOpenings` / `listCycles`** — hoje vêm todos. Em contas com 200+ funcionários isso fica caro. Mover para server-side pagination com `range(from, to)` + total count.
- **`listCycleIdsInvolvingEmployee`** faz 3 round-trips em sequência (visibleCycles → participants+assignments). Compactar num RPC reduz a 1.
- **Dashboard KPIs**: `getAssignmentStats`, `getCycleProgress` trazem todas as rows e filtram em memória. Usar `count(*) filter (where status = ...)` no Postgres via RPC ou `head: true` count por status. Ganha muito em ciclos grandes.

---

## Melhorias de bundle / client components

- **Zero `dynamic()` hoje.** Candidatos prioritários a lazy load:
  - `ReviewCycleWizard` + wizard steps (`WizardShell`, `Step1..Step5`) — só usados em `/avaliacoes/nova` e `/avaliacoes/[id]/editar`.
  - `OnboardingWizard` e steps — só usados em `/onboarding/criar-empresa`.
  - `Kanban`, `RelatoriosDashboard`, `CandidateProfile`, `ScorecardSheet`, `JobOpeningSheet` — grandes componentes de recrutamento.
  - Charts Recharts (3 componentes): `DepartmentBarsChart`, `CompetencyRadarChart`, `OriginsDualDonut`, `StageDurationsLollipop` — lazy com `ssr: false`.
  - `CandidateSheet`/`EmployeeSheet`/`FeedbackSheet` — drawers raros.
- **97 arquivos com `'use client'`** é ok para este domínio (muito form/sheet/chart), mas vale revisar:
  - `TaxonomyList`, `TaxonomySheet`, `ConfirmDeleteDialog` em configurações são candidatos a manter client, mas os **wrappers/containers** (páginas `configuracoes/*/page.tsx`) estão bem como server.
  - `Sidebar` é client só por causa do `usePathname` — pode permanecer assim (custo mínimo).
- **Lucide React** — confirmar no build que está fazendo tree-shake (cada ícone importado por nome — ok no padrão atual).
- **`date-fns`** — usando `format/formatRelative` — ok, tree-shakeable.
- **Sentry** — `@sentry/nextjs` pesa no client. O `withSentryConfig` já tem `widenClientFileUpload: true` + `removeDebugLogging: true`. Ok. Considere `sampleRate` reduzido fora de produção.

---

## Melhorias de UX percebida (loading states)

- **Adicionar 8 arquivos `loading.tsx`** mínimos (skeleton de header + grid/tabela):
  1. `src/app/(app)/loading.tsx` (fallback geral do shell)
  2. `src/app/(app)/dashboard/loading.tsx`
  3. `src/app/(app)/colaboradores/loading.tsx`
  4. `src/app/(app)/colaboradores/[id]/loading.tsx`
  5. `src/app/(app)/avaliacoes/loading.tsx`
  6. `src/app/(app)/avaliacoes/[cycleId]/loading.tsx`
  7. `src/app/(app)/recrutamento/vagas/loading.tsx`
  8. `src/app/(app)/pdi/loading.tsx` + `(app)/feedbacks/loading.tsx`
- **`error.tsx`** no root `(app)` com retry + link para `/dashboard`.
- **Suspense boundaries granulares no Dashboard** para KPIs streamarem à medida que resolvem (evita um "stall" de 2s se uma query for lenta).
- **Skeletons próximos do layout final** (mesmas alturas/grid) para evitar layout shift.

---

## Railway / Deploy — o que verificar

1. **Latência Railway → Supabase**: confira que o projeto Supabase está na mesma região do serviço Railway. Se Railway estiver em `us-west` e Supabase em `sa-east-1`, cada query paga ~150ms. Com 12 queries por navegação isso é ~1.8s só de rede.
2. **Cold start**: Next.js no Railway roda como Node long-running (não serverless). Não deve haver cold start por requisição, mas **vale ver nos logs do Railway** se o serviço está reiniciando. `/monitoring` (tunnel Sentry) pode ajudar.
3. **`next start` com ENV `PORT`**: ok, padrão Railway.
4. **Sem Edge runtime**: o proxy.ts está rodando em Node (padrão). Se ele fosse `runtime = 'edge'`, as queries Supabase seriam ainda piores. Manter em Node mesmo.
5. **Healthcheck**: Railway pinga `/` → `redirect('/dashboard')` → `/login`. Cada healthcheck dispara o middleware. Considerar rota dedicada `/api/healthz` que retorne 200 sem tocar Supabase.
6. **Gzip/Brotli**: conferir que o Next está servindo comprimido (em produção, padrão ok). Railway não é um reverse proxy que intercepta isso.
7. **Supabase Pooler**: confirmar que as conexões estão via pooler (`pgbouncer`) — `@supabase/supabase-js` usa REST/PostgREST, então é fine, mas é bom ver o painel Supabase → "Database" → "Connection pooling" para saber se há picos.
8. **Logs do Sentry** para tracer: as chamadas Supabase aparecem como spans? O `@sentry/nextjs` + `automaticVercelMonitors` não cobre Railway; vale adicionar manualmente tracing no `createServerSupabaseClient` para medir em prod.

---

## Plano de ação por fases

### Fase 1 — Correções rápidas sem risco (1 dia)

Objetivo: reduzir de ~12 para ~3–4 queries por navegação sem mudar arquitetura.

1. Criar `src/features/auth/context.ts` com `getActorContext = React.cache(async () => { ... })` retornando `{ user, profile, employee, gate, isManager, isHiringManager }`.
2. Substituir os blocos de auth em `(app)/layout.tsx`, todas as `page.tsx` de `(app)/`, `(app)/recrutamento/layout.tsx`, `(app)/configuracoes/layout.tsx` por `await getActorContext()`.
3. `TopBar` recebe `userId` por prop (ou usa `getActorContext`). Remove `auth.getUser()` de lá.
4. `NotificationBell`: pausa polling em `document.hidden`; amplia intervalo para 60s; consolida count+list em 1 query.
5. Adiciona `loading.tsx` (skeletons simples) em `(app)/`, `(app)/colaboradores/`, `(app)/avaliacoes/`, `(app)/recrutamento/vagas/`, `(app)/dashboard/`, `(app)/colaboradores/[id]/`.
6. Remove 2ª chamada de `getEmployeeDescendants` em `colaboradores/[id]/page.tsx` (consolida no `Promise.all`).

**Sem tocar**: middleware, schema, queries individuais, client components. Zero risco de quebrar auth.

### Fase 2 — Otimização estrutural moderada (2–3 dias)

1. RPC `get_actor_context(uid)` no Supabase retornando tudo em 1 round-trip. `getActorContext()` passa a chamar o RPC.
2. Cookie leve `evolu_ctx` assinado (JWT curto, 60s) com `company_status`, `has_company`, `has_active_employee`. Proxy lê cookie; fallback para query só quando vence.
3. Remover query de `profiles/employees` do proxy — lógica de `terminated`/`suspended` passa ao layout com `getActorContext`.
4. `unstable_cache` + tags em taxonomias (`departments:${companyId}`, `positions:${companyId}`, `competencies:${companyId}`, `cycles:${companyId}`), invalidando nas mutations.
5. Dashboard com Suspense por KPI (cada card wrapado em `<Suspense fallback={<KpiSkeleton/>}>`), streaming.
6. `EXPLAIN ANALYZE` + índices compostos nas queries hot identificadas. Nova migration com os faltantes.

### Fase 3 — Refatorações maiores (>3 dias)

1. Lazy loading (`next/dynamic`) para wizards, Kanban, Recharts, sheets grandes.
2. Paginação server-side em `listEmployees`, `listJobOpenings`, `listCycles`.
3. Substituir polling de notificações por Supabase Realtime.
4. Consolidar queries de dashboard em RPCs Postgres (`dashboard_overview(scope jsonb)`), evitando puxar todas as answers/assignments para memória.
5. Revisar RLS das tabelas mais lidas (`review_assignments`, `review_answers`, `employees`) — RLS pesado pode multiplicar custo mesmo com índice. `supabase-postgres-best-practices` tem checklist específico.
6. Observabilidade: tracing de queries Supabase no Sentry; dashboard de "queries por request".

---

## Depois da auditoria

Quer que eu **implemente a Fase 1** agora? Ela é baixo risco, não toca middleware/auth em estrutura, e a expectativa é cortar 60–70% das queries por navegação já na próxima navegação após o deploy. Posso abrir os PRs item por item ou um só, como preferir.

Se quiser primeiro **confirmar uma das hipóteses com dados** (ex.: medir quantas queries estão saindo por navegação em produção), dá para adicionar um instrument/log leve no `createServerSupabaseClient` antes de começar — me avise.
