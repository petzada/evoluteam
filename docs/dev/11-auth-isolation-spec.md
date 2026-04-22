# Spec — Auth & Isolamento (tema #1)

Estado atual do modelo de autenticação do Evoluteam. Revisado em 2026-04-22:
o webhook Postgres → `/api/webhooks/auth-user-created` foi **removido** por ser
quebradiço (cadeia de trigger + pg_net + rota pública + HMAC + configs DB caía
a cada ajuste de proxy/rotas). Admin de nova empresa agora é criado pelo painel
Supabase **sem envio de email**, e o próprio fluxo de onboarding provisiona a
empresa no primeiro login.

---

## 1. Decisões vigentes

| # | Decisão | Razão |
|---|---|---|
| 1.1 | **Self-signup desabilitado** no painel Supabase (`Auth → Enable email signups` = OFF) | Toda conta nasce controlada; API de signup pública retorna 422 |
| 1.2 | **Admin de nova empresa nasce no painel Supabase** com `email_confirm=true` e senha temporária definida pelo Marcio; credenciais vão ao cliente por canal direto (WhatsApp/email manual) | Zero email automático, zero superfície pública — centraliza criação em uma única pessoa com acesso ao painel |
| 1.3 | **Convidado (colaborador/diretor) não passa pelo onboarding** — `acceptInvite` cria profile já com `company_id` → gate detecta e libera direto no `/dashboard` | Já implementado em `src/features/employees/actions.ts:543` (`acceptInvite`) |
| 1.4 | **Onboarding é exclusivo de quem não tem `profiles.company_id`** — i.e., o admin_rh criado manualmente no painel | Gate em `src/app/(app)/layout.tsx:18-25` redireciona para `/onboarding/criar-empresa` |
| 1.5 | **Isolamento por empresa continua 100% via RLS** (`my_company_id()`); nenhuma mudança no schema ou policies | Fase 0, sem mudanças |

## 2. Fluxos operacionais

### 2.1 Nova empresa cliente (onboarding do SaaS)

1. Marcio abre o painel Supabase → Authentication → Users → **Add user → Create new user**.
2. Preenche email do admin + senha temporária forte (ex: `openssl rand -base64 16`).
3. Marca **Auto-confirm user** (email confirmado) e **NÃO marca "Send invitation email"**.
4. Marcio envia email + senha ao cliente pelo canal que preferir (WhatsApp, email manual, ligação). Recomenda que o cliente troque a senha após o primeiro login via `/forgot-password`.
5. Cliente entra em `/login` com as credenciais. Gate em `src/app/(app)/layout.tsx:18-25` detecta ausência de `profiles.company_id` e redireciona para `/onboarding/criar-empresa`.
6. Wizard (`src/features/company/components/OnboardingWizard.tsx`) coleta dados da empresa + perfil do admin e chama `createCompany` em `src/features/company/actions.ts`, que insere em `companies`, `profiles(role=admin_rh)`, `employees`, `positions` (cargo inicial) e `competencies` (7 padrões).
7. Redirect final para `/dashboard`.

### 2.2 Admin adicional em empresa existente

Usa o **convite in-app** normal. O admin atual entra em `/colaboradores`, convida com role `admin_rh` e a função `sendInviteForEmployee` (`src/features/employees/actions.ts:203`) cria a linha em `invites`, gera token, envia email via Resend com link `/convite/{token}`. O convidado aceita em `acceptInvite` (`src/features/employees/actions.ts:543`), que cria o `auth.users`, insere `profiles(role=admin_rh, company_id=...)` e linka o employee.

### 2.3 Colaborador / diretor

Idêntico ao §2.2 mas com role `user` ou `director`. Único caminho: convite in-app.

## 3. Componentes já existentes (referência)

- `src/proxy.ts` — gates de session, empresa suspensa, conta desligada, admin-only em `/configuracoes`
- `src/app/(app)/layout.tsx:18-25` — gate que redireciona para `/onboarding/criar-empresa` quem não tem `company_id`
- `src/features/auth/actions.ts` — `signIn`, `signOut`, `requestPasswordReset`, `resetPassword`
- `src/app/(onboarding)/convite/[token]/page.tsx` — aceite de convite
- `src/app/(onboarding)/onboarding/criar-empresa/page.tsx` — wizard de provisionamento
- `src/features/company/actions.ts` — `createCompany` (insere companies + profile + employee + positions + competencies)
- `src/features/employees/actions.ts:203` — `sendInviteForEmployee` (emissão de convite + Resend)
- `src/features/employees/actions.ts:543` — `acceptInvite` (cria user + profile + linka employee)
- `src/lib/email.ts` — helper `sendEmail({ to, subject, html })` encapsulando Resend
- `src/emails/employee-invite.tsx` — template react-email do convite in-app
- `supabase/migrations/20260419_0003_rls_policies.sql` — RLS em todas as tabelas via `my_company_id()` / `my_role()`
- Sem `/signup` no app

## 4. Variáveis de ambiente necessárias

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — usado por `createAdminSupabaseClient()` em `src/lib/supabase/admin.ts`
- `RESEND_API_KEY` — envio de convite in-app
- `NEXT_PUBLIC_SITE_URL` — base para montar `/convite/{token}` nos emails

~~`SUPABASE_WEBHOOK_SECRET`~~ — **removido** junto com o webhook (ver §5).

## 5. Remoção do webhook (2026-04-22)

Motivação: qualquer ajuste em proxy/rewrites/middleware quebrava o POST do
trigger. Endpoint público adicionava superfície de ataque sem benefício —
onboarding in-app já provisiona a empresa no primeiro login.

**Removido:**
- `src/app/api/webhooks/auth-user-created/route.ts`
- `src/emails/admin-welcome.tsx` + test
- Flag `app_metadata: { source: 'invite' }` em `acceptInvite`
- Migration `supabase/migrations/20260422_0001_drop_auth_user_created_webhook.sql` dropa trigger `on_auth_user_created` + função `notify_auth_user_created`

**Limpeza manual pós-deploy:** remover variável `SUPABASE_WEBHOOK_SECRET` do Railway (dev e prod).

Os parâmetros `app.webhook_secret` e `app.webhook_auth_user_created_url` no Postgres não precisam ser removidos. No Supabase hospedado, o role do SQL Editor não tem permissão para `ALTER DATABASE` (erro 42501). Como a função `notify_auth_user_created()` foi dropada pela migration, esses parâmetros ficam órfãos e ninguém os lê — inofensivos.

Extensão `pg_net` é mantida — não é dropada pela migration pois pode ser útil para
triggers futuros e o custo de deixá-la ativa é nulo.

## 6. Fora do escopo

- Mudanças em RLS (sem necessidade)
- Mudanças em `/login`, `/forgot-password`, `/reset-password`
- Mudanças em `/onboarding/criar-empresa`
- Multi-empresa (1 user = 1 empresa permanece)
- UI de "criar admin" dentro do app (operação permanece manual no painel Supabase)
- Customização de templates do Supabase (Confirm signup, Reset password) — default basta para `/forgot-password`
