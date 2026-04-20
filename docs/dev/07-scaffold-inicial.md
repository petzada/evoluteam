# Scaffold inicial — Evoluteam

Guia passo a passo para sair do zero ao primeiro `pnpm dev` funcionando, e protocolo de desenvolvimento para todas as features subsequentes.
Última atualização: 2026-04-20.

> **Leia antes:** todos os specs `docs/dev/00-decisoes-transversais.md` a `06-ft-5-dashboard.md`.

---

## 1. Pré-requisitos

Antes de começar, confirmar que os itens abaixo estão prontos:

- [ ] **Node.js 22 LTS** instalado (`node -v` deve retornar `v22.x`)
- [ ] **pnpm** instalado via Corepack:
  ```bash
  corepack enable
  corepack prepare pnpm@latest --activate
  pnpm -v  # confirmar instalação
  ```
- [ ] **Supabase CLI** instalado globalmente (apenas para `gen types`):
  ```bash
  pnpm add -g supabase
  supabase -v  # confirmar instalação
  ```
- [ ] **Projeto Supabase** já criado no dashboard — ter em mãos:
  - Project URL (`https://<ref>.supabase.co`)
  - Anon key (public)
  - Service role key (secret)
  - Project ID (ref, ex: `abcdefghijklmnop`)
- [ ] **Resend** — conta criada, API key gerada, domínio `marct.co` verificado com SPF/DKIM
- [ ] **Sentry** — projeto criado (free tier), DSN disponível (opcional para dev local)

---

## 2. Criar o projeto Next.js

```bash
pnpm create next-app@latest evoluteam \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-turbopack

cd evoluteam
```

> `--no-turbopack` evita incompatibilidades com algumas dependências no início do projeto.

---

## 3. Instalar dependências

```bash
# Runtime
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add react-hook-form @hookform/resolvers zod
pnpm add @tanstack/react-table
pnpm add recharts
pnpm add sonner
pnpm add lucide-react
pnpm add next-themes

# Sentry
pnpm add @sentry/nextjs

# Dev
pnpm add -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
pnpm add -D @types/node
```

---

## 4. Configurar shadcn/ui

```bash
# Inicializar (escolher: New York style, zinc base color, CSS variables = yes)
pnpm dlx shadcn@latest init

# Instalar conjunto core
pnpm dlx shadcn@latest add \
  button input label textarea form \
  sheet dialog alert-dialog \
  table \
  select dropdown-menu \
  badge avatar \
  skeleton \
  tabs card separator tooltip \
  sonner
```

> Componentes adicionais serão instalados sob demanda conforme cada feature:
> - FT-2: `calendar`, `progress`
> - FT-5: nenhum extra (Recharts já instalado)

---

## 5. Configurar Vitest

Criar `vitest.config.ts` na raiz:

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

Criar `src/test/setup.ts`:

```typescript
import '@testing-library/jest-dom';
```

Adicionar scripts em `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run"
  }
}
```

---

## 6. Configurar Sentry

```bash
pnpm dlx @sentry/wizard@latest -i nextjs
```

> O wizard cria `sentry.client.config.ts`, `sentry.server.config.ts` e `sentry.edge.config.ts` automaticamente. Aceitar todas as opções padrão.

---

## 7. Variáveis de ambiente

Criar `.env.example` (commitado no git):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Resend (obrigatorio para fluxo de convite — Fase 0)
RESEND_API_KEY=

# Sentry (opcional — pode deixar vazio em dev local)
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
```

Criar `.env.local` (no `.gitignore` — preencher com valores reais):

```bash
cp .env.example .env.local
# Editar .env.local com os valores reais do Supabase, Resend e Sentry
```

Confirmar que `.gitignore` inclui `.env.local` (Next.js já inclui por padrão).

---

## 8. Configurar clientes Supabase

Criar os 4 arquivos do cliente conforme `docs/dev/00-decisoes-transversais.md §8`:

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './types';

export function createServerSupabaseClient() {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}
```

```typescript
// src/lib/supabase/browser.ts
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

export function createBrowserSupabaseClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

```typescript
// src/lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

export function createAdminSupabaseClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
```

```typescript
// src/lib/supabase/types.ts
// Arquivo gerado automaticamente — NÃO editar à mão
// Ver §10 para o comando de geração
export type Database = { public: { Tables: {}; Views: {}; Functions: {} } };
```

---

## 9. Estrutura de pastas

Estrutura alvo após setup inicial (antes de qualquer feature):

```
src/
  app/
    (auth)/
      login/page.tsx
      forgot-password/page.tsx
      reset-password/[token]/page.tsx
      layout.tsx
    (onboarding)/
      criar-empresa/page.tsx
      convite/[token]/page.tsx
    (app)/
      dashboard/page.tsx
      colaboradores/
        page.tsx
        novo/page.tsx
        [id]/page.tsx
      avaliacoes/
      feedbacks/
      pdi/
      configuracoes/
        empresa/page.tsx
        usuarios/page.tsx
        departamentos/page.tsx
        cargos/page.tsx
        competencias/page.tsx
        auditoria/page.tsx
        perfil/page.tsx
        layout.tsx
      layout.tsx            # app shell (sidebar + topbar)
    conta-suspensa/page.tsx
    layout.tsx              # root layout (Geist, Sentry, Sonner)
    globals.css
  middleware.ts
  components/
    ui/                     # componentes shadcn/ui (gerados pelo CLI)
    EmptyState.tsx          # componente global de estado vazio
  lib/
    supabase/
      server.ts
      browser.ts
      admin.ts
      types.ts
    date.ts                 # formatadores de data (pt-BR, São Paulo)
    number.ts               # formatadores de número (pt-BR)
    notifications.ts        # notify()
    activity.ts             # logActivity()
    validations.ts          # schemas Zod compartilhados
  features/
    auth/
    company/
    employees/
    reviews/
    feedbacks/
    pdi/
    dashboard/
    settings/
  test/
    setup.ts
```

---

## 10. Ciclo de desenvolvimento por feature

Para **cada feature** (Fase 0, FT-1, FT-2, FT-3, FT-4, FT-5), seguir esta ordem:

### Passo 1 — Configurar Supabase dashboard
Consultar o checklist da feature em §11 e aplicar as configurações necessárias no dashboard antes de escrever código.

### Passo 2 — Aplicar migration no SQL Editor
Abrir **Supabase dashboard → SQL Editor**, colar o SQL da migration correspondente ao spec da feature e executar.

Nomear mentalmente as migrations na ordem dos specs:
- Fase 0: `20260501_*`
- FT-1: `20260508_*`
- FT-2: `20260510_*`
- FT-3: `20260517_*`
- FT-4: `20260601_*`
- FT-5: sem migration

### Passo 3 — Gerar tipos TypeScript
Após aplicar a migration, rodar:

```bash
npx supabase gen types typescript \
  --project-id <SEU_PROJECT_ID> \
  > src/lib/supabase/types.ts
```

> Substitua `<SEU_PROJECT_ID>` pelo ref do seu projeto (ex: `abcdefghijklmnop`).

### Passo 4 — Implementar na ordem
Dentro de `src/features/<domain>/`:

1. `schema.ts` — schemas Zod de input/output
2. `permissions.ts` — helpers de autorização (puros, testáveis)
3. `queries.ts` — funções de leitura (server client)
4. `actions.ts` — Server Actions (mutations, revalidatePath, logActivity, notify)
5. `components/` — React components

### Passo 5 — Rotas e páginas
Criar as páginas em `src/app/(app)/` conforme o spec da feature.

### Passo 6 — Testes unitários (Vitest)
Cobrir pelo menos: permissions, schema Zod, funções utilitárias da feature.

```bash
pnpm test
```

### Passo 7 — Commit
```bash
git add .
git commit -m "feat(<domain>): <descricao breve>"
```

Frequência sugerida: 1 commit por sub-entrega (ex: `feat(auth): login + forgot password`, `feat(auth): onboarding wizard`). Não esperar a feature inteira para commitar.

---

## 11. Checklist Supabase dashboard por fase

### Fase 0

**Auth → URL Configuration:**
- [ ] Site URL: `http://localhost:3000`
- [ ] Redirect URLs: `http://localhost:3000/**`

**Auth → Email:**
- [ ] Confirm email: **DESABILITAR** (para dev local; reabilitar antes de produção)
- [ ] Secure email change: manter padrão

**Auth → Sessions:**
- [ ] JWT Expiry: `604800` (7 dias — suporta "Lembrar-me" da Fase 0)

**Storage:**
- [ ] Criar bucket `avatars` (público) — para foto de perfil e logo da empresa
- [ ] Policy do bucket: leitura pública, escrita autenticada restrita ao próprio `user_id`

**SQL:**
- [ ] Executar funções auxiliares: `public.my_company_id()` e `public.my_role()` (definidas no spec Fase 0 §6)

### FT-1 a FT-3

Nenhuma configuração adicional no dashboard. Só migrations SQL.

### FT-4

**Extensions:**
- [ ] Habilitar extensão `pg_cron`: Database → Extensions → procurar `pg_cron` → Enable
- [ ] Após habilitar, executar a migration `20260601_0005_ft4_pdi_cron.sql` para registrar o job diário

### FT-5

Nenhuma configuração adicional. Só implementação de queries.

### Antes do deploy em produção (Railway)

- [ ] Auth → Email → Confirm email: **REABILITAR**
- [ ] Auth → URL Configuration: atualizar Site URL e Redirect URLs para o domínio de produção (`https://evolu.team`)
- [ ] Storage → bucket `avatars`: revisar policies de produção
- [ ] Criar segundo projeto Supabase (prod) separado do dev — ver decisão transversal §9

---

## 12. Primeiro commit após setup

Após completar os passos 2–9, fazer o primeiro commit antes de qualquer código de feature:

```bash
git add .
git commit -m "chore: scaffold inicial Next.js + Supabase + shadcn/ui + Vitest"
```

O `.env.example` deve estar incluso neste commit. O `.env.local` nunca é commitado.

---

## 14. Referências

- `docs/dev/00-decisoes-transversais.md` — stack, estrutura por feature, padrão Server Action
- `docs/dev/01-fase-0-fundacao.md` — primeira feature a implementar
- `docs/dev/02-ft-1-colaboradores.md` a `06-ft-5-dashboard.md` — features subsequentes
- Next.js App Router docs: `nextjs.org/docs`
- Supabase SSR guide: `supabase.com/docs/guides/auth/server-side/nextjs`
- shadcn/ui: `ui.shadcn.com`
