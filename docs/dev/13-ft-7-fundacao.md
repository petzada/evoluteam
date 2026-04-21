# FT-7 — Recrutamento — Fundação do módulo

Spec de **fundação** do novo módulo de Recrutamento.
Equivale à camada estrutural (schema, RLS, navegação, auditoria) que sustenta as três ondas subsequentes.
Depende de Fase 0 + FT-1 (Colaboradores).
Última atualização: 2026-04-20.

> **Leia antes:** `docs/dev/00-decisoes-transversais.md` + `docs/dev/01-fase-0-fundacao.md` + `docs/dev/02-ft-1-colaboradores.md`.
> **Fonte de produto:** `docs/features/new-module/FT-7.md` + `docs/features/new-module/PRD-FT-7.md` + `docs/features/new-module/FT-7.1.md` a `FT-7.7.md`.
> **Specs subsequentes (cada um com próprio brainstorm):**
> - `14-ft-7-onda1-vagas-candidatos.md`
> - `15-ft-7-onda2-feedback-contratacao.md`
> - `16-ft-7-onda3-metricas-scorecard-tarefas.md`

---

## 1. Objetivo

Introduzir no Evoluteam a capacidade de acompanhar processos seletivos por vaga, da abertura à contratação, conectando a jornada pre-contratação com o ciclo existente de gestão de pessoas. O módulo vira a porta de entrada de colaboradores: candidato contratado no módulo de Recrutamento cria automaticamente um `employee` e preserva o histórico do processo seletivo para consulta futura.

Esta Fundação entrega **somente a camada estrutural** — migrations, RLS, sidebar, breadcrumbs, seeds e plumbing de permissions. Nenhuma tela funcional sai desta entrega; telas vêm nas Ondas 1-3.

## 2. Escopo

### Dentro da Fundação

- 5 tabelas novas: `recruitment_stages`, `job_openings`, `candidates`, `job_applications`, `candidate_stage_history`.
- Enums Postgres: `recruitment_stage_kind`, `job_opening_employment_type`, `job_opening_workplace_type`, `job_opening_status`, `application_status`, `candidate_source`, `rejection_reason`, `withdrawal_reason`.
- RLS completo nas 5 tabelas, cobrindo as 4 roles (`admin_rh`, `director`, `gestor`, `colaborador`).
- Nova coluna `job_openings.position_id` (FK opcional para `positions`) para vincular vaga a cargo cadastrado.
- Nova sub-rota de Configurações: `/configuracoes/etapas-recrutamento` (apenas o registro da rota e o layout-guard; UI de CRUD das etapas é implementada na Onda 1).
- Trigger em `companies` (INSERT) que cria as 7 etapas padrão do funil automaticamente.
- Backfill das 7 etapas padrão para todas as companies existentes.
- Sidebar nova: categoria **RECRUTAMENTO** sempre expandida entre PRINCIPAL e Configurações, com itens Vagas e Candidatos.
- Layout-guard `src/app/(app)/recrutamento/layout.tsx` valida acesso ao módulo (colaborador não acessa).
- `src/features/recruitment/` com: `schema.ts` (tipos Zod compartilhados), `permissions.ts` (funções `can*`), `queries/` e `actions/` vazios (preenchidos nas ondas).
- Extensão de `src/lib/activity.ts` com novos valores de `ActivityAction` e `ACTIVITY_LABELS`.
- Atualização de `features/notifications/` com os 3 tipos de notificação planejados (implementação do disparo fica nas ondas).
- Breadcrumbs registrados nas páginas do módulo via `BreadcrumbContext` existente.

### Fora da Fundação

- Qualquer CRUD funcional de vaga, candidato ou aplicação (→ Onda 1).
- Kanban, DnD, aba Arquivados (→ Onda 1).
- Feedback de candidato, wizard de contratação (→ Onda 2).
- Scorecard, tarefas, métricas, `/recrutamento/relatorios` (→ Onda 3).
- Página pública de vaga, upload de currículo, e-mails automáticos, IA (→ MVP 1.5, pós FT-7).

---

## 3. User stories

A Fundação não tem user stories orientadas a usuário final porque não entrega telas. As stories abaixo representam os invariantes que usuários ganham ao fim da Fundação, mesmo sem UI ativa:

- Users with permission should be able to acessar rotas do módulo Recrutamento (redirecionam para lista vazia ou placeholder até Onda 1).
- Admin_rh should be able to navegar para `/configuracoes/etapas-recrutamento` e ver as 7 etapas padrão criadas automaticamente para sua empresa.
- Colaboradores should not be able to acessar rotas do módulo Recrutamento.
- Directors should be able to navegar pelo módulo em modo leitura.
- Gestores should be able to acessar rotas do módulo; conteúdo visível é filtrado por `hiring_manager_id` nas ondas subsequentes.
- Admin_rh should be able to ver eventos do Recrutamento na tela `/configuracoes/auditoria` assim que as ondas começarem a gerar eventos.

---

## 4. Schema

### 4.1 Enums

```sql
CREATE TYPE recruitment_stage_kind AS ENUM ('entry', 'intermediate', 'hired_terminal');

CREATE TYPE job_opening_employment_type AS ENUM
  ('clt', 'pj', 'estagio', 'temporario', 'freelancer');

CREATE TYPE job_opening_workplace_type AS ENUM
  ('presencial', 'remoto', 'hibrido');

CREATE TYPE job_opening_status AS ENUM
  ('open', 'paused', 'closed', 'cancelled');

CREATE TYPE application_status AS ENUM
  ('in_progress', 'hired', 'rejected', 'withdrawn', 'frozen');

CREATE TYPE candidate_source AS ENUM
  ('indicacao', 'linkedin', 'site_empresa', 'whatsapp',
   'instagram', 'indeed', 'gupy', 'manual', 'outro');

CREATE TYPE rejection_reason AS ENUM
  ('perfil_tecnico_insuficiente', 'experiencia_incompativel',
   'pretensao_salarial_incompativel', 'fit_cultural_insuficiente',
   'nao_compareceu', 'comunicacao_insuficiente',
   'indisponibilidade_de_horario', 'outro');

CREATE TYPE withdrawal_reason AS ENUM
  ('nao_respondeu_contato', 'aceitou_outra_proposta',
   'salario_incompativel', 'beneficios_incompativeis',
   'modelo_trabalho_incompativel', 'localizacao_incompativel',
   'perdeu_interesse', 'processo_muito_longo', 'outro');
```

### 4.2 `recruitment_stages`

Etapas globais por empresa. Editáveis em Configurações a partir da Onda 1.

```sql
CREATE TABLE recruitment_stages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name         text NOT NULL,
  position     int  NOT NULL,
  kind         recruitment_stage_kind NOT NULL DEFAULT 'intermediate',
  archived_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX recruitment_stages_company_entry_active
  ON recruitment_stages (company_id)
  WHERE kind = 'entry' AND archived_at IS NULL;

CREATE UNIQUE INDEX recruitment_stages_company_hired_active
  ON recruitment_stages (company_id)
  WHERE kind = 'hired_terminal' AND archived_at IS NULL;

CREATE INDEX recruitment_stages_company_position
  ON recruitment_stages (company_id, position);
```

**Seeds (7 etapas padrão)** inseridas automaticamente na criação de cada company (ver seção 7):

| position | name | kind |
|---|---|---|
| 1 | Cadastrado | entry |
| 2 | Triagem | intermediate |
| 3 | Entrevista RH | intermediate |
| 4 | Entrevista Gestor | intermediate |
| 5 | Teste / Case | intermediate |
| 6 | Proposta | intermediate |
| 7 | Contratado | hired_terminal |

### 4.3 `job_openings`

```sql
CREATE TABLE job_openings (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id         uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title              text NOT NULL,
  description        text,
  department_id      uuid REFERENCES departments(id) ON DELETE SET NULL,
  position_id        uuid REFERENCES positions(id)   ON DELETE SET NULL,
  hiring_manager_id  uuid REFERENCES employees(id)   ON DELETE SET NULL,
  employment_type    job_opening_employment_type NOT NULL,
  workplace_type     job_opening_workplace_type  NOT NULL,
  location           text,
  open_positions     int NOT NULL DEFAULT 1 CHECK (open_positions > 0),
  status             job_opening_status NOT NULL DEFAULT 'open',
  closed_at          timestamptz,
  created_by         uuid REFERENCES auth.users(id),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX job_openings_company_status     ON job_openings (company_id, status);
CREATE INDEX job_openings_company_manager    ON job_openings (company_id, hiring_manager_id);
CREATE INDEX job_openings_company_department ON job_openings (company_id, department_id);
```

`status` muda apenas por ação explícita do admin. Não há fechamento automático ao preencher `open_positions`.

### 4.4 `candidates`

Banco global por empresa. Sem `user_id` — candidato nunca tem acesso à plataforma; só o colaborador criado na contratação recebe convite (manual, em Colaboradores).

```sql
CREATE TABLE candidates (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name                text NOT NULL,
  email               text NOT NULL,
  phone               text,
  linkedin_url        text,
  resume_url          text,
  source              candidate_source NOT NULL DEFAULT 'manual',
  source_other        text,
  notes               text,
  hired_employee_id   uuid REFERENCES employees(id) ON DELETE SET NULL,
  archived_at         timestamptz,
  created_by          uuid REFERENCES auth.users(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT candidates_email_unique_per_company UNIQUE (company_id, email),
  CONSTRAINT candidates_source_other_consistency
    CHECK ((source = 'outro' AND source_other IS NOT NULL)
        OR (source <> 'outro' AND source_other IS NULL))
);

CREATE INDEX candidates_company_archived ON candidates (company_id, archived_at);
CREATE INDEX candidates_hired_employee   ON candidates (hired_employee_id) WHERE hired_employee_id IS NOT NULL;
```

### 4.5 `job_applications`

Vínculo candidato ↔ vaga. Um candidato pode ter múltiplas aplicações em vagas diferentes, mas no máximo uma simultânea por vaga.

```sql
CREATE TABLE job_applications (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  job_opening_id      uuid NOT NULL REFERENCES job_openings(id) ON DELETE CASCADE,
  candidate_id        uuid NOT NULL REFERENCES candidates(id)   ON DELETE CASCADE,
  current_stage_id    uuid NOT NULL REFERENCES recruitment_stages(id),
  status              application_status NOT NULL DEFAULT 'in_progress',
  rejection_reason    rejection_reason,
  withdrawal_reason   withdrawal_reason,
  reason_other        text,
  frozen_reason_notes text,
  stage_entered_at    timestamptz NOT NULL DEFAULT now(),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT job_applications_unique_active UNIQUE (job_opening_id, candidate_id),

  CONSTRAINT job_applications_reason_status_consistency CHECK (
    (status = 'rejected'  AND rejection_reason  IS NOT NULL AND withdrawal_reason IS NULL) OR
    (status = 'withdrawn' AND withdrawal_reason IS NOT NULL AND rejection_reason  IS NULL) OR
    (status NOT IN ('rejected', 'withdrawn') AND rejection_reason IS NULL AND withdrawal_reason IS NULL)
  )
);

CREATE INDEX job_applications_job_status       ON job_applications (job_opening_id, status);
CREATE INDEX job_applications_candidate        ON job_applications (candidate_id);
CREATE INDEX job_applications_stage_status     ON job_applications (current_stage_id, status);
CREATE INDEX job_applications_stage_entered_at ON job_applications (stage_entered_at);
```

**Invariante adicional (enforced na server action, não em CHECK por referenciar outra tabela):**
`status = 'hired'` implica que `current_stage_id` aponta para a etapa com `kind = 'hired_terminal'` da mesma company.

### 4.6 `candidate_stage_history`

Histórico append-only de transições operacionais. Alimenta a UI do perfil do candidato, o tooltip de "dias parado" no Kanban e as métricas da Onda 3.

```sql
CREATE TABLE candidate_stage_history (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id   uuid NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  from_stage_id    uuid REFERENCES recruitment_stages(id),
  to_stage_id      uuid REFERENCES recruitment_stages(id),
  status_change    jsonb,
  reason_code      text,
  reason_notes     text,
  changed_at       timestamptz NOT NULL DEFAULT now(),
  changed_by       uuid REFERENCES auth.users(id)
);

CREATE INDEX candidate_stage_history_app_time
  ON candidate_stage_history (application_id, changed_at DESC);

CREATE INDEX candidate_stage_history_to_stage_time
  ON candidate_stage_history (to_stage_id, changed_at);
```

`status_change` é `null` quando o evento é apenas movimentação de etapa; caso contrário carrega `{from: <status>, to: <status>}`.
`from_stage_id` é `null` apenas no primeiro evento da aplicação (criação/vínculo inicial).

### 4.7 Coluna adicionada a tabela existente

```sql
ALTER TABLE job_openings ADD COLUMN position_id uuid REFERENCES positions(id) ON DELETE SET NULL;
```

(Já incluída na definição da seção 4.3; listada aqui separadamente pela migration ordenar o ALTER depois do CREATE de `positions` caso haja diferença de ordem na migration chain.)

---

## 5. Permissions

### 5.1 Camada de aplicação (`src/features/recruitment/permissions.ts`)

```ts
canAccessRecruitmentModule(actor)             = role IN (admin_rh, director, gestor)
canManageJobOpenings(actor)                   = role = admin_rh
canViewAllJobOpenings(actor)                  = role IN (admin_rh, director)
canViewAssignedJobOpening(actor, openingId)   = role = gestor AND hiring_manager_id = actor.employeeId

canManageCandidates(actor)                    = role = admin_rh
canViewAllCandidates(actor)                   = role IN (admin_rh, director)
canViewCandidate(actor, candidateId)          = admin_rh | director | (gestor com aplicacao em vaga dele)

canMoveApplication(actor, applicationId)      = admin_rh | gestor (da vaga)
canHireCandidate(actor)                       = admin_rh
canGiveFeedback(actor, applicationId)         = admin_rh | gestor (da vaga)      (Onda 2)
canSubmitScorecard(actor, applicationId)      = admin_rh | gestor (da vaga)      (Onda 3)
canManageTasks(actor, applicationId)          = admin_rh | gestor (da vaga)      (Onda 3)
canManageStages(actor)                        = admin_rh
canViewMetrics(actor)                         = admin_rh | director (globais) | gestor (filtradas)
```

Director nunca ganha write em nada. Colaborador nunca ganha read em nada do módulo.

### 5.2 RLS — Postgres

Padrão: toda policy começa filtrando `company_id = get_user_company_id()` (função existente usada pelas outras features). Depois aplica a regra específica.

**`recruitment_stages`**
- `SELECT`: qualquer membro da company (inclusive colaborador — nomes de etapa aparecem em múltiplas UIs).
- `INSERT` / `UPDATE` / `DELETE`: apenas `admin_rh`.

**`job_openings`**
- `SELECT`:
  - `admin_rh`, `director`: todas da company.
  - `gestor`: apenas `hiring_manager_id = actor.employee_id`.
  - `colaborador`: nunca.
- `INSERT` / `UPDATE` / `DELETE`: apenas `admin_rh`.

**`candidates`**
- `SELECT`:
  - `admin_rh`, `director`: todos da company.
  - `gestor`: apenas candidatos com `EXISTS (SELECT 1 FROM job_applications ja JOIN job_openings jo ON ja.job_opening_id=jo.id WHERE ja.candidate_id=candidates.id AND jo.hiring_manager_id=actor.employee_id)`.
  - `colaborador`: nunca.
- `INSERT` / `UPDATE` / `DELETE`: apenas `admin_rh`.

**`job_applications`**
- `SELECT`:
  - `admin_rh`, `director`: todas da company.
  - `gestor`: apenas aplicações em vagas onde ele é `hiring_manager_id`.
  - `colaborador`: nunca.
- `INSERT`: `admin_rh`.
- `UPDATE`:
  - `admin_rh`: livre (respeitando CHECKs).
  - `gestor`: em vagas dele, exceto mudanças que envolvam `status = 'hired'` (prerrogativa de admin).
- `DELETE`: ninguém. Arquivamento é mudança de `status`, não DELETE.

**`candidate_stage_history`**
- `SELECT`: herda de `job_applications` (quem vê a aplicação vê o histórico dela).
- `INSERT`: feito via server actions do módulo (role do service client usando check de `canMoveApplication`). Tabela não aceita writes diretos do client.
- `UPDATE` / `DELETE`: ninguém — append-only.

### 5.3 Função SQL auxiliar

Para simplificar policies de `gestor` em `candidates` e `job_applications`, criar:

```sql
CREATE OR REPLACE FUNCTION is_gestor_of_opening(p_employee_id uuid, p_opening_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM job_openings jo
    WHERE jo.id = p_opening_id AND jo.hiring_manager_id = p_employee_id
  );
$$;
```

---

## 6. Rotas e layout físico

### 6.1 Árvore de rotas

| Rota | Acesso | Entrega |
|---|---|---|
| `/recrutamento/vagas` | admin_rh, director, gestor | Onda 1 |
| `/recrutamento/vagas/nova` | admin_rh | Onda 1 |
| `/recrutamento/vagas/[id]` | admin_rh, director, gestor (da vaga) | Onda 1 |
| `/recrutamento/vagas/[id]/editar` | admin_rh | Onda 1 |
| `/recrutamento/candidatos` | admin_rh, director | Onda 1 |
| `/recrutamento/candidatos/novo` | admin_rh | Onda 1 |
| `/recrutamento/candidatos/[id]` | admin_rh, director, gestor (com aplicação) | Onda 1 |
| `/recrutamento/candidatos/[id]/editar` | admin_rh | Onda 1 |
| `/recrutamento/relatorios` | admin_rh, director, gestor (filtrado) | Onda 3 |
| `/configuracoes/etapas-recrutamento` | admin_rh | Onda 1 (UI); Fundação só cria a rota/layout-guard. |

### 6.2 Layout físico

```
src/app/(app)/recrutamento/
  layout.tsx                          ← Fundação: valida canAccessRecruitmentModule, registra breadcrumb raiz "Recrutamento"
  vagas/                              ← Onda 1
    page.tsx
    nova/page.tsx
    [id]/
      page.tsx
      editar/page.tsx
  candidatos/                         ← Onda 1
    page.tsx
    novo/page.tsx
    [id]/
      page.tsx
      editar/page.tsx
  relatorios/                         ← Onda 3
    page.tsx
src/app/(app)/configuracoes/etapas-recrutamento/
  page.tsx                            ← Fundação: layout-guard; UI CRUD vem na Onda 1.
src/features/recruitment/
  schema.ts                           ← Fundação: tipos Zod compartilhados (JobOpeningStatus, ApplicationStatus, etc.)
  permissions.ts                      ← Fundação: todas as funções can* listadas em 5.1
  queries/                            ← Fundação: estrutura vazia; ondas preenchem
  actions/                            ← Fundação: estrutura vazia; ondas preenchem
  job-openings/                       ← Onda 1
  candidates/                         ← Onda 1
  applications/                       ← Onda 1
  stages/                             ← Onda 1
  feedbacks/                          ← Onda 2
  scorecards/                         ← Onda 3
  tasks/                              ← Onda 3
  metrics/                            ← Onda 3
```

### 6.3 Sidebar

Atualizar `src/features/shell/components/Sidebar.tsx`:

```ts
const RECRUITMENT_NAV: NavItem[] = [
  { label: 'Vagas',      href: '/recrutamento/vagas',      icon: Briefcase },
  { label: 'Candidatos', href: '/recrutamento/candidatos', icon: UserPlus  },
];
```

Renderização: grupo sempre expandido com label `RECRUTAMENTO`, entre o grupo PRINCIPAL e a seção Configurações. Apenas roles `admin_rh | director | gestor` veem o grupo — mesma regra de `canAccessRecruitmentModule`.

Adicionar também em `CONFIG_NAV` o novo item `{ label: 'Etapas de recrutamento', href: '/configuracoes/etapas-recrutamento', icon: KanbanSquare }` (antes de Auditoria).

### 6.4 Breadcrumbs

Cada página registra via `useBreadcrumb()` (API existente em `src/features/shell/BreadcrumbContext.tsx`):

| Rota | Breadcrumb |
|---|---|
| `/recrutamento/vagas` | Recrutamento › Vagas |
| `/recrutamento/vagas/[id]` | Recrutamento › Vagas › [title] |
| `/recrutamento/candidatos` | Recrutamento › Candidatos |
| `/recrutamento/candidatos/[id]` | Recrutamento › Candidatos › [name] |
| `/recrutamento/relatorios` | Recrutamento › Relatórios |
| `/configuracoes/etapas-recrutamento` | Configurações › Etapas de recrutamento |

---

## 7. Triggers e seeds

### 7.1 Seed automático na criação de company

```sql
CREATE OR REPLACE FUNCTION seed_recruitment_stages() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO recruitment_stages (company_id, name, position, kind) VALUES
    (NEW.id, 'Cadastrado',       1, 'entry'),
    (NEW.id, 'Triagem',          2, 'intermediate'),
    (NEW.id, 'Entrevista RH',    3, 'intermediate'),
    (NEW.id, 'Entrevista Gestor',4, 'intermediate'),
    (NEW.id, 'Teste / Case',     5, 'intermediate'),
    (NEW.id, 'Proposta',         6, 'intermediate'),
    (NEW.id, 'Contratado',       7, 'hired_terminal');
  RETURN NEW;
END;
$$;

CREATE TRIGGER companies_seed_recruitment_stages
AFTER INSERT ON companies
FOR EACH ROW EXECUTE FUNCTION seed_recruitment_stages();
```

### 7.2 Backfill para companies existentes

Migration roda uma vez ao aplicar a Fundação:

```sql
INSERT INTO recruitment_stages (company_id, name, position, kind)
SELECT c.id, v.name, v.position, v.kind::recruitment_stage_kind
FROM companies c,
LATERAL (VALUES
  ('Cadastrado',        1, 'entry'),
  ('Triagem',           2, 'intermediate'),
  ('Entrevista RH',     3, 'intermediate'),
  ('Entrevista Gestor', 4, 'intermediate'),
  ('Teste / Case',      5, 'intermediate'),
  ('Proposta',          6, 'intermediate'),
  ('Contratado',        7, 'hired_terminal')
) AS v(name, position, kind)
WHERE NOT EXISTS (
  SELECT 1 FROM recruitment_stages rs WHERE rs.company_id = c.id
);
```

---

## 8. Auditoria

Reuso total da infraestrutura existente (`activity_logs` + `src/lib/activity.ts`). A Fundação apenas **declara** os novos valores de `ActivityAction`; o disparo efetivo acontece nas ondas.

```ts
// src/lib/activity.ts — extensão
type ActivityAction =
  | ... // valores existentes
  | 'job_opening.created' | 'job_opening.updated'
  | 'job_opening.status_changed' | 'job_opening.archived'
  | 'candidate.created' | 'candidate.updated' | 'candidate.archived'
  | 'application.created' | 'application.stage_moved'
  | 'application.withdrawn' | 'application.rejected'
  | 'application.frozen' | 'application.hired'
  | 'recruitment_stage.created' | 'recruitment_stage.updated'
  | 'recruitment_stage.archived' | 'recruitment_stage.reordered'
  | 'candidate_feedback.created'  | 'candidate_feedback.deleted'   // Onda 2
  | 'candidate_scorecard.submitted' | 'candidate_scorecard.deleted' // Onda 3
  | 'candidate_task.created' | 'candidate_task.completed';          // Onda 3
```

Estender `ACTIVITY_LABELS` com os rótulos pt-BR correspondentes e `humanizeActivityMetadata()` com os switch-cases dos novos actions (exibir título da vaga, nome do candidato, etapa de/para, motivo, etc.).

A tela `/configuracoes/auditoria` passa a aceitar filtro por `entity_type` com os novos valores: `job_opening`, `candidate`, `application`, `recruitment_stage`, `candidate_feedback`, `candidate_scorecard`, `candidate_task`.

---

## 9. Notificações

Reuso total de `src/features/notifications/`. Três tipos declarados na Fundação; disparo acontece nas ondas:

| Tipo | Destinatário | Gatilho | Onda |
|---|---|---|---|
| `recruitment.candidate_in_manager_stage` | hiring_manager da vaga | aplicação entra em "Entrevista Gestor" | 1 |
| `recruitment.feedback_requested` | gestor indicado | admin_rh solicita feedback explícito | 2 |
| `recruitment.task_assigned` | responsable_id | `candidate_tasks` criada ou reatribuída | 3 |

Templates (pt-BR curtos) seguem o padrão do `features/notifications/` — mesma forma que feedbacks e PDI usam. Opt-out obedece config global do usuário.

---

## 10. Integrações com tabelas existentes

| Tabela existente | Uso no Recrutamento | Mudança estrutural |
|---|---|---|
| `companies` | FK em todas as tabelas novas; trigger de seed | Nenhuma |
| `employees` | FK em `candidates.hired_employee_id`, `job_openings.hiring_manager_id`, `candidate_feedbacks.author_id` (Onda 2) | Nenhuma |
| `departments` | FK em `job_openings.department_id` | Nenhuma |
| `positions` | FK em `job_openings.position_id` | **Nenhuma** (FK adicionada no lado de `job_openings`) |
| `auth.users` | FK em `created_by`, `changed_by`, etc. | Nenhuma |
| `activity_logs` | Novos valores de `ActivityAction` | Nenhuma estrutural |
| `notifications` | Novos tipos de notificação | Nenhuma estrutural |

**Nenhum refactor em features já commitadas (FT-1 a FT-5).** O módulo é puramente aditivo.

---

## 11. Testes

Seguindo o padrão dos specs anteriores:

- **Permissions**: `features/recruitment/permissions.test.ts` cobrindo cada função `can*` para cada role em cenários positivos e negativos.
- **RLS**: testes de SQL manuais documentados em `docs/dev/rls-checks.md` (ou integração futura quando houver runner automatizado); cada policy verificada com role simulada.
- **Schema**: testes unitários dos schemas Zod em `features/recruitment/schema.test.ts`.
- **Trigger de seed**: migration test que cria uma company e verifica existência das 7 etapas.
- **Constraints**: teste manual documentado no spec — tentar inserir segunda `kind='entry'` ativa, segunda `kind='hired_terminal'` ativa, violar `source_other` consistency, violar `reason_status_consistency`.

Testes funcionais de telas ficam por conta das ondas correspondentes.

---

## 12. Critérios de aceite da Fundação

1. Aplicar a migration cria as 5 tabelas, os 8 enums, os indexes listados, a função `is_gestor_of_opening()`, o trigger `companies_seed_recruitment_stages` e as policies RLS.
2. Criar uma company nova: inserir linha em `companies` deve resultar em 7 linhas em `recruitment_stages` para ela, com `kind` correto.
3. Backfill: após a migration, **toda** company existente tem as 7 etapas seedadas exatamente uma vez.
4. Tentar inserir segunda etapa `kind='entry'` ativa para a mesma company falha com erro de UNIQUE.
5. Tentar inserir aplicação com `status='rejected'` sem `rejection_reason` falha com CHECK constraint.
6. Usuário logado como `colaborador` navega para `/recrutamento/vagas` e é redirecionado (comportamento do layout-guard).
7. Usuário logado como `admin_rh | director | gestor` navega para `/recrutamento/vagas` e recebe placeholder de Onda 1 (sem erro).
8. Sidebar renderiza categoria RECRUTAMENTO para as 3 roles que acessam o módulo; não renderiza para colaborador.
9. `/configuracoes/etapas-recrutamento` é acessível apenas por `admin_rh` (redirect/403 pra demais).
10. Tela `/configuracoes/auditoria` oferece os novos valores de `entity_type` como filtro (mesmo sem eventos ainda).
11. Breadcrumbs registrados corretamente nas páginas-placeholder (inclusive em rotas da Onda 3 que ainda retornam placeholder).
12. Testes de permissions passam; testes de schema Zod passam.
13. Nenhum teste existente quebra (FT-1 a FT-5 e Fase 0 continuam verdes).

---

## 13. Riscos e decisões em aberto

### 13.1 Riscos

- **Migration longa em companies com muitos users**: backfill é simples (INSERT SELECT). Aceito.
- **Custo de JOIN em RLS do `candidates` para gestor**: subquery EXISTS em `job_applications` pode ficar lenta em escala grande. Mitigação: índices `(candidate_id)` em `job_applications` já cobrem. Medir em produção.
- **Coluna `position_id` em `job_openings`** adicionada sem estar explícita no FT-7.1. Justificativa na seção 4.7 / decisão 4 do brainstorm. Aceito.

### 13.2 Decisões em aberto (para as ondas)

- **Scorecard (Onda 3)**: nomenclatura final dos ratings, peso relativo, se cada etapa tem scorecard diferente ou se é único por aplicação.
- **Tarefas (Onda 3)**: se há tipo/categoria (ex: `entrevista`, `teste`, `proposta`) ou campo livre. Se tarefa conclui automaticamente ao executar uma ação do processo.
- **Métricas (Onda 3)**: recorte exato dos gráficos; se tempo médio é calculado por mediana ou média; se "candidatos parados" tem threshold global ou por empresa.
- **Coluna "Contratado" na Onda 1**: mantida visível mas inativa (drag pra ela mostra erro) ou escondida até Onda 2. Recomendação atual do brainstorm: **escondida na Onda 1**.

---

## 14. Dependências para as ondas

| Onda | Depende de | Spec |
|---|---|---|
| Onda 1 — Vagas + Candidatos + Kanban | Fundação | `14-ft-7-onda1-vagas-candidatos.md` |
| Onda 2 — Feedback + Contratação | Fundação + Onda 1 | `15-ft-7-onda2-feedback-contratacao.md` |
| Onda 3 — Scorecard + Tarefas + Métricas | Fundação + Onda 1 + Onda 2 | `16-ft-7-onda3-metricas-scorecard-tarefas.md` |

Cada onda terá brainstorm próprio seguindo o protocolo validado (uma pergunta por vez, mockups no Visual Companion, spec em `docs/dev/`, gate de revisão).

---

## 15. Histórico de decisões

As 17 decisões consolidadas deste brainstorm (resumo):

1. Escopo em 3 ondas (MVP enxuto com cobertura total da FT-7).
2. 1 spec de Fundação + 1 por onda.
3. Sidebar: "Vagas" + "Candidatos" sob label RECRUTAMENTO; Kanban vive dentro da página da vaga.
4. Candidato ≠ colaborador: tabelas separadas + FK `candidates.hired_employee_id`. Candidato nunca tem login.
5. Etapas globais por empresa, editáveis em Configurações; 7 etapas seed.
6. Feedback em tabela nova `candidate_feedbacks` (não reusar `feedbacks` da FT-3).
7. Permissions matriz B: gestor opera nas suas vagas; só admin_rh contrata.
8. Dashboard de Recrutamento isolado em `/recrutamento/relatorios`; Dashboard geral intocado.
9. Prefixo de rota `/recrutamento/` (seguindo padrão de `/configuracoes/`).
10. Status de vaga: `open`, `paused`, `closed`, `cancelled` (sem `draft`).
11. Status de aplicação separado de etapa; "Contratado" é etapa + `hired` é status.
12. Origens/motivos fixos em enum; valor `outro` + texto livre resolve edge cases.
13. Auditoria em `activity_logs`; histórico operacional em `candidate_stage_history` separado.
14. Notificações mínimas — apenas quando há ação pendente pra alguém específico.
15. Kanban: DnD primário (`@dnd-kit`) + menu kebab ⋮ secundário.
16. Arquivados em aba separada com tabela motivo/data (fora do Kanban principal).
17. Wizard de contratação: modal com formulário único; convite para plataforma é manual em Colaboradores.
