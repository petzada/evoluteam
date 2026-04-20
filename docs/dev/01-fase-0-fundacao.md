# Fase 0 — Fundação

Spec completa da **Fundação** do Evoluteam: autenticação, multi-tenant, empresa, convites, permissões, layout autenticado, configurações básicas.
Equivale ao **Sprint 1** de `docs/ESTRUTURA.md` §18.
Pré-requisito para FT-1 a FT-5.
Última atualização: 2026-04-19.

> **Leia primeiro:** `docs/dev/00-decisoes-transversais.md` — decisões que valem para toda a aplicação.

---

## 1. Objetivo

Entregar a infraestrutura mínima para uma empresa existir no Evoluteam:
- Admin consegue logar (criado manualmente no Supabase pelo dono).
- Admin conclui o onboarding (cria empresa, preenche a própria ficha de colaborador).
- Admin convida outros usuários, que aceitam por e-mail e entram na mesma empresa.
- Usuários navegam no app, veem o layout completo com itens futuros desabilitados.
- Todas as operações respeitam RLS por empresa e role.

## 2. Escopo

### Dentro do MVP 1.0 (Fase 0)
- Login, logout, recuperar senha, resetar senha.
- Onboarding em wizard de 4 passos.
- Convite de usuário via e-mail (Resend), com tabela `invites` própria.
- Aceite de convite com criação de `auth.user`, `profiles`, link em `employees`.
- Layout autenticado com sidebar escura + user card embaixo.
- `/configuracoes/empresa` — edição de dados da empresa.
- `/configuracoes/usuarios` — listagem + convite + gerenciamento de papéis.
- `/configuracoes/perfil` — edição do próprio perfil.
- `/configuracoes/auditoria` — listagem de activity_logs (admin_rh).
- `/dashboard` — stub com KPIs básicos + checklist de primeiros passos.
- Middleware de rotas com todas as regras de auth e role.
- Notifications sistema base (`notify()` e badge polling).
- Activity logs sistema base (`logActivity()`).
- RLS em todas as tabelas operacionais.

### Fora do MVP 1.0 (vai para FT-1 a FT-5)
- CRUD completo de colaboradores (FT-1).
- Departamentos/cargos com tela dedicada de gestão detalhada (FT-1).
- Ciclos de avaliação, formulários, respostas, resultados (FT-2).
- Feedbacks contínuos (FT-3).
- PDI (FT-4).
- Dashboard com métricas reais (FT-5).
- Signup público e billing.
- Notifications por e-mail (in-app apenas).
- Export CSV/PDF.

## 3. User stories

Baseadas em `docs/PRD-GERAL.md §8 Fase 0` e `docs/USERS-ABLE.md §1`:

### Autenticação
- Users should be able to fazer login com e-mail e senha.
- Users should be able to marcar "lembrar-me" para sessão estendida.
- Users should be able to recuperar senha por e-mail.
- Users should be able to definir nova senha via token de reset.
- Users should be able to sair da conta (logout).

### Onboarding
- Admins should be able to criar uma empresa no primeiro acesso via wizard de 4 passos.
- Admins should be able to preencher a própria ficha de colaborador no onboarding.
- Admins should be able to criar o primeiro departamento inline (opcional).
- Admins should be able to revisar a estrutura inicial (cargos + competências) antes de finalizar.

### Convite
- Admins should be able to convidar novos usuários por e-mail.
- Admins should be able to escolher se envia convite no momento ou depois.
- Admins should be able to listar convites pendentes, ativos e expirados.
- Admins should be able to reenviar convite expirado (gera novo token).
- Admins should be able to revogar convite pendente.
- Invitees should be able to aceitar convite e definir senha.

### Perfil e permissões
- Users should be able to editar nome, foto, telefone e senha no próprio perfil.
- Users should be able to visualizar seus dados de RH (cargo, departamento, admissão) em read-only no perfil.
- Admin_rh should be able to editar dados da empresa.
- Admin_rh should be able to alterar papéis de outros usuários (exceto o próprio).
- Admin_rh should be able to desativar usuários (exceto o próprio).
- Admin_rh should be able to consultar activity logs da empresa.

### Acesso
- Users should be able to acessar apenas dados da própria empresa.
- Users should be able to navegar no app com sidebar mostrando itens futuros desabilitados.

## 4. Rotas

### Públicas
```
/login
/forgot-password
/reset-password/[token]
/convite/[token]
/conta-suspensa                   (só se empresa.status = 'suspended')
```

### Autenticadas (protegidas pelo middleware)
```
/onboarding/criar-empresa         (só se user sem company)
/dashboard                        (todos os roles)
/configuracoes                    (redirect para /configuracoes/empresa)
/configuracoes/empresa            (admin_rh)
/configuracoes/usuarios           (admin_rh)
/configuracoes/departamentos      (admin_rh, stub — CRUD na FT-1)
/configuracoes/cargos             (admin_rh, stub — CRUD na FT-1)
/configuracoes/competencias       (admin_rh, stub — CRUD na FT-2)
/configuracoes/auditoria          (admin_rh)
/configuracoes/perfil             (todos os roles)
```

## 5. Schema SQL

Migrations Supabase em `supabase/migrations/`:

```sql
-- 20260419_0001_init_fase_0.sql

-- 1) companies
CREATE TABLE companies (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  cnpj       text,
  segment    text NOT NULL,
  team_size  text NOT NULL,
  logo_url   text,
  status     text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) profiles (extensão 1:1 de auth.users)
CREATE TABLE profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  role       text NOT NULL DEFAULT 'user' CHECK (role IN ('admin_rh','director','user')),
  full_name  text NOT NULL,
  phone      text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_profiles_company ON profiles(company_id);

-- 3) departments
CREATE TABLE departments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        text NOT NULL,
  is_archived boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, name)
);
CREATE INDEX idx_departments_company ON departments(company_id);

-- 4) positions (seed de 4 no onboarding)
CREATE TABLE positions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        text NOT NULL,
  is_archived boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, name)
);
CREATE INDEX idx_positions_company ON positions(company_id);

-- 5) competencies (seed de 7 no onboarding)
CREATE TABLE competencies (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        text NOT NULL,
  description text,
  is_archived boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, name)
);
CREATE INDEX idx_competencies_company ON competencies(company_id);

-- 6) employees (ficha de RH)
CREATE TABLE employees (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name     text NOT NULL,
  email         text NOT NULL,
  phone         text,
  position_id   uuid REFERENCES positions(id) ON DELETE SET NULL,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  manager_id    uuid REFERENCES employees(id) ON DELETE SET NULL,
  hire_date     date NOT NULL,
  status        text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','terminated')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, email)
);
CREATE INDEX idx_employees_company ON employees(company_id);
CREATE INDEX idx_employees_user    ON employees(user_id);
CREATE INDEX idx_employees_manager ON employees(manager_id);

-- 7) invites
CREATE TABLE invites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  email       text NOT NULL,
  token       text NOT NULL UNIQUE,
  role        text NOT NULL CHECK (role IN ('admin_rh','director','user')),
  invited_by  uuid NOT NULL REFERENCES auth.users(id),
  expires_at  timestamptz NOT NULL,
  accepted_at timestamptz,
  revoked_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_invites_company  ON invites(company_id);
CREATE INDEX idx_invites_employee ON invites(employee_id);
CREATE INDEX idx_invites_token    ON invites(token);

-- 8) notifications
CREATE TABLE notifications (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        text NOT NULL,
  title       text NOT NULL,
  body        text,
  link_url    text,
  entity_type text,
  entity_id   uuid,
  read_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE read_at IS NULL;

-- 9) activity_logs
CREATE TABLE activity_logs (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  company_id     uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  actor_user_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action         text NOT NULL,
  entity_type    text,
  entity_id      uuid,
  metadata       jsonb NOT NULL DEFAULT '{}',
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_activity_logs_company_date ON activity_logs(company_id, created_at DESC);
```

### Helpers RLS

```sql
-- 20260419_0002_rls_helpers.sql

CREATE OR REPLACE FUNCTION auth.company_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION auth.role_name() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;
```

### Policies

```sql
-- 20260419_0003_rls_policies.sql

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_select ON profiles FOR SELECT
USING ( id = auth.uid() OR (company_id = auth.company_id() AND auth.role_name() = 'admin_rh') );
CREATE POLICY profiles_update_self ON profiles FOR UPDATE
USING ( id = auth.uid() );
CREATE POLICY profiles_update_admin ON profiles FOR UPDATE
USING ( company_id = auth.company_id() AND auth.role_name() = 'admin_rh' );

-- companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY companies_select ON companies FOR SELECT
USING ( id = auth.company_id() );
CREATE POLICY companies_update_admin ON companies FOR UPDATE
USING ( id = auth.company_id() AND auth.role_name() = 'admin_rh' );

-- departments / positions / competencies (mesmo padrão)
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY departments_select ON departments FOR SELECT
USING ( company_id = auth.company_id() );
CREATE POLICY departments_write_admin ON departments FOR ALL
USING ( company_id = auth.company_id() AND auth.role_name() = 'admin_rh' )
WITH CHECK ( company_id = auth.company_id() AND auth.role_name() = 'admin_rh' );

ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY positions_select ON positions FOR SELECT
USING ( company_id = auth.company_id() );
CREATE POLICY positions_write_admin ON positions FOR ALL
USING ( company_id = auth.company_id() AND auth.role_name() = 'admin_rh' )
WITH CHECK ( company_id = auth.company_id() AND auth.role_name() = 'admin_rh' );

ALTER TABLE competencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY competencies_select ON competencies FOR SELECT
USING ( company_id = auth.company_id() );
CREATE POLICY competencies_write_admin ON competencies FOR ALL
USING ( company_id = auth.company_id() AND auth.role_name() = 'admin_rh' )
WITH CHECK ( company_id = auth.company_id() AND auth.role_name() = 'admin_rh' );

-- employees
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY employees_select ON employees FOR SELECT
USING ( company_id = auth.company_id() );
CREATE POLICY employees_write_admin ON employees FOR ALL
USING ( company_id = auth.company_id() AND auth.role_name() = 'admin_rh' )
WITH CHECK ( company_id = auth.company_id() AND auth.role_name() = 'admin_rh' );

-- invites
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY invites_admin ON invites FOR ALL
USING ( company_id = auth.company_id() AND auth.role_name() = 'admin_rh' )
WITH CHECK ( company_id = auth.company_id() AND auth.role_name() = 'admin_rh' );

-- notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_own ON notifications FOR SELECT
USING ( user_id = auth.uid() );
CREATE POLICY notifications_update_own ON notifications FOR UPDATE
USING ( user_id = auth.uid() );

-- activity_logs (INSERT só via service_role, SELECT para admin_rh)
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY logs_admin_select ON activity_logs FOR SELECT
USING ( company_id = auth.company_id() AND auth.role_name() = 'admin_rh' );
```

### Seed inicial

```sql
-- supabase/seed.sql (roda no reset local; em prod, aplica manualmente se necessário)
-- Nenhum seed no MVP — o cadastro da empresa no onboarding é quem insere
-- cargos e competências via função createCompany().
```

## 6. Estrutura do código

```
src/
  app/
    (auth)/
      login/page.tsx
      forgot-password/page.tsx
      reset-password/[token]/page.tsx
      convite/[token]/page.tsx
      layout.tsx                    # layout público (centrado, logo topo)
    (onboarding)/
      onboarding/criar-empresa/page.tsx     # wizard 4 passos
      layout.tsx                    # layout minimal
    (app)/
      dashboard/page.tsx            # stub Fase 0
      configuracoes/
        empresa/page.tsx
        usuarios/page.tsx
        departamentos/page.tsx      # stub até FT-1
        cargos/page.tsx             # stub até FT-1
        competencias/page.tsx       # stub até FT-2
        auditoria/page.tsx
        perfil/page.tsx
        layout.tsx                  # abas laterais de configurações
      layout.tsx                    # app shell (sidebar escura + user card)
    conta-suspensa/page.tsx
    layout.tsx                      # root layout (fonte Geist, Sentry)
    globals.css                     # paleta com laranja primary

  middleware.ts                     # route guards (ver §7)

  lib/
    supabase/
      server.ts
      browser.ts
      admin.ts
      types.ts                      # gerado via supabase gen types
    date.ts
    number.ts
    notifications.ts                # notify()
    activity.ts                     # logActivity()
    validations.ts                  # shared Zod schemas

  features/
    auth/
      schema.ts                     # LoginSchema, ForgotPasswordSchema, ResetPasswordSchema
      actions.ts                    # signIn, signOut, requestPasswordReset, resetPassword
      components/
        LoginForm.tsx
        ForgotPasswordForm.tsx
        ResetPasswordForm.tsx
    company/
      schema.ts                     # CompanySchema (zod)
      queries.ts                    # getCurrentCompany, getCompanyById
      actions.ts                    # createCompany (service_role), updateCompany
      components/
        OnboardingWizard.tsx        # orquestra 4 passos
        OnboardingStep1Company.tsx
        OnboardingStep2Profile.tsx
        OnboardingStep3Review.tsx
        OnboardingStep4Confirm.tsx
        CompanyEditForm.tsx
    users/
      schema.ts                     # InviteSchema, UpdateRoleSchema
      queries.ts                    # listUsers (profiles + invites unified)
      actions.ts                    # inviteUser, revokeInvite, resendInvite, updateRole, deactivateUser
      permissions.ts                # canManageUser(actor, target)
      components/
        UsersList.tsx               # TanStack Table
        InviteSheet.tsx             # side sheet
        AcceptInviteForm.tsx
    profile/
      schema.ts
      queries.ts                    # getCurrentProfile
      actions.ts                    # updateProfile, changePassword
      components/
        ProfileForm.tsx
        ChangePasswordDialog.tsx
    notifications/
      queries.ts                    # unreadCount, listRecent
      actions.ts                    # markAsRead
      components/
        NotificationBell.tsx
    activity/
      queries.ts                    # listActivityLogs
      components/
        ActivityLogList.tsx
    shell/
      components/
        Sidebar.tsx                 # sidebar escura
        UserCard.tsx                # card user no rodapé
        TopBar.tsx                  # breadcrumbs + bell

  components/
    ui/                             # shadcn primitives
    EmptyState.tsx
    PageHeader.tsx

tests/
  e2e/
    auth.spec.ts                    # login/logout/reset
    onboarding.spec.ts              # wizard completo
    invite-flow.spec.ts             # convite → aceite

supabase/
  migrations/
    20260419_0001_init_fase_0.sql
    20260419_0002_rls_helpers.sql
    20260419_0003_rls_policies.sql
```

## 7. Middleware — árvore de decisão

`src/middleware.ts`:

```typescript
// Pseudocódigo — implementação real lê session do Supabase server client
export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const session = await getSession(req);

  // 1) Rotas estritamente públicas
  if (matches(path, ['/login', '/forgot-password', '/reset-password/:token', '/convite/:token'])) {
    // Se já logado, redireciona para dashboard (exceto reset/convite que sempre permitem acesso)
    if (session && (path === '/login' || path === '/forgot-password')) {
      return redirect(session.hasCompany ? '/dashboard' : '/onboarding/criar-empresa');
    }
    return next();
  }

  // 2) Rotas autenticadas: precisa session
  if (!session) return redirect(`/login?continue=${encodeURIComponent(path)}`);

  // 3) Estado da conta
  if (session.employeeStatus === 'inactive') {
    await signOut();
    return redirect('/login?error=conta_inativa');
  }
  if (session.companyStatus === 'suspended' && path !== '/conta-suspensa') {
    return redirect('/conta-suspensa');
  }

  // 4) Sem company: só pode acessar onboarding
  if (!session.hasCompany) {
    if (path === '/onboarding/criar-empresa') return next();
    return redirect('/onboarding/criar-empresa');
  }

  // 5) Com company tentando acessar onboarding
  if (path.startsWith('/onboarding')) {
    return redirect('/dashboard');
  }

  // 6) Proteção de role
  if (path.startsWith('/configuracoes') && path !== '/configuracoes/perfil') {
    if (session.role !== 'admin_rh') return new Response('Forbidden', { status: 403 });
  }

  return next();
}

export const config = {
  matcher: ['/((?!_next|api/public|favicon|.*\\..*).*)'],
};
```

### Resolução de session
O middleware chama `createServerClient()`, pega `auth.getUser()`, e (se existir) faz uma query a `profiles` para obter `company_id`, `role`, `companies.status` e `employees.status`. Esse lookup pode ser cacheado em edge memory por alguns segundos, se a Railway permitir.

## 8. Componentes principais — telas

### 8.1. `/login`
- Card centrado, logo Evoluteam em laranja no topo.
- Campos: e-mail, senha, **checkbox "Lembrar-me"**.
- Link "Esqueci minha senha" → `/forgot-password`.
- Rodapé: "Não tem acesso? Fale com seu RH."
- Submit → `signIn()` action → Supabase Auth com `persistSession` baseado em "Lembrar-me".

### 8.2. `/forgot-password`
- Form com e-mail + botão "Enviar link".
- Action chama `supabase.auth.resetPasswordForEmail(email, { redirectTo: '/reset-password/[token]' })`.
- Feedback genérico ("Se o e-mail existir, um link foi enviado") para não enumerar usuários.

### 8.3. `/reset-password/[token]`
- Card com "nova senha" + "confirmar".
- Submit → atualiza senha via Supabase.
- Redirect para `/login` com toast de sucesso.

### 8.4. `/convite/[token]`
- Valida token: existe, não expirado, não aceito, não revogado, vinculado a employee ativo.
- Exibe copy "Você foi convidado para [nome da empresa]".
- Campos: nome completo (pré-preenchido do employee), senha, confirmar.
- Submit → `acceptInvite(token, { fullName, password })`:
  1. Cria `auth.user` via `supabase.auth.admin.createUser`.
  2. Insere `profiles` com `company_id`, `role` do invite, `full_name`.
  3. Atualiza `employees.user_id` para vincular.
  4. Marca `invites.accepted_at = now()`.
  5. Envia notification para admin_rh do convite: "Fulano aceitou o convite".
  6. Faz sign-in automático.
  7. Redirect para `/dashboard`.

### 8.5. `/onboarding/criar-empresa` — wizard 4 passos

**Estado controlado** em um `<OnboardingWizard />` que carrega submódulos por passo. Estado temporário em React state (sem salvar draft no DB — wizard é rápido).

**Passo 1 — Dados da empresa:**
- Nome* (text)
- CNPJ (text, opcional)
- Segmento* (select: 10 opções — Tecnologia, Comércio/Varejo, Indústria, Serviços, Saúde, Educação, Financeiro, Construção Civil, Agronegócio, Outro)
- Tamanho do time* (select: 5 ranges — 1–20, 21–50, 51–100, 101–300, 300+)
- Logo (upload opcional — adiar para `/configuracoes/empresa` se admin preferir)
- Botão "Próximo"

**Passo 2 — Seus dados de colaborador:**
- Nome completo* (text)
- Cargo* (select dos 4 seeds, default `Administrativo/RH`)
- Departamento (text inline, opcional — cria o 1º departamento se preenchido)
- Data de admissão* (date, default hoje)
- Telefone (text, opcional)
- Botões "Voltar" / "Próximo"

**Passo 3 — Revisar estrutura inicial:**
- Lista de cargos (pills laranja, 4 itens)
- Lista de competências (pills cinza, 7 itens)
- Bloco de departamentos (0 ou 1 item conforme passo 2)
- Copy: *"Tudo é editável depois em Configurações."*
- Botões "Voltar" / "Próximo"

**Passo 4 — Finalizar:**
- Resumo em 3 cards (empresa, você, estrutura) com link "editar" em cada
- Botão "Criar minha empresa" → chama `createCompany()` action
- Após sucesso: toast + redirect `/dashboard`

**`createCompany()`** (Server Action, usa `admin.ts` com service_role porque o user ainda não tem `company_id`):

```typescript
// Transação única
1. INSERT companies (dados passo 1) → companyId
2. INSERT departments (0 ou 1, do passo 2)
3. INSERT positions (4 seeds, cada UNIQUE por company_id)
4. INSERT competencies (7 seeds)
5. INSERT employees (admin, com company_id, user_id, hire_date etc) → adminEmployeeId
6. INSERT profiles (id=auth.uid(), company_id, role='admin_rh', full_name) OR UPDATE se já existir
7. logActivity({ action: 'company.created', entityId: companyId })
8. Se qualquer passo falhar → rollback completo
```

### 8.6. App shell autenticado (layout `(app)/layout.tsx`)
- **Sidebar escura** (fundo `#1f1f1f`):
  - Logo "Evoluteam" em laranja no topo.
  - Grupo **PRINCIPAL**: Dashboard, Colaboradores, Avaliações (disabled), Feedbacks (disabled), PDI (disabled).
  - Grupo **CONFIGURAÇÕES**: Empresa, Usuários, Departamentos, Cargos, Competências, Auditoria (todos visíveis só pra admin_rh) + Perfil (todos).
  - **User card** no rodapé: avatar, nome, "nome da empresa".
- **TopBar** clara no topo do conteúdo:
  - Breadcrumbs (ex: "Configurações › Usuários").
  - Ícone de notificação com badge (polling 30s).
  - (sem search global no MVP).
- Conteúdo principal à direita.

### 8.7. `/dashboard` (stub)
- Saudação: "Olá, {primeiro nome}".
- 3 KPI cards: Colaboradores ativos, Convites pendentes, Departamentos.
- Checklist "Primeiros passos":
  - ✓ Criar empresa (sempre completo ao ver essa tela)
  - ○ Convidar colaboradores → link `/configuracoes/usuarios`
  - ○ Definir departamentos → link `/configuracoes/departamentos`
  - ○ Criar primeiro ciclo (disabled, "Em breve")
- Aviso: *"Dashboard completo em breve. Quando você tiver ciclos de avaliação ativos, métricas aparecerão aqui."*

### 8.8. `/configuracoes/usuarios`
- Header com "+ Convidar usuário" (abre side sheet).
- Busca, filtro de status, filtro de role.
- Tabela (TanStack):
  - Coluna **Nome/E-mail** (nome em bold, e-mail cinza abaixo; se for o admin logado, tag "(você)").
  - Coluna **Cargo**.
  - Coluna **Papel** (pill colorida).
  - Coluna **Status** (Ativo/Pendente/Expirado).
  - Coluna **Ações** (kebab): editar papel, reenviar convite, revogar convite, desativar usuário.
- Paginação 20/página (só aparece se >20).
- Lista inclui:
  - `profiles` ativos (`auth.users` linkados) +
  - `invites` não aceitos (pending/expired/revoked), cada um com employee_id mostrando os dados do employee que será criado.

### 8.9. Side sheet `InviteSheet`
- 440px, slide da direita, overlay escuro.
- Campos: nome*, e-mail*, cargo*, papel*, departamento (opcional, com "+ Criar novo" inline), gestor direto (autocomplete, opcional), data de admissão*, checkbox **"Enviar convite agora"** (default on).
- Botão final muda de copy: "Cadastrar e enviar" vs "Cadastrar sem enviar".
- `inviteUser()` action:
  1. Valida input (Zod).
  2. INSERT `employees` (user_id NULL).
  3. INSERT `invites` (token = `crypto.randomUUID()`, expires_at = now + 7 days).
  4. Se checkbox on: envia e-mail via Resend (template HTML simples com botão "Aceitar convite").
  5. `logActivity({ action: 'invite.sent', entityId: inviteId })`.
  6. revalidatePath + toast.
  7. Falha no envio de e-mail **não** aborta — toast "Cadastrado, mas o envio falhou. Reenvie pelo menu ⋯".

### 8.10. `/configuracoes/empresa`
- Form com os mesmos campos do passo 1 do wizard + upload de logo (bucket Supabase Storage).
- Apenas admin_rh.
- `updateCompany()` action.

### 8.11. `/configuracoes/perfil`
- Todos os roles.
- Edita: nome, foto, telefone, senha (modal separada).
- Read-only: e-mail, cargo, departamento, admissão, gestor.
- Sem copy explicando "editável só pelo admin_rh" — regras ficam implícitas.

### 8.12. `/configuracoes/auditoria`
- Apenas admin_rh.
- Tabela paginada (30/página) de `activity_logs` com filtros: range de datas, tipo de ação, autor.
- Renderização por ação: `company.created` → "Empresa criada"; `invite.sent` → "{actor} convidou {email}"; etc. (dicionário de formatadores em `src/lib/activity.ts`).

### 8.13. `/conta-suspensa`
- Página estática, sem layout de app.
- Copy: "Sua conta está temporariamente suspensa. Entre em contato com o suporte."
- Único link ativo: "Sair" (logout).

## 9. Error states e edge cases

Ver `docs/dev/00-decisoes-transversais.md` §17 e a tabela completa abaixo:

| Categoria | Situação | Tratamento |
|---|---|---|
| **Convite** | Token inexistente | Página "Convite inválido. Peça novo ao RH." |
| | Token expirado | Mesma tela + admin reenvia via kebab |
| | Token já aceito | Redirect `/login` + toast "Já foi usado, entre com e-mail/senha" |
| | Token revogado | Página "Convite inválido" |
| | E-mail já em uso | Constraint UNIQUE bloqueia; toast "Usuário já cadastrado" |
| **Login** | Credencial errada | "E-mail ou senha inválidos" (genérico) |
| | Conta desativada | Força logout + redirect `/login?error=conta_inativa` |
| | Empresa suspensa | Redirect `/conta-suspensa` (bloqueia tudo exceto logout) |
| | Rate limit | "Muitas tentativas. Aguarde alguns minutos." |
| **Usuários** | Admin tenta auto-desativar | Botão disabled + validação server-side |
| | Admin tenta auto-rebaixar | Server Action bloqueia |
| | Último admin_rh | Não pode rebaixar último admin; toast "A empresa precisa de ao menos um administrador." |
| | Desativar gestor | Modal obriga escolher novo gestor OU aceitar NULL para todos liderados |
| | Arquivar departamento com employees | Modal de confirmação; se confirma, employees ficam com `department_id = NULL` |
| | Arquivar cargo com employees | Igual departamento (soft via NULL) |
| **Upload** | Logo > 2MB | Rejeita no client; toast "Até 2MB" |
| | Formato inválido | Aceita só PNG/JPG/WEBP |
| | Upload falha | Toast; não bloqueia form (logo opcional) |
| **Onboarding** | Wizard abandonado | Session persiste; ao retornar, middleware redireciona pro passo 1 |
| | Falha em `createCompany` | Rollback + toast + Sentry |
| **Notificações** | User deletado | CASCADE via FK |

## 10. Critérios de aceite

- [ ] Admin criado manualmente no Supabase consegue logar em `/login`.
- [ ] Admin sem empresa é redirecionado para `/onboarding/criar-empresa`.
- [ ] Admin completa os 4 passos do wizard e cai em `/dashboard`.
- [ ] Empresa, departamento inline (se preenchido), 4 cargos, 7 competências, 1 employee do admin, 1 profile do admin são criados na mesma transação.
- [ ] Admin convida Ana por `/configuracoes/usuarios` com checkbox "enviar agora" marcado.
- [ ] Ana recebe e-mail via Resend, clica no link, preenche nome/senha, entra direto em `/dashboard` — como `user`, ligada à empresa correta.
- [ ] Marcio (admin) vê notificação "Ana aceitou o convite".
- [ ] Ana NÃO vê `/configuracoes/empresa` (403 via middleware).
- [ ] Marcio tenta desativar a si mesmo — botão disabled; se tentar via API, server valida e bloqueia.
- [ ] Token de convite expirado mostra a tela apropriada; admin reenvia.
- [ ] `/configuracoes/auditoria` lista os eventos (`company.created`, `invite.sent`, `invite.accepted`).
- [ ] RLS: em modo incógnito, conectando no Supabase com JWT de Ana, SELECT em `companies` só retorna a empresa dela.
- [ ] `/dashboard` stub mostra 3 KPIs corretos (colaboradores=2, convites pendentes=0, departamentos=1).
- [ ] Todos os itens de menu futuros aparecem na sidebar em cinza (desabilitados).
- [ ] Pt-BR, datas `dd/MM/yyyy`, timezone `America/Sao_Paulo` em toda exibição.
- [ ] Vitest testa permissões + schemas + helpers puros.
- [ ] Playwright smoke: login, onboarding completo, convite → aceite.
- [ ] Sentry captura um erro artificial e envia para o projeto configurado.

## 11. Plano de implementação (ordem sugerida)

1. **Scaffold** — `npx create-next-app@latest evoluteam --ts --tailwind --app --src-dir` + configs (ESLint, Prettier, fontes Geist, paleta orange).
2. **Supabase** — criar projeto cloud, gerar URL/keys, configurar Resend com `marct.co`, instalar `@supabase/ssr` + `@supabase/supabase-js`.
3. **Migrations** — rodar as 3 migrations (tables, helpers, policies).
4. **Supabase clients** — `server.ts`, `browser.ts`, `admin.ts`, tipos gerados.
5. **Shell visual** — `app/(app)/layout.tsx` com sidebar + user card + topbar.
6. **Rotas públicas** — login, forgot, reset, convite (com página de "token inválido").
7. **Middleware** — todas as regras da §7.
8. **Onboarding wizard** — 4 passos + `createCompany()`.
9. **`/configuracoes/perfil`** — form simples.
10. **`/configuracoes/empresa`** — form com upload de logo.
11. **`/configuracoes/usuarios`** — lista + side sheet de convite + `inviteUser()`.
12. **Fluxo de aceite** — `/convite/[token]` + `acceptInvite()`.
13. **Ações de gestão** — revogar, reenviar, editar papel, desativar usuário.
14. **Notifications base** — `notify()`, badge com polling, lista.
15. **Activity logs base** — `logActivity()`, `/configuracoes/auditoria`.
16. **Dashboard stub** — KPIs + checklist.
17. **Stubs** — `/configuracoes/departamentos`, `/cargos`, `/competencias` (páginas "Em breve na próxima fase").
18. **Sentry** — `@sentry/nextjs` wizard, verificação de envio.
19. **Testes** — Vitest + Playwright cobrindo critérios de aceite.
20. **Deploy** — Railway configurado, `marct.co` verificado no Resend, admin de teste criado.

## 12. Não-funcionais

- **Performance:** sidebar e shell renderizam em <200ms em rede local.
- **Acessibilidade:** shadcn garante a11y base; botões têm labels; forms têm `aria-describedby` para erros.
- **Segurança:** RLS obrigatório; `service_role` nunca exposto ao client; tokens de convite são UUID v4 (não adivinháveis); senha mínima 8 caracteres (padrão Supabase).
- **i18n:** pt-BR hardcoded; nenhum `next-intl` até demanda.
- **Observabilidade:** Sentry em server + client; logs Railway para stdout.

## 13. Referências

- `docs/PRD-GERAL.md` §8 Fase 0
- `docs/MVP.md` §1
- `docs/USERS-ABLE.md` §1
- `docs/ESTRUTURA.md` §18 Sprint 1
- `docs/dev/00-decisoes-transversais.md` — toda decisão #1 a #17
