# Design — Templates de e-mail com react-email

**Data:** 2026-04-22
**Escopo:** Migrar os dois templates de e-mail transacional do Evoluteam (admin welcome, employee invite) para `react-email`, travando o padrão para futuros templates (recuperação de senha custom, lembretes, notificações).

---

## 1. Motivação

Hoje temos dois templates em `src/lib/emails/*.ts` com HTML inline cru (`<p>` tags, sem branding, sem footer, sem preheader, sem fallback de texto). Exemplos:

- `src/lib/emails/admin-welcome.ts:11` — 6 linhas de HTML sem estilo.
- `src/lib/emails/employee-invite.ts:11` — idem.

Ambos já passam por `sendEmail()` em `src/lib/email.ts:13` (Resend ativo). O problema não é a integração — é o **padrão de autoria** dos templates: HTML inline é chato de estilar, não tem preview, não é testável visualmente, e cada novo template tende a reinventar header/footer.

A escolha é por `react-email`: biblioteca React + componentes cross-client, com CLI de preview (`email dev`) e `render()` que converte para HTML final. Padrão de mercado para Resend; zero fricção com a stack atual (React 19, TypeScript).

### Fora do escopo

- **Template de lembrete de avaliações** (`src/features/reviews/actions.ts:632`) — usa `resend.emails.send()` direto, com HTML inline. Fica anotado como tech debt, migra em seguida.
- **Magic link direto no admin welcome** — hoje o CTA do welcome aponta pra `/forgot-password` (form onde o admin digita o e-mail pra receber um segundo e-mail de reset). Seria melhor gerar um link de recovery direto no webhook via `admin.generateLink({ type: 'recovery' })`. Fica pra outra spec — requer mudança no webhook, não no template.

---

## 2. Contexto da codebase

**Stack relevante:**
- Next.js 16.2.4, React 19.2, TypeScript 5, Tailwind 4, Vitest 4.1, pnpm 10.32.
- `resend@^6.12.0` já instalado.
- `NEXT_PUBLIC_SITE_URL=https://evolu.team` em produção.

**Branding (extraído da app):**
- Cor primária: laranja `#F97316` (Tailwind 500) — veja `src/app/globals.css:54` (oklch equivalente) e uso consistente em `src/app/(auth)/layout.tsx:5`, `src/app/(onboarding)/layout.tsx:5`, `src/features/shell/components/Sidebar.tsx:160`.
- Wordmark: texto "Evoluteam", `font-bold tracking-tight`, cor primária. Nenhum logotipo gráfico é usado na navegação.
- Fonte: Geist Sans (não sobrevive em cliente de e-mail — cai em `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`).

**From address:** `Evoluteam <marcio@marct.co>` (domínio `marct.co` verificado no Resend). Mantido.

**Fluxos atuais:**

1. **Admin welcome** — `src/app/api/webhooks/auth-user-created/route.ts:59`.
   Supabase `auth.users` INSERT → trigger SQL → HTTP POST com HMAC → branching por `app_metadata.source`:
   - `source === 'invite'` → ignora (o aceite de convite criou o user).
   - Caso contrário → envia welcome com `recoveryUrl = ${origin}/forgot-password`.

2. **Employee invite** — `src/features/employees/actions.ts:202` (`sendInviteForEmployee`).
   Chamado por `createEmployee` e `resendInvite`. Cria registro em `invites` com token UUID, envia e-mail com `inviteUrl = ${origin}/convite/${token}`. `acceptInvite` (mesmo arquivo, linha 527) cria o `auth.users` com `app_metadata: { source: 'invite' }` — é isso que previne duplo e-mail.

**Dados disponíveis para enriquecer o invite** (já consultáveis via join na tabela `invites`):
- `employees.full_name` — nome do convidado.
- `companies.name` — nome da empresa.
- `profiles.full_name` via `invites.invited_by` — nome de quem convidou.
- `invites.role` — vira `roleLabel` ("administrador RH" | "colaborador").
- `invites.expires_at` — vira "expira em X dias".

---

## 3. Arquitetura

### Abordagem escolhida: render-to-HTML no caller

`sendEmail()` em `src/lib/email.ts` **permanece com assinatura `{ to, subject, html }`** — zero breaking change.

Cada template expõe uma função `render*(props)` que retorna `{ subject, html }` usando `@react-email/render`. O caller faz:

```ts
await sendEmail({
  to: record.email,
  ...(await renderAdminWelcome({ recoveryUrl })),
});
```

Benefícios:
- `sendEmail()` fica enxuto (uma preocupação: despachar HTML pelo Resend).
- `render*` é puro — fácil de testar via snapshot de HTML.
- Ponto único (`@/emails/*`) para adicionar text-plain, preheader, etc. no futuro.

Alternativa rejeitada: passar `react: <Component/>` direto pro `sendEmail()`. Complicaria a assinatura (`html?` vs `react?`) e espalharia responsabilidade de renderização.

### Estrutura de pastas

```
src/
├─ emails/                         # pasta nova, top-level (padrão react-email)
│  ├─ _components/
│  │  ├─ Layout.tsx                # <Html><Head><Body> + header wordmark + footer
│  │  ├─ Button.tsx                # CTA laranja sólido
│  │  ├─ Heading.tsx               # título do e-mail
│  │  └─ Text.tsx                  # parágrafo padrão + variant muted
│  ├─ _lib/
│  │  └─ role-label.ts             # Role -> string PT-BR
│  ├─ admin-welcome.tsx            # AdminWelcomeEmail + renderAdminWelcome
│  ├─ admin-welcome.test.tsx
│  ├─ employee-invite.tsx          # EmployeeInviteEmail + renderEmployeeInvite
│  ├─ employee-invite.test.tsx
│  └─ README.md                    # como criar novo template
├─ lib/
│  ├─ email.ts                     # inalterado
│  └─ emails/                      # DELETADO (migra pra src/emails/)
```

**`src/lib/emails/admin-welcome.ts` e `src/lib/emails/employee-invite.ts` são removidos** ao final.

### Dependências novas

| Pacote | Tipo | Função |
|---|---|---|
| `@react-email/components` | runtime | `<Html>`, `<Body>`, `<Container>`, `<Section>`, `<Button>`, `<Hr>`, `<Text>`, `<Link>`, `<Preview>` |
| `@react-email/render` | runtime | `render(component)` → `Promise<string>` de HTML |
| `react-email` | dev | CLI `email dev` pra preview local |

### Scripts novos (`package.json`)

```json
"email:dev": "email dev --dir src/emails --port 3001"
```

Porta 3001 pra não conflitar com `pnpm dev` (Next em 3000).

---

## 4. Design visual

### Canvas

```
┌─────────────────────────────────────┐  ← background #F5F5F5, padding 40px 20px
│                                     │
│   ┌───────────────────────────────┐ │  ← card #FFFFFF, 600px, radius 12, padding 40
│   │ Evoluteam                     │ │  ← wordmark: 22px, weight 700, #F97316
│   │                               │ │    tracking -0.02em
│   │ {conteúdo do template}        │ │
│   │                               │ │
│   │ ─────────────────────────     │ │  ← <Hr> #E5E5E5
│   │ Evoluteam · evolu.team        │ │  ← footer: 13px #737373
│   │ {footerMessage}               │ │
│   └───────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### Componentes compartilhados

**`Layout.tsx`**
```ts
interface LayoutProps {
  preheader: string;
  footerMessage: string;
  children: ReactNode;
}
```
Renderiza `<Html><Head><Preview>{preheader}</Preview><Body>...<Container>...</Container></Body></Html>`.

**`Button.tsx`** — wrapper fino de `@react-email/components` `<Button>`:
- `backgroundColor: #F97316`, `color: #FFFFFF`
- `padding: 14px 28px`, `borderRadius: 8px`
- `fontSize: 15px`, `fontWeight: 600`
- `textDecoration: none`, `display: inline-block`

Props: `{ href: string; children: ReactNode }`.

**`Heading.tsx`** — 22px, weight 700, color `#171717`, margin `0 0 16px 0`.

**`Text.tsx`** — 15px, line-height 1.6, color `#404040`, margin `0 0 16px 0`. Suporta `variant="muted"` para 13px `#737373` (usado em fallback-link e rodapé).

### Regras visuais obrigatórias (quirks de e-mail)

- Estilos **inline** via `style={{}}`. Nada de CSS externo.
- Layout via `<Section>`, `<Row>`, `<Column>` de `@react-email/components` (renderiza tabelas internamente). Nada de Flexbox/Grid.
- Cores em HEX (Outlook ignora OKLCH).
- Imagens: `width`/`height` explícitos, `alt` obrigatório. **Não usamos imagens** nesses templates; regra vale pra futuros.
- Font stack: `"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.

---

## 5. Conteúdo dos templates

### 5.1 `admin-welcome.tsx`

**Props:**
```ts
interface AdminWelcomeProps {
  recoveryUrl: string;
}
```

**Subject:** `Bem-vindo ao Evoluteam — defina sua senha`

**Preheader:** `Sua conta de administrador está pronta. Defina sua senha para começar.`

**Corpo:**
```
<Heading>Bem-vindo ao Evoluteam</Heading>
<Text>Olá,</Text>
<Text>
  Sua conta de administrador no Evoluteam foi criada. Para começar,
  defina sua senha e finalize o cadastro da sua empresa.
</Text>
<Button href={recoveryUrl}>Definir minha senha</Button>
<Text variant="muted">Se o botão não funcionar, copie e cole este link no navegador:</Text>
<Text variant="muted"><Link href={recoveryUrl}>{recoveryUrl}</Link></Text>
```

**Footer message:** `Se você não esperava este email, pode ignorá-lo.`

### 5.2 `employee-invite.tsx`

**Props:**
```ts
interface EmployeeInviteProps {
  inviteUrl: string;
  inviteeName?: string;
  inviterName?: string;
  companyName?: string;
  roleLabel?: string;
  expiresAt: Date;
}
```

**Subject (resolvido no `renderEmployeeInvite`):**
```ts
inviterName && companyName
  ? `${inviterName} convidou você para o ${companyName} no Evoluteam`
  : 'Você foi convidado para o Evoluteam'
```

**Preheader:** `Aceite o convite para acessar a plataforma. O link expira em 7 dias.`

**Corpo principal com fallback em cascata:**

| Dados disponíveis | Texto |
|---|---|
| `inviterName` + `companyName` + `roleLabel` | **{inviterName}** convidou você para participar do **{companyName}** no Evoluteam como **{roleLabel}**. |
| `companyName` (sem inviter) | Você foi convidado para participar do **{companyName}** no Evoluteam. |
| nada | Você foi convidado para acessar o **Evoluteam**. |

**Estrutura:**
```
<Heading>Você foi convidado</Heading>
<Text>Olá{inviteeName ? `, ${firstName(inviteeName)}` : ''},</Text>
<Text>{corpoComFallback}</Text>
<Text>
  O Evoluteam é a plataforma de gestão de pessoas onde seu time
  acompanha avaliações, feedback e desenvolvimento.
</Text>
<Button href={inviteUrl}>Aceitar convite</Button>
<Text variant="muted">
  Este convite expira em {expiresInDays} dias ({formatDate(expiresAt)}).
</Text>
<Text variant="muted">Se o botão não funcionar, copie e cole este link no navegador:</Text>
<Text variant="muted"><Link href={inviteUrl}>{inviteUrl}</Link></Text>
```

**Footer message:** `Se você não esperava este convite, pode ignorá-lo com segurança.`

**Helpers internos ao template:**
- `firstName(name: string): string` — primeiro token de `name.trim().split(/\s+/)`.
- `formatDate(date: Date): string` — via `date-fns` (já é dep) + locale pt-BR. Formato: `"28 de abril de 2026"`.
- `expiresInDays(expiresAt: Date): number` — `Math.max(1, Math.ceil((+expiresAt - Date.now()) / 86_400_000))`.

### 5.3 `_lib/role-label.ts`

```ts
import type { Role } from '@/features/permissions/types';

export function roleLabel(role: Role): string {
  switch (role) {
    case 'admin_rh': return 'administrador RH';
    case 'user':     return 'colaborador';
    default:         return 'colaborador';
  }
}
```

Resolvido no caller (`actions.ts`) antes de chamar `renderEmployeeInvite` — o template recebe a string já formatada, mantendo-se agnóstico do domínio de roles.

---

## 6. Integração nos call sites

### 6.1 Webhook — `src/app/api/webhooks/auth-user-created/route.ts`

**Diff conceitual:**
```diff
-import { adminWelcomeEmail } from '@/lib/emails/admin-welcome';
+import { renderAdminWelcome } from '@/emails/admin-welcome';
...
-await sendEmail({
-  to: record.email,
-  ...adminWelcomeEmail({ recoveryUrl }),
-});
+await sendEmail({
+  to: record.email,
+  ...(await renderAdminWelcome({ recoveryUrl })),
+});
```

Toda a validação HMAC e o branching de `source=invite` (linhas 18-54) permanecem intactos.

### 6.2 `src/features/employees/actions.ts` — `sendInviteForEmployee`

A função hoje recebe `employeeId`, `email`, `role`, `invitedBy`, `companyId`. Para enriquecer o template, adiciona **uma query extra** após a criação do invite:

```ts
async function sendInviteForEmployee(...) {
  // ... cria invite como hoje (linhas 210-227) ...

  await logActivity({ /* inalterado */ });

  // NOVO: contexto pro template (best-effort; template tem fallbacks)
  const { data: ctx } = await admin
    .from('invites')
    .select(`
      expires_at,
      employee:employees(full_name),
      company:companies(name),
      inviter:profiles!invites_invited_by_fkey(full_name)
    `)
    .eq('id', invite.id)
    .single();

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const result = await sendEmail({
    to: email,
    ...(await renderEmployeeInvite({
      inviteUrl: `${origin}/convite/${token}`,
      inviteeName: ctx?.employee?.full_name ?? undefined,
      inviterName: ctx?.inviter?.full_name ?? undefined,
      companyName: ctx?.company?.name ?? undefined,
      roleLabel: roleLabel(role),
      expiresAt: new Date(ctx?.expires_at ?? expiresAt),
    })),
  });

  return { emailSent: result.ok };
}
```

**Decisões:**
- Buscar dentro de `sendInviteForEmployee` em vez de passar como argumentos: mantém contrato da função, evita duplicar a query em `createEmployee` e `resendInvite`.
- Best-effort: se a query falhar, `ctx` = `null` e o template cai no fallback ("Você foi convidado para acessar o Evoluteam").
- A FK `invites_invited_by_fkey` pode ter outro nome — confirmar via `supabase/types.ts` no plano de implementação.

### 6.3 Cleanup

- Deletar `src/lib/emails/admin-welcome.ts`.
- Deletar `src/lib/emails/employee-invite.ts`.
- Deletar a pasta `src/lib/emails/` (fica vazia).

---

## 7. Testes

Ao lado de cada template (`src/emails/*.test.tsx`), seguindo o padrão `src/features/.../schema.test.ts`.

**Estratégia:** `toContain()` em strings do HTML renderizado. **Não** snapshots cegos — whitespace muda com upgrade de `@react-email/render` e gera falsos positivos.

### `admin-welcome.test.tsx`
- `renderAdminWelcome` retorna subject `'Bem-vindo ao Evoluteam — defina sua senha'`.
- HTML contém `href="https://app/forgot-password"` (recoveryUrl).
- HTML contém wordmark `'Evoluteam'`.
- HTML contém preheader `'Sua conta de administrador'`.

### `employee-invite.test.tsx`
- Subject personalizado quando `inviterName` + `companyName` presentes.
- Subject fallback `'Você foi convidado para o Evoluteam'` quando faltam.
- Corpo renderiza `inviterName`, `companyName`, `roleLabel` quando completos.
- Corpo fallback genérico quando dados ausentes.
- `expiresInDays` mostra 1 quando `expiresAt` < 24h (piso).
- `expiresInDays` mostra 7 quando `expiresAt` = 7 dias no futuro.
- HTML contém `href="https://app/convite/<token>"`.
- Saudação usa primeiro nome (`"Olá, João,"` para `inviteeName: "João Silva Santos"`).

---

## 8. Validação manual (antes de marcar pronto)

1. `pnpm email:dev` — abrir `http://localhost:3001`, revisar os dois templates em desktop e mobile.
2. Enviar e-mail de teste via botão do preview → inbox Gmail + Outlook.
3. `node scripts/test-webhook.mjs welcome` → verificar inbox.
4. `pnpm dev` + criar colaborador com "enviar convite" marcado → verificar inbox.

---

## 9. Tratamento de erros e rollback

- `sendEmail()` já retorna `{ ok: boolean }` e não lança. Inalterado.
- `renderAdminWelcome` / `renderEmployeeInvite` são puros. TS garante props corretos; risco de erro é desprezível.
- Query extra em `sendInviteForEmployee` é best-effort: falha → template fallback.

### Rollback

`git revert` do(s) commit(s) de integração:
1. Templates em `src/emails/` ficam órfãos mas inofensivos (não importados).
2. `src/lib/emails/*.ts` voltam via revert.

---

## 10. Sequência de commits

Tudo inline (sem quebrar em PRs), mas em commits separados para facilitar revert/bisect:

1. **`chore(emails): add react-email deps + scaffold`**
   - `pnpm add @react-email/components @react-email/render`
   - `pnpm add -D react-email`
   - Script `email:dev` em `package.json`.
   - `src/emails/_components/*` + `src/emails/_lib/role-label.ts` + `README.md`.

2. **`feat(emails): react-email templates for admin welcome and employee invite`**
   - `src/emails/admin-welcome.tsx` + teste.
   - `src/emails/employee-invite.tsx` + teste.

3. **`refactor(emails): wire react-email templates into call sites`**
   - Webhook atualizado.
   - `sendInviteForEmployee` atualizada com query de contexto.

4. **`chore(emails): remove legacy HTML templates`**
   - Delete `src/lib/emails/`.

---

## 11. Entregáveis (checklist)

- [ ] 4 componentes compartilhados em `src/emails/_components/`
- [ ] 2 templates react-email (admin-welcome, employee-invite)
- [ ] 2 arquivos de teste com ~10 casos no total
- [ ] 1 helper `roleLabel` em `src/emails/_lib/`
- [ ] 1 `README.md` em `src/emails/` travando o padrão (como criar novo template)
- [ ] Script `email:dev` em `package.json`
- [ ] Integração em 2 call sites (webhook + `actions.ts`)
- [ ] Cleanup de `src/lib/emails/`
- [ ] 3 deps novas instaladas
- [ ] Validação manual (preview + inbox real)

---

## 12. Tech debt registrado (fora deste escopo)

1. **`src/features/reviews/actions.ts:632`** — `resend.emails.send()` direto com HTML inline para lembrete de avaliações. Migrar para react-email na próxima iteração (template `review-reminder.tsx`).
2. **Admin welcome com magic link direto** — hoje o CTA vai pra `/forgot-password` (form com captura de e-mail). Seria melhor gerar link de recovery direto no webhook via `admin.generateLink({ type: 'recovery' })`. Spec separada — mudança no webhook, não no template.
