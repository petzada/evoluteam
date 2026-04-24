# Decisões transversais — Evoluteam

Decisões que valem para **todas** as fases/features do produto. Toda escolha que afeta múltiplos módulos mora aqui.
Último update: 2026-04-19.

---

## Sumário (17 decisões)

| # | Tópico | Escolha |
|---|---|---|
| 1 | Stack principal | Next.js App Router (Railway) + Supabase (Auth+Postgres+RLS+Storage) + Resend |
| 2 | Multi-tenancy | 1 user ↔ 1 empresa |
| 3 | User vs Employee | Todo user logado **é** employee (C.1). Admin inicial criado manualmente no Supabase pelo dono |
| 4 | Papéis (roles) | Enum `admin_rh / director / user` + gestor **derivado** de `employees.manager_id` |
| 5 | Skip-level | Leitura total na árvore, escrita só em liderados diretos. `admin_rh` fura tudo. Ausências resolvidas manualmente |
| 6 | Convite | Checkbox "enviar agora" + email+senha + tabela `invites` customizada + Resend + 7 dias |
| 7 | Testes | Vitest + ESLint + Prettier. Sem Husky, sem CI/CD |
| 8 | Data access | Supabase Client em todo lugar + estrutura `features/{domain}/{schema,queries,actions,permissions,components}` |
| 9 | Environments | Um único projeto Supabase cloud (dev = prod) até o 1º cliente pagante |
| 10 | Locale | pt-BR hardcoded + UTC/São Paulo + formato BR |
| 11 | Notificações | Application code + polling 30s |
| 13 | Activity logs | Schema populado + tela simples em `/configuracoes/auditoria` (admin_rh) |
| 14 | Seed no cadastro | Departamentos **vazios**, cargos **pré-populados** (4), competências **pré-populadas** (7) |
| 15 | Identidade | Evoluteam / `evolu.team` / logo text-only / paleta branco+cinza+laranja / remetente `marcio@marct.co` |
| 16 | UI stack | shadcn/ui + Geist + Lucide + RHF+Zod + TanStack Table + Recharts + Sonner |
| 17 | Billing | Nenhum no MVP 1.0. Onboarding manual (admin criado direto no Supabase). `/signup` desativado |

---

## 1. Stack principal

- **Frontend/Backend:** Next.js 14+ App Router, TypeScript strict, rodando em Node.js na Railway.
- **Banco/Auth/Storage:** Supabase (Postgres 15, Supabase Auth, Supabase Storage, RLS ativa em todas as tabelas operacionais).
- **E-mail transacional:** Resend (3k e-mails/mês no free, domínio `marct.co` verificado com SPF/DKIM).
- **Sem:** Clerk, Drizzle, tRPC, Docker local (opção C de ambientes). Sem observabilidade externa no MVP — logs Railway para stdout são suficientes.

### Por quê
Supabase dá RLS multi-tenant nativo, Auth completo, Storage S3-compatível e Realtime futuro — tudo sob uma conta. Railway hospeda Next.js em Node sem complicação. Resend tem DX melhor que SendGrid para o volume do MVP.

---

## 2. Multi-tenancy — 1 user ↔ 1 empresa

Cada `auth.user` pertence a **exatamente uma** `companies`. Não há seletor de workspace. A tabela `profiles` carrega `company_id` direto.

### Consequências
- `profiles.company_id NOT NULL` (após aceitar convite / criar empresa).
- Todas as tabelas operacionais têm `company_id NOT NULL`.
- `/signup` fechado; admins são criados manualmente pelo dono do produto.
- Um mesmo e-mail **não pode** existir em duas empresas (Supabase Auth já bloqueia por `UNIQUE(email)`).

---

## 3. Relação user ↔ employee (modelo C.1)

- **Todo user logado é employee** — admin preenche sua ficha no passo 2 do onboarding.
- **Employees podem existir sem user** — intervalo entre cadastro e aceite do convite.
- FK: `employees.user_id → auth.users.id` é **nullable** até o aceite.

### Vantagem
Dashboards/listagens de colaboradores não precisam de gambiarra para "excluir admins". Regra mental única: "quem loga é colaborador".

---

## 4. Papéis (roles)

`profiles.role` é um enum simples:
- `admin_rh` — cria empresa, convida, cadastra colaboradores, cria ciclos, vê tudo.
- `director` — apenas leitura de dashboards consolidados.
- `user` — padrão de colaborador.

**"Gestor" não é um role** — é derivado da hierarquia: você é gestor se existe algum `employee` com `manager_id` apontando para você.

### Helpers
- `public.my_company_id()` — retorna `company_id` do user logado (usado em policies).
- `public.my_role()` — retorna role do user logado.
- `isManager(userId)` — query helper em app: `EXISTS(SELECT 1 FROM employees e2 INNER JOIN employees e1 ON e2.manager_id = e1.id WHERE e1.user_id = $1)`.

---

## 5. Skip-level (gestor do gestor)

| Ação | Acesso |
|---|---|
| Ler resultado de avaliação / PDI / feedback visível | Toda a árvore descendente (via CTE recursiva sobre `manager_id`) |
| Responder avaliação / criar PDI | Apenas liderados **diretos** |
| Enviar feedback para qualquer pessoa | Qualquer user (visibilidade do feedback controla quem vê) |
| `admin_rh` | Fura todas as regras acima dentro da empresa |

### Edge case de ausência
Se gestor direto estiver de férias e alguém precisa avaliar, o `admin_rh` troca manualmente o `manager_id` no cadastro. Não há feature de "delegação temporária" no MVP.

---

## 6. Convite

- **Fluxo:** admin cadastra employee em `/configuracoes/usuarios` → checkbox "Enviar convite agora" (default on) → e-mail via Resend com link `/convite/[token]` válido por 7 dias → destinatário preenche senha → `auth.users` criado, `employees.user_id` preenchido, `invites.accepted_at` preenchido.
- **Tabela `invites`** (não usa `auth.admin.inviteUserByEmail` do Supabase).
- **Reenvio** gera novo token, invalida o anterior.
- **Revogação** preenche `revoked_at`; token deixa de funcionar.
- **Erro no envio de e-mail** não bloqueia criação do employee; admin reenvia depois via kebab da listagem.

---

## 7. Testes

- **Vitest** para unit/integration: helpers de permissão, schemas Zod, funções puras.
- **ESLint + Prettier** (config baseada em `next/core-web-vitals`).
- **Sem Husky, sem lint-staged, sem GitHub Actions.** Qualidade roda localmente sob disciplina.

### Estrutura
```
src/**/*.test.ts        → Vitest
```

---

## 8. Data access — Supabase Client em todo lugar

```
src/lib/supabase/
  server.ts    createServerClient()  (SSR cookies, RSC + Server Actions)
  browser.ts   createBrowserClient() (Client Components quando precisar)
  admin.ts     createAdminClient()   (service_role, SOMENTE em rotas sistêmicas)
  types.ts     gerado via `supabase gen types typescript`
```

### Estrutura por feature
```
src/features/{domain}/
  schema.ts         Zod schemas de input/output
  queries.ts        funções que leem (usam server client)
  actions.ts        Server Actions (mutations, revalidatePath, logActivity)
  permissions.ts    helpers de autorização (puros, testáveis)
  components/       React components
```

### Quando usar `admin.ts` (bypass RLS)
- Onboarding: `createCompany()` — admin ainda não tem `company_id`, precisa bypass para o insert inicial.
- `acceptInvite()` — user ainda não existe, precisa criar no `auth.users`.
- `logActivity()` e `notify()` — inserts de sistema.
- **Nunca** em operações acionadas por UI com dados do usuário.

---

## 9. Environments — projeto Supabase único

Um só projeto Supabase cloud. Dev e "prod" compartilham o mesmo Postgres/Auth/Storage no MVP.

### Risco consciente
No dia em que o primeiro cliente tiver dados reais, qualquer `db reset` ou teste destrutivo passa a afetar produção. **Marco:** promover para ambiente separado (2 projetos: dev + prod) **antes do 1º cliente pagante**.

### Deploy
- `git push main` → Railway builda → deploy.
- **Migrations** via Supabase CLI: `supabase migration new <nome>`, edita SQL, commit. Push manual para o projeto cloud (`supabase db push`) antes do deploy da feature dependente.

---

## 10. Locale e timezone

- **Idioma:** pt-BR hardcoded (strings direto no JSX). Sem `next-intl` no MVP.
- **Timezone:** armazenar tudo em `timestamptz` (UTC); exibir em `America/Sao_Paulo` fixo.
- **Datas:** `dd/MM/yyyy` (ex: `19/04/2026`).
- **Datetimes:** `dd/MM/yyyy HH:mm`.
- **Decimais:** `,` (ex: `4,2`).
- **Milhar:** `.` (ex: `1.234`).

### Helpers
`src/lib/date.ts` e `src/lib/number.ts` centralizam formatação. Código nunca usa `Date.toLocaleString()` solto.

---

## 11. Notificações

- **Gerador:** Server Actions chamam `notify({ userIds, type, title, body, linkUrl })` em `src/lib/notifications.ts`.
- **Visualização:** polling simples, badge no header faz `GET /api/notifications/unread-count` a cada 30s.
- **Mutation:** `router.refresh()` após ações para forçar atualização imediata.
- **Sem Realtime websocket no MVP.** Adicionável depois via Supabase Realtime em 1 dia.

### Tipos no MVP
```
'invite_accepted'     → admin recebe quando convite é aceito (Fase 0)
'review_pending'      → user recebe quando tem avaliação pra responder (FT-2)
'feedback_received'   → user recebe feedback (FT-3)
'pdi_created'         → user/gestor recebe novo PDI (FT-4)
'pdi_action_due'      → user recebe quando ação do PDI está próxima do prazo (FT-4)
```

---

## 13. Activity logs

- **Helper:** `logActivity({ action, entityType, entityId, metadata })` em `src/lib/activity.ts`.
- **Naming:** `domain.verb` (ex: `company.created`, `invite.sent`, `cycle.published`).
- **UI:** `/configuracoes/auditoria` — listagem paginada, filtros (data, tipo, autor). Visível apenas para `admin_rh`.

### Eventos registrados
Lista canônica em `ESTRUTURA.md §21` + eventos de convite (`invite.sent`, `invite.accepted`, `invite.revoked`, `invite.resent`).

---

## 14. Seed no cadastro da empresa

Executado dentro de `createCompany()` na mesma transação:

| Entidade | Seed |
|---|---|
| Departamentos | **Vazio** — admin cria em `/configuracoes/departamentos` ou no próprio passo 2 do onboarding (inline, opcional) |
| Cargos | `Colaborador`, `Líder/Supervisor`, `Coordenador`, `Administrativo/RH` |
| Competências | `Comunicação`, `Liderança`, `Colaboração`, `Entrega`, `Organização`, `Domínio técnico`, `Comportamento` |

Copy do wizard deixa claro: *"Você pode editar depois em Configurações."*

---

## 15. Identidade

- **Nome:** Evoluteam.
- **Domínio:** `evolu.team` (único host: `evolu.team` → app + landing). Landing dedicada fica para depois.
- **Logo:** placeholder text-only (Evoluteam em laranja, `#f97316`) até arte final.
- **Paleta:** base `zinc` (shadcn default) + primary laranja (HSL `24 94% 53%` = Tailwind `orange-500`).
- **Fonte:** Geist (via `next/font`).
- **E-mail remetente:** `marcio@marct.co` (domínio próprio do Marcio, verificado no Resend).

### Tokens CSS
```css
:root {
  --primary: 24 94% 53%;
  --primary-foreground: 0 0% 100%;
  --accent: 24 94% 95%;
}
```

---

## 16. UI stack

| Camada | Escolha |
|---|---|
| Componentes | shadcn/ui (copy-paste, custom total) |
| Ícones | Lucide |
| Fonte | Geist |
| Forms | React Hook Form + Zod resolver |
| Validation | Zod |
| Tabelas | TanStack Table v8 |
| Gráficos | Recharts |
| Toasts | Sonner |
| Modais | shadcn Dialog / AlertDialog / Sheet |
| Loading | `loading.tsx` + Suspense + Skeleton |
| Erro | `error.tsx` por rota |
| Vazio | Componente `<EmptyState />` custom |

### Padrão Server Action → UI
```typescript
// features/employees/actions.ts
export async function createEmployee(input: unknown) {
  const parsed = CreateEmployeeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'validation', issues: parsed.error.issues };
  // ... insert ...
  revalidatePath('/colaboradores');
  return { ok: true, employeeId };
}
```

UI sempre mostra toast via Sonner (`ok` → sucesso verde, `error` → vermelho).

---

## 17. Billing e onboarding de clientes

- **Sem billing no MVP 1.0.**
- **`/signup` público desativado** (rota existe mas retorna 404 ou "solicite acesso").
- **Admin inicial** de cada empresa-cliente é criado **direto no Supabase Auth** (dashboard ou API) pelo dono do produto.
- **Coluna `companies.status`** já existe (`active` / `suspended`) — permite "desativar" cliente inadimplente sem migration no futuro.

### Marco para MVP 1.5
Quando houver 2–3 clientes pagantes, avaliar:
- Abrir `/signup` público.
- Integrar Stripe Checkout.
- Adicionar tabelas `plans`, `subscriptions`, `invoices`.

---

## 18. Auth & Onboarding — ritual de operação

Operação de criar novas empresas e colaboradores. Spec detalhada em `docs/dev/11-auth-isolation-spec.md`.

### Princípios
- **Sem self-signup.** `Auth → Enable email signups` = OFF no painel Supabase. `POST /auth/v1/signup` retorna 422.
- **Admin de plataforma nasce no Supabase Dashboard**, com `Email confirmed = true` e senha temporária qualquer.
- **Colaboradores entram apenas por convite** emitido pelo `admin_rh` na UI `/colaboradores`.
- **Convidado não faz onboarding** — `acceptInvite` cria profile já com `company_id`.
- **Onboarding é exclusivo de quem não tem `company_id`** — ou seja, do admin recém-criado no Dashboard.

### Fluxo de nascimento do admin_rh de nova empresa

1. Dono da plataforma abre Supabase → Authentication → Users → Add user → Create new user
2. Informa e-mail do admin cliente, senha qualquer, **Email confirmed = true**, Create
3. Trigger Postgres `on_auth_user_created` dispara POST para `/api/webhooks/auth-user-created`
4. Handler detecta que `app_metadata.source` é ausente (não é convite) → envia e-mail via Resend com link para `/forgot-password`
5. Admin recebe e-mail → define senha → faz login → proxy leva para `/onboarding/criar-empresa` (porque `profile.company_id` é null)
6. Admin completa wizard → empresa ativa, admin vira `admin_rh`

### Fluxo de nascimento do colaborador

1. Admin_rh logado entra em `/colaboradores` → "Novo colaborador" → preenche + marca "Enviar convite"
2. Server action `inviteEmployee` cria registro em `invites` e envia e-mail via Resend (template `employee-invite`)
3. Colaborador clica no link `/convite/[token]` → define nome/senha → `acceptInvite` cria user com `app_metadata: { source: 'invite' }`, profile já com `company_id` e role, vincula `employees.user_id`
4. Trigger Postgres dispara o webhook → handler detecta `source === 'invite'` → **ignora** (não envia boas-vindas duplicada)
5. Colaborador já logado cai direto no `/dashboard` (ou `/colaboradores` conforme a role)

### Ativação pós-deploy (uma vez por ambiente)

Passo-a-passo completo em `docs/dev/11-auth-isolation-spec.md` § 5. Resumo:

1. `openssl rand -hex 32` — gerar secret
2. Railway → Project → Variables → `SUPABASE_WEBHOOK_SECRET` = `<secret>`
3. Supabase SQL Editor:
   ```sql
   alter database postgres set app.webhook_secret = '<secret>';
   alter database postgres set app.webhook_auth_user_created_url = 'https://<domínio>/api/webhooks/auth-user-created';
   ```
4. Smoke: criar user de teste no Dashboard → esperar e-mail → apagar user

### Checklist de sanidade do painel Supabase

Revisar antes de cada deploy:

- [ ] Authentication → Providers → Email → **Enable email signups** desmarcado
- [ ] Database → Extensions → `pg_net` habilitado
- [ ] SQL: `select count(*) from pg_trigger where tgname = 'on_auth_user_created'` retorna 1
- [ ] SQL: `select setting from pg_settings where name = 'app.webhook_auth_user_created_url'` retorna URL correta
- [ ] `SUPABASE_WEBHOOK_SECRET` do host = `app.webhook_secret` do DB (caractere a caractere)

---

## Referências cruzadas

- `docs/PRD-GERAL.md` — visão do produto
- `docs/ESTRUTURA.md` — rotas, banco, sprints
- `docs/MVP.md` + `docs/MVP-2.md` — escopo MVP
- `docs/USERS-ABLE.md` — user stories por papel
- `features/FT-1.md` a `features/FT-5.md` — specs por feature
- `docs/dev/01-fase-0-fundacao.md` — spec da Fundação (Fase 0)
- `docs/dev/11-auth-isolation-spec.md` — spec operacional completa de auth + webhook
- `docs/dev/12-sidebar-inicio-spec.md` — spec da sidebar (Início vs Dashboard por role)
