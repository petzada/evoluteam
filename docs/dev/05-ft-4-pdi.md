# FT-4 — PDI — Plano de Desenvolvimento Individual

Spec da feature de Plano de Desenvolvimento Individual.
Equivale ao **Sprint 7** de `docs/ESTRUTURA.md` §18.
Depende de Fase 0 + FT-1 + FT-2 + FT-3.
Última atualização: 2026-04-20.

> **Leia antes:** `docs/dev/00-decisoes-transversais.md` + `docs/dev/01-fase-0-fundacao.md` + `docs/dev/02-ft-1-colaboradores.md` + `docs/dev/03-ft-2-avaliacoes.md` + `docs/dev/04-ft-3-feedbacks.md`.

---

## 1. Objetivo

Transformar o diagnóstico gerado por avaliações e feedbacks em ações práticas de desenvolvimento. O PDI é onde o produto deixa de ser uma ferramenta de nota e vira uma ferramenta de evolução profissional: gestor ou RH cria um plano estruturado com ações, prazos e responsáveis; o colaborador executa e atualiza o status de cada ação; todos acompanham o progresso em tempo real.

## 2. Escopo

### Dentro do MVP 1.0

- `PdiSheet` 440px para criação (mesmo padrão de `FeedbackSheet` e `EmployeeSheet`).
- Campos do PDI: colaborador, objetivo, competência (opcional), prazo geral (`due_date`), ciclo de avaliação (opcional — pré-preenche quando criado a partir de resultado).
- Ações lean dentro do PDI: título + prazo + status + responsável.
- Responsável da ação: default = colaborador do PDI; override para qualquer employee ativo.
- Status do PDI: `nao_iniciado → em_andamento → concluido / cancelado`; `atrasado` computado em leitura.
- Status das ações: `pendente → em_andamento → concluida / cancelada`; `atrasada` computado em leitura.
- `em_andamento` no PDI disparado automaticamente quando a primeira ação muda de `pendente`.
- Encerramento (`concluido`) via ação explícita com confirmação modal.
- Cancelamento manual pelo criador ou `admin_rh`.
- Tela `/pdi` com 3 abas: "Meus PDIs" · "Minha equipe" · "Todos" (`admin_rh`).
- Página de detalhe `/pdi/[id]` com ações + thread de comentários.
- Aba "PDI" ativa no perfil `/colaboradores/[id]` (era stub em FT-1).
- Seção "PDI gerado" no resultado individual `/avaliacoes/[cycleId]/resultados/[employeeId]`.
- Botão "Criar PDI" na tela de resultado pré-preenche `employee_id` + `cycle_id` + competência com menor média.
- Notificações: `pdi_created` (colaborador), `pdi_action_due` (responsável, 7 dias antes via `pg_cron`), `pdi_concluded` (colaborador + criador se diferente de quem concluiu).
- Thread de comentários no PDI (sem comentários por ação).
- Hard delete lógico via `deleted_at` por `admin_rh`.
- RLS completo nas 3 tabelas, reutilizando `get_employee_ancestors()` da FT-3.

### Fora do MVP 1.0

- Evidências e anexos por ação.
- Comentários por ação.
- Aprovação formal e assinatura eletrônica do PDI.
- Biblioteca de cursos e trilhas automáticas.
- Integração com LMS.
- Check-ins recorrentes automáticos.
- Sugestão de PDI via IA (reservado para MVP 1.5).
- Export PDF/CSV do PDI.
- PDI criado pelo próprio colaborador.
- Reabertura de PDI concluído.
- Delegação de PDI para outro gestor.

---

## 3. User stories

### Criação e gestão (admin_rh / gestor)

- Users with permission should be able to criar um PDI para um colaborador via `PdiSheet`.
- Users with permission should be able to vincular o PDI a um ciclo de avaliação (opcional).
- Users with permission should be able to vincular o PDI a uma competência (opcional).
- Users with permission should be able to definir objetivo e prazo geral do PDI.
- Users with permission should be able to adicionar ações ao PDI com título, prazo e responsável.
- Users with permission should be able to editar o responsável de uma ação para qualquer employee ativo.
- Users with permission should be able to encerrar formalmente o PDI (com confirmação modal).
- Users with permission should be able to cancelar um PDI.
- Users with permission should be able to criar PDI a partir do resultado de avaliação com campos pré-preenchidos.
- Admin_rh should be able to deletar um PDI (soft delete via `deleted_at`).

### Execução (colaborador)

- Colaboradores should be able to visualizar seus próprios PDIs em `/pdi` aba "Meus PDIs".
- Colaboradores should be able to visualizar ações do PDI com status e prazo em `/pdi/[id]`.
- Colaboradores should be able to atualizar o status de ações onde são responsáveis.
- Colaboradores should be able to adicionar comentários de acompanhamento na thread do PDI.
- Colaboradores should be able to visualizar a aba "PDI" ativada no próprio perfil.

### Acompanhamento (gestor / admin_rh / director)

- Gestores should be able to acompanhar PDIs dos liderados diretos e indiretos (skip-level) em `/pdi` aba "Minha equipe".
- Admin_rh should be able to visualizar todos os PDIs da empresa em `/pdi` aba "Todos".
- Director should be able to visualizar PDIs individuais (somente leitura).
- Admin_rh should be able to atualizar status de qualquer ação.
- Users with permission should be able to comentar na thread de acompanhamento do PDI.
- Users with permission should be able to ver seção "PDI gerado" no resultado individual do ciclo de avaliação.

---

## 4. Rotas

```
/pdi                                        (todos os roles; abas conforme papel)
/pdi/[id]                                   (todos com acesso ao PDI via RLS)
/colaboradores/[id] — aba "PDI"             (ativada — era stub da FT-1)
/avaliacoes/[cycleId]/resultados/[employeeId] — seção "PDI gerado"  (admin_rh, gestor, director)
```

`PdiSheet` abre sobre qualquer rota via estado de URL ou prop — sem rota própria de criação.

---

## 5. Schema SQL

```sql
-- 20260601_0001_ft4_development_plans.sql

CREATE TABLE development_plans (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id     uuid NOT NULL REFERENCES employees(id),
  cycle_id        uuid REFERENCES review_cycles(id) ON DELETE SET NULL,
  competency_id   uuid REFERENCES competencies(id) ON DELETE SET NULL,
  objective       text NOT NULL CHECK (length(objective) >= 10 AND length(objective) <= 500),
  due_date        date NOT NULL,
  status          text NOT NULL DEFAULT 'nao_iniciado'
                    CHECK (status IN ('nao_iniciado','em_andamento','concluido','cancelado')),
  created_by      uuid NOT NULL REFERENCES auth.users(id),
  concluded_at    timestamptz,
  cancelled_at    timestamptz,
  deleted_at      timestamptz,
  deleted_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_development_plans_employee ON development_plans(employee_id)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_development_plans_company_status ON development_plans(company_id, status)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_development_plans_cycle ON development_plans(cycle_id)
  WHERE cycle_id IS NOT NULL AND deleted_at IS NULL;
```

```sql
-- 20260601_0002_ft4_development_plan_actions.sql

CREATE TABLE development_plan_actions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id                 uuid NOT NULL REFERENCES development_plans(id) ON DELETE CASCADE,
  company_id              uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title                   text NOT NULL CHECK (length(title) >= 3 AND length(title) <= 200),
  due_date                date NOT NULL,
  status                  text NOT NULL DEFAULT 'pendente'
                            CHECK (status IN ('pendente','em_andamento','concluida','cancelada')),
  responsible_employee_id uuid NOT NULL REFERENCES employees(id),
  sort_order              integer NOT NULL DEFAULT 0,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_plan_actions_plan ON development_plan_actions(plan_id);
CREATE INDEX idx_plan_actions_responsible ON development_plan_actions(responsible_employee_id);
```

```sql
-- 20260601_0003_ft4_development_plan_comments.sql

CREATE TABLE development_plan_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id     uuid NOT NULL REFERENCES development_plans(id) ON DELETE CASCADE,
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  author_id   uuid NOT NULL REFERENCES employees(id),
  body        text NOT NULL CHECK (length(body) >= 1 AND length(body) <= 2000),
  created_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz,
  deleted_by  uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_plan_comments_plan ON development_plan_comments(plan_id, created_at ASC)
  WHERE deleted_at IS NULL;
```

### Status computado em leitura

`atrasado` (PDI) e `atrasada` (ação) não são armazenados — são derivados na camada de app:

```typescript
// src/features/pdi/utils.ts
export function computePdiStatus(plan: { status: string; due_date: string }) {
  if (['concluido','cancelado'].includes(plan.status)) return plan.status;
  if (new Date(plan.due_date) < new Date()) return 'atrasado';
  return plan.status;
}

export function computeActionStatus(action: { status: string; due_date: string }) {
  if (['concluida','cancelada'].includes(action.status)) return action.status;
  if (new Date(action.due_date) < new Date()) return 'atrasada';
  return action.status;
}
```

---

## 6. RLS policies

```sql
-- 20260601_0004_ft4_pdi_rls.sql

ALTER TABLE development_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE development_plan_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE development_plan_comments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- development_plans
-- ============================================================

-- SELECT: colaborador, gestores na árvore ascendente, admin_rh, director
CREATE POLICY pdi_select ON development_plans FOR SELECT USING (
  company_id = auth.company_id()
  AND deleted_at IS NULL
  AND (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    OR
    (SELECT id FROM employees WHERE user_id = auth.uid() AND company_id = auth.company_id())
      IN (SELECT get_employee_ancestors(employee_id))
    OR
    auth.role_name() IN ('admin_rh', 'director')
  )
);

-- INSERT: admin_rh ou gestor direto do employee_id
CREATE POLICY pdi_insert ON development_plans FOR INSERT WITH CHECK (
  company_id = auth.company_id()
  AND created_by = auth.uid()
  AND (
    auth.role_name() = 'admin_rh'
    OR
    employee_id IN (
      SELECT e.id FROM employees e
      JOIN employees mgr ON mgr.id = e.manager_id
      WHERE mgr.user_id = auth.uid()
        AND e.company_id = auth.company_id()
    )
  )
);

-- UPDATE: criador do PDI ou admin_rh
CREATE POLICY pdi_update ON development_plans FOR UPDATE USING (
  company_id = auth.company_id()
  AND deleted_at IS NULL
  AND (created_by = auth.uid() OR auth.role_name() = 'admin_rh')
);

-- ============================================================
-- development_plan_actions
-- ============================================================

-- SELECT: herda acesso do PDI pai
CREATE POLICY pdi_actions_select ON development_plan_actions FOR SELECT USING (
  plan_id IN (
    SELECT id FROM development_plans
    WHERE company_id = auth.company_id()
      AND deleted_at IS NULL
      AND (
        employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
        OR (SELECT id FROM employees WHERE user_id = auth.uid() AND company_id = auth.company_id())
             IN (SELECT get_employee_ancestors(employee_id))
        OR auth.role_name() IN ('admin_rh', 'director')
      )
  )
);

-- INSERT (adicionar ações): criador do PDI ou admin_rh
CREATE POLICY pdi_actions_insert ON development_plan_actions FOR INSERT WITH CHECK (
  plan_id IN (
    SELECT id FROM development_plans
    WHERE company_id = auth.company_id()
      AND deleted_at IS NULL
      AND (created_by = auth.uid() OR auth.role_name() = 'admin_rh')
  )
);

-- UPDATE de status: responsável pela ação ou admin_rh
CREATE POLICY pdi_actions_update ON development_plan_actions FOR UPDATE USING (
  responsible_employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  OR (auth.role_name() = 'admin_rh' AND company_id = auth.company_id())
);

-- ============================================================
-- development_plan_comments
-- ============================================================

-- SELECT: herda acesso do PDI pai
CREATE POLICY pdi_comments_select ON development_plan_comments FOR SELECT USING (
  deleted_at IS NULL
  AND plan_id IN (
    SELECT id FROM development_plans
    WHERE company_id = auth.company_id()
      AND deleted_at IS NULL
      AND (
        employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
        OR (SELECT id FROM employees WHERE user_id = auth.uid() AND company_id = auth.company_id())
             IN (SELECT get_employee_ancestors(employee_id))
        OR auth.role_name() IN ('admin_rh', 'director')
      )
  )
);

-- INSERT: admin_rh + gestores + colaborador do PDI (não director)
CREATE POLICY pdi_comments_insert ON development_plan_comments FOR INSERT WITH CHECK (
  company_id = auth.company_id()
  AND author_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  AND auth.role_name() != 'director'
  AND plan_id IN (
    SELECT id FROM development_plans
    WHERE company_id = auth.company_id()
      AND deleted_at IS NULL
      AND (
        employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
        OR (SELECT id FROM employees WHERE user_id = auth.uid() AND company_id = auth.company_id())
             IN (SELECT get_employee_ancestors(employee_id))
        OR auth.role_name() = 'admin_rh'
      )
  )
);

-- UPDATE (soft delete de comentário): autor ou admin_rh
CREATE POLICY pdi_comments_update ON development_plan_comments FOR UPDATE USING (
  author_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  OR auth.role_name() = 'admin_rh'
);
```

### pg_cron — notificação de ação próxima do prazo

```sql
-- 20260601_0005_ft4_pdi_cron.sql

CREATE OR REPLACE FUNCTION notify_pdi_action_due() RETURNS void
LANGUAGE sql AS $$
  INSERT INTO notifications (user_id, type, title, body, link_url, created_at)
  SELECT
    e.user_id,
    'pdi_action_due',
    'Ação do PDI próxima do prazo',
    'A ação "' || a.title || '" vence em 7 dias.',
    '/pdi/' || a.plan_id::text,
    now()
  FROM development_plan_actions a
  JOIN development_plans p ON p.id = a.plan_id
  JOIN employees e ON e.id = a.responsible_employee_id
  WHERE a.due_date = CURRENT_DATE + 7
    AND a.status NOT IN ('concluida', 'cancelada')
    AND p.deleted_at IS NULL
    AND p.status NOT IN ('concluido', 'cancelado')
    AND e.user_id IS NOT NULL
    AND e.status != 'terminated'
    AND e.company_id = p.company_id;
$$;

-- Job diário 09h BRT (12h UTC)
SELECT cron.schedule(
  'pdi-action-due-notifications',
  '0 12 * * *',
  $$ SELECT notify_pdi_action_due(); $$
);
```

---

## 7. Componentes e telas

### 7.1. `/pdi` (listagem)

**Header:** Título "PDIs" + botão "+ Novo PDI" (visível para `admin_rh` e gestores; abre `PdiSheet`).

**3 abas:**
- **Meus PDIs** (default para todos) — PDIs onde `employee_id` = employee do user logado.
- **Minha equipe** — só aparece se user é gestor de alguém; PDIs dos liderados diretos e indiretos via RLS.
- **Todos** — só aparece para `admin_rh`; todos os PDIs da empresa.

**Filtros em cada aba:** Status · Competência · Período (prazo geral).

**Card do PDI:**
- Nome do colaborador + badge de status computado (amarelo = em_andamento, vermelho = atrasado, verde = concluido, cinza = cancelado/nao_iniciado).
- Objetivo (truncado em 2 linhas).
- Progresso das ações: "N de M ações concluídas" + barra de progresso.
- Prazo geral + competência (se houver) como pills.
- Click abre `/pdi/[id]`.

**Paginação:** 20/página, mais recentes primeiro.

### 7.2. `PdiSheet` (side sheet 440px)

Mesmo shell do `EmployeeSheet` via `<EntitySheet>` genérico.

**Campos:**
- **Colaborador \***: autocomplete de employees `active` (gestor vê só liderados diretos; `admin_rh` vê todos).
- **Objetivo \***: textarea, mín 10 · máx 500 chars, com contador.
- **Competência** (opcional): dropdown com competências não arquivadas + "Nenhuma".
- **Prazo geral \***: date picker.
- **Ciclo** (opcional): dropdown de ciclos `published` ou `closed` da empresa. Pré-preenche quando `PdiSheet` é aberto a partir do resultado de avaliação.

Sem campo de ações na criação — ações são adicionadas em `/pdi/[id]` após criar.

**Footer:** Cancelar · Criar PDI (disabled até campos obrigatórios preenchidos).

**Server Action `createPdi(input)`:**
1. Valida Zod.
2. INSERT `development_plans` com `status = 'nao_iniciado'` e `created_by = auth.uid()`.
3. `notify({ userIds: [collaboratorUserId], type: 'pdi_created', title: 'Novo PDI criado', body: 'Um novo PDI foi criado para você.', linkUrl: '/pdi/' + planId })` — só se colaborador tem `user_id`.
4. `logActivity({ action: 'pdi.created', entityType: 'development_plan', entityId, metadata: { employee_id, cycle_id, competency_id } })`.
5. `revalidatePath('/pdi')`.
6. Redireciona para `/pdi/[id]` e fecha sheet.

### 7.3. `/pdi/[id]` (detalhe)

**Header da página:**
- Nome do colaborador + badge de status computado.
- Objetivo em destaque.
- Pills: competência · prazo geral (vermelho se `atrasado`) · ciclo vinculado (com link para `/avaliacoes/[cycleId]`).
- Botões conforme permissão: "Encerrar PDI" · "Cancelar PDI" · "Editar" (abre mini-form inline para campos do header).

**Seção Ações:**
- Lista de ações com colunas: título · prazo (vermelho se `atrasada`) · responsável (avatar + nome) · status (dropdown inline para quem tem `canUpdateActionStatus`).
- Botão "+ Adicionar ação" visível para criador do PDI e `admin_rh`.
- Formulário inline ao adicionar: título \* · prazo \* · responsável \* (default = colaborador do PDI, autocomplete para qualquer employee ativo).
- Ao mover qualquer ação de `pendente` para outro status, Server Action atualiza `development_plans.status` para `em_andamento` automaticamente se ainda estava em `nao_iniciado`.

**Encerrar PDI:**
- Botão abre `AlertDialog`. Se há ações `pendente` ou `em_andamento`: "Existem X ações ainda abertas. Deseja encerrar o PDI mesmo assim?"
- Ao confirmar: UPDATE `status = 'concluido'`, `concluded_at = now()`.
- Notifica colaborador do PDI + criador do PDI se diferente do usuário que está encerrando.
- `logActivity({ action: 'pdi.concluded', ... })`.

**Cancelar PDI:**
- `AlertDialog` de confirmação simples.
- UPDATE `status = 'cancelado'`, `cancelled_at = now()`.
- `logActivity({ action: 'pdi.cancelled', ... })`.

**Seção Comentários:**
- Thread flat, ordem crescente (mais antigo no topo).
- Card: avatar + nome do autor + data relativa + corpo do comentário.
- `director` não vê campo de input (somente leitura).
- Textarea + botão "Comentar" no rodapé da thread.
- Autor e `admin_rh` podem soft-deletar comentário (exibe "[comentário removido]").

### 7.4. Aba "PDI" no perfil `/colaboradores/[id]`

Agora ativa (era stub "em breve" da FT-1).

Lista todos os PDIs do colaborador (ativo + concluídos + cancelados). Respeita RLS.

Cards com mesmo layout da listagem `/pdi`.

Filtros locais: Status · Competência.

Contagem no header: "N PDIs".

Botão "+ Criar PDI" visível para `admin_rh` e gestor do colaborador — abre `PdiSheet` com `employee_id` pré-preenchido.

### 7.5. Seção "PDI gerado" no resultado individual

Em `/avaliacoes/[cycleId]/resultados/[employeeId]`, ao final da página:

**Se já existe PDI vinculado ao ciclo para este colaborador:**
- Card compacto: objetivo + status + link "Ver PDI" → `/pdi/[id]`.

**Se não existe PDI:**
- Botão "Criar PDI com base nesta avaliação" (visível para `admin_rh` e gestor do colaborador).
- Ao clicar: abre `PdiSheet` com pré-preenchimento de `employee_id` + `cycle_id` + `competency_id` (competência com menor média no ciclo, se houver questões agrupadas por competência).

---

## 8. Permissions

```typescript
// src/features/pdi/permissions.ts

export function canCreatePdi(actor: Actor, targetEmployee: Employee): boolean {
  if (actor.role === 'admin_rh') return true;
  return targetEmployee.manager_id === actor.employeeId;
}

export function canViewPdi(actor: Actor, plan: Plan): boolean {
  if (actor.role === 'admin_rh' || actor.role === 'director') return true;
  if (actor.employeeId === plan.employee_id) return true;
  return isAncestorOf(plan.employee_id, actor.employeeId);
}

export function canEditPdiHeader(actor: Actor, plan: Plan): boolean {
  if (actor.role === 'admin_rh') return true;
  return plan.created_by === actor.userId;
}

export function canAddAction(actor: Actor, plan: Plan): boolean {
  return canEditPdiHeader(actor, plan);
}

export function canUpdateActionStatus(actor: Actor, action: PlanAction): boolean {
  if (actor.role === 'admin_rh') return true;
  return action.responsible_employee_id === actor.employeeId;
}

export function canCommentOnPdi(actor: Actor, plan: Plan): boolean {
  if (actor.role === 'director') return false;
  return canViewPdi(actor, plan);
}

export function canConcludePdi(actor: Actor, plan: Plan): boolean {
  if (actor.role === 'admin_rh') return true;
  return plan.created_by === actor.userId;
}

export function canCancelPdi(actor: Actor, plan: Plan): boolean {
  return canConcludePdi(actor, plan);
}

export function canDeletePdi(actor: Actor): boolean {
  return actor.role === 'admin_rh';
}
```

---

## 9. Notifications

| Evento | Destinatário | Tipo |
|---|---|---|
| PDI criado | Colaborador do PDI (se tem `user_id`) | `pdi_created` |
| Ação próxima do prazo (7 dias antes, via `pg_cron` diário 09h BRT) | Responsável pela ação (se tem `user_id` e status != `terminated`) | `pdi_action_due` |
| PDI encerrado (concluído) | Colaborador do PDI + criador do PDI se diferente de quem encerrou | `pdi_concluded` |

**Não notifica:**
- Gestor quando colaborador atualiza status de ação.
- Ninguém quando PDI é cancelado (ação silenciosa, registrada em activity logs).
- Autonotificação: se criador é quem está encerrando, `pdi_concluded` não é enviado para ele mesmo.

---

## 10. Error states e edge cases

| Situação | Tratamento |
|---|---|
| PDI criado sem ações | Permitido — PDI nasce em `nao_iniciado`; ações são adicionadas em `/pdi/[id]` |
| Gestor do colaborador muda (`manager_id` atualizado) | Novo gestor passa a ver o PDI via RLS (reavalia em tempo de query); `created_by` do PDI não muda |
| Ciclo vinculado é arquivado | PDI continua normalmente; `cycle_id` é referência histórica, não dependência funcional |
| Competência vinculada é arquivada | Exibe com tag "(arquivada)", idêntico ao padrão de FT-3 |
| `pg_cron` dispara para ação já `concluida` ou `cancelada` | Filtro `WHERE status NOT IN ('concluida','cancelada')` no job impede notificação |
| `pg_cron` dispara para PDI já `concluido` ou `cancelado` | Filtro `WHERE p.status NOT IN ('concluido','cancelado')` no job impede notificação |
| Encerrar PDI com ações abertas | `AlertDialog` de confirmação: "Existem X ações abertas. Encerrar mesmo assim?" |
| `due_date` do PDI passa sem mudança de status | `atrasado` computado em leitura; nenhum UPDATE necessário no banco |
| `due_date` da ação passa | `atrasada` computado em leitura; badge vermelho na listagem de ações |
| Responsável de ação é desligado | Ação permanece com responsável registrado; `admin_rh` ou criador troca manualmente |
| Colaborador do PDI é desligado | PDI permanece intacto; `admin_rh` ou gestor decide manualmente se cancela |
| Tentativa de criar PDI para colaborador de outra empresa | RLS bloqueia; INSERT policy valida `company_id = auth.company_id()` |
| Tentativa de comentar por `director` | `canCommentOnPdi` retorna false; input não é renderizado; RLS bloqueia INSERT |
| Nenhum PDI encontrado nas abas | `<EmptyState>` com CTA "Criar primeiro PDI" para quem tem permissão |

---

## 11. Critérios de aceite

- [ ] Migrations aplicadas: `development_plans`, `development_plan_actions`, `development_plan_comments`, RLS, `pg_cron` job.
- [ ] `admin_rh` e gestor direto conseguem criar PDI via `PdiSheet`.
- [ ] Colaborador não consegue criar PDI (UI não mostra botão para si mesmo como alvo; RLS bloqueia INSERT).
- [ ] `PdiSheet` pré-preenche `employee_id` + `cycle_id` + `competency_id` quando aberto a partir do resultado de avaliação.
- [ ] Ações criadas com título + prazo + responsável (default = colaborador do PDI, override livre para qualquer employee ativo).
- [ ] Responsável da ação consegue atualizar o status dela; não-responsável não consegue (RLS bloqueia).
- [ ] `admin_rh` consegue atualizar status de qualquer ação.
- [ ] Status `atrasado` (PDI) e `atrasada` (ação) aparecem corretamente quando `due_date < hoje`.
- [ ] PDI muda para `em_andamento` automaticamente quando primeira ação sai de `pendente`.
- [ ] Encerramento de PDI com ações abertas exibe confirmação modal antes de concluir.
- [ ] `pdi_created` notifica colaborador ao criar.
- [ ] `pdi_action_due` notifica responsável 7 dias antes do prazo (pg_cron); não notifica se ação já concluída/cancelada ou PDI já concluído/cancelado.
- [ ] `pdi_concluded` notifica colaborador + criador (quando diferente de quem encerrou).
- [ ] Thread de comentários: `admin_rh` + gestor + colaborador do PDI postam; `director` só lê.
- [ ] `director` vê PDIs individuais mas não vê campo de input de comentário.
- [ ] Aba "PDI" no perfil do colaborador lista todos os PDIs (ativo + histórico), com botão "+ Criar PDI" para quem tem permissão.
- [ ] Seção "PDI gerado" no resultado individual: card de PDI se já existe, botão "Criar PDI" se não existe.
- [ ] Listagem `/pdi` com 3 abas conforme papel ("Minha equipe" só para gestores; "Todos" só para `admin_rh`).
- [ ] Filtros de status, competência e período funcionam em cada aba.
- [ ] RLS: colaborador não vê PDIs de colegas; gestor vê liderados skip-level; `admin_rh` vê tudo; PDI de empresa diferente completamente inacessível.
- [ ] Soft delete por `admin_rh` remove PDI das listagens; permanece em `/configuracoes/auditoria`.
- [ ] Vitest cobre: `canCreatePdi`, `canViewPdi`, `canEditPdiHeader`, `canUpdateActionStatus`, `canCommentOnPdi`, `computePdiStatus`, `computeActionStatus`.
- [ ] Playwright smoke: criar PDI a partir do resultado de avaliação → adicionar ações → colaborador atualiza status → gestor comenta → admin_rh encerra.

---

## 12. Plano de implementação

1. **Migrations** — `development_plans`, `development_plan_actions`, `development_plan_comments`, RLS policies.
2. **pg_cron** — função `notify_pdi_action_due()` + job diário.
3. **Types** — regenerar `supabase gen types typescript`.
4. **Utils** — `computePdiStatus`, `computeActionStatus` em `src/features/pdi/utils.ts`.
5. **Permissions** — `src/features/pdi/permissions.ts`.
6. **Queries** — `listMyPdis`, `listTeamPdis`, `listAllPdis`, `getPdiDetail`, `listActionsForPlan`, `listCommentsForPlan`, `getPdiForResult` (verifica se existe PDI vinculado ao ciclo + employee).
7. **Actions** — `createPdi`, `updatePdiHeader`, `concludePdi`, `cancelPdi`, `deletePdi` (admin_rh), `addAction`, `updateActionStatus`, `removeAction`, `addComment`, `deleteComment`.
8. **`PdiSheet`** — form com validações, pré-preenchimento, redirect para `/pdi/[id]` após criar.
9. **`/pdi`** — listagem com 3 abas condicionais + filtros + cards.
10. **`/pdi/[id]`** — página de detalhe: header + ações inline + encerramento + cancelamento + thread de comentários.
11. **Aba "PDI" no perfil** — ativar em `/colaboradores/[id]`, remover tag "em breve".
12. **Seção "PDI gerado" no resultado** — bloco condicional em `/avaliacoes/[cycleId]/resultados/[employeeId]`.
13. **Activity logs** — formatadores para `pdi.created`, `pdi.concluded`, `pdi.cancelled`, `pdi.deleted`.
14. **Testes** — Vitest (permissions + utils) + Playwright (fluxo completo).

---

## 13. Não-funcionais

- **Performance:** listagem de 500 PDIs renderiza em <300ms (índices em `employee_id`, `company_id`, `status`). Comentários paginados (20/página).
- **Segurança:** RLS em todas as 3 tabelas; `canUpdateActionStatus` verificado na Server Action além do RLS (defense in depth). `pg_cron` insere diretamente em `notifications` sem bypassar outras políticas.
- **Acessibilidade:** cards com `<article>`, badges com `aria-label`, `AlertDialog` com foco gerenciado pelo shadcn.
- **Observabilidade:** Sentry captura erros de Server Actions; activity logs em `pdi.created`, `pdi.concluded`, `pdi.cancelled`, `pdi.deleted`.
- **pg_cron resiliente:** falha no job diário não afeta a aplicação; erros ficam em `cron.job_run_details` do Supabase para diagnóstico.

---

## 14. Referências

- `docs/ESTRUTURA.md` §17.5, §18 Sprint 7
- `features/FT-4.md`
- `docs/USERS-ABLE.md` §10
- `docs/MVP.md` §4
- `docs/dev/00-decisoes-transversais.md`
- `docs/dev/01-fase-0-fundacao.md`
- `docs/dev/02-ft-1-colaboradores.md`
- `docs/dev/03-ft-2-avaliacoes.md`
- `docs/dev/04-ft-3-feedbacks.md`
