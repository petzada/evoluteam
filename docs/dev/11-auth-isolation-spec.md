# Spec — Auth & Isolamento (tema #1)

Design validado em brainstorm 2026-04-20. Endurece o modelo de autenticação: sem
self-signup, admin de plataforma nasce via Supabase Dashboard com e-mail automático,
colaboradores entram apenas por convite. RLS continua garantindo isolamento por empresa.

> Este documento é a fonte de verdade para a implementação. Operação pós-deploy fica em
> `docs/dev/00-decisoes-transversais.md` (§ "Auth & Onboarding — ritual de operação") que
> será atualizado em conjunto.

---

## 1. Decisões validadas

| # | Decisão | Razão |
|---|---|---|
| 1.1 | **Self-signup desabilitado** no painel Supabase (`Auth → Enable email signups` = OFF) | Qualquer conta nasce controlada; API de signup retorna 422 |
| 1.2 | **Admin de plataforma nasce via Supabase Dashboard** com `email_confirm=true` e senha temporária descartável; adm define senha real via fluxo `/forgot-password` que já existe | Reaproveita recovery flow; zero senha trafegando por canal externo |
| 1.3 | **Convidado não passa pelo onboarding** — `acceptInvite` cria profile já com `company_id` → proxy detecta e libera | Já implementado hoje (`src/features/employees/actions.ts:507`) |
| 1.4 | **Onboarding é exclusivo de quem não tem `company_id`** — i.e., do admin_rh inicial | Já implementado (`src/proxy.ts:80-83`) |
| 1.5 | **Webhook Postgres → Resend** dispara e-mail de boas-vindas automaticamente quando um user nasce do Dashboard | Elimina fricção operacional; distingue via `app_metadata.source` |
| 1.6 | **Isolamento por empresa continua 100% via RLS** (`my_company_id()`); nenhuma mudança no schema ou policies | Já implementado na fase 0 |

## 2. O que JÁ existe (sem alteração)

Para deixar explícito e evitar retrabalho:

- `src/proxy.ts` — gates de session, empresa suspensa, conta desligada, onboarding, `/configuracoes` admin-only
- `src/features/auth/actions.ts` — `signIn`, `signOut`, `requestPasswordReset`, `resetPassword`
- `src/app/(onboarding)/convite/[token]/page.tsx` — aceite de convite
- `src/features/employees/actions.ts:166-228` — emissão de convite (cria `invites` + dispara Resend com HTML inline)
- `src/features/employees/actions.ts:507-569` — `acceptInvite` cria user via admin API com `email_confirm=true` e vincula employee
- `supabase/migrations/20260419_0003_rls_policies.sql` — RLS em todas as tabelas via `my_company_id()` e `my_role()`
- Sem `/signup` no app

## 3. O que muda / é novo

### 3.1 Helpers de e-mail (refactor pequeno)

Novos arquivos:

- `src/lib/email.ts` — helper `sendEmail({ to, subject, html })` único, encapsulando `Resend`, com try/catch padronizado
- `src/lib/emails/employee-invite.ts` — função `employeeInviteEmail({ inviteUrl })` retornando `{ subject, html }`. Extrai o HTML inline de `actions.ts:217-222`
- `src/lib/emails/admin-welcome.ts` — função `adminWelcomeEmail({ recoveryUrl })` retornando `{ subject, html }`

Alteração:

- `src/features/employees/actions.ts:213-223` passa a usar `sendEmail(employeeInviteEmail({ inviteUrl }))`

### 3.2 Flag de origem no `acceptInvite`

`src/features/employees/actions.ts:521` (`admin.auth.admin.createUser(...)`) passa a incluir `app_metadata: { source: 'invite' }`. É o sinal que o webhook usa para diferenciar user criado via convite (ignora) de user criado via Dashboard (envia boas-vindas).

### 3.3 Endpoint do webhook

Novo: `src/app/api/webhooks/auth-user-created/route.ts` (POST). Contrato:

1. Valida cabeçalho `X-Webhook-Signature` contra HMAC-SHA256 do body com `SUPABASE_WEBHOOK_SECRET`. Falha → 401.
2. Lê `record.raw_app_meta_data.source`. Se `'invite'` → retorna 200 sem ação.
3. Caso contrário:
   - Monta `recoveryUrl = ${NEXT_PUBLIC_SITE_URL}/forgot-password`
   - Chama `sendEmail(adminWelcomeEmail({ recoveryUrl }))` para `record.email`
   - Loga em `activity_logs` com `action = 'company.admin_invited'` (novo label), `entityType = 'auth_user'`, `entityId = record.id`
4. Retorna 200 em qualquer caso esperado (inclusive erro de Resend com log) — evita retries do Supabase para casos esperados.

Novo `activity.action` em `src/lib/activity.ts`:
- `company.admin_invited` → label "Convite de admin enviado"

### 3.4 Migration do trigger (Plano B adotado)

O painel do Supabase usado pelo Marcio não tem o menu "Database → Webhooks", então o trigger vai em migration SQL versionada (mais portável de qualquer jeito).

Novo: `supabase/migrations/20260420_0001_auth_user_created_webhook.sql`:

```sql
create extension if not exists pg_net with schema extensions;

create or replace function public.notify_auth_user_created()
returns trigger language plpgsql security definer as $$
declare
  webhook_url text := nullif(current_setting('app.webhook_auth_user_created_url', true), '');
  webhook_secret text := nullif(current_setting('app.webhook_secret', true), '');
  payload jsonb;
  signature text;
begin
  if webhook_url is null or webhook_secret is null then
    return NEW;  -- URL/secret não configurados (dev local) → no-op
  end if;

  payload := jsonb_build_object(
    'type', 'INSERT',
    'table', 'users',
    'schema', 'auth',
    'record', jsonb_build_object(
      'id', NEW.id,
      'email', NEW.email,
      'raw_app_meta_data', NEW.raw_app_meta_data,
      'created_at', NEW.created_at
    )
  );
  signature := encode(hmac(payload::text, webhook_secret, 'sha256'), 'hex');

  perform extensions.http_post(
    url := webhook_url,
    body := payload,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Webhook-Signature', signature
    )
  );
  return NEW;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.notify_auth_user_created();
```

**Nota-chave:** se `app.webhook_auth_user_created_url` ou `app.webhook_secret` não estiverem setados, o trigger é no-op (return NEW sem postar). Isso permite dev local sem efeitos colaterais.

### 3.5 Variáveis de ambiente

Nova em produção (Railway):

- `SUPABASE_WEBHOOK_SECRET` — mesmo valor que `app.webhook_secret` no DB Postgres

Já existentes (sem mudança):
- `RESEND_API_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

### 3.6 Documentação

Novo: seção em `docs/dev/00-decisoes-transversais.md` — "Auth & Onboarding — ritual de
operação". Contém:

- Sem self-signup (config do painel + como validar)
- Criação de admin de nova empresa (passo a passo no Dashboard + e-mail automático)
- Criação de colaborador (UI `/colaboradores`)
- Diagrama de fluxo: `auth.users INSERT` → trigger → webhook → branch
- Passo-a-passo de ativação pós-deploy (copiado da § 5 abaixo)

## 4. Testes

### 4.1 Unitário do handler do webhook

Arquivo: `src/app/api/webhooks/auth-user-created/route.test.ts`

- HMAC inválido → 401, Resend **não** chamado
- Payload com `raw_app_meta_data.source === 'invite'` → 200, Resend **não** chamado
- Payload sem `source` → 200, Resend chamado 1× com template correto (mock)
- Payload com e-mail vazio/malformado → 200 (safe no-op), Resend não chamado

### 4.2 Script manual de smoke em dev

Arquivo: `scripts/test-webhook.ts` — envia POST local com HMAC calculado a partir de
`SUPABASE_WEBHOOK_SECRET` do `.env.local`. Permite testar o handler sem precisar de
tunnel. Documentado em comentário no topo.

### 4.3 Smoke pós-deploy

Manual (checklist na § 5.5 abaixo): criar user de teste no Dashboard Supabase, confirmar
chegada do e-mail, apagar user teste.

## 5. Passo-a-passo — ativação pós-deploy

Guardar essa seção. Executar **uma vez por ambiente de produção**. Cópia literal vai
também em `docs/dev/00-decisoes-transversais.md`.

### 5.1 Pré-requisitos

- Aplicação deployada em URL pública (ex: `https://evoluteam.up.railway.app`)
- `RESEND_API_KEY` já configurado no ambiente (já existe)
- Migration `20260420_0001_auth_user_created_webhook.sql` aplicada

### 5.2 Gerar o secret

No terminal local, **uma vez**:

```bash
openssl rand -hex 32
```

Guardar o valor (ex: `3f9a2b...eeff`).

### 5.3 Adicionar o secret ao ambiente de produção

No painel da Railway (Project → Variables):
- `SUPABASE_WEBHOOK_SECRET` = `<valor do passo 5.2>`
- Redeploy (ou aguardar próximo deploy)

### 5.4 Configurar secret + URL no Supabase

No painel Supabase → SQL Editor:

```sql
alter database postgres set app.webhook_secret = '<valor do passo 5.2>';
alter database postgres set app.webhook_auth_user_created_url =
  'https://<seu-dominio-de-producao>/api/webhooks/auth-user-created';
```

Validar:

```sql
select name, setting
from pg_settings
where name in ('app.webhook_secret', 'app.webhook_auth_user_created_url');
```

### 5.5 Smoke test

1. Supabase → Authentication → Users → Add user → Create new user
2. E-mail de teste (pessoal, tipo `seunome+teste@gmail.com`), senha qualquer, Email confirmed = true
3. Esperar ~30s. E-mail "Bem-vindo ao evoluteam, defina sua senha" deve chegar
4. Logs Supabase → Postgres logs: buscar linha `pg_net` com status 200
5. Logs Railway → Deployments → View Logs: buscar `POST /api/webhooks/auth-user-created 200`
6. Apagar o user de teste

### 5.6 Rotina de criação de novas empresas

Para cada novo cliente:

1. Supabase → Authentication → Users → Add user
2. E-mail do admin_rh, senha temporária, Email confirmed = true, Create
3. Admin recebe e-mail automático → clica link `/forgot-password` → define senha → loga → cai em `/onboarding/criar-empresa`
4. Admin completa wizard → empresa ativa

### 5.7 Troubleshooting

| Sintoma | Causa | Ação |
|---|---|---|
| E-mail não chega | Secrets diferentes entre Railway e DB | Validar caractere-a-caractere |
| Railway logs: 401 | HMAC inválido (secrets diferentes) | Idem |
| Railway logs: rota não chamada | URL errado ou `pg_net` desabilitado | Conferir § 5.4 + `create extension pg_net` |
| E-mail duplicado ao aceitar convite | `app_metadata.source` não está sendo setado | Conferir § 3.2 (`acceptInvite`) |
| "E-mail não confirmado" no login | Esqueceu Email confirmed = true no Dashboard | Editar user → Confirm email |

## 6. Fora do escopo

- Mudanças em RLS (já correto)
- Mudanças em `/login`, `/forgot-password`, `/reset-password` (já funcionais)
- Mudanças em `/onboarding/criar-empresa` (já funcional)
- Migração de schema (nenhuma)
- Multi-empresa (1 user = 1 empresa permanece)
- UI de "criar admin" dentro do app (operação permanece manual no Supabase Dashboard)
- Customização de templates do Supabase (Confirm signup, Reset password) — mantém default do Supabase para `/forgot-password`

## 7. Ordem de implementação

1. Helpers de e-mail (`src/lib/email.ts`, `src/lib/emails/*.ts`)
2. Refactor de `inviteEmployee` para usar helpers
3. Flag `app_metadata.source = 'invite'` em `acceptInvite`
4. Handler do webhook `/api/webhooks/auth-user-created` + testes unitários
5. Migration do trigger
6. Novo label em `ACTIVITY_LABELS`
7. Atualização de `docs/dev/00-decisoes-transversais.md` com § "Auth & Onboarding"
8. Script `scripts/test-webhook.ts` para dev

Itens operacionais (§ 5) ficam pendentes até o deploy do usuário.
