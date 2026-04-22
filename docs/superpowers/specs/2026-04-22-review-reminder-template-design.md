# Design — Template react-email para lembrete de avaliações pendentes

**Data:** 2026-04-22
**Escopo:** Migrar `sendReminders` (`src/features/reviews/actions.ts:609`) do envio direto via `resend.emails.send()` com HTML inline para o padrão react-email + `sendEmail()` já estabelecido. Enriquecer o template com contagem de pendências, prazo do ciclo e link específico do ciclo. Aproveitar pra extrair helper compartilhado de formatação de data (`format-deadline.ts`).

Continuação natural da spec [`2026-04-22-react-email-templates-design.md`](./2026-04-22-react-email-templates-design.md), seção 12 (tech debt registrado).

---

## 1. Motivação

Hoje `sendReminders` em `src/features/reviews/actions.ts:609`:
- Importa `Resend` direto (`import { Resend } from 'resend'`, linha 8) e instancia próprio cliente (linha 18), bypassando `sendEmail()` de `src/lib/email.ts`.
- Renderiza HTML inline cru (`<p>`s, sem branding, sem preheader, sem footer).
- Conteúdo genérico: "Você ainda tem avaliações pendentes no ciclo X" — sem contagem, sem prazo, sem urgência.
- Link aponta para `/avaliacoes` (lista geral) em vez de `/avaliacoes/[cycleId]`.

Trocar pelo padrão react-email + `sendEmail()` resolve tudo de uma vez e consolida o último ponto de envio fora do padrão.

### Fora do escopo

- **Magic link / `/forgot-password` flow**: já tratado em outra rodada.
- **Automatização (cron)**: hoje é manual via UI; segue manual. O template não muda quando trigger virar agendado.

---

## 2. Contexto da codebase

### `sendReminders` atual (`src/features/reviews/actions.ts:609-656`)

```ts
export async function sendReminders(cycleId: string, reviewerEmployeeId?: string) {
  const ctx = await getAdminContext();
  if (!requireAdmin(ctx)) return { error: 'Sem permissão.' };

  const admin = createAdminSupabaseClient();
  let query = admin
    .from('review_assignments')
    .select(`id, reviewer_id, reviewer:employees!reviewer_id(id, full_name, email, user_id), cycle:review_cycles!cycle_id(name)`)
    .eq('cycle_id', cycleId)
    .in('status', ['pending', 'in_progress']);
  if (reviewerEmployeeId) query = query.eq('reviewer_id', reviewerEmployeeId);
  const { data: rows } = await query;

  // ... loop com dedup por email + resend.emails.send() inline ...
}
```

### Schema relevante

`review_cycles` (`supabase/migrations/20260503_0001_ft2_review_tables.sql:4`) tem:
- `name` text
- `response_end` date — **prazo final** do ciclo (já usado em `ensureNotExpired`)

`review_assignments`:
- `reviewer_id` → `employees(id)`
- `status` IN (`pending`, `in_progress`, `submitted`, `cancelled`)
- Um reviewer pode ter N assignments em um ciclo (avaliar várias pessoas + self).

### Triggers e UI

`src/features/reviews/components/CycleDetail.tsx:170,175`:
- "Lembrar todos" → `sendReminders(cycle.id)`.
- "Lembrar um" → `sendReminders(cycle.id, reviewerEmployeeId)`.

100% manual. Sem cron.

### Padrão react-email já estabelecido

`src/emails/`:
- `_components/{Layout, Button, Heading, Text}.tsx`
- `_lib/role-label.ts`
- `admin-welcome.tsx` + teste
- `employee-invite.tsx` + teste

`employee-invite.tsx` tem 2 helpers internos duplicados (`formatExpiry`, `expiresInDays`) que serão extraídos para um helper compartilhado neste trabalho.

---

## 3. Arquitetura

### Helper compartilhado novo

`src/emails/_lib/format-deadline.ts`:

```ts
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatDeadlineDate(date: Date): string {
  return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}

export function daysUntil(date: Date): number {
  const diffMs = date.getTime() - Date.now();
  return Math.ceil(diffMs / 86_400_000);
}
```

Mensagens humanas (`"em 6 dias"`, `"amanhã"`, `"hoje"`, `"expirou"`) ficam **dentro de cada template** — semântica varia (convite "expira", ciclo "termina"). O helper só fornece os primitivos.

### Refatoração de `employee-invite.tsx`

Trocar os helpers internos pelos do `_lib/format-deadline`:
- `formatExpiry(expiresAt)` → `formatDeadlineDate(expiresAt)` (mesma saída)
- `expiresInDays(expiresAt)` → `Math.max(1, daysUntil(expiresAt))` (mesmo comportamento, piso em 1)

A semântica e o output não mudam — testes existentes garantem zero regressão visual ou de subject.

### Template novo

`src/emails/review-reminder.tsx` + `src/emails/review-reminder.test.tsx`.

### Estrutura final

```
src/emails/
├─ _components/                   # inalterado
├─ _lib/
│  ├─ role-label.ts               # inalterado
│  └─ format-deadline.ts          # NOVO
├─ admin-welcome.tsx              # inalterado
├─ admin-welcome.test.tsx         # inalterado
├─ employee-invite.tsx            # refatorado (helpers internos -> _lib)
├─ employee-invite.test.tsx       # inalterado
├─ review-reminder.tsx            # NOVO
└─ review-reminder.test.tsx       # NOVO
```

### Sem mudança de assinatura externa

- `sendEmail()` continua `{ to, subject, html }`.
- `sendReminders` continua retornando `{ ok, sent, failed }`.
- UI em `CycleDetail.tsx` não muda.

---

## 4. Conteúdo do template

### Props

```ts
export interface ReviewReminderProps {
  reviewerName?: string;       // fallback defensivo
  cycleName?: string;          // fallback defensivo
  pendingCount: number;        // sempre presente, calculado pelo caller
  responseEnd?: Date;          // omite linha se ausente
  cycleUrl: string;            // sempre presente
}
```

### Subject (lógica em `renderReviewReminder`)

```ts
const noun = pendingCount === 1 ? 'avaliação pendente' : 'avaliações pendentes';
return cycleName
  ? `Lembrete: você tem ${pendingCount} ${noun} em "${cycleName}"`
  : `Lembrete: você tem ${pendingCount} ${noun}`;
```

### Preheader

```ts
if (!responseEnd) return 'Você tem avaliações pendentes. Finalize quando puder.';
const days = daysUntil(responseEnd);
if (days <= 0) return 'O prazo de resposta está acabando. Finalize agora.';
if (days === 1) return 'O ciclo termina amanhã. Não esqueça de finalizar.';
return `O ciclo termina em ${days} dias. Não esqueça de finalizar.`;
```

### Footer message

```
Você está recebendo este email porque foi designado como avaliador.
```

### Corpo

```
<Layout preheader={...} footerMessage={...}>
  <Heading>Você tem avaliações pendentes</Heading>
  <Text>Olá{reviewerName ? `, ${firstName(reviewerName)}` : ''},</Text>
  <Text>{bodyLine}</Text>
  {responseEnd && <Text variant="muted">{deadlineLine}</Text>}
  <Button href={cycleUrl}>Abrir avaliações</Button>
  <Text variant="muted">Se o botão não funcionar, copie e cole este link no navegador:</Text>
  <Text variant="muted"><Link href={cycleUrl}>{cycleUrl}</Link></Text>
</Layout>
```

**`bodyLine` (cascata de fallback):**

| Dados | Texto |
|---|---|
| `cycleName` presente | `Você tem ${pendingCount} ${noun} no ciclo "${cycleName}".` |
| sem `cycleName` | `Você tem ${pendingCount} ${noun}.` |

**`deadlineLine` (lógica em template, usa `daysUntil` + `formatDeadlineDate`):**

| Condição | Texto |
|---|---|
| `daysLeft > 1` | `O ciclo termina em ${formatDeadlineDate(responseEnd)} (em ${daysLeft} dias).` |
| `daysLeft === 1` | `O ciclo termina amanhã (${formatDeadlineDate(responseEnd)}).` |
| `daysLeft === 0` | `O ciclo termina hoje.` |
| `daysLeft < 0` | `O prazo de resposta expirou.` |

### Helper interno

`firstName(name)`: mesmo do `employee-invite.tsx` — primeiro token de `name.trim().split(/\s+/)`. Se for usado em 3º template no futuro, vira helper em `_lib/`. Por ora, fica inline (DRY após 3 ocorrências, não 2).

### Cuidados de SSR (lição aprendida do `employee-invite`)

Strings com interpolação de variável **devem ser construídas como template literals em `const` antes do JSX**, não com children adjacentes — React 19 SSR insere `<!-- -->` entre crianças, quebrando substrings em testes (`toContain` falha).

Exemplo correto:
```tsx
const deadlineLine = `O ciclo termina em ${formatDeadlineDate(responseEnd)} (em ${daysLeft} dias).`;
return <Text variant="muted">{deadlineLine}</Text>;
```

---

## 5. Integração em `sendReminders`

### Imports

```diff
-import { Resend } from 'resend';
+import { sendEmail } from '@/lib/email';
+import { renderReviewReminder } from '@/emails/review-reminder';
```

### Remover instância local

```diff
-const resend = new Resend(process.env.RESEND_API_KEY);
```

### Query enriquecida (linha 614-620)

```ts
let query = admin
  .from('review_assignments')
  .select(`
    id, reviewer_id,
    reviewer:employees!reviewer_id(id, full_name, email),
    cycle:review_cycles!cycle_id(name, response_end)
  `)
  .eq('cycle_id', cycleId)
  .in('status', ['pending', 'in_progress']);
if (reviewerEmployeeId) query = query.eq('reviewer_id', reviewerEmployeeId);
const { data: rows } = await query;
```

Mudanças do select original:
- Adiciona `response_end` ao join `cycle`.
- Remove `user_id` do `reviewer` (não usado).

### Agregação por reviewer (antes do loop)

```ts
const counts = new Map<string, number>();
for (const row of rows ?? []) {
  if (row.reviewer_id) {
    counts.set(row.reviewer_id, (counts.get(row.reviewer_id) ?? 0) + 1);
  }
}
```

### Loop com template novo

```ts
const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const seen = new Set<string>();
let sent = 0;
let failed = 0;

for (const row of rows ?? []) {
  const rev = row.reviewer as unknown as { id: string; email: string; full_name: string } | null;
  const cyc = row.cycle as unknown as { name: string; response_end: string } | null;
  if (!rev || !rev.email || seen.has(rev.email)) continue;
  seen.add(rev.email);

  const result = await sendEmail({
    to: rev.email,
    ...(await renderReviewReminder({
      reviewerName: rev.full_name,
      cycleName: cyc?.name,
      pendingCount: counts.get(rev.id) ?? 1,
      responseEnd: cyc?.response_end ? new Date(cyc.response_end) : undefined,
      cycleUrl: `${origin}/avaliacoes/${cycleId}`,
    })),
  });

  if (result.ok) sent += 1;
  else failed += 1;
}
```

### `logActivity` e retorno permanecem iguais

```ts
await logActivity({
  companyId: ctx.companyId, actorUserId: ctx.userId,
  action: 'review_cycle.reminded',
  entityType: 'review_cycle', entityId: cycleId,
  metadata: { sent, failed },
});

return { ok: true, sent, failed };
```

### UI inalterada

`CycleDetail.tsx:170-178` continua chamando `sendReminders(cycle.id)` / `sendReminders(cycle.id, employeeId)` e tratando o retorno do mesmo jeito.

---

## 6. Testes

### `review-reminder.test.tsx` (~10 casos)

Mesmo estilo de `employee-invite.test.tsx` — `toContain()` em strings do HTML, sem snapshot cego.

```
subject:
  ✓ singular: "Lembrete: você tem 1 avaliação pendente em ..."
  ✓ plural: "Lembrete: você tem 3 avaliações pendentes em ..."
  ✓ fallback sem cycleName

corpo:
  ✓ saudação usa primeiro nome quando reviewerName presente
  ✓ saudação genérica "Olá," quando reviewerName ausente
  ✓ corpo contém pendingCount + cycleName

prazo:
  ✓ "termina em N dias" quando daysLeft > 1
  ✓ "termina amanhã" quando daysLeft = 1
  ✓ "termina hoje" quando daysLeft = 0
  ✓ "prazo expirou" quando responseEnd já passou
  ✓ omite linha de prazo quando responseEnd ausente

CTA:
  ✓ HTML contém href={cycleUrl}
```

### `employee-invite.test.tsx`

Sem mudança no arquivo de teste. Os 13 casos existentes garantem que a refatoração para `_lib/format-deadline` não regrediu nada (subject, corpo, expiração, saudação).

### `format-deadline.ts`

Sem teste próprio. Lógica trivial (1 chamada `format`, 1 cálculo de subtração). Coberto indiretamente pelos testes dos templates.

---

## 7. Validação manual

1. `pnpm email:dev` → preview do `review-reminder` com `PreviewProps` (cycleName="Avaliação Q2 2026", pendingCount=3, responseEnd em 6 dias).
2. No app: criar ciclo com `response_end` próximo, publicar, criar assignments, marcar alguns como pendentes, clicar "Lembrar todos" no `CycleDetail` → verificar inbox.
3. Conferir que `employee-invite` continua visualmente idêntico (refatoração sem regressão).

---

## 8. Tratamento de erros

- `renderReviewReminder` puro. TS garante shape.
- Query falha → `rows` undefined → loop nem inicia → retorno `{ ok: true, sent: 0, failed: 0 }` (mesmo comportamento atual).
- `sendEmail()` retorna `{ ok: false }` em erro do Resend → conta em `failed`. Sem throw.
- `cyc?.response_end` ausente/null → template omite linha de prazo. Subject não menciona prazo.
- `cyc?.name` ausente → subject e corpo caem no fallback.

---

## 9. Sequência de commits

1. **`refactor(emails): extract format-deadline helper`**
   - Cria `src/emails/_lib/format-deadline.ts`.
   - Refatora `employee-invite.tsx` pra usar o helper.
   - Testes existentes continuam passando.

2. **`feat(emails): review reminder template + tests`**
   - `src/emails/review-reminder.tsx`.
   - `src/emails/review-reminder.test.tsx`.

3. **`refactor(reviews): use sendEmail + react-email in sendReminders`**
   - Remove `Resend` import e instância local de `actions.ts`.
   - Atualiza query (adiciona `response_end`, remove `user_id`).
   - Agrega contagem por reviewer.
   - Chama `renderReviewReminder` + `sendEmail`.

---

## 10. Entregáveis (checklist)

- [ ] `src/emails/_lib/format-deadline.ts`
- [ ] Refactor `src/emails/employee-invite.tsx` (sem mudança visual)
- [ ] `src/emails/review-reminder.tsx`
- [ ] `src/emails/review-reminder.test.tsx` (~10 casos)
- [ ] Refactor `src/features/reviews/actions.ts:609` (`sendReminders`)
- [ ] `pnpm test:run` 100% verde (todos os 304+ testes)
- [ ] `pnpm lint` limpo nos arquivos novos/alterados
- [ ] Validação manual: preview + envio real

---

## 11. Tech debt remanescente após este trabalho

Nenhum dos pontos abertos da spec anterior fica de fora. Todos os 3 templates do projeto passam a usar react-email + `sendEmail()`. Ponto único para futuras melhorias (text-plain, tracking, etc.).

Próximos templates candidatos (sem urgência):
- `/forgot-password` flow — hoje usa `supabase.auth.resetPasswordForEmail` (template padrão Supabase). Pra ficar consistente, dá pra trocar por `admin.generateLink({ type: 'recovery' })` + `/auth/callback` (já existe rota). Mas é fluxo independente, não bloqueante.
