# FT-2 — Ciclos de avaliação de desempenho

Spec completa da feature **central** do Evoluteam: criar ciclos, montar formulários, distribuir avaliações, coletar respostas e apresentar resultados.
Equivale a **Sprints 3, 4 e 5** de `docs/ESTRUTURA.md` §18.
Depende de Fase 0 + FT-1.
Última atualização: 2026-04-20.

> **Leia antes:** `docs/dev/00-decisoes-transversais.md` + `docs/dev/01-fase-0-fundacao.md` + `docs/dev/02-ft-1-colaboradores.md`.

---

## 1. Objetivo

Permitir ao RH criar ciclos formais de avaliação de desempenho com autoavaliação + avaliação do gestor, coletar respostas de todos os envolvidos e apresentar resultados consolidados por colaborador, com controle de visibilidade.

## 2. Escopo

### Dentro do MVP 1.0
- Criar ciclo via wizard de 5 passos.
- Status simplificado: `draft → published → closed → archived`.
- Participantes: todos ativos / por departamento / por cargo / manual / combinação aditiva.
- Formulário com 2 tipos de pergunta: nota (1-5 fixa) + texto livre.
- Template padrão (7 nota + 2 texto) · Em branco · Copiar de ciclo anterior (disabled).
- Tipos de avaliação no MVP: autoavaliação + avaliação do gestor.
- Geração automática de assignments na publicação.
- Responder avaliação com auto-save, single-page.
- Acompanhar progresso em `/avaliacoes/[cycleId]` com 4 tabs.
- Reenviar lembretes (email via Resend).
- Calcular resultados on-the-fly (sem tabela materializada).
- Resultado individual com média geral, pontos fortes/desenvolver, comparativo self × gestor, comentários.
- Liberar/ocultar resultado por colaborador (controlado por admin_rh).

### Fora do MVP 1.0 (adia para 1.5 ou mais)
- Avaliação por pares.
- Avaliação 360.
- Anonimato.
- Múltiplas etapas de aprovação.
- Pesos por pergunta ou competência.
- Múltipla escolha, sim/não, escalas customizadas.
- Templates salvos (além do padrão).
- Copiar de ciclo anterior (UI preparada, feature inativa).
- Export PDF do resultado.
- Reabertura de assignment submitted.
- Calibração de notas.
- Delegação temporária de gestor por ausência.

## 3. User stories

Baseadas em `features/FT-2.md` + refinamentos do brainstorm:

### Criação do ciclo
- Admins should be able to criar um ciclo via wizard de 5 passos.
- Admins should be able to salvar como rascunho em qualquer momento.
- Admins should be able to definir nome, descrição, período avaliado, e prazo de resposta.
- Admins should be able to selecionar participantes por filtros (todos / depto / cargo / manual) combináveis.
- Admins should be able to desmarcar participantes específicos após um filtro.
- Admins should be able to escolher tipos de avaliação (autoavaliação e/ou avaliação do gestor).
- Admins should be able to partir de template padrão, em branco, ou copiar de ciclo anterior (disabled no MVP).
- Admins should be able to adicionar, editar, reordenar (drag-and-drop) e remover perguntas.
- Admins should be able to vincular perguntas a uma competência (opcional).
- Admins should be able to marcar perguntas como obrigatórias ou opcionais.
- Admins should be able to revisar o ciclo no passo 5 antes de publicar.
- Admins should be able to publicar o ciclo (confirma com modal).

### Gestão do ciclo publicado
- Admins should be able to visualizar o progresso do ciclo em tempo real.
- Admins should be able to reenviar lembretes (em bloco ou individual).
- Admins should be able to adicionar participantes após publicação.
- Admins should be able to remover participantes após publicação (cancela assignments).
- Admins should be able to reatribuir reviewer de um assignment específico.
- Admins should be able to cancelar assignments individualmente.
- Admins should be able to encerrar manualmente o ciclo.
- Admins should be able to arquivar ciclos encerrados.

### Resposta
- Users should be able to ver avaliações pendentes na tela `/avaliacoes` e no dashboard.
- Users should be able to abrir uma avaliação pendente em `/avaliacoes/[cycleId]/responder/[assignmentId]`.
- Users should be able to ver contexto do avaliado (nome, cargo, admissão, liderados, feedbacks — stub até FT-3).
- Users should be able to responder perguntas de nota (5 botões) e texto livre.
- Users should be able to ter respostas salvas automaticamente (auto-save em blur).
- Users should be able to sair e voltar sem perder progresso.
- Users should be able to enviar a avaliação quando obrigatórias estiverem respondidas.
- Users should not be able to editar uma avaliação depois de enviada.

### Resultados
- Admin_rh should be able to visualizar resultado individual de qualquer colaborador.
- Gestores should be able to visualizar resultado de seus liderados diretos e indiretos (árvore descendente).
- Admin_rh should be able to liberar resultado para o próprio colaborador.
- Admin_rh should be able to ocultar (despublicar) um resultado já liberado.
- Colaboradores should be able to visualizar o próprio resultado quando liberado.

## 4. Rotas

```
/avaliacoes                                            (todos os roles; filtra por visibilidade)
/avaliacoes/nova                                       (admin_rh, wizard)
/avaliacoes/[cycleId]                                  (visível conforme permissões)
/avaliacoes/[cycleId]/editar                           (admin_rh; rascunho = livre, publicado = só datas/descrição)
/avaliacoes/[cycleId]/responder/[assignmentId]         (reviewer do assignment + admin_rh pode ver)
/avaliacoes/[cycleId]/resultados                       (admin_rh + gestor — listagem de participantes com resultado)
/avaliacoes/[cycleId]/resultados/[employeeId]          (admin_rh + gestor + self após liberação)
```

## 5. Schema — migrations de FT-2

```sql
-- 20260503_0001_ft2_review_tables.sql

CREATE TABLE review_cycles (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id           uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name                 text NOT NULL,
  description          text,
  period_start         date NOT NULL,          -- período avaliado (ex: 01/01)
  period_end           date NOT NULL,          -- período avaliado (ex: 30/06)
  response_start       date NOT NULL,          -- quando pode começar a responder
  response_end         date NOT NULL,          -- prazo final de resposta
  status               text NOT NULL DEFAULT 'draft'
                         CHECK (status IN ('draft','published','closed','archived')),
  include_self         boolean NOT NULL DEFAULT true,
  include_manager      boolean NOT NULL DEFAULT true,
  created_by           uuid REFERENCES auth.users(id),
  published_at         timestamptz,
  closed_at            timestamptz,
  archived_at          timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_cycles_company_status ON review_cycles(company_id, status);

CREATE TABLE review_cycle_participants (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id           uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  cycle_id             uuid NOT NULL REFERENCES review_cycles(id) ON DELETE CASCADE,
  employee_id          uuid NOT NULL REFERENCES employees(id),
  added_at             timestamptz NOT NULL DEFAULT now(),
  added_by             uuid REFERENCES auth.users(id),
  removed_at           timestamptz,
  result_released_at   timestamptz,
  result_released_by   uuid REFERENCES auth.users(id),
  UNIQUE (cycle_id, employee_id)
);
CREATE INDEX idx_participants_cycle ON review_cycle_participants(cycle_id);

CREATE TABLE review_forms (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  cycle_id     uuid NOT NULL UNIQUE REFERENCES review_cycles(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE review_questions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  form_id         uuid NOT NULL REFERENCES review_forms(id) ON DELETE CASCADE,
  competency_id   uuid REFERENCES competencies(id) ON DELETE SET NULL,
  question_order  int NOT NULL,
  type            text NOT NULL CHECK (type IN ('scale','text')),
  question_text   text NOT NULL,
  is_required     boolean NOT NULL DEFAULT true,
  scale_min       int,  -- NULL para 'text'; 1 para 'scale' no MVP
  scale_max       int   -- NULL para 'text'; 5 para 'scale' no MVP
);
CREATE INDEX idx_questions_form_order ON review_questions(form_id, question_order);

CREATE TABLE review_assignments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  cycle_id        uuid NOT NULL REFERENCES review_cycles(id) ON DELETE CASCADE,
  form_id         uuid NOT NULL REFERENCES review_forms(id),
  reviewee_id     uuid NOT NULL REFERENCES employees(id),
  reviewer_id     uuid NOT NULL REFERENCES employees(id),
  type            text NOT NULL CHECK (type IN ('self','manager')),
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','in_progress','submitted','cancelled')),
  submitted_at    timestamptz,
  cancelled_at    timestamptz,
  cancelled_reason text,  -- 'reviewee_removed', 'reviewer_terminated', 'admin_manual'
  UNIQUE (cycle_id, reviewee_id, reviewer_id, type)
);
CREATE INDEX idx_assignments_reviewer_status ON review_assignments(reviewer_id, status);
CREATE INDEX idx_assignments_cycle ON review_assignments(cycle_id);

CREATE TABLE review_answers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  assignment_id   uuid NOT NULL REFERENCES review_assignments(id) ON DELETE CASCADE,
  question_id     uuid NOT NULL REFERENCES review_questions(id),
  scale_value     int,
  text_value      text,
  answered_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, question_id),
  CHECK (
    (scale_value IS NOT NULL AND text_value IS NULL)
    OR
    (scale_value IS NULL AND text_value IS NOT NULL)
    OR
    (scale_value IS NULL AND text_value IS NULL)  -- permitido: resposta opcional em branco
  )
);
CREATE INDEX idx_answers_assignment ON review_answers(assignment_id);
```

### RLS policies (ver §10 para visão completa)

```sql
-- review_cycles / review_cycle_participants / review_forms / review_questions
ALTER TABLE review_cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY cycles_select ON review_cycles FOR SELECT
USING ( company_id = public.my_company_id() );
CREATE POLICY cycles_write_admin ON review_cycles FOR ALL
USING ( company_id = public.my_company_id() AND public.my_role() = 'admin_rh' )
WITH CHECK ( company_id = public.my_company_id() AND public.my_role() = 'admin_rh' );

-- Mesmos padrões para participants/forms/questions/answers.

-- review_assignments: reviewer ou reviewee ou admin lê; só reviewer do próprio assignment ou admin escreve
ALTER TABLE review_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY assignments_select ON review_assignments FOR SELECT USING (
  company_id = public.my_company_id()
  AND (
    public.my_role() = 'admin_rh'
    OR reviewer_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    OR reviewee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    OR reviewee_id IN (SELECT * FROM get_employee_descendants(
         (SELECT id FROM employees WHERE user_id = auth.uid())
       ))
  )
);

-- review_answers: reviewer do próprio assignment escreve; admin_rh/gestor lê descendentes
ALTER TABLE review_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY answers_select ON review_answers FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM review_assignments a
    WHERE a.id = review_answers.assignment_id
      AND a.company_id = public.my_company_id()
      AND (
        public.my_role() = 'admin_rh'
        OR a.reviewer_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
        OR a.reviewee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
           AND (
             -- self vê se resultado foi liberado
             EXISTS (SELECT 1 FROM review_cycle_participants p
                     WHERE p.cycle_id = a.cycle_id
                       AND p.employee_id = a.reviewee_id
                       AND p.result_released_at IS NOT NULL)
           )
      )
  )
);
CREATE POLICY answers_write_own ON review_answers FOR ALL USING (
  EXISTS (
    SELECT 1 FROM review_assignments a
    WHERE a.id = review_answers.assignment_id
      AND a.reviewer_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
      AND a.status IN ('pending','in_progress')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM review_assignments a
    WHERE a.id = review_answers.assignment_id
      AND a.reviewer_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
      AND a.status IN ('pending','in_progress')
  )
);
```

Observação: policies com CTE e EXISTS aninhados ficam complexas; recomenda-se wrappear em funções `SECURITY DEFINER` para legibilidade e performance (cached plans).

## 6. Lifecycle e transições

### Estados
| Status | Características |
|---|---|
| `draft` | Editável livremente. Não gera assignments. Admin trabalha no ciclo. |
| `published` | Assignments gerados. Editável apenas: `response_end`, `description`. Label UI derivada das datas: **Agendado** (`response_start > now`), **Em andamento** (`response_start ≤ now < response_end`), **Encerrado lazy** (`response_end < now`). |
| `closed` | Encerrado explicitamente (manual ou lazy-trigger). Respostas travadas. Resultados visíveis (respeitando liberação). |
| `archived` | Ocultado de listagem default. Mantido para histórico. |

### Transições
```
draft       → published     (admin "Publicar" + modal confirma)
published   → closed        (admin "Encerrar" OU Server Action detecta response_end < now)
closed      → archived      (admin "Arquivar")
qualquer    → archived      (admin pode arquivar rascunhos ou publicados antigos também)
```

Reversões **NÃO permitidas** no MVP: `published → draft`, `closed → published` (reabrir), `archived → qualquer`.

### Lazy close
Em toda Server Action que envolve o ciclo (`submitAnswer`, `listAssignments` do reviewer, etc.), se `response_end < now AND status = 'published'`, atualiza `status = 'closed', closed_at = now()` e `logActivity('cycle.auto_closed')`. Sem cron.

## 7. Geração de assignments

Ao publicar (`publishCycle()`):

```typescript
// Transação
1. UPDATE review_cycles SET status = 'published', published_at = now() WHERE id = cycleId
2. INSERT INTO review_forms (cycle_id, company_id) RETURNING id AS formId
   -- (form já existe se admin editou em draft — UPSERT lógico)
3. Para cada participante em review_cycle_participants WHERE removed_at IS NULL:
   a. Se cycle.include_self:
      INSERT review_assignments (reviewee=p.employee_id, reviewer=p.employee_id, type='self', ...)
   b. Se cycle.include_manager AND p.employee.manager_id IS NOT NULL:
      INSERT review_assignments (reviewee=p.employee_id, reviewer=p.employee.manager_id, type='manager', ...)
4. logActivity('cycle.published', { assignmentsCount, participantsCount })
5. notify() TODOS os reviewers: "Você tem uma avaliação pendente em {ciclo}"
```

## 8. Fórmula dos resultados (cálculo on-the-fly)

### Média por competência (para um colaborador)
Para cada competência com pelo menos uma pergunta de nota respondida por **gestor** (fonte primária):
```
avg_competency = AVG(scale_value) FROM review_answers ra
  INNER JOIN review_questions q ON ra.question_id = q.id
  INNER JOIN review_assignments a ON ra.assignment_id = a.id
  WHERE a.cycle_id = $1
    AND a.reviewee_id = $2
    AND a.status = 'submitted'
    AND a.type = 'manager'
    AND q.competency_id = $3
    AND q.type = 'scale'
    AND ra.scale_value IS NOT NULL
```

Se colaborador **não tem avaliação do gestor** (sem gestor ou assignment cancelado): usa `type = 'self'` como fallback.

### Média geral
```
avg_overall = AVG(avg_competency)  -- média das médias por competência
```
Se ciclo não agrupa por competência (admin não vinculou): `avg_overall = AVG(scale_value)` simples de todas as perguntas de nota.

### Pontos fortes (top 3 competências) e a desenvolver (bottom 2-3)
```
strengths    = TOP 3 competencies ORDER BY avg_competency DESC
weaknesses   = BOTTOM 2-3 competencies ORDER BY avg_competency ASC
```
Empate → ordenação estável por nome.

### Comparativo self × gestor
Tabela mostrando, por competência: nota do self, nota do gestor, delta (+/-).

### Comentários
Todas as respostas `type = 'text'` agrupadas por pergunta, rotulando o autor (autoavaliação / gestor).

### Implementação
View SQL ou funções `STABLE`:
```sql
CREATE VIEW review_result_overview AS SELECT ...;
CREATE FUNCTION get_employee_competency_scores(cycle_id uuid, employee_id uuid) RETURNS SETOF ...;
```

## 9. Componentes e telas

### 9.1. `/avaliacoes` (listagem)
- Seção **"Pendentes para você"** no topo (cards destacados em laranja claro) — assignments `pending`/`in_progress` do próprio user.
- Lista de ciclos em cards/rows: nome, períodos, progresso (X/Y enviadas), status/label derivado.
- Filtros: busca + status (Rascunho/Agendado/Em andamento/Encerrado/Arquivado).
- Botão "+ Novo ciclo" (admin_rh).
- Click em ciclo → `/avaliacoes/[cycleId]`.

### 9.2. `/avaliacoes/nova` — wizard 5 passos
Reusa `<OnboardingWizard />` component (mesma UX de Fase 0).

**Passo 1 — Dados básicos:**
- Nome*
- Descrição (opcional)
- Período avaliado: date range (ex: 01/01 – 30/06/2026)
- Prazo de resposta: date range (ex: 15/04 – 30/04)

**Passo 2 — Participantes:**
- 4 modos combináveis (todos / depto / cargo / manual).
- Preview ao final: "N colaboradores serão avaliados" com lista expandível.
- Warnings: sem gestor / inativos.

**Passo 3 — Tipos:**
- Checkbox autoavaliação (default on).
- Checkbox avaliação do gestor (default on).
- Info "Pares e 360 virão em versão futura".

**Passo 4 — Formulário:**
- Escolha de partida: Template padrão (pre-selected) / Em branco / Copiar de ciclo anterior (disabled).
- Lista de perguntas com drag-and-drop, pills (competência / tipo / obrigatória), botões Editar / Deletar.
- "+ Adicionar pergunta de nota" / "+ Adicionar pergunta de texto".
- Editar pergunta abre modal inline.

**Passo 5 — Revisar:**
- Resumo dos passos 1-4 em cards com link "editar" (volta ao passo correspondente).
- Botões: "Salvar rascunho" (status = draft) ou "Publicar agora" (status = published, abre modal de confirmação).

### 9.3. `/avaliacoes/[cycleId]` — detalhe com 4 tabs

**Header:** nome, períodos, status (label derivado), botões "Editar" (abre wizard) e kebab (arquivar, duplicar [MVP 1.5], etc).

**4 KPI cards:** Participantes, Assignments, Progresso %, Atrasadas.

**Tabs:**
- **Progresso:** tabela participante × self/gestor com status visual (✓ ● ○). Kebab por linha: reenviar lembrete individual, cancelar assignment, reatribuir reviewer. Botões acima da tabela: "Reenviar lembretes a todos pendentes", "Encerrar ciclo" (modal de confirmação).
- **Participantes:** gerenciar quem está no ciclo; adicionar/remover pós-publish (gera/cancela assignments).
- **Formulário:** read-only após publicar; admin_rh vê as perguntas originais.
- **Resultados:** disabled enquanto `status ≠ closed/archived`. Quando closed, listagem de participantes com média geral + ícone de liberação + link pro resultado individual.

### 9.4. `/avaliacoes/[cycleId]/responder/[assignmentId]`
Layout 2 colunas:
- **Sidebar esquerda (280px):** avatar/nome/cargo do avaliado + badge tipo (self/manager) + contexto (admissão, liderados, última avaliação) + bloco feedbacks no período (stub até FT-3) + prazo.
- **Main:** título "Responda sobre {nome}" + copy de auto-save + lista de perguntas.

Cada pergunta:
- Pills: competência / tipo (nota azul / texto verde) / obrigatoriedade (vermelha se obrigatória).
- **Nota:** 5 botões horizontais (1-5), labels "Precisa melhorar" / "Excelente" abaixo.
- **Texto:** textarea com contador 0-2000 (soft limit).

Footer: "Salvar e sair" (botão secundário) + "Enviar avaliação" (disabled se obrigatórias pendentes).

Auto-save: on blur + debounce 2s. Indicator "💾 Rascunho salvo há Xs" no header.

Modal de envio: "Após enviar, não poderá alterar. Continuar?". Pós-envio: redirect `/avaliacoes` + toast.

### 9.5. `/avaliacoes/[cycleId]/resultados` (listagem)
Tabela de participantes com:
- Nome, cargo, depto.
- Média geral (número grande colorido).
- Coluna "Liberado?" (✓ / 🔒).
- Link "Ver resultado" → `/avaliacoes/[cycleId]/resultados/[employeeId]`.
- Filtros: departamento, gestor, status de liberação.
- Ordenação por média (asc/desc).

### 9.6. `/avaliacoes/[cycleId]/resultados/[employeeId]`
Layout 2 colunas:
- **Sidebar esquerda (340px):**
  - Cartão "MÉDIA GERAL" (laranja, número grande).
  - Bloco "PONTOS FORTES" (top 3, verde).
  - Bloco "PONTOS A DESENVOLVER" (bottom 2-3, amarelo).
  - CTA "Criar PDI com base neste resultado" (leva para `/pdi/novo?cycleId=X&employeeId=Y` — disabled até FT-4).
- **Main:**
  - Banner de liberação: "🔒 Oculto do colaborador" + botão "Liberar resultado" OU "✓ Liberado em DD/MM" + botão "Ocultar novamente".
  - Tabela "Notas por competência — self × gestor × Δ".
  - Seção "Comentários" — cards agrupados por pergunta, com autor (autoavaliação / gestor nome).
  - Header: Exportar PDF (disabled com "Em breve").

## 10. Permissions

```typescript
// src/features/reviews/permissions.ts

export function canCreateCycle(actor): boolean {
  return actor.role === 'admin_rh';
}

export function canEditCycle(actor, cycle): boolean {
  if (actor.role !== 'admin_rh') return false;
  if (cycle.status === 'archived') return false;
  return true;  // editabilidade dos campos é limitada por status (ver §6)
}

export function canSeeCycle(actor, cycle): boolean {
  // Admin_rh, director vêem tudo da empresa
  if (actor.role === 'admin_rh' || actor.role === 'director') return true;
  // User vê se está envolvido (participante ou reviewer)
  return isInvolvedInCycle(actor.employeeId, cycle.id);
}

export function canAnswerAssignment(actor, assignment): boolean {
  return (
    actor.employeeId === assignment.reviewer_id
    && ['pending','in_progress'].includes(assignment.status)
  );
}

export function canSeeResultOf(actor, employeeId, cycle): boolean {
  if (actor.role === 'admin_rh' || actor.role === 'director') return true;
  if (actor.employeeId === employeeId) {
    // self só vê se liberado
    return cycleParticipant.result_released_at != null;
  }
  // gestor vê descendentes (skip-level read)
  return isDescendantOf(employeeId, actor.employeeId);
}

export function canReleaseResult(actor): boolean {
  return actor.role === 'admin_rh';
}
```

## 11. Error states e edge cases

| Situação | Tratamento |
|---|---|
| Ciclo encerrado com 0 envios | Tab Resultados: "Nenhuma avaliação concluída." + admin pode arquivar |
| Assignment cancelado | Não entra no cálculo. Header da tab Resultados mostra N cancelados. |
| Colaborador sem gestor | Só self. Pontos fortes/desenvolver derivam do self. Comparativo só com coluna self. |
| Colaborador muda gestor mid-ciclo | Assignment existente permanece. Admin pode cancelar e reatribuir manualmente se desejado. |
| Colaborador desligado com resultado liberado | Resultado permanece no histórico. Ex-colaborador (sem acesso) não vê. |
| Admin edita form/participantes de `published` | UI bloqueia + server 403. |
| Admin edita `closed`/`archived` | UI bloqueia + server 403. |
| Zero perguntas de nota | Média = N/A. Mostra só comentários. Pontos fortes/desenvolver ocultos. |
| Resposta parcial (só obrigatórias) | Permitido. Opcionais vazias. |
| Reviewer sem `user_id` (nunca convidado) | Warning no passo 5 da publicação + na tab Progresso. Botão inline "Convidar gestor". |
| Reviewer tenta abrir `closed` | Redirect `/avaliacoes/[cycleId]` + toast "Ciclo encerrado". |
| Submit acidental | Irreversível no MVP 1.0. Admin comunica offline. |
| Múltiplos ciclos simultâneos | Permitido. Reviewer pode ter vários assignments ativos. |
| Admin oculta resultado liberado | Permitido. `result_released_at = NULL`. Logs registram ambos os eventos. |
| `published` com `response_start > now` | Label "Agendado". Tentativa de responder → 403 "Ciclo ainda não começou". |
| `response_end < now` mas ainda `published` | Server lazy-close no próximo acesso. |

## 12. Critérios de aceite

- [ ] Admin_rh cria ciclo via wizard, salva como rascunho, volta, edita, publica.
- [ ] Ao publicar, assignments são gerados corretamente (2 × N quando ambos tipos on).
- [ ] Assignments para reviewee sem gestor geram só `self`.
- [ ] Warning no wizard para sem gestor E manager enabled.
- [ ] Notification enviada aos reviewers na publicação.
- [ ] Reviewer abre assignment, responde, auto-save funciona, envia, redirect + toast.
- [ ] Reviewer não consegue editar após submit (UI + server).
- [ ] Admin vê progresso em tempo real (% atualiza).
- [ ] "Reenviar lembretes" dispara e-mail Resend para pending/in_progress.
- [ ] Adicionar participante pós-publish gera novos assignments.
- [ ] Remover participante pós-publish cancela assignments (status=cancelled, cancelled_reason='reviewee_removed').
- [ ] Reatribuir reviewer troca FK preservando histórico.
- [ ] Admin encerra ciclo manualmente → status=closed, submissions bloqueadas.
- [ ] Lazy close dispara na próxima Server Action após response_end.
- [ ] Resultados mostram média geral correta (média das médias por competência).
- [ ] Pontos fortes/desenvolver derivam da avaliação do gestor (ou self quando sem gestor).
- [ ] Tabela self × gestor × delta colorida corretamente.
- [ ] Comentários agrupados por pergunta, com autor rotulado.
- [ ] Admin libera resultado → colaborador passa a ver; toast confirmation.
- [ ] Admin oculta resultado → colaborador volta a ver "não liberado".
- [ ] Gestor vê resultado de todos os descendentes (árvore).
- [ ] Colaborador fora da hierarquia não vê resultado alheio (403 + RLS).
- [ ] Activity logs registram: cycle.created, cycle.published, cycle.closed, cycle.archived, cycle.auto_closed, assignment.submitted, assignment.cancelled, result.released, result.hidden.
- [ ] Vitest cobre: geração de assignments, cálculo de médias, permissions.

## 13. Plano de implementação (ordem sugerida)

1. **Migration** — todas as tabelas + RLS policies + índices.
2. **Types** — regenerar `supabase gen types`.
3. **Seed template** — função `buildDefaultForm(cycleId, companyId)` que insere 7 perguntas de nota + 2 texto.
4. **Permissions** — `src/features/reviews/permissions.ts`.
5. **Queries** — `listCycles`, `getCycle`, `getCycleProgress`, `getParticipants`, `getAssignmentsForUser`, `getResultDetail`, `getCompetencyScores`.
6. **Actions — ciclo:** `createCycleDraft`, `saveCycleDraft`, `publishCycle` (gera assignments + notifies), `closeCycle`, `archiveCycle`, `addParticipant`, `removeParticipant`.
7. **Actions — assignments:** `cancelAssignment`, `reassignReviewer`, `sendReminders` (Resend batch).
8. **Actions — respostas:** `saveAnswerDraft` (UPSERT), `submitAssignment`.
9. **Actions — resultados:** `releaseResult`, `hideResult`.
10. **`/avaliacoes/nova`** — wizard 5 passos reaproveitando `<OnboardingWizard />`.
11. **`/avaliacoes`** — listagem com seção "Pendentes para você".
12. **`/avaliacoes/[cycleId]`** — header + 4 KPI cards + 4 tabs.
13. **`/avaliacoes/[cycleId]/responder/[assignmentId]`** — tela de resposta com auto-save.
14. **`/avaliacoes/[cycleId]/resultados`** — listagem.
15. **`/avaliacoes/[cycleId]/resultados/[employeeId]`** — resultado individual com gráficos simples.
16. **Lazy-close** — helper que toda Server Action de ciclo roda no início.
17. **Notifications** — disparar nas transições corretas.
18. **Testes** — Vitest (lógica pura).

## 14. Não-funcionais

- **Performance:** listagem de 100 ciclos em <400ms. Cálculo de resultado individual em <200ms (view otimizada).
- **Segurança:** RLS impede cross-cycle e cross-employee. Teste cobre cenários de vazamento.
- **Acessibilidade:** modais de confirmação destructivos têm foco em Cancelar. Tabelas com `<caption>` + headers corretos. Nota escolhível via teclado (1-5 mapeados).
- **Observabilidade:** Sentry captura erros. Activity logs cobrem transições.
- **Resiliência:** falha no envio de e-mail de lembrete não bloqueia outras operações; admin recebe toast "Alguns lembretes falharam (N). Tente novamente."

## 15. Referências

- `docs/PRD-GERAL.md` §8
- `docs/MVP.md` §2
- `docs/MVP-2.md`
- `docs/USERS-ABLE.md` §4–§8
- `docs/ESTRUTURA.md` §18 Sprints 3, 4, 5
- `features/FT-2.md`
- `docs/dev/00-decisoes-transversais.md`
- `docs/dev/01-fase-0-fundacao.md`
- `docs/dev/02-ft-1-colaboradores.md`
