# FT-7 — Recrutamento — Onda 3 — Scorecard, Tarefas e Métricas

Spec da **terceira e última onda** do módulo de Recrutamento.
Adiciona scorecard estruturado com comparação entre avaliadores, tarefas operacionais, e o dashboard de relatórios com métricas do funil.
Depende da Fundação + Onda 1 + Onda 2.
Última atualização: 2026-04-21.

> **Leia antes:** `docs/dev/13-ft-7-fundacao.md` + `docs/dev/14-ft-7-onda1-vagas-candidatos.md` + `docs/dev/15-ft-7-onda2-feedback-contratacao.md`.

---

## 1. Objetivo

Fechar o módulo de Recrutamento com as três capacidades que separam um "banco de candidatos" de uma ferramenta real de gestão de processos seletivos:

1. **Scorecard estruturado** — avaliadores (admin e gestor) registram ratings em 4 dimensões universais + decisão de recomendação. Múltiplos scorecards numa mesma etapa ativam **comparação automática lado-a-lado** com destaque de divergências, habilitando decisões baseadas em sinal (não só em opinião textual).
2. **Tarefas operacionais** com responsável e prazo, ligadas a aplicação específica. Responsável é notificado automaticamente; atrasos aparecem no card do Kanban e no dashboard.
3. **Dashboard de Relatórios** em `/recrutamento/relatorios` com KPIs, funil de conversão, origens × contratados, tempo mediano por etapa, candidatos parados e tarefas atrasadas — respondendo as perguntas do FT-7.5 (conversão, abandono, tempo, origem).

Após esta Onda, o FT-7 está entregue na íntegra.

## 2. Escopo

### Dentro da Onda 3

**Schema (2 migrations aditivas):**
- Tabela `candidate_scorecards` com RLS.
- Tabela `candidate_tasks` com RLS.

**Scorecard (UI):**
- `ScorecardSheet` 440px (form com pills 1-5, salário binário, comentário, recomendação).
- Acesso via card do Kanban (menu kebab `⋮ → 📋 Preencher scorecard`) e perfil do candidato (botão no card de aplicação).
- Seção "Scorecards" no perfil do candidato, paralela à seção "Feedbacks" — agrupada por aplicação; ativa aberta por default; terminadas colapsadas.
- **Comparação automática**: quando há 2+ scorecards na mesma `(application_id, stage_id)`, renderiza **tabela lado-a-lado** com destaque de divergências; caso contrário, card simples.
- **Badge `📋 N` condicional** no card do Kanban (só quando count ≥ 1), análogo ao `💬 N` da Onda 2.

**Tarefas (UI):**
- `TaskDialog` (modal centralizado, padrão Departamentos/Cargos/Competências) para criar e editar.
- Seção "Tarefas" no perfil do candidato — agrupada por aplicação; lista com checkbox (só leitura), título, prazo, responsável.
- Marcar concluída: botão "Concluir" visível ao hover da linha; em mobile/touch, sempre visível. Menu kebab `⋮` para editar e deletar.
- **Badge no card do Kanban** indicando estado das tarefas: `⚠ N atrasada(s)` (vermelho) / `✓ N/M` quando tudo concluído (verde) / `N pendentes` (neutro).
- Notificação `recruitment.task_assigned` dispara quando `responsible_id` é preenchido e é diferente do criador.

**Dashboard (`/recrutamento/relatorios`):**
- `PageHeader` com título + descrição; **actions à direita**: chips `7d / 30d / 90d / 📅 Personalizado` (popover com calendário duplo + "Tudo" + "Aplicar").
- **Barra de filtros** abaixo (padrão `EmployeesList`): Buscar candidato + MultiSelect Vaga + MultiSelect Responsável.
- **KPI row** (4 cards): Candidatos ativos · Contratados (período) · Tempo até contratação (mediana) · Tarefas atrasadas.
- **Funil de conversão**: bar chart horizontal com todas as etapas ativas; tooltip rico com breakdown.
- **Grid 2 colunas (meio)**:
  - Origens — **donuts gêmeos** (Candidatos · Contratados) com legenda única; tooltip rico.
  - Tempo mediano por etapa — **lollipop vertical** com gargalos em vermelho (>5d); tooltip rico.
- **Grid 2 colunas (fim)**:
  - Candidatos parados > 5d (tabela compacta).
  - Tarefas atrasadas (tabela compacta).
- **URL state**: `?period=30d&from=X&to=Y&job_ids=a,b&owner_ids=x,y&q=maria`.

**Auditoria:**
- `candidate_scorecard.submitted` · `candidate_scorecard.updated` · `candidate_scorecard.deleted`.
- `candidate_task.created` · `candidate_task.updated` · `candidate_task.completed` · `candidate_task.reopened` · `candidate_task.deleted`.
- Extensão de `humanizeActivityMetadata` com strings pt-BR.

**Notificações:**
- `recruitment.task_assigned` (declarada na Fundação §9) passa a disparar.

### Fora da Onda 3

- Cross-filter entre gráficos do dashboard (click na etapa do funil filtra os outros) → pós-MVP.
- Tela global `/recrutamento/tarefas` com todas as tarefas da empresa → pós-MVP (dashboard + perfil cobrem).
- Feature "Pedir feedback de…" (P27 da Onda 2) continua fora.
- Exportação CSV/XLSX dos relatórios → pós-MVP.
- Drill-down: "clique pra ver candidatos desta etapa" indicado em tooltips é upgrade futuro.
- Comentários encadeados em scorecard/feedback → pós-MVP.
- Scorecard com dimensões customizáveis por empresa → pós-MVP.

---

## 3. User stories

### Scorecard

- Admin_rh or gestor (da vaga) should be able to preencher scorecard estruturado a partir do card do Kanban (kebab `⋮`).
- Admin_rh or gestor (da vaga) should be able to preencher scorecard a partir do perfil do candidato.
- Admin_rh or gestor should be able to editar o próprio scorecard dentro da janela 2h.
- Admin_rh or gestor should be able to deletar o próprio scorecard dentro da janela 2h; admin_rh pode deletar qualquer a qualquer momento.
- Users with permission should be able to ver scorecards agrupados por aplicação no perfil do candidato.
- Users with permission should be able to ver **tabela comparativa** quando há 2+ scorecards na mesma etapa, com destaque de divergências.
- Users with permission should be able to ver badge `📋 N` no card do Kanban quando a aplicação tem scorecards.
- Avaliador should be blocked ao tentar submeter segundo scorecard na mesma aplicação+etapa (UNIQUE constraint); opção é editar o existente.

### Tarefas

- Admin_rh or gestor (da vaga) should be able to criar tarefa vinculada a uma aplicação com título livre, prazo opcional e responsável (default = criador).
- Admin_rh or gestor should be able to editar título, prazo e responsável das tarefas que criaram.
- Admin_rh or gestor should be able to deletar tarefas que criaram (admin_rh pode deletar qualquer).
- Admin_rh or gestor or responsável should be able to marcar tarefa como concluída via botão "Concluir" (hover) ou reabrir uma concluída.
- Admin_rh or gestor should be able to ver tarefas da aplicação no perfil do candidato, agrupadas por aplicação.
- Admin_rh or gestor should be able to ver indicador de tarefas pendentes/atrasadas no card do Kanban.
- Responsável should receive notificação `recruitment.task_assigned` ao ser atribuído (quando diferente do criador).

### Dashboard de Relatórios

- Admin_rh and directors should be able to acessar `/recrutamento/relatorios` com visão consolidada de toda a empresa.
- Gestores should be able to acessar `/recrutamento/relatorios` com filtro automático pelas vagas onde são `hiring_manager`.
- Colaboradores should be blocked pelo layout-guard do módulo.
- Users with access should be able to filtrar por período (7d/30d/90d/Personalizado/Tudo), vaga (multi) e responsável (multi), além de buscar candidato por nome/email.
- Users with access should see KPIs, funil de conversão, origens × contratados, tempo mediano por etapa, candidatos parados e tarefas atrasadas.
- Users with access should see tooltips ricos com breakdowns ao hover nos gráficos.
- Filtros should be persistent via URL query string (compartilhável).

---

## 4. Schema — migrations aditivas

### 4.1 `candidate_scorecards`

```sql
-- Migration: ft7_onda3_candidate_scorecards.sql

CREATE TABLE candidate_scorecards (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id             uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  application_id         uuid NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  stage_id               uuid NOT NULL REFERENCES recruitment_stages(id),
  author_id              uuid NOT NULL REFERENCES employees(id),

  rating_communication   smallint NOT NULL CHECK (rating_communication BETWEEN 1 AND 5),
  rating_experience      smallint NOT NULL CHECK (rating_experience BETWEEN 1 AND 5),
  rating_role_fit        smallint NOT NULL CHECK (rating_role_fit BETWEEN 1 AND 5),
  rating_culture_fit     smallint NOT NULL CHECK (rating_culture_fit BETWEEN 1 AND 5),
  salary_expectation     text CHECK (salary_expectation IN ('compatible', 'incompatible')),
  comment                text CHECK (comment IS NULL OR char_length(comment) <= 2000),
  recommendation         text NOT NULL CHECK (recommendation IN ('advance', 'doubt', 'reject')),

  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  deleted_at             timestamptz
);

-- Unicidade por (aplicação, etapa, autor) — decisão P33
CREATE UNIQUE INDEX candidate_scorecards_unique_per_author_stage
  ON candidate_scorecards (application_id, stage_id, author_id)
  WHERE deleted_at IS NULL;

CREATE INDEX candidate_scorecards_application_time
  ON candidate_scorecards (application_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX candidate_scorecards_stage_recommendation
  ON candidate_scorecards (stage_id, recommendation)
  WHERE deleted_at IS NULL;

CREATE INDEX candidate_scorecards_company_time
  ON candidate_scorecards (company_id, created_at DESC)
  WHERE deleted_at IS NULL;
```

### 4.2 `candidate_tasks`

```sql
-- Migration: ft7_onda3_candidate_tasks.sql

CREATE TABLE candidate_tasks (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  application_id    uuid NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,

  title             text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 140),
  due_date          date,
  responsible_id    uuid NOT NULL REFERENCES employees(id),
  created_by        uuid NOT NULL REFERENCES employees(id),
  completed_at      timestamptz,
  completed_by      uuid REFERENCES employees(id),

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz
);

CREATE INDEX candidate_tasks_application_pending
  ON candidate_tasks (application_id, due_date)
  WHERE deleted_at IS NULL AND completed_at IS NULL;

CREATE INDEX candidate_tasks_responsible_pending
  ON candidate_tasks (responsible_id, due_date)
  WHERE deleted_at IS NULL AND completed_at IS NULL;

CREATE INDEX candidate_tasks_company_time
  ON candidate_tasks (company_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Consultas de atrasadas são muito frequentes — índice específico
CREATE INDEX candidate_tasks_overdue
  ON candidate_tasks (company_id, due_date)
  WHERE deleted_at IS NULL AND completed_at IS NULL AND due_date IS NOT NULL;
```

### 4.3 RLS

**`candidate_scorecards`** — mesmo padrão de `candidate_feedbacks` (Onda 2):

```sql
ALTER TABLE candidate_scorecards ENABLE ROW LEVEL SECURITY;

-- SELECT: admin/director + gestor da vaga + próprio autor
CREATE POLICY candidate_scorecards_select ON candidate_scorecards
FOR SELECT USING (
  company_id = get_user_company_id()
  AND deleted_at IS NULL
  AND (
    get_user_role() IN ('admin_rh', 'director')
    OR author_id = get_user_employee_id()
    OR EXISTS (
      SELECT 1 FROM job_applications ja
      JOIN job_openings jo ON ja.job_opening_id = jo.id
      WHERE ja.id = candidate_scorecards.application_id
        AND jo.hiring_manager_id = get_user_employee_id()
    )
  )
);

-- INSERT: admin_rh OR gestor da vaga
CREATE POLICY candidate_scorecards_insert ON candidate_scorecards
FOR INSERT WITH CHECK (
  company_id = get_user_company_id()
  AND author_id = get_user_employee_id()
  AND (
    get_user_role() = 'admin_rh'
    OR EXISTS (
      SELECT 1 FROM job_applications ja
      JOIN job_openings jo ON ja.job_opening_id = jo.id
      WHERE ja.id = candidate_scorecards.application_id
        AND jo.hiring_manager_id = get_user_employee_id()
    )
  )
);

-- UPDATE: autor dentro de 2h
CREATE POLICY candidate_scorecards_update_author ON candidate_scorecards
FOR UPDATE USING (
  company_id = get_user_company_id()
  AND author_id = get_user_employee_id()
  AND created_at > (now() - interval '2 hours')
  AND deleted_at IS NULL
);

-- Admin: soft-delete sempre (ação controlada via server action)
CREATE POLICY candidate_scorecards_soft_delete_admin ON candidate_scorecards
FOR UPDATE USING (
  company_id = get_user_company_id()
  AND get_user_role() = 'admin_rh'
  AND deleted_at IS NULL
) WITH CHECK (
  company_id = get_user_company_id()
);
```

**`candidate_tasks`**:

```sql
ALTER TABLE candidate_tasks ENABLE ROW LEVEL SECURITY;

-- SELECT: admin/director + gestor da vaga + criador + responsável
CREATE POLICY candidate_tasks_select ON candidate_tasks
FOR SELECT USING (
  company_id = get_user_company_id()
  AND deleted_at IS NULL
  AND (
    get_user_role() IN ('admin_rh', 'director')
    OR created_by = get_user_employee_id()
    OR responsible_id = get_user_employee_id()
    OR EXISTS (
      SELECT 1 FROM job_applications ja
      JOIN job_openings jo ON ja.job_opening_id = jo.id
      WHERE ja.id = candidate_tasks.application_id
        AND jo.hiring_manager_id = get_user_employee_id()
    )
  )
);

-- INSERT: admin_rh OR gestor da vaga
CREATE POLICY candidate_tasks_insert ON candidate_tasks
FOR INSERT WITH CHECK (
  company_id = get_user_company_id()
  AND created_by = get_user_employee_id()
  AND (
    get_user_role() = 'admin_rh'
    OR EXISTS (
      SELECT 1 FROM job_applications ja
      JOIN job_openings jo ON ja.job_opening_id = jo.id
      WHERE ja.id = candidate_tasks.application_id
        AND jo.hiring_manager_id = get_user_employee_id()
    )
  )
);

-- UPDATE: criador, responsável, admin_rh, ou gestor da vaga
-- (granulares adicionais controladas por server action)
CREATE POLICY candidate_tasks_update ON candidate_tasks
FOR UPDATE USING (
  company_id = get_user_company_id()
  AND deleted_at IS NULL
  AND (
    get_user_role() = 'admin_rh'
    OR created_by = get_user_employee_id()
    OR responsible_id = get_user_employee_id()
    OR EXISTS (
      SELECT 1 FROM job_applications ja
      JOIN job_openings jo ON ja.job_opening_id = jo.id
      WHERE ja.id = candidate_tasks.application_id
        AND jo.hiring_manager_id = get_user_employee_id()
    )
  )
);
```

`DELETE` é sempre soft (via `deleted_at`); UPDATE de `deleted_at` é coberto pela policy `candidate_tasks_update`. Critério de quem pode deletar fica na server action:
- Criador ou admin_rh — sempre.
- Gestor da vaga — sempre (tarefa é da sua vaga).
- Responsável (não-criador) — não pode deletar, apenas concluir/reabrir.

---

## 5. UI — Scorecard

### 5.1 `ScorecardSheet` (440px)

Localização: `src/features/recruitment/scorecards/ScorecardSheet.tsx`. Mesmo padrão de `FeedbackSheet` (Onda 2) e demais sheets do repo.

**Header do sheet:**
- Nome do candidato + email.
- Vaga (link) + etapa (badge) em que o scorecard está sendo dado.
- Se já existe scorecard do mesmo autor nesta etapa (UNIQUE), sheet abre em modo edição.

**Body** (form RHF + Zod):

**Seção "Ratings" (grid 2x2)** — pills 1-5 por dimensão:

| Campo | Validação |
|---|---|
| `rating_communication` | smallint 1-5 obrigatório |
| `rating_experience` | smallint 1-5 obrigatório |
| `rating_role_fit` | smallint 1-5 obrigatório |
| `rating_culture_fit` | smallint 1-5 obrigatório |

Cada pill é um botão 32×32px com número; selecionado em laranja `#f97316`, outros brancos com borda cinza.

**Seção "Salário"**:
```
[ ✓ Compatível ]   [ ⚠ Incompatível ]
(radio, opcional — null se não marcado)
```

**Seção "Comentário"**:
- Textarea, opcional, até 2000 chars, texto plano (`whitespace-pre-wrap` no render).

**Seção "Recomendação"** (radio obrigatório):
- `✓ Avança` (verde)
- `? Dúvida` (amarelo)
- `× Reprova` (vermelho)

**Footer:**
- Cancelar (ghost)
- Salvar scorecard (primary)

**Após sucesso:**
- Toast "Scorecard registrado" (ou "atualizado").
- Fecha sheet.
- Revalida: Kanban da vaga + perfil do candidato.
- Card no Kanban atualiza badge `📋 N`.

### 5.2 Acessos ao ScorecardSheet

Dois caminhos, paralelos aos do feedback (decisão P23):

**Caminho 1 — Kanban, menu kebab `⋮` no card:**

Menu final do card na Onda 3 (integra Onda 1 + 2 + 3):

```
↑ Mover para [etapa anterior]
↓ Mover para [próxima etapa]
───────
💬 Dar feedback             (Onda 2)
📋 Preencher scorecard      (Onda 3)
📝 Adicionar tarefa         (Onda 3)
───────
× Marcar desistente
× Marcar reprovado
❄ Congelar
✓ Marcar contratado         (admin_rh, Onda 2)
```

**Caminho 2 — Perfil do candidato:**

No card de cada aplicação da seção "Aplicações", ao lado do botão `💬 Dar feedback` (Onda 2), adicionar:
- `📋 Preencher scorecard`

Clique abre `ScorecardSheet` com aplicação e etapa atual pré-definidas.

### 5.3 Seção "Scorecards" no perfil do candidato

Ordem final das seções do perfil após Onda 3:

1. Dados pessoais
2. Aplicações
3. Feedbacks (Onda 2)
4. **Scorecards** (nova — Onda 3)
5. **Tarefas** (nova — Onda 3)
6. Histórico (Onda 1)

**Estrutura de "Scorecards"** (decisão P36):
- Acordeão por aplicação. Cabeçalho: nome da vaga + status badge + contagem de scorecards.
- Aplicação ativa (`status='in_progress'`) — aberta por default.
- Aplicação terminada (`hired`/`rejected`/`withdrawn`/`frozen`) — fechada; admin expande se precisar.

**Dentro de cada grupo:**

Agrupado por **etapa** (cada etapa é um `stage-block`). Dentro do stage-block, comportamento depende da contagem:

- **1 scorecard na etapa** → renderiza `ScorecardCard` (card simples herdado de P36).
- **2+ scorecards na etapa** → renderiza `ScorecardsComparisonTable` (tabela lado-a-lado — decisão P54).

### 5.4 `ScorecardCard` (1 avaliador)

```
┌─────────────────────────────────────────────────────┐
│ Entrevista RH · por Carlos Pereira       há 3 dias  │
│                                                     │
│  Comunicação  ★★★★☆   Experiência   ★★★☆☆         │
│  Aderência    ★★★★★   Fit cultural  ★★★★☆         │
│                                                     │
│  [✓ Salário compatível]  [✓ Recomenda avançar]     │
│  ─────────────────────────────────────────────      │
│  Comentário: Fit técnico forte; precisa trabalhar   │
│  comunicação em apresentações. Recomendo avançar.   │
└─────────────────────────────────────────────────────┘
```

- Ratings renderizados como estrelas (decisão P37: stars no card).
- Kebab `⋮` visível pro autor dentro de 2h (Editar/Deletar); pro admin_rh sempre (Deletar).

### 5.5 `ScorecardsComparisonTable` (2+ avaliadores)

```
┌───────────────────────────────────────────────────────────────────┐
│ Entrevista Gestor · 2 avaliadores [⚠ divergência em 3 de 6]       │
│                                                    há 2–5 dias    │
│                                                                   │
│                     Carlos P.       Pedro M.      Diferença       │
│                     (admin_rh)      (gestor)                      │
│  Comunicação        ★★★★☆           ★★★☆☆         -1              │
│  Experiência        ★★★☆☆           ★★★★☆         +1              │
│  Aderência          ★★★★★           ★★★★★         =               │
│  Fit cultural       ★★★★☆           ★★★☆☆         -1      [warn]  │
│  Salário            ✓ Compatível    ⚠ Incompat.   divergente      │
│  Recomendação       ✓ Avança        ? Dúvida      divergente      │
│                                                                   │
│  ┌ Carlos P. · admin_rh ─────────────────────────────────┐       │
│  │ Técnica forte, alinhado com cultura. Recomendo...    │       │
│  └──────────────────────────────────────────────────────┘       │
│  ┌ Pedro M. · gestor ──────────────────────────────────────┐     │
│  │ Comunicação não me convenceu em conflitos. Dúvida.      │     │
│  └────────────────────────────────────────────────────────┘     │
└───────────────────────────────────────────────────────────────────┘
```

**Comportamentos**:
- Header da tabela mostra **badge `⚠ divergência em X de 6`** (laranja/amarelo) quando há pelo menos 1 linha divergente. X = número de dimensões divergentes (soma ratings com diff ≠ 0 + salário divergente + recomendação divergente).
- **Linha destacada** (`background: #fffbf0`) quando a diferença absoluta é ≥ 2 nos ratings, OU quando salário/recomendação divergem.
- Diferença colorida: `0` em cinza, `±1` em laranja, `±2+` em vermelho; salário/recomendação como "divergente" em vermelho ou "=" em cinza.
- Escala até **4 avaliadores** na tabela sem scroll horizontal; 5+ avaliadores adiciona scroll horizontal interno (caso raro).
- Comentários listados abaixo da tabela, um por autor, caixa com borda-esquerda cinza.
- Kebab `⋮` fica em cada coluna de autor (Editar/Deletar) — não na tabela inteira.

### 5.6 Badge `📋 N` no card do Kanban (decisão P53)

Card do Kanban ganha mais um badge após o `💬 N`:

```
┌─────────────────────────────┐
│ Maria Silva            ⋮   │
│ maria.s@gmail.com           │
│                             │
│ [LinkedIn] 2d  💬 3  📋 2  │
└─────────────────────────────┘
```

- Badge condicional — só aparece se count de scorecards (não deletados) ≥ 1.
- Cor **azul** (`background: #eff6ff; color: #1e3a8a`) — distinto do laranja do feedback.
- Click leva a `/recrutamento/candidatos/[id]?app=[applicationId]#scorecards` — perfil abre na seção Scorecards com aplicação expandida.
- Tooltip: "N scorecards registrados".

---

## 6. UI — Tarefas

### 6.1 `TaskDialog` (modal centralizado, padrão Configurações)

Localização: `src/features/recruitment/tasks/TaskDialog.tsx`. Baseado no padrão de `DepartmentDialog`, `RoleDialog`, `CompetencyDialog` (já existentes no produto).

**Header:**
- Título: "Nova tarefa" (create) ou "Editar tarefa" (edit).
- Subtítulo: nome do candidato · nome da vaga (context).

**Body** (form RHF + Zod):

| Campo | Tipo | Obrigatório | Default |
|---|---|---|---|
| `title` | text | sim | "" (3-140 chars) |
| `due_date` | date | não | `null` |
| `responsible_id` | select (employees ativos) | sim | `actor.employee_id` (criador) |

**Layout (2 colunas)**:
```
O que precisa ser feito? (full width)
────────────────────────
Prazo (opcional)    |    Responsável
[ 25/04/2026  📅]  |    [ Carlos Pereira ▾ ]
```

**Footer:**
- Cancelar (ghost)
- Criar tarefa / Salvar alterações (primary)

### 6.2 Acessos ao TaskDialog

**Caminho 1 — Kanban, menu kebab `⋮` no card** → `📝 Adicionar tarefa` (entre scorecard e saídas laterais).

**Caminho 2 — Perfil do candidato** → botão `+ Adicionar tarefa` no cabeçalho da seção "Tarefas" e/ou em cada grupo de aplicação.

### 6.3 Seção "Tarefas" no perfil do candidato

Estrutura análoga à de Scorecards:

```
Tarefas                                     [+ Adicionar tarefa]
──────────────────────────────────────────────────────────
▼ Analista de Suporte Jr · 2 pendentes
  ┌──────────────────────────────────────────────────┐
  │ ☐  Agendar entrevista com gestor                  │
  │    ⚠ Venceu há 2d · Carlos P.        [Concluir]  │ ⋮
  ├──────────────────────────────────────────────────┤
  │ ☐  Enviar teste técnico                           │
  │    Hoje · Admin RH                   [Concluir]  │ ⋮
  ├──────────────────────────────────────────────────┤
  │ ☑  Validar referências profissionais              │
  │    Concluída 15/04 por Carlos P.                 │ ⋮
  └──────────────────────────────────────────────────┘

▸ Analista Pleno · arquivada (vaga fechada)
```

- Agrupada por aplicação (igual feedbacks/scorecards); ativa aberta, terminadas colapsadas.
- Cada linha: checkbox read-only + título + prazo (relativo, com ⚠ se atrasada) + responsável.
- Botão "Concluir" visível ao hover (desktop) ou sempre (mobile, quando `matchMedia('(hover: none)')`).
- Kebab `⋮` para Editar e Deletar.
- Ordenação: pendentes primeiro (por prazo ASC, nulls last); concluídas depois (por `completed_at` DESC).

### 6.4 Marcar tarefa como concluída/reabrir (decisão P44)

**Fluxo concluir:**
- Admin hover na linha → botão laranja "Concluir" aparece.
- Click → chama `completeTask(taskId)` → `UPDATE candidate_tasks SET completed_at = now(), completed_by = actor WHERE id = taskId`.
- Linha atualiza: checkbox vira checado (verde), título riscado, botão some, subtitle muda pra "Concluída DD/MM por [nome]".
- Evento `candidate_task.completed` em `activity_logs`.

**Fluxo reabrir:**
- Kebab `⋮` em tarefa concluída oferece "Reabrir".
- Click → `UPDATE candidate_tasks SET completed_at = NULL, completed_by = NULL`.
- Evento `candidate_task.reopened` em `activity_logs`.

**Fallback mobile:**
- Em viewport detectado via `@media (hover: none)`, botão "Concluir" é sempre visível (não depende de hover). Tailwind class pattern: `opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100`.

### 6.5 Indicador de tarefas no card do Kanban (decisão P39)

Card do Kanban ganha pill indicando estado agregado das tarefas não-deletadas da aplicação:

Prioridade de exibição (só 1 pill por vez):
1. **⚠ N atrasada(s)** (vermelho) — se `count > 0` de tarefas com `due_date < now() AND completed_at IS NULL`.
2. **N pendentes** (neutro) — se há tarefas pendentes (`completed_at IS NULL`) mas nenhuma atrasada.
3. **✓ N/M** (verde) — todas concluídas e há pelo menos 1 tarefa.
4. **(sem pill)** — zero tarefas.

Exemplo de card completo (todos os badges da Onda 1+2+3):

```
┌──────────────────────────────────┐
│ Maria Silva               ⋮     │
│ maria.s@gmail.com                │
│                                  │
│ [LinkedIn] 2d 💬3 📋2 ⚠1 atras. │
└──────────────────────────────────┘
```

`flex-wrap` permite quebrar em 2ª linha de badges em viewport apertado.

---

## 7. UI — Dashboard de Relatórios

### 7.1 Rota e acesso

- Rota: `/recrutamento/relatorios` (declarada na Fundação §6.1).
- Acesso: `admin_rh`, `director`, `gestor` (conteúdo filtrado por RLS pra vagas dele).
- Colaborador bloqueado pelo layout-guard.

### 7.2 `PageHeader` + período (decisão P47)

```
Relatórios de Recrutamento              [7d] [30d] [90d] [📅 Personalizado]
Métricas do funil, tempo por etapa, origens e tarefas pendentes.
────────────────────────────────────────────────────────────────
```

- Título com `text-xl font-semibold`.
- Descrição `text-muted-foreground`.
- Separador `border-b` abaixo.

**Chips** (slot `actions` do `PageHeader`):
- `7d`, `30d`, `90d` = presets fixos.
- `📅 Personalizado` = abre popover com calendário duplo (Março + Abril se hoje for 21/04, por exemplo).

**Popover "Personalizado"**:
- Largura ~512px.
- Step indicator: "✓ De" (verde quando preenchido) + "Agora selecione a data final" / "✓ Até".
- Calendário duplo com mês atual e mês anterior.
- **Fluxo**: primeiro clique em qualquer dia vira "De"; próximo clique vira "Até" (range pintado); se clicar em data anterior ao "De", reinicia seleção.
- Footer (canto direito):
  - **Tudo** (ghost, discreto) — desconsidera datas, envia `?period=all`.
  - **Aplicar** (primary, laranja) — submete query.

**Query string**:
- `?period=7d`, `?period=30d`, `?period=90d`, `?period=all`.
- `?from=YYYY-MM-DD&to=YYYY-MM-DD` — quando custom range.
- Default ao abrir: `?period=30d`.

### 7.3 Barra de filtros (decisão P48 — padrão `EmployeesList`)

Card branco abaixo do header:

```
┌──────────────────────────────────────────────────────────────┐
│ Buscar candidato  │  Vaga       │  Responsável             │
│ [🔍 Nome ou…   ]  │  [Todas ▾]  │  [Todos responsáveis ▾]  │
└──────────────────────────────────────────────────────────────┘
```

- Layout: `flex flex-wrap items-end gap-3`.
- Label `text-xs text-muted-foreground` acima de cada controle.
- **Buscar candidato**: `<Input>` com ícone de lupa à esquerda (padrão existente).
- **Vaga**: `<MultiSelectFilter>` reutilizado (de `src/components/MultiSelectFilter.tsx`). Label do botão: "Todas as vagas" (vazio) / "Analista Jr" (1) / "N vagas" (>1).
- **Responsável**: `<MultiSelectFilter>` com lista de `employees` que são `hiring_manager` de alguma vaga.

**Query string cumulativa**:
- `?period=30d&job_ids=uuid1,uuid2&owner_ids=uuid3&q=maria`.

**RLS + filtro de gestor**:
- Gestor não vê lista completa de vagas no MultiSelect — apenas as dele (filtrado no server).
- Mesmo filtro aplicado pro dropdown de "Responsável".

### 7.4 KPI row (4 cards)

```
┌─ Candidatos ativos ─┐ ┌─ Contratados (30d) ─┐ ┌─ Tempo até contratação ─┐ ┌─ Tarefas atrasadas ─┐
│  47 em 5 vagas      │ │  3  ↑ +1            │ │  18d  [mediana]         │ │  4  (destaque vermelho) │
└─────────────────────┘ └─────────────────────┘ └─────────────────────────┘ └─────────────────────┘
```

Queries (agregadas respeitando filtros):
- **Candidatos ativos**: `COUNT(*) FROM job_applications WHERE status='in_progress'` + filtros.
- **Contratados (N)**: `COUNT(*) FROM job_applications WHERE status='hired' AND updated_at BETWEEN period`.
- **Tempo até contratação (mediana)**: `PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(epoch FROM (updated_at - created_at))/86400) FROM job_applications WHERE status='hired' AND updated_at BETWEEN period` (ignora aplicações ainda in_progress — decisão P49).
- **Tarefas atrasadas**: `COUNT(*) FROM candidate_tasks WHERE due_date < now() AND completed_at IS NULL AND deleted_at IS NULL` + filtros.

Tag `[mediana]` no KPI de tempo é uma chip pequena cinza (`font-size: 9px`) indicando a medida estatística — evita confusão "é a média?".

### 7.5 Funil de conversão (decisão P45/P46)

Card com bar chart horizontal — uma linha por etapa não arquivada, ordenada por `position`.

```
Cadastrado        ████████████████████████  120   100%
Triagem           ████████████████          78    65%
Entrevista RH     ██████████                50    42%
Entrevista Gestor ██████                    34    28%
Teste/Case        ████                      20    17%
Proposta          █                          6     5%
Contratado        █                          3     3%
```

**Tooltip rico** (decisão P52) ao hover na barra:
```
Entrevista Gestor
──────────────────
Candidatos na etapa      34
Conversão da anterior    67%
Avançaram                20 (59%)
Reprovados/desistiram    14 (41%)
Tempo mediano            8d
clique pra ver candidatos (desabilitado no MVP)
```

**Query**: conta distinct applications passadas por cada etapa dentro do período do filtro, via `candidate_stage_history` + aplicação atual.

### 7.6 Origens — candidatos × contratados (decisão P51)

Card com **donuts gêmeos** lado a lado + legenda única abaixo.

```
┌─────────────────────────────────────────────┐
│  Candidatos              Contratados         │
│                                              │
│     ◯ 120                   ◯ 3              │
│     total                   total            │
│                                              │
│ ● LinkedIn  ● Indicação  ● Indeed  ● Gupy  ● Outros │
└─────────────────────────────────────────────┘
```

- Donut esquerda = distribuição de candidatos por origem (soma = 100% do total de candidatos no período).
- Donut direita = distribuição de contratados por origem.
- Legenda única compartilhada abaixo, com swatches de cor.
- **Tooltip rico** ao hover na fatia:
  ```
  LinkedIn
  ──────────
  Candidatos     54
  Contratados    0
  Taxa           0%
  ```

### 7.7 Tempo mediano por etapa (decisão P46)

Card com **lollipop vertical**. Eixo Y = dias; cada etapa tem linha fina + círculo no topo com valor.

```
      [dot 8d]
      [dot 6d]
 [dot 4d]
 [dot 3d]
[dot 2d]
─────────────────────────────
Triagem Ent.RH Ent.Gestor Teste Proposta
```

- Linha vertical cor laranja clara, círculo laranja forte com número branco.
- Gargalo (>5d) — círculo vermelho + linha rosada.
- Tooltip rico ao hover no dot:
  ```
  Entrevista Gestor
  ──────────────────
  Mediana     8d
  Média       11d
  Mínimo      2d
  Máximo      21d
  Candidatos ativos  34
  ⚠ gargalo: mais que 5d
  ```

### 7.8 Candidatos parados > 5d (decisão P50)

Card com tabela compacta:

| Candidato | Vaga · Etapa | Tempo |
|---|---|---|
| Paula L. | Analista Jr · Ent. RH | ⚠ 6d |
| Diogo F. | Dev Front · Teste | ⚠ 9d |
| Bruno R. | Analista Jr · Ent. Gestor | ⚠ 7d |

- Ordenada por tempo DESC (mais atrasado primeiro).
- Limite 10 linhas visíveis; link "Ver todos (N)" no rodapé se `count > 10`.
- Link abre `/recrutamento/candidatos?filter=stalled` (pós-Onda 3 — pro MVP, link desabilitado).

**Query**: `job_applications WHERE status='in_progress' AND stage_entered_at < now() - interval '5 days'` + filtros.

### 7.9 Tarefas atrasadas

Card com tabela compacta:

| Tarefa | Responsável | Vencida |
|---|---|---|
| Agendar entrevista | Carlos P. | -2d |
| Enviar teste | Admin RH | -1d |

- Ordenada por `due_date` ASC (mais vencida primeiro).
- Clique na linha abre perfil do candidato com aplicação expandida (tarefa destacada).
- Limite 10 linhas; link "Ver todas (N)" pra dashboard expandido (pós-MVP).

**Query**: `candidate_tasks WHERE due_date < now() AND completed_at IS NULL AND deleted_at IS NULL` + filtros + RLS.

### 7.10 Interatividade (decisão P52 — tooltip rico apenas)

- Todos os gráficos (funil, donuts, lollipop) usam `customTooltip` do Recharts com breakdowns contextuais.
- **Sem cross-filter** no MVP. Hint "clique pra ver candidatos" aparece no tooltip como upgrade futuro (texto em cinza, itálico, desabilitado visual).
- Mobile/touch: Recharts trata tap como hover (sticky tooltip até novo tap).

---

## 8. Server actions

Arquivo: `src/features/recruitment/actions/scorecards.ts` (novo).

```ts
export async function createScorecard(input: ScorecardInput): Promise<{ id: string } | ActionError>
// Rejeita se UNIQUE(application_id, stage_id, author_id) já existe — retorna erro
// com link pro scorecard existente ("edite o scorecard atual").

export async function updateScorecard(id: string, input: Partial<ScorecardInput>): Promise<ActionOk | ActionError>
// Autor dentro de 2h (RLS reforça).

export async function deleteScorecard(id: string): Promise<ActionOk | ActionError>
// Autor (janela 2h) OR admin_rh (sempre). Soft delete via deleted_at.
```

Arquivo: `src/features/recruitment/actions/tasks.ts` (novo).

```ts
export async function createTask(input: TaskInput): Promise<{ id: string } | ActionError>
// Dispara notificação recruitment.task_assigned se responsible_id != actor.employee_id.

export async function updateTask(id: string, input: Partial<TaskInput>): Promise<ActionOk | ActionError>
// Criador + admin + gestor da vaga podem mudar título/prazo/responsável.
// Reassign: se responsible_id muda, dispara task_assigned pro novo (se != actor).

export async function completeTask(id: string): Promise<ActionOk | ActionError>
// Responsável + criador + admin + gestor da vaga.
// UPDATE completed_at=now(), completed_by=actor.

export async function reopenTask(id: string): Promise<ActionOk | ActionError>
// Mesmo escopo. UPDATE completed_at=NULL, completed_by=NULL.

export async function deleteTask(id: string): Promise<ActionOk | ActionError>
// Criador + admin + gestor da vaga (responsável só-responsável NÃO pode deletar).
// Soft delete via deleted_at.
```

### Ações de revalidação

Todas as actions chamam `revalidatePath`:
- `/recrutamento/candidatos/[candidateId]` — sempre.
- `/recrutamento/vagas/[jobId]` — sempre (Kanban reflete badges).
- `/recrutamento/relatorios` — quando muda contador (create, complete, delete).

### Queries agregadas (novo arquivo)

Arquivo: `src/features/recruitment/metrics/queries.ts`.

```ts
export interface MetricsFilter {
  companyId: string;
  period: { from: Date; to: Date } | 'all';
  jobIds: string[] | null;
  ownerIds: string[] | null;
  candidateQuery: string | null;
  viewerEmployeeId: string | null; // gestor: filtrado por suas vagas
  viewerRole: 'admin_rh' | 'director' | 'gestor';
}

export async function getKpis(f: MetricsFilter): Promise<{
  activeCandidates: number;
  activeCandidatesJobCount: number;
  hiredInPeriod: number;
  hiredDelta: number; // comparado com período anterior
  medianTimeToHireDays: number | null;
  overdueTasksCount: number;
}>

export async function getFunnel(f: MetricsFilter): Promise<Array<{
  stageId: string;
  stageName: string;
  stagePosition: number;
  count: number;
  conversionRate: number; // vs primeira etapa
  conversionFromPrev: number; // vs etapa anterior
  advancedCount: number;
  rejectedOrWithdrawnCount: number;
  medianDaysInStage: number | null;
}>>

export async function getOriginsDualDonut(f: MetricsFilter): Promise<{
  candidates: Array<{ source: string; count: number; percent: number }>;
  hired: Array<{ source: string; count: number; percent: number }>;
}>

export async function getStageDurations(f: MetricsFilter): Promise<Array<{
  stageId: string;
  stageName: string;
  medianDays: number | null;
  meanDays: number | null;
  minDays: number | null;
  maxDays: number | null;
  activeCount: number;
  isBottleneck: boolean; // mediana > 5d
}>>

export async function getStalledCandidates(f: MetricsFilter, limit: number = 10): Promise<Array<{
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  stageName: string;
  daysStalled: number;
}>>

export async function getOverdueTasks(f: MetricsFilter, limit: number = 10): Promise<Array<{
  taskId: string;
  title: string;
  candidateName: string;
  jobTitle: string;
  responsibleName: string;
  daysOverdue: number;
}>>
```

Todas as queries respeitam RLS + filtro `viewerRole`/`viewerEmployeeId` no nível SQL (policies fazem o grosso; query adiciona `job_ids` explícito).

### Page server component

`src/app/(app)/recrutamento/relatorios/page.tsx`:

```
export default async function RelatoriosPage({ searchParams }: Props) {
  // Parse search params: period, from, to, job_ids, owner_ids, q
  // Build MetricsFilter com RLS info
  // Promise.all das 6 queries acima
  // Render <RelatoriosDashboard filter={...} data={...} />
}
```

---

## 9. Auditoria — eventos novos

Extensão de `ActivityAction` em `src/lib/activity.ts`:

```ts
| 'candidate_scorecard.submitted'
| 'candidate_scorecard.updated'
| 'candidate_scorecard.deleted'
| 'candidate_task.created'
| 'candidate_task.updated'
| 'candidate_task.completed'
| 'candidate_task.reopened'
| 'candidate_task.deleted'
```

Labels (pt-BR) em `ACTIVITY_LABELS`:
- `candidate_scorecard.submitted`: "Scorecard registrado"
- `candidate_scorecard.updated`: "Scorecard atualizado"
- `candidate_scorecard.deleted`: "Scorecard removido"
- `candidate_task.created`: "Tarefa criada"
- `candidate_task.updated`: "Tarefa atualizada"
- `candidate_task.completed`: "Tarefa concluída"
- `candidate_task.reopened`: "Tarefa reaberta"
- `candidate_task.deleted`: "Tarefa removida"

Switch cases em `humanizeActivityMetadata` extraem:
- Scorecard: `candidate_name, job_title, stage_name, author_name, recommendation`
- Task: `task_title, candidate_name, job_title, responsible_name, due_date`

Tela `/configuracoes/auditoria` ganha `entity_type` novos nos filtros: `candidate_scorecard`, `candidate_task`.

---

## 10. Notificações

### `recruitment.task_assigned` (declarada na Fundação §9)

**Gatilhos:**
1. `createTask` com `responsible_id != actor.employee_id`.
2. `updateTask` que muda `responsible_id` — notifica o **novo** responsável (o antigo não recebe nada especial; se quisesse, poderia haver evento `task_reassigned_away`, mas fica fora).

**Template** (pt-BR):
```
Título: Tarefa atribuída a você
Corpo: {actor_name} atribuiu uma tarefa pra você sobre {candidate_name} na vaga {job_title}:
       "{task_title}". Prazo: {due_date formatada ou "sem prazo"}.
CTA: Abrir tarefa →
     /recrutamento/candidatos/[candidateId]?app=[applicationId]#tasks
```

**Opt-out**: herda config global.

### `recruitment.feedback_requested` continua dormente (decisão P27 da Onda 2).

---

## 11. Comportamento retroativo (nenhum)

Esta Onda não exige ajustes retroativos aos specs 14 ou 15. Todas as mudanças são aditivas:
- 2 novas tabelas.
- 2 novos eventos de auditoria.
- 1 notificação ativada.
- 2 seções novas no perfil do candidato (Scorecards e Tarefas).
- 1 badge novo no card do Kanban (`📋`).
- 1 pill de estado das tarefas no card do Kanban.
- 1 rota nova implementada (`/recrutamento/relatorios` — já reservada na Fundação).
- Extensão do menu kebab do card com 2 itens novos.

---

## 12. Testes

### Unit

- `features/recruitment/scorecards/schema.test.ts`: `ScorecardInput` com ratings 1-5, recommendation enum, comment ≤2000, salary opcional.
- `features/recruitment/scorecards/permissions.test.ts`: admin cria em qualquer; gestor só nas suas; colaborador nunca.
- `features/recruitment/tasks/schema.test.ts`: `TaskInput` com title 3-140 chars, due_date opcional, responsible_id uuid.
- `features/recruitment/tasks/permissions.test.ts`: matriz de (criador / responsável / admin / gestor / outro) × (complete / reopen / edit / delete).
- `features/recruitment/actions/scorecards.test.ts`: UNIQUE violation → erro estruturado; update fora de janela → rejeita; admin delete qualquer.
- `features/recruitment/actions/tasks.test.ts`: notificação disparada quando `responsible_id != creator`; reassign notifica novo; responsável não-criador não deleta.
- `features/recruitment/metrics/queries.test.ts`: mock de dados + validação de shapes e cálculos (mediana, counts, filtros aplicados).

### Integração (manual, documentada em `rls-checks.md`)

- Gestor vê apenas scorecards/tarefas das vagas dele.
- Director vê todos mas não cria/edita/deleta.
- Colaborador bloqueado no layout-guard.
- MultiSelect de vaga no dashboard só mostra vagas do gestor quando este está logado.
- Filtros URL persistem ao recarregar; compartilhar URL carrega mesmo estado.

---

## 13. Critérios de aceite

### Scorecard (P32-P37, P53, P54)
1. Admin cria scorecard via Kanban → dados persistidos, UNIQUE enforcada no segundo create (erro com opção "editar existente").
2. Autor edita scorecard dentro de 2h; fora da janela, form de edição não abre.
3. Admin deleta scorecard de outro autor a qualquer momento; evento `candidate_scorecard.deleted` com `deleted_by_admin: true`.
4. Perfil do candidato mostra seção "Scorecards" agrupada por aplicação; ativa aberta por default.
5. Etapa com 1 scorecard renderiza card simples (estrelas na exibição); etapa com 2+ renderiza tabela comparativa com destaque de divergência.
6. Tabela comparativa exibe badge "⚠ divergência em X de 6" quando há pelo menos 1 diff não-zero; linhas com `|diff| ≥ 2` em ratings, ou salário/recomendação divergentes, ficam destacadas.
7. Card do Kanban mostra badge `📋 N` apenas se count ≥ 1 scorecards ativos; click navega ao perfil na seção Scorecards.
8. Comentários de cada autor aparecem abaixo da tabela comparativa.

### Tarefas (P38-P44)
9. Admin cria tarefa com título, prazo opcional e responsável (default = criador) via Dialog modal.
10. Notificação `recruitment.task_assigned` dispara quando `responsible_id != creator`; não dispara quando criador = responsável.
11. Reassign (editar responsável) notifica o novo responsável.
12. Marcar como concluída atualiza `completed_at` e `completed_by`; evento `candidate_task.completed` loga.
13. Reabrir tarefa concluída zera `completed_at` e `completed_by`; evento `candidate_task.reopened`.
14. Responsável não-criador consegue concluir/reabrir mas NÃO deletar.
15. Botão "Concluir" aparece ao hover em desktop; sempre visível em mobile/touch (`@media (hover: none)`).
16. Perfil do candidato mostra seção "Tarefas" com ordem: pendentes por prazo ASC (nulls last), depois concluídas por completed_at DESC.
17. Card do Kanban mostra pill de estado: "⚠ N atrasada(s)" vermelho (prioritário) / "N pendentes" neutro / "✓ N/M" verde; sem pill quando zero tarefas.

### Dashboard (P45-P52)
18. Admin abre `/recrutamento/relatorios` → PageHeader com chips de período à direita; filtros padrão EmployeesList abaixo; KPIs + funil + grid de gráficos + tabelas.
19. Gestor abre dashboard → conteúdo filtrado automaticamente pelas vagas dele; MultiSelect de Vaga lista só vagas suas.
20. Director abre dashboard → vê tudo em leitura; sem CTAs de edição.
21. Chip "30d" selecionado por default; query string `?period=30d` na URL.
22. Clique em "📅 Personalizado" abre popover com calendário duplo; primeiro clique em dia define "De", segundo define "Até", range destacado entre eles.
23. Footer do popover tem "Tudo" (ghost) + "Aplicar" (primary) no canto direito; "Aplicar" desabilitado se `De > Até`.
24. KPI "Tempo até contratação" mostra mediana com chip `[mediana]`; cálculo ignora aplicações ainda `in_progress`.
25. KPI "Tarefas atrasadas" destaca vermelho quando > 0.
26. Funil de conversão mostra todas as etapas ativas; hover na barra mostra tooltip rico com conversão, breakdown de avançados/reprovados, mediana.
27. Donuts gêmeos mostram Candidatos (esquerda) × Contratados (direita) com legenda única; tooltip rico mostra count absoluto + taxa por origem.
28. Lollipop vertical mostra tempo mediano por etapa; gargalos (>5d) em vermelho; tooltip mostra mediana/média/min/max + candidatos ativos.
29. Tabelas "Candidatos parados > 5d" e "Tarefas atrasadas" mostram até 10 linhas, ordenadas por severidade.
30. Filtros (período, vaga, responsável, busca) atualizam todos os gráficos e tabelas via query string; URL compartilhável preserva estado.

### Auditoria
31. `/configuracoes/auditoria` mostra eventos de scorecard e task com rótulos pt-BR corretos; filtros por `entity_type` incluem `candidate_scorecard` e `candidate_task`.

### Regressão
32. Testes da Fundação, Onda 1 e Onda 2 continuam verdes.
33. Comportamento do Kanban (drag-and-drop, saídas laterais, coluna Contratado, wizard) segue idêntico ao da Onda 2.
34. Feedbacks (Onda 2) continuam funcionando; seção no perfil permanece entre "Aplicações" e "Scorecards".

---

## 14. Riscos e decisões em aberto

### Riscos

- **Queries do dashboard em empresas com muito volume** — `PERCENTILE_CONT` + agregações podem ficar lentas com 10k+ aplicações. Mitigação MVP: aceitar latência até 2s; depois introduzir cache ou materialized view por empresa se ficar uma dor.
- **Tabela comparativa de scorecards com 5+ avaliadores** — cenário raro, mas pode causar scroll horizontal. UX aceitável pro MVP; re-avaliar se aparecer.
- **Notificação `task_assigned` pra responsável inativo** — persistida mas nunca lida. Aceito (igual padrão `feedback_requested`).
- **Mobile do dashboard** — grid `grid-2` empilha verticalmente em viewport pequeno; scroll longo pode cansar. Priorizar KPIs + funil + parados+tarefas no topo; donuts/lollipop embaixo. Layout já previsto.

### Decisões em aberto (pós-MVP)

- **Cross-filter** nos gráficos do dashboard (P52 D) — promover se admin reportar "quero clicar na etapa e ver só ela".
- **Tela global `/recrutamento/tarefas`** (P39 A) — promover se dashboard não for suficiente.
- **Exportação** CSV/XLSX dos relatórios — nenhuma decisão; entra conforme demanda.
- **Scorecard customizável** (P32 C) — cliente-grande pode pedir; design futuro migra enum de colunas pra JSON com schema por empresa.
- **Edição de scorecard fora de janela** (admin RH override) — aguardar feedback real.

---

## 15. Dependências

| Feature | Uso |
|---|---|
| Fundação | Tabelas, RLS helpers, permissions, `recruitment_stages` |
| Onda 1 | Kanban (card + badges), CandidateCard, menu kebab, perfil do candidato (seções Aplicações/Histórico), barra de arquivados, MultiSelectFilter |
| Onda 2 | Seção Feedbacks no perfil (padrão para Scorecards e Tarefas), CandidateCard badges, menu kebab |
| FT-1 | `employees` (responsible_id, author_id), departamentos/cargos (não usados diretamente mas parte do ecossistema) |
| FT-5 (Dashboard) | Padrão PageHeader, chart library (Recharts) |
| `src/components/MultiSelectFilter` | reutilizado 100% nos filtros do dashboard |
| `src/lib/activity.ts` | Novos actions + labels + humanize |
| `src/features/notifications/` | Novo disparo `recruitment.task_assigned` |

Nenhuma mudança destrutiva em nenhuma feature existente.

---

## 16. Resumo das decisões desta Onda (P32-P54)

| # | Decisão | Escolha |
|---|---|---|
| P32 | Dimensões do scorecard | 4 fixas (Comunicação, Experiência, Aderência, Fit cultural) + salário binário + comentário + recomendação |
| P33 | Multiplicidade do scorecard | 1 por avaliador por etapa (`UNIQUE(application_id, stage_id, author_id)`) |
| P34 | Componente do form | Sheet 440px |
| P35 | Janela edição/deleção | 2h autor + admin_rh sempre (igual P22/P31) |
| P36 | Seção no perfil | Nova seção "Scorecards" paralela a "Feedbacks" |
| P37 | Formato dos ratings | Pills 1-5 no form + stars no card/tabela |
| P38 | Vinculação da tarefa | `application_id` FK NOT NULL |
| P39 | Onde aparecem tarefas | Card do Kanban + perfil + dashboard (sem tela global) |
| P40 | Tipo da tarefa | Título livre apenas |
| P41 | Prazo | Opcional |
| P42 | Responsável | Default = criador; NOT NULL |
| P43 | Form de tarefa | Dialog modal centralizado (padrão Departamentos/Cargos/Competências) |
| P44 | Marcar concluída | Botão "Concluir" ao hover + kebab (fallback mobile: sempre visível) |
| P45 | Layout do dashboard | Hierarquia tradicional (KPIs → funil → grid) |
| P46 | Gráficos | Funil horizontal · Donut · Lollipop vertical |
| P47 | Filtro período | Chips `7d / 30d / 90d / 📅 Personalizado` no PageHeader; popover com calendário duplo; "Tudo" e "Aplicar" no canto direito do popover |
| P48 | Filtros adicionais | Barra padrão EmployeesList abaixo: Buscar + MultiSelect Vaga + MultiSelect Responsável |
| P49 | Tempo médio | Mediana (label explícito) |
| P50 | Threshold "parados" | 5d global fixo |
| P51 | Origens | Donuts gêmeos (Candidatos · Contratados) com legenda única |
| P52 | Interatividade | Tooltip rico em todos os gráficos (sem cross-filter no MVP) |
| P53 | Badge scorecard no Kanban | `📋 N` condicional (análogo ao `💬 N`) |
| P54 | Comparação de scorecards | Tabela lado-a-lado automática quando 2+ scorecards na mesma etapa; destaque de divergência |
