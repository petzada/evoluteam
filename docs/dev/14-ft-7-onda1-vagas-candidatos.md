# FT-7 — Recrutamento — Onda 1 — Vagas, Candidatos e Kanban

Spec da **primeira onda** do módulo de Recrutamento.
Entrega o fluxo operacional completo: criar vaga, cadastrar candidato, vincular candidato a vaga, mover candidato no Kanban, registrar saídas laterais (desistente / reprovado / congelado), editar etapas em Configurações.
Depende da Fundação (`13-ft-7-fundacao.md`).
Última atualização: 2026-04-20.

> **Leia antes:** `docs/dev/13-ft-7-fundacao.md` — esta Onda pressupõe que as 5 tabelas base (`recruitment_stages`, `job_openings`, `candidates`, `job_applications`, `candidate_stage_history`), os 8 enums, as RLS policies e a sidebar estão commitados.
> **Specs seguintes:** `15-ft-7-onda2-feedback-contratacao.md`, `16-ft-7-onda3-metricas-scorecard-tarefas.md`.

---

## 1. Objetivo

Colocar o módulo de Recrutamento em uso real. Até o fim desta Onda, o RH consegue abrir uma vaga, cadastrar candidatos, acompanhar o processo em Kanban visual, mover candidatos entre etapas por drag-and-drop, e arquivar quem desistiu ou foi reprovado — com motivo registrado e histórico rastreável. A contratação propriamente dita (com wizard que cria o colaborador) fica para a Onda 2; até lá, o fluxo completo de triagem e progressão já está funcional.

Depende apenas da Fundação já commitada. Nenhuma onda posterior altera regras da Onda 1.

## 2. Escopo

### Dentro da Onda 1

- **Migration aditiva**: coluna `notifies_hiring_manager boolean NOT NULL DEFAULT false` em `recruitment_stages`; seed atualizado para marcar `true` em "Entrevista Gestor" de todas as companies.
- Tela `/recrutamento/vagas`: tabela de vagas com filtros e busca.
- Tela `/recrutamento/vagas/nova` (Sheet).
- Tela `/recrutamento/vagas/[id]`: header + 3 tabs (Kanban, Arquivados, Detalhes).
- Tela `/recrutamento/vagas/[id]/editar` (Sheet).
- Tela `/recrutamento/candidatos`: tabela de candidatos (banco global).
- Tela `/recrutamento/candidatos/novo` (Sheet).
- Tela `/recrutamento/candidatos/[id]`: perfil com Dados, Aplicações e Histórico.
- Tela `/recrutamento/candidatos/[id]/editar` (Sheet).
- Tela `/configuracoes/etapas-recrutamento`: CRUD de etapas + reorder DnD + toggle `notifies_hiring_manager`.
- Sheet **"Adicionar candidato"** na vaga, com abas **"Cadastrar novo"** e **"Vincular existente"** (busca no banco global).
- Kanban com 7 colunas (inclui "Contratado"), DnD via `@dnd-kit`, menu kebab `⋮` no card para ações secundárias.
- Modal de saída lateral (desistente / reprovado / congelado) com select de motivo e textarea opcional.
- Aba "Arquivados" na vaga: tabela paginada com etapa de saída + motivo + data.
- Notificação `recruitment.candidate_in_manager_stage` disparada quando `current_stage_id` muda para etapa com `notifies_hiring_manager = true` e o `hiring_manager_id` da vaga é diferente do usuário que fez o move.
- Eventos no `activity_logs`: `job_opening.*`, `candidate.*`, `application.*`, `recruitment_stage.*` (ver §12).
- Testes de permissions, schema Zod e RLS (padrão das FT anteriores).

### Fora da Onda 1

- Feedback livre sobre candidato → Onda 2.
- Wizard de contratação (modal que cria `employee`, grava FK `hired_employee_id`, dispara `application.hired`) → Onda 2.
- Scorecard estruturado → Onda 3.
- Tarefas / lembretes → Onda 3.
- Métricas e tela `/recrutamento/relatorios` → Onda 3.
- Página pública de vaga, upload de currículo, e-mails automáticos, IA → MVP 1.5+ (pós FT-7).

### Comportamento da coluna "Contratado" nesta Onda

A coluna `hired_terminal` (posição 7) **aparece no Kanban desde a Onda 1**, mas permanece **inativa** até a Onda 2:

- DnD na coluna "Contratado" é bloqueado: ao tentar soltar um card ali, toast mostra "Contratação disponível em breve".
- Menu kebab `⋮` **não mostra** o item "Marcar contratado" nesta Onda.
- Badge visual da coluna tem tom cinza-claro (diferente das etapas ativas), sem destaque.

Isso evita esconder/mostrar coluna entre ondas e já prepara o visual final do Kanban.

---

## 3. User stories

### Criação e gestão de vagas (admin_rh)

- Admin_rh should be able to criar uma vaga via Sheet com título, descrição, departamento, cargo, gestor responsável, tipo de contrato, modalidade, localidade e número de posições.
- Admin_rh should be able to editar qualquer campo de uma vaga existente.
- Admin_rh should be able to mudar o status de uma vaga (`open` → `paused`, `closed`, `cancelled` e reversões permitidas entre open/paused).
- Admin_rh should be able to arquivar uma vaga (equivale a `status='cancelled'` ou `status='closed'` conforme contexto) sem perder dados.

### Listagem e busca de vagas

- Admin_rh and directors should be able to listar todas as vagas da empresa com filtros por status, departamento e gestor responsável.
- Admin_rh and directors should be able to buscar vagas por título.
- Gestores should be able to listar apenas vagas onde são `hiring_manager`.

### Gestão de candidatos

- Admin_rh should be able to cadastrar candidato avulso em `/recrutamento/candidatos/novo`.
- Admin_rh should be able to cadastrar candidato **diretamente dentro da vaga** via Sheet "Adicionar candidato" aba "Cadastrar novo" — cria `candidate` + `job_application` atomicamente.
- Admin_rh should be able to vincular candidato existente à vaga via aba "Vincular existente" com busca por nome/email.
- Admin_rh should be able to editar dados do candidato.
- Admin_rh should be able to arquivar candidato (soft).

### Listagem e busca de candidatos

- Admin_rh and directors should be able to listar todos os candidatos da empresa com filtros por origem e "tem aplicação ativa?".
- Admin_rh and directors should be able to buscar candidatos por nome ou email.
- Gestores should be able to listar candidatos, filtrado automaticamente para os que têm aplicação em vaga deles.

### Kanban operacional

- Admin_rh and gestores (em vagas onde são hiring_manager) should be able to ver o Kanban da vaga com colunas ordenadas por `position`.
- Admin_rh and gestores (da vaga) should be able to mover candidato entre etapas via drag-and-drop.
- Admin_rh and gestores (da vaga) should be able to mover candidato entre etapas via menu kebab `⋮` no card.
- Admin_rh and gestores (da vaga) should be able to marcar candidato como desistente, reprovado ou congelado via modal com motivo obrigatório.
- Users with access to Kanban should be able to filtrar por origem, buscar por nome/email e filtrar por "parados > 5d".

### Arquivados

- Users with access to the job opening should be able to ver aba "Arquivados" com tabela de candidatos arquivados, etapa em que saíram, status, motivo e data.

### Perfil do candidato

- Users with permission should be able to ver perfil com Dados pessoais, Aplicações (vagas atuais e passadas) e Histórico completo de movimentações.

### Etapas em Configurações

- Admin_rh should be able to acessar `/configuracoes/etapas-recrutamento` e ver todas as etapas da empresa ordenadas por `position`.
- Admin_rh should be able to renomear etapas (inline edit ou modal).
- Admin_rh should be able to criar nova etapa intermediária.
- Admin_rh should be able to arquivar etapas intermediárias (entry e hired_terminal nunca arquivam).
- Admin_rh should be able to reordenar etapas via drag-and-drop.
- Admin_rh should be able to ligar/desligar `notifies_hiring_manager` por etapa.

---

## 4. Schema — migration aditiva

```sql
-- docs/dev/supabase/migrations/<timestamp>_ft7_onda1_notifies_hiring_manager.sql

ALTER TABLE recruitment_stages
  ADD COLUMN notifies_hiring_manager boolean NOT NULL DEFAULT false;

-- Update seed padrão: "Entrevista Gestor" notifica por default
UPDATE recruitment_stages
SET notifies_hiring_manager = true
WHERE name = 'Entrevista Gestor' AND kind = 'intermediate';

-- Atualiza também a função de seed para novas companies (substitui a da Fundação)
CREATE OR REPLACE FUNCTION seed_recruitment_stages() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO recruitment_stages (company_id, name, position, kind, notifies_hiring_manager) VALUES
    (NEW.id, 'Cadastrado',        1, 'entry',          false),
    (NEW.id, 'Triagem',           2, 'intermediate',   false),
    (NEW.id, 'Entrevista RH',     3, 'intermediate',   false),
    (NEW.id, 'Entrevista Gestor', 4, 'intermediate',   true),
    (NEW.id, 'Teste / Case',      5, 'intermediate',   false),
    (NEW.id, 'Proposta',          6, 'intermediate',   false),
    (NEW.id, 'Contratado',        7, 'hired_terminal', false);
  RETURN NEW;
END;
$$;
```

Nenhuma mudança em `job_openings`, `candidates`, `job_applications` ou `candidate_stage_history` — tabelas da Fundação ficam intactas.

### Policy RLS adicional em `recruitment_stages` (UPDATE da flag)

A policy UPDATE de `recruitment_stages` já era `admin_rh only` (Fundação §5.2). Nenhuma mudança: a flag `notifies_hiring_manager` é só mais uma coluna sob a mesma policy.

---

## 5. Rotas e UI

### 5.1 `/recrutamento/vagas` — lista de vagas

**Header**: `PageHeader` com título "Vagas", descrição curta, ação primária **"+ Nova vaga"** (abre Sheet) — visível apenas para `admin_rh`.

**Filtros**: barra com chips expansíveis:
- **Status** (multi-select): open, paused, closed, cancelled. Default: `open`.
- **Departamento** (single-select): lista de departamentos da empresa.
- **Gestor responsável** (single-select): lista de employees que são hiring_manager de alguma vaga.
- **Busca**: input por título (debounce 300ms).

**Tabela** (TanStack Table, padrão do repo):

| Coluna | Conteúdo | Ordenação |
|---|---|---|
| Título | Link para `/recrutamento/vagas/[id]` | sim |
| Departamento | nome | sim |
| Gestor | nome do hiring_manager (`—` se nulo) | sim |
| Candidatos ativos | count de `job_applications` com `status='in_progress'` | sim |
| Status | badge colorido (verde/amarelo/cinza/vermelho) | sim |
| Criada em | data relativa ("há 3 dias") | sim (default desc) |

**Linha**: clique em qualquer lugar navega para o detalhe da vaga.

**Empty state**: `EmptyState` com texto "Nenhuma vaga ainda." + botão "+ Nova vaga" (se admin).

**Gestor**: mesma tabela, RLS já filtra para mostrar apenas vagas suas. Botão "+ Nova vaga" oculto.

---

### 5.2 Sheet "Nova vaga" e "Editar vaga"

**Componente**: `JobOpeningSheet` (440px, padrão do repo). Usa RHF + Zod.

**Campos**:

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| `title` | text | sim | max 140 chars |
| `description` | textarea | não | max 2000 chars, render markdown simples em detalhe |
| `department_id` | select | não | lista de departamentos ativos |
| `position_id` | select | não | lista de cargos ativos |
| `hiring_manager_id` | select | não | lista de employees ativos |
| `employment_type` | radio-group | sim | 5 valores do enum |
| `workplace_type` | radio-group | sim | 3 valores do enum |
| `location` | text | não | só aparece se workplace_type ≠ 'remoto' |
| `open_positions` | number | sim | min 1, default 1 |

**Footer**: "Cancelar" (ghost) + "Criar vaga" / "Salvar alterações" (primary).

**Após sucesso**: toast + fecha sheet + invalida cache da lista. Se "Nova vaga", redireciona para `/recrutamento/vagas/[id]` da vaga recém-criada.

---

### 5.3 `/recrutamento/vagas/[id]` — detalhe da vaga

**Header** (`PageHeader` extendido):

Linha 1 (title + actions):
- Título da vaga.
- Ações alinhadas à direita:
  - **"+ Adicionar candidato"** (primary, laranja) — abre Sheet com abas.
  - **"Editar"** (secondary) — abre Sheet de edição.
  - **`⋮`** (icon button) — menu com: "Pausar vaga" / "Reabrir vaga" / "Fechar vaga" / "Cancelar vaga" conforme estado atual.

Linha 2 (badges e meta):
- Badge `Status` (cor por estado).
- Nome do `Departamento` (link para filtro na lista).
- Nome do `Gestor` (link para perfil).
- Badge `Tipo` (CLT / PJ / Estágio / Temporário / Freelancer).
- Badge `Modalidade` (Presencial / Remoto / Híbrido).
- Count `N posições`.

**Breadcrumb**: `Recrutamento › Vagas › [título]`.

**Tabs**: `Kanban` | `Arquivados (N)` | `Detalhes`.

---

### 5.4 Tab "Kanban" (dentro do detalhe da vaga)

**Toolbar** (acima das colunas):
- Input de **busca** por nome/email (debounce 300ms, filtra cards em memória).
- Chip **"Origem ▾"** (multi-select com todas as 9 origens + "Outro").
- Chip toggle **"⚠ Parados > 5d"** (filtra aplicações com `stage_entered_at < now() - 5 days`).

**Colunas**: 7 colunas renderizadas em ordem de `position` (Cadastrado → Contratado). Apenas etapas com `archived_at IS NULL`. Cada coluna mostra:
- Título da etapa.
- Contagem de aplicações ativas nela.
- Cards de candidatos nessa etapa, com `status = 'in_progress'`.

**Coluna "Contratado"**: visível mas **inativa na Onda 1** (tom cinza-claro, DnD bloqueado, toast "Contratação disponível em breve" se tentar soltar).

**Card do candidato** (componente `CandidateCard`):

```
┌─────────────────────────────┐
│ Maria Silva            ⋮   │
│ maria.s@gmail.com           │
│                             │
│ [LinkedIn]  2d              │
└─────────────────────────────┘
```

- Nome (bold, truncate após 22 chars).
- Email (muted, truncate após 18 chars + "…").
- Origem (pill cinza).
- Tempo na etapa: `diffInDays(now, stage_entered_at)` formatado ("2d", "1h", "3w"). Se > 5 dias, fica **amarelo** (`#b45309`) com prefixo "⚠".
- Kebab `⋮` no canto superior direito.

**DnD**: `@dnd-kit/core` + `@dnd-kit/sortable`. Ao soltar em coluna destino:
1. Optimistic UI: card move imediatamente.
2. Server action `moveApplicationStage(applicationId, targetStageId)` chamada.
3. Se falha: revert + toast de erro.
4. Se sucesso: `candidate_stage_history` registrada, `stage_entered_at` atualizado, evento `application.stage_moved` loga em `activity_logs`, notificação disparada se target tem `notifies_hiring_manager = true`.

**Drop na coluna "Contratado"**: não executa server action, mostra toast "Contratação disponível em breve" e reverte.

**Menu kebab `⋮` no card**:

- `↑ Mover para [etapa anterior]` (se houver)
- `↓ Mover para [próxima etapa]` (se houver)
- Separador
- `× Marcar desistente` → abre modal (seção 5.7)
- `× Marcar reprovado` → abre modal (seção 5.7)
- `❄ Congelar` → abre modal (seção 5.7)

**Nunca no menu na Onda 1**: "Marcar contratado" (só na Onda 2).

---

### 5.5 Sheet "Adicionar candidato" (acionada do botão primary da vaga)

**Componente**: `AddCandidateSheet` (440px). Duas abas no topo:

#### Aba 1: "Cadastrar novo"

Form igual ao sheet de novo candidato avulso (§5.9), mas o submit cria **candidato + job_application atomicamente**:

```ts
// server action linkCandidateToJob (variante com create)
transaction:
  1. INSERT INTO candidates (...)
  2. INSERT INTO job_applications (job_opening_id, candidate_id, current_stage_id=entry, status='in_progress')
  3. INSERT INTO candidate_stage_history (application_id, from_stage_id=NULL, to_stage_id=entry, changed_by=actor)
  4. logActivity('candidate.created') + logActivity('application.created')
```

#### Aba 2: "Vincular existente"

- Input de **busca** (autocomplete) — busca em `candidates` da company por nome ou email.
- Resultados como lista: mostra nome + email + origem + "N aplicações" (count).
- Selecionar um → preview com dados + botão "Vincular a esta vaga".
- Se candidato já tem aplicação ativa nesta vaga (`UNIQUE(job_opening_id, candidate_id)`), desabilita botão com mensagem "Já está no processo desta vaga".
- Ao confirmar: cria apenas `job_application` + `candidate_stage_history` + logs.

---

### 5.6 Tab "Arquivados" (dentro do detalhe da vaga)

Tabela paginada (25 rows/page):

| Coluna | Conteúdo |
|---|---|
| Candidato | nome (link para perfil) |
| Origem | pill |
| Saiu em | nome da etapa onde estava ao ser arquivado |
| Status | badge (Desistente amarelo / Reprovado vermelho / Congelado azul) |
| Motivo | rótulo do enum (rejection_reason / withdrawal_reason / frozen_reason_notes truncado) |
| Data | data formatada |

**Filtros**: status (multi-select dos 3 terminais), busca por nome.

**Sem CTA**: só leitura. Para "reativar" um candidato, caminho é abrir o perfil e usar ação lá (pós-Onda 1).

---

### 5.7 Modal "Marcar [status]" (desistente / reprovado / congelar)

Modal pequeno (ConfirmDialog). Campos:

- **Motivo** (select, obrigatório):
  - Se desistente: 9 valores de `withdrawal_reason`.
  - Se reprovado: 8 valores de `rejection_reason`.
  - Se congelar: sem enum, só textarea obrigatória.
- **Se motivo = 'outro'**: aparece input `reason_other` obrigatório.
- **Notas adicionais** (textarea, opcional): usado como `reason_notes` no `candidate_stage_history`; se congelar, vira `frozen_reason_notes` na aplicação.

**Footer**: "Cancelar" + "Confirmar" (primary, cor conforme ação — amarelo/vermelho/azul).

**Ao confirmar**: server action `markApplication{Withdrawn|Rejected|Frozen}(applicationId, reason, notes)`:
1. UPDATE `job_applications` (status + reason + reason_other ou frozen_reason_notes).
2. INSERT em `candidate_stage_history` (from_stage = current, to_stage = NULL, status_change jsonb, reason_code, reason_notes).
3. `logActivity('application.withdrawn' | 'application.rejected' | 'application.frozen')`.
4. Card some do Kanban principal (filtro RLS / WHERE status='in_progress'), aparece em Arquivados.

---

### 5.8 `/recrutamento/candidatos` — banco global

**Header**: `PageHeader` com título "Candidatos", ação primária **"+ Novo candidato"** (admin apenas).

**Filtros**:
- **Origem** (multi-select).
- **Com aplicação ativa?** (toggle 3-estados: todos / sim / não).
- **Busca** por nome ou email.

**Tabela**:

| Coluna | Conteúdo |
|---|---|
| Nome | link para `/candidatos/[id]` |
| Email | — |
| Origem | pill |
| Vagas ativas | count de `job_applications` com `status='in_progress'`; chip clicável abre tooltip com a lista |
| Criado em | relativa |

---

### 5.9 Sheet "Novo candidato" e "Editar candidato"

**Componente**: `CandidateSheet` (440px). Usado também dentro da aba "Cadastrar novo" do `AddCandidateSheet`.

**Campos**:

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| `name` | text | sim | max 120 |
| `email` | email | sim | uniqueness validada antes do submit |
| `phone` | text | não | máscara BR |
| `linkedin_url` | url | não | prefill `https://linkedin.com/in/` |
| `resume_url` | url | não | URL externa, upload vem em 1.5 |
| `source` | select | sim | 9 valores + outro |
| `source_other` | text | condicional | aparece se `source='outro'` |
| `notes` | textarea | não | observações internas |

**Footer**: "Cancelar" + "Criar candidato" / "Salvar alterações".

Se `UNIQUE(company_id, email)` conflitar no submit, server action retorna erro estruturado e sheet mostra alerta "Já existe um candidato com este email. [Abrir cadastro]" com link para `/recrutamento/candidatos/[id_do_existente]`.

---

### 5.10 `/recrutamento/candidatos/[id]` — perfil

**Header**: nome do candidato + email, pill de origem.

**Ações**:
- **"Editar"** (admin).
- **"+ Vincular a vaga"** (admin) — abre modal pequeno: select de vaga + confirmação.
- `⋮` (admin): arquivar / desarquivar.

**Seções (cards verticais)**:

#### Seção 1 — Dados pessoais

Grid de 2 colunas com: Nome, Email, Telefone, LinkedIn, Currículo (link externo se presente), Origem (+ `source_other` se aplicável), Notas internas.

#### Seção 2 — Aplicações

Lista de cards, um por `job_application`:

```
┌──────────────────────────────────────────────────┐
│ Analista de Suporte Jr        [Entrev. RH]      │
│ Suporte · Carlos Pereira                         │
│ Em andamento · entrou em 02/04 (há 18 dias)      │
└──────────────────────────────────────────────────┘
```

Cada card clicável leva ao Kanban da vaga com o card destacado (query string `?app=[id]`).

#### Seção 3 — Histórico de movimentações

Timeline derivada de `candidate_stage_history` ordenada desc:

```
● há 3 dias · você moveu de Triagem para Entrevista RH
│
● há 8 dias · admin RH moveu de Cadastrado para Triagem
│
● há 15 dias · admin RH cadastrou na vaga Analista de Suporte Jr
```

Eventos de status change (desistente/reprovado/congelado) aparecem com ícone e motivo.

---

### 5.11 `/configuracoes/etapas-recrutamento` — CRUD e reorder

**Header**: "Etapas de recrutamento" + ação primária **"+ Nova etapa"** (abre modal pequeno com input de nome).

**Tabela** com DnD de linhas (via `@dnd-kit/sortable`):

| Coluna | Conteúdo |
|---|---|
| `≡` | handle de drag para reordenar |
| Posição | número (1, 2, ...) |
| Nome | inline-editable (click-to-edit) |
| Tipo | badge imutável (Entry / Intermediária / Contratação) |
| Notifica gestor | checkbox ligado/desligado; só editável em `intermediate` |
| Ações | `⋮` → "Arquivar" (só para `intermediate` ativa) |

**Regras**:
- `entry` e `hired_terminal` **nunca** podem ser arquivadas, renomeadas em tipo, ou mudadas de posição. Nome pode ser editado.
- `intermediate` pode ser arquivada, renomeada, reordenada, e ligar/desligar `notifies_hiring_manager`.
- Reorder via DnD envia atualização otimista → server action `reorderRecruitmentStages(ids[])`.
- Etapa archived não some — fica ao final da tabela em área "Etapas arquivadas" com ação "Reativar".

---

## 6. Server actions

Arquivo-base: `src/features/recruitment/actions/`.

### 6.1 Job openings — `features/recruitment/actions/job-openings.ts`

```ts
export async function createJobOpening(input: JobOpeningInput): Promise<{ id: string } | ActionError>
export async function updateJobOpening(id: string, input: Partial<JobOpeningInput>): Promise<ActionOk | ActionError>
export async function changeJobStatus(id: string, newStatus: JobOpeningStatus): Promise<ActionOk | ActionError>
export async function archiveJobOpening(id: string): Promise<ActionOk | ActionError>  // soft: status='cancelled'
```

### 6.2 Candidates — `features/recruitment/actions/candidates.ts`

```ts
export async function createCandidate(input: CandidateInput): Promise<{ id: string } | ActionError>
export async function updateCandidate(id: string, input: Partial<CandidateInput>): Promise<ActionOk | ActionError>
export async function archiveCandidate(id: string): Promise<ActionOk | ActionError>
```

### 6.3 Applications — `features/recruitment/actions/applications.ts`

```ts
// Vincular candidato existente a uma vaga (aba "Vincular existente")
export async function linkCandidateToJob(candidateId: string, jobOpeningId: string): Promise<{ applicationId: string } | ActionError>

// Cadastrar candidato + vincular atomicamente (aba "Cadastrar novo")
export async function createAndLinkCandidate(input: CandidateInput, jobOpeningId: string): Promise<{ candidateId: string; applicationId: string } | ActionError>

// Mover candidato de etapa (DnD ou menu)
export async function moveApplicationStage(applicationId: string, targetStageId: string): Promise<ActionOk | ActionError>

// Saídas laterais
export async function markApplicationWithdrawn(applicationId: string, reason: WithdrawalReason, reasonOther: string | null, notes: string | null): Promise<ActionOk | ActionError>
export async function markApplicationRejected (applicationId: string, reason: RejectionReason,  reasonOther: string | null, notes: string | null): Promise<ActionOk | ActionError>
export async function markApplicationFrozen   (applicationId: string, notes: string): Promise<ActionOk | ActionError>
```

### 6.4 Recruitment stages — `features/recruitment/actions/stages.ts`

```ts
export async function createRecruitmentStage(input: { name: string }): Promise<{ id: string } | ActionError>  // kind auto = 'intermediate'; position = último + 1
export async function updateRecruitmentStage(id: string, input: { name?: string; notifies_hiring_manager?: boolean }): Promise<ActionOk | ActionError>
export async function archiveRecruitmentStage(id: string): Promise<ActionOk | ActionError>  // bloqueia se kind = 'entry' ou 'hired_terminal'
export async function reorderRecruitmentStages(orderedIds: string[]): Promise<ActionOk | ActionError>
```

**Todas as actions**:
1. Validam `canXxx` de `features/recruitment/permissions.ts`.
2. Validam input com Zod.
3. Chamam Supabase com service client quando necessário bypass RLS (writes em `candidate_stage_history`).
4. Logam `activity_logs` com metadata contextual.
5. Disparam notificação quando aplicável.
6. Revalidam cache (`revalidatePath`) das telas afetadas.

### 6.5 Regras específicas de `moveApplicationStage`

Fluxo completo:
```
0. Check canMoveApplication(actor, applicationId).
1. Read application atual (current_stage_id, status).
2. Bloqueio: se target stage é kind='hired_terminal' → retorna error 'HIRING_NOT_AVAILABLE_IN_ONDA_1' (Onda 2 remove esse bloqueio).
3. Bloqueio: se application.status != 'in_progress' → retorna error 'APPLICATION_NOT_ACTIVE'.
4. UPDATE job_applications SET current_stage_id = target, stage_entered_at = now().
5. INSERT candidate_stage_history (from_stage_id, to_stage_id, changed_by=actor).
6. logActivity('application.stage_moved', metadata={from_stage, to_stage, candidate_name, job_title}).
7. Se target.notifies_hiring_manager = true AND job.hiring_manager_id != actor.employeeId:
     dispatch notification 'recruitment.candidate_in_manager_stage' to job.hiring_manager_id.
8. revalidatePath('/recrutamento/vagas/[id]') e '/recrutamento/candidatos/[candidateId]'.
```

---

## 7. Permissions (delta da Fundação)

Nenhuma nova função `can*` é necessária. As da Fundação (§5.1) cobrem todos os cenários da Onda 1.

Confirmações explícitas:
- `canManageJobOpenings(admin_rh)` → permite criar/editar/arquivar/changeStatus.
- `canMoveApplication` → admin + gestor da vaga (usado em DnD e menu kebab).
- `canManageCandidates(admin_rh)` → cadastro e edição de candidato.
- `canManageStages(admin_rh)` → tela de Configurações > Etapas.
- **Hiring permanece bloqueado para todos na Onda 1**: nenhuma action desta onda aceita transição para `status='hired'` ou stage `kind='hired_terminal'`.

---

## 8. Auditoria — eventos disparados nesta Onda

| Action | Quando | Metadata principal |
|---|---|---|
| `job_opening.created` | createJobOpening | `{ job_opening_id, title, status }` |
| `job_opening.updated` | updateJobOpening | `{ job_opening_id, title, changes: {...} }` |
| `job_opening.status_changed` | changeJobStatus | `{ job_opening_id, title, from_status, to_status }` |
| `job_opening.archived` | archiveJobOpening | `{ job_opening_id, title }` |
| `candidate.created` | createCandidate ou createAndLinkCandidate | `{ candidate_id, name, email, source }` |
| `candidate.updated` | updateCandidate | `{ candidate_id, name, changes }` |
| `candidate.archived` | archiveCandidate | `{ candidate_id, name }` |
| `application.created` | linkCandidateToJob ou createAndLinkCandidate | `{ application_id, candidate_name, job_title }` |
| `application.stage_moved` | moveApplicationStage | `{ application_id, candidate_name, job_title, from_stage, to_stage }` |
| `application.withdrawn` | markApplicationWithdrawn | `{ application_id, candidate_name, job_title, reason, notes }` |
| `application.rejected` | markApplicationRejected | `{ application_id, candidate_name, job_title, reason, notes }` |
| `application.frozen` | markApplicationFrozen | `{ application_id, candidate_name, job_title, notes }` |
| `recruitment_stage.created` | createRecruitmentStage | `{ stage_id, name, position }` |
| `recruitment_stage.updated` | updateRecruitmentStage | `{ stage_id, name, changes }` |
| `recruitment_stage.archived` | archiveRecruitmentStage | `{ stage_id, name }` |
| `recruitment_stage.reordered` | reorderRecruitmentStages | `{ ordered_ids: [...] }` |

`humanizeActivityMetadata` em `src/lib/activity.ts` ganha os switch-cases correspondentes para renderizar labels pt-BR em `/configuracoes/auditoria`:
- "Vaga criada: Analista de Suporte Jr (aberta)"
- "Candidato movido: Maria Silva · Analista de Suporte Jr · Triagem → Entrevista RH"
- etc.

---

## 9. Notificações — disparo

### 9.1 `recruitment.candidate_in_manager_stage`

**Gatilho**: em `moveApplicationStage`, após sucesso, quando:
- `target_stage.notifies_hiring_manager = true` E
- `job_opening.hiring_manager_id IS NOT NULL` E
- `job_opening.hiring_manager_id != actor.employee_id` (evita auto-notificação)

**Destinatário**: `employee` com `id = job_opening.hiring_manager_id` (resolver para `user_id` via `employees.user_id`).

**Template** (pt-BR curto):
```
Título: Candidato chegou na sua etapa
Corpo: {candidate_name} foi movido(a) para "{stage_name}" na vaga {job_title}.
CTA: Abrir vaga → /recrutamento/vagas/[id]
```

**Opt-out**: herda config global do usuário (mesma camada dos feedbacks FT-3).

---

## 10. Interações de cache e revalidação

| Action | revalidatePath |
|---|---|
| `createJobOpening` | `/recrutamento/vagas` |
| `updateJobOpening`, `changeJobStatus`, `archiveJobOpening` | `/recrutamento/vagas`, `/recrutamento/vagas/[id]` |
| `createCandidate`, `updateCandidate`, `archiveCandidate` | `/recrutamento/candidatos`, `/recrutamento/candidatos/[id]` |
| `linkCandidateToJob`, `createAndLinkCandidate` | `/recrutamento/vagas/[jobId]`, `/recrutamento/candidatos/[candidateId]` |
| `moveApplicationStage` | `/recrutamento/vagas/[jobId]`, `/recrutamento/candidatos/[candidateId]` |
| `markApplicationWithdrawn` / `Rejected` / `Frozen` | mesmo que moveApplicationStage |
| `*RecruitmentStage` actions | `/configuracoes/etapas-recrutamento`, `/recrutamento/vagas/[id]` (todas) |

Queries do Kanban usam React Query com stale tempo curto (5s) para refletir movimentos de outros admins em tempo quase-real.

---

## 11. Componentes reutilizados e novos

### Reutilizados (sem mudança)

| Componente | Uso |
|---|---|
| `PageHeader`, `EmptyState`, `BreadcrumbLabel` | cabeçalhos das rotas |
| `Sheet` (shadcn) | todos os forms de criação/edição |
| `Dialog` (shadcn) | modais de saída lateral e "Vincular a vaga" |
| TanStack Table | listas de vagas, candidatos, arquivados, etapas |
| `Toast/Sonner` | feedback de sucesso/erro |
| `Tooltip` | hints no Kanban |

### Novos componentes internos

| Componente | Responsabilidade |
|---|---|
| `JobOpeningSheet` | form de vaga |
| `JobOpeningsTable` | lista de vagas |
| `JobOpeningHeader` | header do detalhe da vaga com ações |
| `JobOpeningTabs` | orquestra Kanban / Arquivados / Detalhes |
| `Kanban` | grid de colunas + DnD provider |
| `KanbanColumn` | uma etapa |
| `CandidateCard` | card do Kanban |
| `CandidateCardMenu` | kebab com ações de movimentação e saída |
| `ArchivedApplicationsTable` | tabela da aba Arquivados |
| `ArchiveReasonDialog` | modal de motivo (desistente/reprovado/congelar) |
| `CandidateSheet` | form de candidato |
| `CandidatesTable` | lista global |
| `CandidateProfile` | perfil com 3 seções |
| `CandidateApplicationsList` | seção "Aplicações" no perfil |
| `CandidateHistoryTimeline` | seção "Histórico" |
| `AddCandidateSheet` | sheet com abas "Cadastrar novo | Vincular existente" |
| `RecruitmentStagesTable` | CRUD de etapas com DnD |
| `StageNotifyToggle` | checkbox "Notifica gestor" |

### Biblioteca externa nova

- `@dnd-kit/core`
- `@dnd-kit/sortable`
- `@dnd-kit/utilities`

Instalar como dependência regular; peer deps limpos.

---

## 12. Testes

Seguindo o padrão das FT anteriores.

### Unit

- `features/recruitment/schema.test.ts`: cobre JobOpeningInput, CandidateInput, todos os enums.
- `features/recruitment/permissions.test.ts`: estende o que veio da Fundação; testa cenários de movimentação e arquivamento com cada role.
- `features/recruitment/actions/*.test.ts`: validação de input + guards de permissão (sem chamada Supabase real; mock do client).

### Regras específicas

- `moveApplicationStage` rejeita movimento para `hired_terminal`.
- `moveApplicationStage` rejeita movimento quando `status != 'in_progress'`.
- `linkCandidateToJob` respeita `UNIQUE(job_opening_id, candidate_id)`.
- `createAndLinkCandidate` é atômico (falha de segundo INSERT desfaz o primeiro).
- `archiveRecruitmentStage` bloqueia para `entry` e `hired_terminal`.
- `reorderRecruitmentStages` exige que o array contenha todas as etapas ativas da company.
- `markApplicationRejected` exige `rejection_reason` válido; `markApplicationWithdrawn` exige `withdrawal_reason` válido.

### Integração (manual, documentada em `rls-checks.md`)

- Simular cada role (admin, director, gestor, colaborador) e verificar tabelas visíveis + ações permitidas.
- Gestor de vaga A não consegue mover card de vaga B.
- Director não consegue INSERT/UPDATE em nenhuma tabela via cliente direto.

---

## 13. Critérios de aceite

### Vagas
1. Admin cria vaga via Sheet → aparece na lista, breadcrumb correto na página detalhada.
2. Admin muda status open → paused → open; trilha em `activity_logs` com ambos eventos.
3. Gestor vê apenas vagas onde é `hiring_manager`; não vê botão "+ Nova vaga".
4. Director vê todas as vagas; tenta editar via cliente direto → 403 (RLS).
5. Filtros de status/departamento/gestor funcionam combinados; busca por título com debounce.

### Candidatos
6. Admin cadastra candidato avulso via `/candidatos/novo` → aparece em `/candidatos` com contagem "0 vagas ativas".
7. Admin cadastra candidato direto na vaga via aba "Cadastrar novo" → aplicação criada na etapa `entry`, contagem da vaga incrementa, candidato aparece na lista global com "1 vaga ativa".
8. Admin busca "maria" em "Vincular existente" dentro da vaga → lista candidatos da company; selecionar e confirmar cria aplicação.
9. Email duplicado retorna erro claro no Sheet com link para o candidato existente.
10. Gestor acessa lista de candidatos e vê apenas candidatos com aplicação em vaga dele.

### Kanban
11. Admin arrasta card de Triagem para Entrevista RH → card move imediatamente, `stage_entered_at` atualizado, linha em `candidate_stage_history`, evento `application.stage_moved` em `activity_logs`.
12. Gestor da vaga consegue arrastar no Kanban da sua vaga; em vaga de outro gestor, DnD é bloqueado.
13. Arrastar para coluna "Contratado" mostra toast "Contratação disponível em breve" e reverte o card.
14. Menu kebab `⋮` oferece mover para etapa anterior/próxima + saídas laterais; não oferece "Marcar contratado" na Onda 1.
15. Card de candidato "parado" há mais de 5 dias mostra badge amarelo "⚠ 6d parada".
16. Filtro "Parados > 5d" esconde cards com `stage_entered_at` recente; busca por nome/email filtra em memória instantaneamente.

### Saídas laterais
17. "Marcar desistente" → modal com select `withdrawal_reason` obrigatório; confirmar muda status, grava history, card some do Kanban e aparece na aba Arquivados com motivo visível.
18. "Marcar reprovado" → idem, com `rejection_reason`.
19. "Congelar" → modal com textarea `notes` obrigatória; status=frozen, `frozen_reason_notes` preenchido.
20. Motivo `outro` exibe input `reason_other` obrigatório.

### Arquivados
21. Aba "Arquivados" mostra todos com status terminal (≠ in_progress); filtro por status funciona; linha mostra etapa em que saiu + motivo.

### Etapas em Configurações
22. Admin renomeia etapa inline → persiste, tela revalida.
23. Admin adiciona nova etapa → aparece como `intermediate`, `position = último + 1`.
24. Admin arquiva etapa `intermediate` → some da lista principal, aparece em "Arquivadas"; aplicações que estavam nela permanecem (mas nova aplicação nunca é criada ali).
25. Admin tenta arquivar `entry` ou `hired_terminal` → ação bloqueada com mensagem clara.
26. Admin reordena via DnD → `position` atualizada no banco, Kanban de todas as vagas reflete a nova ordem.
27. Admin liga `notifies_hiring_manager` em "Triagem" → próxima vez que candidato entrar em Triagem dispara notificação ao gestor da vaga.

### Perfil do candidato
28. Perfil mostra Dados + Aplicações (lista clicável) + Histórico (timeline ordenada desc).
29. Clicar em uma aplicação no perfil leva ao Kanban da vaga com card destacado (`?app=[id]`).

### Notificações
30. Admin move candidato para "Entrevista Gestor" de vaga onde ele não é gestor → gestor recebe notificação na próxima vez que abrir o app (ou real-time se estiver logado).

### Auditoria
31. Tela `/configuracoes/auditoria` mostra todos os eventos do módulo com rótulos pt-BR e metadata humanizado.

### Testes automatizados
32. Todos os testes de schema, permissions e actions passam.
33. Testes já existentes (FT-1 a FT-5 + Fundação) continuam verdes.

---

## 14. Riscos e decisões em aberto (para ondas seguintes)

### Riscos

- **DnD em mobile/tablet**: `@dnd-kit` suporta touch, mas UX de drag longo em tela pequena pode ser frustrante. Mitigação: documentar que Kanban é pensado para desktop; no mobile, menu kebab é o caminho natural. Revisitar se telemetria mostrar uso mobile relevante.
- **Etapa arquivada que ainda tem aplicações**: decisão desta Onda é bloquear novas aplicações nela, mas permitir visualização. Pode causar dúvida "por que aparece no Kanban?". Se incomodar, na Onda 3 adicionar banner "Etapa legada — mover aplicações para etapa ativa".
- **Candidato com email muito comum** (ex: `contato@empresa.com`): pode colidir com UNIQUE inesperadamente. Mensagem de erro precisa ser clara (já prevista em §5.9).

### Decisões em aberto (para Onda 2)

- Quem vê o card ghost/destacado pelo `?app=[id]` quando vem do perfil do candidato? Default: só o admin que originou o link (comportamento padrão de anchor).
- Cadeia de feedbacks no perfil do candidato: lista cronológica (Onda 2) ou agrupada por aplicação?
- Wizard de contratação: comportamento se o candidato já foi convertido antes (`hired_employee_id IS NOT NULL`) — bloquear? Mostrar aviso?

---

## 15. Dependências com outras features

| Feature | Uso |
|---|---|
| FT-1 (Colaboradores) | FK em `job_openings.hiring_manager_id`, `candidates.hired_employee_id` (Onda 2), `candidate_feedbacks.author_id` (Onda 2) |
| FT-1 (Departamentos/Cargos) | selects em Sheet de vaga (`department_id`, `position_id`) |
| Fundação (`13-ft-7-fundacao.md`) | todas as tabelas + RLS + sidebar + breadcrumbs |
| `src/lib/activity.ts` | `ActivityAction` extendido, `ACTIVITY_LABELS`, `humanizeActivityMetadata` |
| `src/features/notifications/` | novo tipo `recruitment.candidate_in_manager_stage` |
| `src/features/shell/BreadcrumbContext.tsx` | registros das rotas do módulo |

Nenhuma mudança destrutiva em nenhuma delas.

---

## 16. Resumo das decisões desta Onda

1. Fluxo primário: vaga-first. Sheet "Adicionar candidato" dentro da vaga tem abas "Cadastrar novo" e "Vincular existente".
2. Listas (vagas e candidatos) são tabelas TanStack com filtros no header.
3. Criar/editar vaga e candidato usam Sheet 440px (padrão do repo).
4. Detalhe da vaga: header com ações, tabs Kanban/Arquivados/Detalhes.
5. Kanban: 7 colunas, DnD com `@dnd-kit`, card com nome + email + origem + tempo na etapa + kebab.
6. Tempo > 5 dias vira badge amarelo `⚠ Nd parada`.
7. Coluna "Contratado" aparece desde a Onda 1 mas é inativa (drop bloqueado; menu sem "Marcar contratado").
8. Saídas laterais via modal de motivo — select do enum + textarea opcional; motivo `outro` exibe input de texto.
9. Arquivados como aba da vaga, tabela motivo/data.
10. Perfil do candidato: Dados + Aplicações + Histórico (timeline).
11. Configurações > Etapas de recrutamento: CRUD + reorder DnD + toggle `notifies_hiring_manager`.
12. Migration aditiva: `recruitment_stages.notifies_hiring_manager` (+ seed update).
13. Notificação `candidate_in_manager_stage` disparada via flag na etapa (robusto a renome).
14. Eventos em `activity_logs` cobrem todo o ciclo da Onda.
15. Permissions e RLS da Fundação cobrem tudo sem nova função.
