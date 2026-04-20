# FT-3 — Feedbacks contínuos

Spec da feature de registro de feedbacks fora do ciclo formal. Cria histórico útil para avaliações, PDI e cultura.
Equivale ao **Sprint 6** de `docs/ESTRUTURA.md` §18.
Depende de Fase 0 + FT-1. Integra com FT-2 (aba "em breve" no perfil ativa agora; sidebar da resposta de avaliação populada).
Última atualização: 2026-04-20.

> **Leia antes:** `docs/dev/00-decisoes-transversais.md` + `docs/dev/01-fase-0-fundacao.md` + `docs/dev/02-ft-1-colaboradores.md` + `docs/dev/03-ft-2-avaliacoes.md`.

---

## 1. Objetivo

Permitir que qualquer colaborador com acesso registre feedback contínuo para outro colaborador, com tipos (elogio, reconhecimento, etc.) e visibilidade controlada (privado, gestor, RH). Integrar esse histórico nas telas de perfil do colaborador e na sidebar da resposta de avaliação.

## 2. Escopo

### Dentro do MVP 1.0
- Tela `/feedbacks` com 3 abas: Recebidos · Enviados · Minha equipe (só se user é gestor).
- Envio via side sheet `FeedbackSheet` (440px, slide da direita — consistente com `EmployeeSheet`).
- 5 tipos: `elogio`, `reconhecimento`, `ponto_de_melhoria`, `orientacao`, `observacao_privada`.
- 3 visibilidades: `privado`, `visivel_para_gestor` (todos ancestrais via skip-level), `visivel_para_rh`.
- Feedback imutável após envio (autor não edita/deleta).
- Hard delete só por admin_rh (soft via `deleted_at`).
- Notificação para recipient (não para gestor nem RH — evita inundar).
- Competência opcional + competency filter nas listagens.
- Aba "Feedbacks" ativa no `/colaboradores/[id]` (era stub da FT-1).
- Sidebar "Feedbacks no período" ativa no `/avaliacoes/[cycleId]/responder/[assignmentId]` (era stub da FT-2).
- Helper SQL `get_employee_ancestors()` para suporte a RLS.

### Fora do MVP 1.0
- Mural público da empresa.
- Reações (like/emoji) e comentários em feedback.
- Anonimato.
- Campanhas de reconhecimento / badges / gamificação.
- Moderação avançada.
- Anexos em feedback.
- Edição pelo autor (mesmo dentro de janela curta).
- Notificação para gestor quando feedback visível chega.
- Export CSV/PDF.

## 3. User stories

### Envio
- Users should be able to enviar feedback para outro colaborador ativo/inativo (não desligado).
- Users should be able to escolher um dos 5 tipos.
- Users should be able to vincular a uma competência opcional.
- Users should be able to escrever mensagem (mín 20 · máx 2000 chars).
- Users should be able to escolher a visibilidade entre `privado`, `visivel_para_gestor`, `visivel_para_rh`.
- Users should not be able to enviar feedback para si mesmos.
- Users should not be able to editar feedback depois de enviado.

### Leitura
- Users should be able to visualizar feedbacks recebidos em `/feedbacks` (aba Recebidos).
- Users should be able to visualizar feedbacks enviados (aba Enviados).
- Users should be able to visualizar feedbacks dos liderados diretos e indiretos (aba Minha equipe), respeitando visibilidade.
- Users should be able to filtrar por tipo, competência e período.
- Users should be able to ver badge "N novos" na aba Recebidos quando há `read_at IS NULL`.
- Users should be able to ver aba Feedbacks ativada no perfil de qualquer colaborador que podem acessar.
- Gestores should be able to visualizar feedbacks dos liderados respeitando skip-level (toda árvore descendente).
- Admin_rh should be able to visualizar feedbacks com visibility = `visivel_para_rh`. Admin_rh **NÃO vê** feedbacks `privado`.

### Gestão
- Admin_rh should be able to deletar feedbacks (hard delete lógico via `deleted_at`).
- Admin_rh should be able to ver feedbacks deletados em `/configuracoes/auditoria`.

## 4. Rotas

```
/feedbacks                              (todos os roles; 3 abas conforme user)
/feedbacks/novo                         (deep link; abre a listagem com FeedbackSheet pré-aberto)
/colaboradores/[id] — aba "Feedbacks"   (ativada — era stub da FT-1)
```

Sem rota nova de detalhe — feedback é lido inline no card.

## 5. Schema — migrations de FT-3

```sql
-- 20260517_0001_ft3_feedbacks.sql

CREATE TABLE feedbacks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  sender_id       uuid NOT NULL REFERENCES employees(id),
  recipient_id    uuid NOT NULL REFERENCES employees(id),
  type            text NOT NULL CHECK (type IN
                    ('elogio','reconhecimento','ponto_de_melhoria','orientacao','observacao_privada')),
  competency_id   uuid REFERENCES competencies(id) ON DELETE SET NULL,
  message         text NOT NULL CHECK (length(message) >= 20 AND length(message) <= 10000),
  visibility      text NOT NULL CHECK (visibility IN ('privado','visivel_para_gestor','visivel_para_rh')),
  read_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,
  deleted_by      uuid REFERENCES auth.users(id),
  CHECK (sender_id != recipient_id),
  CHECK (type != 'observacao_privada' OR visibility = 'privado')
);
CREATE INDEX idx_feedbacks_recipient_created ON feedbacks(recipient_id, created_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_feedbacks_sender_created ON feedbacks(sender_id, created_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_feedbacks_competency ON feedbacks(competency_id)
  WHERE deleted_at IS NULL;
```

### Helper SQL `get_employee_ancestors`

```sql
-- 20260517_0002_ft3_helper_ancestors.sql

CREATE OR REPLACE FUNCTION get_employee_ancestors(emp_id uuid) RETURNS SETOF uuid
LANGUAGE sql STABLE AS $$
  WITH RECURSIVE ancestors AS (
    SELECT manager_id AS id FROM employees
      WHERE id = emp_id
        AND manager_id IS NOT NULL
        AND company_id = auth.company_id()
    UNION ALL
    SELECT e.manager_id
      FROM employees e
      INNER JOIN ancestors a ON e.id = a.id
      WHERE e.manager_id IS NOT NULL
        AND e.company_id = auth.company_id()
  )
  SELECT id FROM ancestors
$$;
```

## 6. RLS policies

```sql
-- 20260517_0003_ft3_rls.sql

ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

-- SELECT: conforme visibility + papel + hierarquia
CREATE POLICY feedbacks_select ON feedbacks FOR SELECT USING (
  company_id = auth.company_id()
  AND deleted_at IS NULL
  AND (
    -- sender sempre lê
    sender_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    OR
    -- recipient sempre lê
    recipient_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    OR
    -- visivel_para_gestor ou visivel_para_rh: ancestrais do recipient na hierarquia
    (
      visibility IN ('visivel_para_gestor','visivel_para_rh')
      AND (SELECT id FROM employees WHERE user_id = auth.uid())
          IN (SELECT get_employee_ancestors(recipient_id))
    )
    OR
    -- visivel_para_rh: admin_rh da empresa lê
    (
      visibility = 'visivel_para_rh'
      AND auth.role_name() = 'admin_rh'
    )
  )
);

-- INSERT: user autenticado envia de si pra qualquer ativo/inativo da empresa
CREATE POLICY feedbacks_insert ON feedbacks FOR INSERT WITH CHECK (
  company_id = auth.company_id()
  AND sender_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  AND recipient_id IN (SELECT id FROM employees WHERE company_id = auth.company_id() AND status IN ('active','inactive'))
);

-- UPDATE: apenas marcar read_at (pelo recipient) OU deleted_at/deleted_by (pelo admin_rh)
CREATE POLICY feedbacks_update_mark_read ON feedbacks FOR UPDATE USING (
  recipient_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
);
CREATE POLICY feedbacks_update_delete_admin ON feedbacks FOR UPDATE USING (
  company_id = auth.company_id()
  AND auth.role_name() = 'admin_rh'
);
```

> Nota: a política de UPDATE por policies separadas permite tanto recipient (apenas read_at) quanto admin_rh (apenas deleted_at/deleted_by) modificarem a row. A Server Action valida exatamente quais colunas podem ser tocadas por quem — defense in depth.

## 7. Componentes e telas

### 7.1. `/feedbacks` (listagem)

**Header:** Título + botão "+ Enviar feedback" (abre `FeedbackSheet`).

**3 abas:**
- **Recebidos** (default) — feedbacks onde `recipient = user atual`. Badge "N novos" se `read_at IS NULL`.
- **Enviados** — feedbacks onde `sender = user atual`.
- **Minha equipe** — só aparece se user é gestor de alguém. Feedbacks onde `recipient` está em `get_employee_descendants(current_user.employee_id)`, respeitando RLS.

**Filtros:** Tipo · Competência · Período (30 dias · 6 meses · 1 ano · customizado).

**Card do feedback:**
- Avatar + nome do sender (ou recipient em "Enviados") + data.
- Pills coloridas: tipo · competência (se houver) · visibilidade.
- Mensagem integral (sem truncar — feedback é curto por natureza).
- Sem reações/comentários no MVP.

**Paginação** 20/página, mais recentes primeiro.

**Sem seleção múltipla, sem ações em bloco** no MVP.

### 7.2. `FeedbackSheet` (side sheet 440px)

Mesmo shell do `EmployeeSheet` via `<EntitySheet>` genérico.

**Campos:**
- **Para quem ***: autocomplete de employees `active` + `inactive`, exclui `terminated` e self.
- **Tipo ***: grid 2×2 de 4 cards + 1 card full-width para `observacao_privada`. Cada card: ícone · nome · descrição curta.
- **Competência** (opcional): dropdown com competências não arquivadas + "Nenhuma".
- **Mensagem ***: textarea com contador 0–2000 (soft) / 10000 (hard). Placeholder orientativo.
- **Visibilidade ***: 3 radio-cards. Default `privado`. Se tipo = `observacao_privada`, bloco fica oculto e visibility força para `privado`.

**Footer:** Cancelar · Enviar feedback (disabled até campos obrigatórios preenchidos).

**Server Action `sendFeedback(input)`:**
1. Valida Zod.
2. Valida regra: `type = 'observacao_privada'` → `visibility = 'privado'`.
3. INSERT `feedbacks`.
4. `notify({ userIds: [recipientUserId], type: 'feedback_received', title: 'Novo feedback', body: 'Você recebeu um feedback.', linkUrl: '/feedbacks' })` — só se recipient tem `user_id`.
5. `logActivity({ action: 'feedback.sent', entityType: 'feedback', entityId, metadata: { type, visibility, has_competency } })`.
6. Revalidate + toast "Feedback enviado".
7. Fecha sheet.

### 7.3. Aba "Feedbacks" no perfil `/colaboradores/[id]`

Agora ativa (estava em "em breve").

Mostra feedbacks onde `recipient = employee do perfil`. Respeita RLS (o que o usuário logado pode ler).

Card com mesmo layout da listagem `/feedbacks`.

Filtros locais: Tipo · Competência · Período.

Contagem no header: "12 feedbacks recebidos".

### 7.4. Sidebar "Feedbacks no período" na resposta de avaliação

Ativa a partir de FT-3. No sidebar de `/avaliacoes/[cycleId]/responder/[assignmentId]`:

- Bloco mostra feedbacks **recebidos** pelo reviewee durante `cycle.period_start` a `cycle.period_end`, visíveis ao reviewer (respeita RLS).
- Compactos: tipo (pill) + primeiros 80 caracteres. Click abre modal com mensagem completa.
- Limita a 10; se tiver mais, botão "Ver todos" leva a `/colaboradores/[id]/feedbacks` pré-filtrado por período.

## 8. Permissions

```typescript
// src/features/feedbacks/permissions.ts

export function canSendFeedback(actor): boolean {
  return actor.employeeStatus !== 'terminated';
}

export function canReceiveFeedback(recipient): boolean {
  return ['active','inactive'].includes(recipient.status);
}

export function canViewFeedback(actor, feedback): boolean {
  if (feedback.deleted_at) return actor.role === 'admin_rh';  // só pra auditoria
  if (actor.employeeId === feedback.sender_id) return true;
  if (actor.employeeId === feedback.recipient_id) return true;
  if (['visivel_para_gestor','visivel_para_rh'].includes(feedback.visibility)) {
    if (isAncestorOf(feedback.recipient_id, actor.employeeId)) return true;
  }
  if (feedback.visibility === 'visivel_para_rh' && actor.role === 'admin_rh') return true;
  return false;
}

export function canDeleteFeedback(actor): boolean {
  return actor.role === 'admin_rh';
}
```

## 9. Notifications

| Evento | Destinatário | Tipo |
|---|---|---|
| Feedback enviado | recipient (só se tem `user_id`) | `feedback_received` |
| Feedback deletado pelo admin_rh | (nada — ação silenciosa, registrada em logs) | — |

**Não notifica:**
- Gestor quando feedback `visivel_para_gestor` chega (evita inundar).
- Admin_rh quando feedback `visivel_para_rh` chega.
- Sender quando recipient lê.

## 10. Error states e edge cases

| Situação | Tratamento |
|---|---|
| Recipient desligado | Autocomplete não mostra; tentativa via API bloqueada pela policy INSERT |
| Recipient inativo | Permitido enviar; recipient vê ao reativar ou logar |
| Sender desligado depois | Feedback permanece; card exibe "Pessoa desligada" ao lado do nome |
| Competência arquivada | Exibe normalmente com tag "(arquivada)" se admin quiser |
| Gestor do recipient muda após envio | Novo gestor passa a ver; RLS reavalia em tempo de query |
| Self-feedback | Constraint bloqueia; toast "Você não pode enviar feedback para si mesmo" |
| Mensagem < 20 chars | Zod rejeita com toast |
| Mensagem entre 2000 e 10000 chars | Permitido (soft limit 2000, hard 10000) |
| Mensagem > 10000 | Zod + DB CHECK bloqueiam |
| Admin deleta feedback | `deleted_at`/`deleted_by` preenchidos; some das listagens; registra log |
| Dois usuários marcam feedback como lido simultâneo | Idempotent (UPDATE SET read_at = now() WHERE read_at IS NULL) |

## 11. Critérios de aceite

- [ ] Migration FT-3 aplicada: tabela feedbacks, função `get_employee_ancestors`, policies RLS.
- [ ] Qualquer user ativo/inativo consegue enviar feedback via `FeedbackSheet`.
- [ ] Não consegue enviar para si mesmo (UI + constraint).
- [ ] Não consegue enviar para desligado (autocomplete filtra; policy bloqueia).
- [ ] "Observação privada" força visibility = `privado` e esconde bloco.
- [ ] Recipient recebe notificação ao receber feedback.
- [ ] Gestor/RH **não** são notificados.
- [ ] Feedback `privado` não aparece para admin_rh nem gestor.
- [ ] Feedback `visivel_para_gestor` aparece para TODOS os ancestrais da hierarquia do recipient (skip-level read).
- [ ] Feedback `visivel_para_rh` aparece para admin_rh.
- [ ] Aba "Minha equipe" só aparece se user tem liderados.
- [ ] Badge "N novos" mostra corretamente na aba Recebidos.
- [ ] Autor não consegue editar/deletar o próprio feedback.
- [ ] Admin_rh consegue deletar feedback (soft delete).
- [ ] Feedback deletado some das listagens, permanece em `/configuracoes/auditoria`.
- [ ] Aba "Feedbacks" no perfil do colaborador mostra feedbacks recebidos conforme RLS.
- [ ] Sidebar de resposta de avaliação mostra feedbacks no período avaliado.
- [ ] RLS testada: user fora da empresa não lê nada; gestor de ramo distinto não lê `visivel_para_gestor`.
- [ ] Vitest cobre `canViewFeedback`, validação de tipos, regra de observacao_privada.

## 12. Plano de implementação (ordem sugerida)

1. **Migration** — tabela `feedbacks`, função `get_employee_ancestors`, RLS policies.
2. **Types** — regenerar `supabase gen types`.
3. **Permissions** — `src/features/feedbacks/permissions.ts`.
4. **EntitySheet genérico** — refatorar `EmployeeSheet` extraindo o shell (`<EntitySheet>`), reutilizar para `FeedbackSheet`.
5. **Queries** — `listMyReceived`, `listMySent`, `listTeamFeedbacks`, `listForEmployee`, `listForReviewee(cycleId, employeeId)`, `unreadCount`.
6. **Actions** — `sendFeedback`, `markAsRead`, `deleteFeedback` (admin_rh).
7. **`FeedbackSheet`** — form completo com validações.
8. **`/feedbacks`** — listagem com 3 abas + filtros + cards.
9. **Aba "Feedbacks" no perfil** — ativar no `/colaboradores/[id]`.
10. **Sidebar da resposta de avaliação** — ativar bloco "Feedbacks no período".
11. **Dashboard stub** — mostrar "Meus feedbacks recentes" (pre-FT-5).
12. **Activity logs** — formatadores para `feedback.sent` e `feedback.deleted`.
13. **Testes** — Vitest (permissions + regras).

## 13. Não-funcionais

- **Performance:** listagem com 1000 feedbacks renderiza em <300ms (índices em recipient/sender + paginação).
- **Segurança:** RLS cobre todos os cenários de visibilidade; teste manual valida que `privado` não vaza para admin_rh.
- **Acessibilidade:** cards com `<article>`, pills com `aria-label`, textarea com `aria-describedby`.
- **Observabilidade:** Sentry + Activity logs em `sent`/`deleted`.

## 14. Referências

- `docs/PRD-GERAL.md` §8
- `docs/MVP.md` §3
- `docs/USERS-ABLE.md` §9
- `docs/ESTRUTURA.md` §18 Sprint 6
- `features/FT-3.md`
- `docs/dev/00-decisoes-transversais.md`
- `docs/dev/01-fase-0-fundacao.md`
- `docs/dev/02-ft-1-colaboradores.md`
- `docs/dev/03-ft-2-avaliacoes.md`
