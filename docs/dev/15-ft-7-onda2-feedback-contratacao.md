# FT-7 — Recrutamento — Onda 2 — Feedback e Contratação

Spec da **segunda onda** do módulo de Recrutamento.
Adiciona feedback livre sobre candidato e o wizard de contratação que cria o colaborador — fechando o loop do produto (candidato → colaborador).
Depende da Fundação + Onda 1.
Última atualização: 2026-04-20.

> **Leia antes:** `docs/dev/13-ft-7-fundacao.md` + `docs/dev/14-ft-7-onda1-vagas-candidatos.md`.
> **Spec seguinte:** `16-ft-7-onda3-metricas-scorecard-tarefas.md`.

---

## 1. Objetivo

Transformar o Kanban operacional (Onda 1) em um processo completo com voz dos avaliadores e saída real (contratação). A Onda 2 adiciona duas capacidades que conectam o módulo ao produto inteiro:

1. **Feedback livre sobre candidato** — RH e gestor registram impressões durante o processo seletivo; histórico fica atrelado à aplicação e alimenta a decisão de avançar/reprovar.
2. **Wizard de contratação** — transforma candidato em colaborador com 1 ação, cria `employee` (sem convite automático), grava FK bidirecional e dispara o ciclo de gestão de pessoas que já existe no produto.

Depois desta Onda, o módulo entrega a promessa central do FT-7: *"acompanhe candidatos por etapa, entenda onde eles desistem e transforme contratações em colaboradores dentro da plataforma."*

## 2. Escopo

### Dentro da Onda 2

- **Tabela nova**: `candidate_feedbacks` com RLS completo.
- **Sheet de feedback** (`FeedbackSheet`, 440px) acessível de 2 caminhos (card do Kanban e perfil do candidato).
- **Seção "Feedbacks"** no perfil do candidato: acordeão por aplicação (vaga ativa aberta por default; vagas terminadas colapsadas).
- **Badge no card do Kanban**: `💬 N` quando a aplicação tem feedbacks (condicional — só aparece se count ≥ 1).
- **Wizard de contratação** (`HireCandidateDialog`, modal com form único) disparado por:
  - Drop do card na coluna "Contratado" (agora ativo).
  - Menu kebab do card → "Marcar contratado" (agora aparece para `admin_rh`).
- **Server action `hireCandidate`** transacional:
  - Cria `employee` sem `user_id` (convite nunca é automático).
  - Preenche `candidates.hired_employee_id`.
  - Atualiza `job_applications.status='hired'`, `current_stage_id=<hired_terminal>`, `stage_entered_at=now()`.
  - Insere linha em `candidate_stage_history`.
  - **Opcionalmente** arquiva outras aplicações ativas do mesmo candidato como `withdrawn` com motivo `aceitou_outra_proposta` (checkbox no form, default ligado).
  - Dispara `application.hired` + `employee.created` em `activity_logs`.
- **Bloqueios do wizard**:
  - Candidato já com `hired_employee_id IS NOT NULL` → erro com link pro colaborador antigo (recontratação exige novo cadastro de candidato).
  - Email colide com `employees.email` existente → erro inline com input `Email alternativo` + link "Ver colaborador existente".
- **Link bidirecional** entre candidato contratado e colaborador criado:
  - Perfil do candidato: **banner proeminente** de topo.
  - Perfil do colaborador: **badge discreto** nos metadados do header.
- **Coluna "Contratado" vira ativa**: drop não é mais bloqueado; menu passa a mostrar "Marcar contratado" para admin.
- **Aba "Arquivados" da Onda 1 renomeada para "Finalizados"** (ajuste retroativo — ver seção 14).
- **Deleção de feedback**: soft delete via `deleted_at`; autor dentro da janela 2h; admin_rh sempre.

### Fora da Onda 2

- Scorecard estruturado → Onda 3.
- Tarefas / lembretes → Onda 3.
- Métricas e `/recrutamento/relatorios` → Onda 3.
- Reativação de candidato contratado (via nova aplicação) → bloqueada; exige cadastro novo.
- Comentários encadeados em feedbacks: não entra; cada feedback é standalone.
- Upload de anexos em feedback: não entra.
- **Feature "Pedir feedback de…" (notificação direcionada a employee específico) — explicitamente fora da Onda 2. Pós-MVP.** Notificação `recruitment.feedback_requested` declarada na Fundação §9 fica dormente até ser ativada em onda futura. Hoje o canal `recruitment.candidate_in_manager_stage` (Onda 1) cobre o principal envolvimento de gestor; coordenação adicional acontece fora do sistema (chat, presencial).
- Markdown ou rich text em feedback: texto plano apenas.

---

## 3. User stories

### Feedback (admin_rh, gestor da vaga)

- Admin_rh or gestor (da vaga) should be able to dar feedback sobre um candidato a partir do card no Kanban (menu kebab `⋮` → "Dar feedback").
- Admin_rh or gestor (da vaga) should be able to dar feedback a partir do perfil do candidato na seção de aplicação (botão "Dar feedback" no card de cada aplicação).
- Admin_rh or gestor should be able to escrever conteúdo em texto plano (quebras de linha preservadas) de 10 a 3000 caracteres.
- Admin_rh or gestor should be able to escolher opcionalmente uma recomendação (avança / dúvida / reprova).
- Admin_rh or gestor should be able to editar o próprio feedback dentro de 2h após criação.
- Admin_rh or gestor should be able to deletar o próprio feedback (soft delete) dentro de 2h após criação.
- Admin_rh should be able to deletar qualquer feedback a qualquer momento (moderação).
- Users with permission should be able to ver feedbacks agrupados por aplicação no perfil do candidato (vaga ativa aberta; terminadas colapsadas).
- Users with permission should be able to ver badge `💬 N` no card do Kanban quando a aplicação tem feedbacks (badge oculto quando count = 0).
- Users with permission should be able to clicar no badge do card e ser levado direto à seção Feedbacks do perfil com a aplicação expandida.

### Contratação (admin_rh)

- Admin_rh should be able to marcar candidato como contratado via drag pro "Contratado" ou menu `⋮` → "Marcar contratado".
- Admin_rh should be able to ver wizard de contratação com dados pré-preenchidos (pessoais do candidato + vaga/departamento/gestor da aplicação + data hoje).
- Admin_rh should be able to ajustar qualquer campo antes de confirmar.
- Admin_rh should be able to decidir se arquiva outras aplicações ativas do candidato como "aceitou outra proposta" via checkbox no form (default ligado).
- Admin_rh should be blocked ao tentar contratar candidato com `hired_employee_id` já preenchido (erro com link pro colaborador existente e instrução clara).
- Admin_rh should see inline error ao tentar contratar com email que colide com colaborador existente, incluindo: nome do colaborador conflitante, departamento, link "Ver colaborador →", input editável `Email alternativo` para ajuste imediato.
- Admin_rh should see banner "É o colaborador [nome]" no perfil do candidato contratado (botão "Vincular a vaga" é ocultado).
- Admin_rh should see badge discreto "via recrutamento" nos metadados do perfil do colaborador, clicável para abrir o candidato de origem.

### Kanban — mudanças nesta Onda

- Admin_rh should be able to dropar card na coluna "Contratado" e abrir o wizard.
- Admin_rh should see item "Marcar contratado" no menu `⋮` do card (gestores e director continuam sem esse item).
- Gestor should be blocked ao tentar contratar via DnD (drop não executa; toast mostra "Contratação disponível apenas para admin RH").
- Users should see aba renomeada de "Arquivados" para "Finalizados" no detalhe da vaga; conteúdo passa a incluir cards com `status='hired'` com badge verde "Contratado".

---

## 4. Schema — migration aditiva

```sql
-- Migration: ft7_onda2_candidate_feedbacks.sql

CREATE TABLE candidate_feedbacks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  application_id  uuid NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  stage_id        uuid NOT NULL REFERENCES recruitment_stages(id),
  author_id       uuid NOT NULL REFERENCES employees(id),
  content         text NOT NULL,
  recommendation  text CHECK (recommendation IN ('advance','doubt','reject')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,

  CONSTRAINT candidate_feedbacks_content_length CHECK (char_length(content) BETWEEN 10 AND 3000)
);

CREATE INDEX candidate_feedbacks_application_time
  ON candidate_feedbacks (application_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX candidate_feedbacks_author
  ON candidate_feedbacks (author_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX candidate_feedbacks_company
  ON candidate_feedbacks (company_id, created_at DESC)
  WHERE deleted_at IS NULL;
```

Nenhuma outra tabela alterada nesta Onda.

### RLS em `candidate_feedbacks`

```sql
ALTER TABLE candidate_feedbacks ENABLE ROW LEVEL SECURITY;

-- SELECT: admin_rh + director + gestor da vaga + próprio autor (ignorando deletados pela query)
CREATE POLICY candidate_feedbacks_select ON candidate_feedbacks
FOR SELECT USING (
  company_id = get_user_company_id()
  AND deleted_at IS NULL
  AND (
    get_user_role() IN ('admin_rh', 'director')
    OR author_id = get_user_employee_id()
    OR EXISTS (
      SELECT 1 FROM job_applications ja
      JOIN job_openings jo ON ja.job_opening_id = jo.id
      WHERE ja.id = candidate_feedbacks.application_id
        AND jo.hiring_manager_id = get_user_employee_id()
    )
  )
);

-- INSERT: admin_rh OR gestor da vaga; author_id deve = actor
CREATE POLICY candidate_feedbacks_insert ON candidate_feedbacks
FOR INSERT WITH CHECK (
  company_id = get_user_company_id()
  AND author_id = get_user_employee_id()
  AND (
    get_user_role() = 'admin_rh'
    OR EXISTS (
      SELECT 1 FROM job_applications ja
      JOIN job_openings jo ON ja.job_opening_id = jo.id
      WHERE ja.id = candidate_feedbacks.application_id
        AND jo.hiring_manager_id = get_user_employee_id()
    )
  )
);

-- UPDATE (para editar conteúdo/recommendation): apenas autor, dentro de 2h, não deletado
CREATE POLICY candidate_feedbacks_update_author ON candidate_feedbacks
FOR UPDATE USING (
  company_id = get_user_company_id()
  AND author_id = get_user_employee_id()
  AND created_at > (now() - interval '2 hours')
  AND deleted_at IS NULL
);

-- UPDATE para soft-delete por admin_rh (via action usando service client OR policy adicional)
-- Policy adicional permite admin_rh setar deleted_at em qualquer feedback da company:
CREATE POLICY candidate_feedbacks_soft_delete_admin ON candidate_feedbacks
FOR UPDATE USING (
  company_id = get_user_company_id()
  AND get_user_role() = 'admin_rh'
  AND deleted_at IS NULL
) WITH CHECK (
  -- Admin só pode mudar deleted_at; action garante que outros campos não mudam
  company_id = get_user_company_id()
);

-- DELETE bloqueado; soft delete via UPDATE deleted_at
```

**Obs sobre a policy do admin**: o WITH CHECK da policy de admin é minimalista porque a action é a camada que garante que apenas `deleted_at` é alterado quando o autor é diferente. Se preferir endurecer, pode-se usar triggers para verificar colunas alteradas — mas para MVP basta a server action respeitar a regra.

---

## 5. UI — Feedback

### 5.1 FeedbackSheet (440px)

**Componente**: `FeedbackSheet` em `src/features/recruitment/feedbacks/FeedbackSheet.tsx`. Formulário com RHF + Zod.

**Header do sheet**:
- Nome do candidato + email.
- Vaga (link) + etapa em que o feedback está sendo dado (badge).

**Campos** (form):

| Campo | Tipo | Obrigatório | Validação |
|---|---|---|---|
| `content` | textarea (texto plano) | sim | 10–3000 chars |
| `recommendation` | radio-group | não | `advance` / `doubt` / `reject` |
| `stage_id` | interno | sim | snapshot de `application.current_stage_id` ao abrir o sheet; não muda depois |

- **Render do conteúdo**: em listagem, usa `whitespace-pre-wrap` para preservar quebras de linha. **Sem parser de markdown.** Sem upload de anexos.
- **Autor (`author_id`)**: injetado pelo server com `actor.employee_id`; não é campo do form.

**Footer**:
- Cancelar (ghost).
- Salvar feedback (primary).

**Após sucesso**:
- Toast "Feedback registrado".
- Fecha sheet.
- Revalida: Kanban da vaga + perfil do candidato.
- Card no Kanban atualiza badge `💬 N` (count incrementa).

### 5.2 Caminhos de acesso (dois)

**Caminho 1: Card do Kanban → menu `⋮`**

Menu do card ganha 2 itens novos (antes das saídas laterais). Menu final na Onda 2:

```
↑ Mover para [etapa anterior]
↓ Mover para [próxima etapa]
───────
💬 Dar feedback                ← novo nesta Onda
───────
× Marcar desistente
× Marcar reprovado
❄ Congelar
✓ Marcar contratado            ← novo nesta Onda (admin_rh apenas)
```

Clique em "Dar feedback" abre FeedbackSheet com a aplicação do card.

**Caminho 2: Perfil do candidato**

Em `/recrutamento/candidatos/[id]`, seção "Aplicações" existente (Onda 1) ganha em cada card de aplicação:
- Botão "💬 Dar feedback" (secundário, ao lado dos metadados).

Clique abre FeedbackSheet contextualizado pra aquela aplicação.

**Importante**: em ambos os caminhos, a aplicação é pré-determinada pelo clique. Usuário nunca responde "qual aplicação?" dentro do form.

### 5.3 Seção "Feedbacks" no perfil do candidato

Nova seção no perfil, **depois** de "Aplicações" e **antes** de "Histórico". Ordem final das seções do perfil:

1. Dados pessoais
2. Aplicações
3. **Feedbacks** ← nova nesta Onda
4. Histórico

**Estrutura**:
- **Acordeão por aplicação**. Cada grupo mostra: nome da vaga (clickable pra `/recrutamento/vagas/[id]`), status da aplicação (badge colorido).
- **Default de abertura**:
  - Aplicações com `status='in_progress'` → **abertas**.
  - Aplicações terminadas (`hired`/`rejected`/`withdrawn`/`frozen`) → **fechadas**. Admin expande ao clicar.
- Dentro de cada grupo aberto, cards de feedback ordenados `created_at DESC` (mais recente no topo).

**Card de feedback**:

```
┌──────────────────────────────────────────────┐
│ Carlos Pereira · Entrevista Gestor      ⋮    │
│ há 2 dias                                    │
│                                              │
│ Fit técnico forte; precisa trabalhar         │
│ comunicação em apresentações. Recomendo      │
│ avançar mas com atenção na próxima etapa.    │
│                                              │
│ ✓ Recomenda avançar                          │
└──────────────────────────────────────────────┘
```

- Avatar de iniciais + nome do autor + etapa em que foi dado + timestamp relativo ("há 2 dias").
- Conteúdo em texto plano com `whitespace-pre-wrap` (preserva quebras de linha e alinhamentos).
- Badge de recomendação colorido na parte inferior: ✓ verde (advance), ? amarelo (doubt), × vermelho (reject). Sem badge se recommendation é `null`.
- Kebab `⋮` visível conforme regras:
  - **Autor dentro da janela 2h**: "Editar", "Deletar".
  - **Autor fora da janela 2h**: kebab oculto.
  - **Admin_rh** (sempre, exceto quando é o próprio autor — aí usa a regra do autor): "Deletar".

### 5.4 Badge no card do Kanban

Card do Kanban (componente `CandidateCard` da Onda 1) ganha, à direita do tempo-na-etapa, badge condicional:

```
┌─────────────────────────────┐
│ Maria Silva            ⋮   │
│ maria.s@gmail.com           │
│                             │
│ [LinkedIn]  2d    💬 3      │
└─────────────────────────────┘
```

- Renderizado **apenas se count ≥ 1**. Cards sem feedback NÃO mostram badge.
- `💬 {count}` — ícone + número de feedbacks não-deletados da aplicação.
- Tooltip no hover: "{N} feedbacks registrados".
- Clique no badge: navega pra `/recrutamento/candidatos/[id]?app=[applicationId]#feedbacks` → abre perfil direto na seção Feedbacks com aquela aplicação expandida.

### 5.5 Edição e deleção de feedback

**Editar** (form inline ou reabrir o Sheet):
- Visível apenas se `author_id = actor.employee_id` E `now() - created_at <= 2h` E `deleted_at IS NULL`.
- Form mostra `content` e `recommendation` editáveis; `stage_id` é imutável (não reapresentado).
- Ao salvar, `updated_at` é atualizado. RLS reforça janela de 2h (policy rejeita UPDATE fora da janela).

**Deletar (soft)**:
- Visível pro autor dentro da janela 2h (via kebab `⋮` → "Deletar").
- Visível pro admin_rh a qualquer momento (via kebab).
- Ao confirmar: server action `deleteFeedback(id)` aplica `UPDATE deleted_at = now()`. Card some da lista.
- Evento `candidate_feedback.deleted` em `activity_logs` com metadata `{ feedback_id, candidate_name, job_title, deleted_by_admin: bool }`.

---

## 6. UI — Contratação

### 6.1 Gatilhos

**Gatilho 1**: admin arrasta card de qualquer etapa direto pra coluna "Contratado".
- Na Onda 1 essa ação mostrava toast bloqueando. Na Onda 2, agora abre o `HireCandidateDialog`.
- Se o usuário logado não for `admin_rh` (ex: gestor tenta), drop é bloqueado com toast "Contratação disponível apenas para admin RH".

**Gatilho 2**: admin clica kebab `⋮` → "Marcar contratado".
- Item aparece apenas quando `canHireCandidate(actor) === true` (admin_rh).

### 6.2 HireCandidateDialog

**Componente**: `HireCandidateDialog` em `src/features/recruitment/candidates/HireCandidateDialog.tsx`. Dialog shadcn — modal sobre o Kanban, backdrop leve (`rgba(0,0,0,0.4)`).

**Header**:
- Título: "Contratar [nome do candidato]".
- Badge verde: "Vira colaborador(a)".
- Subtítulo: "Vamos criar o cadastro de colaborador com base nos dados do processo seletivo. O histórico do candidato fica preservado."

**Body (form RHF + Zod)**:

#### Seção 1 — Dados pessoais (pré-preenchidos do candidato)

| Campo | Tipo | Obrigatório | Default |
|---|---|---|---|
| `name` | text | sim | `candidate.name` |
| `email` | email | sim | `candidate.email` |
| `phone` | text | não | `candidate.phone` |

#### Seção 2 — Dados do colaborador (derivados da vaga)

| Campo | Tipo | Obrigatório | Default |
|---|---|---|---|
| `position_id` | select | sim | `job_opening.position_id` (pode ser null; nesse caso admin escolhe) |
| `department_id` | select | sim | `job_opening.department_id` |
| `manager_id` | select | não | `job_opening.hiring_manager_id` |
| `hired_at` | date | sim | hoje |
| `level` | text | não | — |

#### Seção 3 — Outras aplicações ativas (condicional)

**Só aparece se** o candidato tem outras aplicações com `status='in_progress'` além da atual.

Checkbox destacado (card com fundo amarelo claro, borda `#fed7aa`):

```
☑  Arquivar outras aplicações ativas · Maria também está ativa em:
   • Analista Jr (vaga)
   [DEFAULT LIGADO] · Se marcado, essas aplicações viram "Desistente"
   com motivo "aceitou outra proposta".
```

- Lista as outras aplicações por nome-da-vaga + etapa-atual.
- Checkbox começa **ligado**; admin pode desmarcar.
- Texto informativo explica a consequência.

**Footer**:
- Cancelar (ghost).
- Contratar e criar colaborador (primary, laranja).

### 6.3 Bloqueios do wizard

**Pré-check ao abrir o dialog** (server action `checkHireEligibility(applicationId)`):

**Bloqueio A — Candidato já contratado** (`candidate.hired_employee_id IS NOT NULL`):

Substitui o form por `ErrorState` dentro do mesmo dialog:

```
Candidato já foi contratado anteriormente
[Nome] foi contratado(a) em [data] (colaborador [status do employee]).

Para recontratar, crie um novo cadastro de candidato ou reative o
colaborador existente em Colaboradores.

[ Ver colaborador → ]  [ Cancelar ]
```

Admin pode sair, abrir o colaborador existente em nova aba, e decidir o caminho (fora do wizard).

**Bloqueio B — Email colide com colaborador existente** (validação no submit final):

Ao tentar confirmar o wizard, action valida `SELECT FROM employees WHERE company_id=? AND email=?`. Se encontrar, **mantém o wizard aberto** e mostra erro inline abaixo do campo email:

```
┌─────────────────────────────────────────────────────────┐
│ ⚠️  E-mail já em uso                                     │
│                                                         │
│ Já existe um colaborador com este e-mail:               │
│ Maria Souza (Financeiro).                               │
│                                                         │
│ Use um e-mail alternativo abaixo, ou verifique se é a   │
│ mesma pessoa.                                           │
│                                                         │
│ [ E-mail alternativo: _______ ]  [ Ver colaborador → ]  │
└─────────────────────────────────────────────────────────┘
```

- Input "Email alternativo" é pré-populado com o email atual e editável.
- Link "Ver colaborador →" abre `/colaboradores/[id]` em nova aba.
- Admin ajusta o email ali mesmo e clica "Contratar" de novo — os outros campos preservam valor.

### 6.4 Server action `hireCandidate`

Localização: `src/features/recruitment/actions/applications.ts`.

```ts
export async function hireCandidate(
  applicationId: string,
  input: HireCandidateInput,
): Promise<{ employeeId: string; applicationId: string } | ActionError>
```

Transação completa:

```
1. Check canHireCandidate(actor). Se não: 403.
2. Carrega application + candidate + job_opening.
3. Bloqueio A: se candidate.hired_employee_id IS NOT NULL → error 'CANDIDATE_ALREADY_HIRED' com hired_employee_id no payload.
4. Bloqueio B: checa employees.email existente → error 'EMAIL_ALREADY_EXISTS' com existing_employee { id, name, department } no payload.
5. INSERT INTO employees (
     company_id, name, email, phone,
     position_id, department_id, manager_id,
     hired_at, status='ativo',
     user_id=NULL,           -- convite é manual depois (não automático)
     level=input.level,
     created_by=actor.user_id
   ) RETURNING id AS new_employee_id.
6. UPDATE candidates
     SET hired_employee_id = new_employee_id, updated_at = now()
     WHERE id = candidate_id.
7. SELECT stage with kind='hired_terminal' AND company_id=current → hired_terminal_id.
8. UPDATE job_applications
     SET status='hired', current_stage_id=hired_terminal_id, stage_entered_at=now(), updated_at=now()
     WHERE id=applicationId.
9. INSERT INTO candidate_stage_history (
     application_id, from_stage_id=<old_current>, to_stage_id=hired_terminal_id,
     status_change={from:'in_progress', to:'hired'},
     reason_code=NULL, reason_notes=NULL,
     changed_by=actor.user_id, changed_at=now()
   ).
10. SE input.archive_other_applications === true:
      SELECT other applications (ja.candidate_id=candidate AND ja.status='in_progress' AND ja.id != current).
      Para cada:
        UPDATE job_applications SET
          status='withdrawn', withdrawal_reason='aceitou_outra_proposta',
          updated_at=now()
        WHERE id=other.id.
        INSERT INTO candidate_stage_history (
          application_id=other.id, from_stage_id=other.current_stage_id, to_stage_id=NULL,
          status_change={from:'in_progress', to:'withdrawn'},
          reason_code='aceitou_outra_proposta',
          reason_notes='Arquivado automaticamente na contratação em [vaga].',
          changed_by=actor.user_id, changed_at=now()
        ).
        logActivity('application.withdrawn', metadata={auto: true, triggered_by_hire: applicationId, ...}).
11. logActivity('application.hired', metadata={application_id, candidate_name, job_title, employee_id=new_employee_id, archived_other_applications_count=N}).
12. logActivity('employee.created', metadata={employee_id, name, source: 'recruitment', source_application: applicationId, source_job_opening: job_opening_id}).
13. revalidatePath: '/recrutamento/vagas/[jobId]', '/recrutamento/candidatos/[candidateId]', '/colaboradores', '/colaboradores/[new_employee_id]'.
14. return { employeeId, applicationId }.
```

Transação Postgres — qualquer passo falha faz rollback; nenhum side effect parcial.

### 6.5 Link bidirecional

**Perfil do candidato contratado** (`/recrutamento/candidatos/[id]`):

Banner **proeminente** no topo (abaixo do título, antes das seções). Ocupa largura total do container, destaque visual:

```
┌────────────────────────────────────────────────────────────────┐
│ ✓ Contratado — agora é o colaborador Maria Silva               │
│   Contratado(a) em 01/05/2026 via "Analista de Suporte Jr"    │
│   [ Abrir perfil do colaborador → ]                            │
└────────────────────────────────────────────────────────────────┘
```

- Cor de destaque verde.
- Link leva a `/colaboradores/[hired_employee_id]`.
- Botão "+ Vincular a vaga" (que existe no perfil do candidato geral) é **ocultado** quando `hired_employee_id IS NOT NULL` — candidato contratado não vincula mais a vagas.

**Perfil do colaborador criado** (`/colaboradores/[id]`):

Badge **discreto** no header, junto aos outros metadados (cargo, depto, gestor, email). Não é banner, não rouba atenção:

```
Maria Silva
Analista de Suporte Jr · Suporte · Gestor: Carlos Pereira
📥 via recrutamento · 01/05/2026      ← pill com link
```

- Pill pequeno com ícone, texto curto, clickable.
- Clique abre `/recrutamento/candidatos/[candidate_id]` em nova aba.
- Tooltip no hover: "Contratado(a) via processo seletivo Analista de Suporte Jr".
- **Só renderiza** se `existe candidate WHERE hired_employee_id = employee.id` (query `getRecruitmentSourceForEmployee`).

**Query nova em `features/employees/queries.ts`**:

```ts
export async function getRecruitmentSourceForEmployee(employeeId: string): Promise<{
  candidateId: string;
  jobOpeningId: string;
  jobTitle: string;
  hiredAt: string;
} | null>
```

### 6.6 Após contratação — onde o card aparece

- **Card some do Kanban principal** (filtro `status='in_progress'` da query do Kanban já exclui).
- **Aparece na aba "Finalizados"** (renomeada de "Arquivados" — ver seção 14) da vaga, com badge verde **"Contratado"**.
- Linha na tabela mostra: Candidato · Origem · Saiu em (stage antes de Contratado) · Status (Contratado) · Data.

---

## 7. Server actions — resumo

Arquivo: `src/features/recruitment/actions/feedbacks.ts` (novo).

```ts
export async function createFeedback(input: FeedbackInput): Promise<{ id: string } | ActionError>
export async function updateFeedback(id: string, input: Partial<FeedbackInput>): Promise<ActionOk | ActionError>
// updateFeedback rejeita se: autor != actor OR created_at < now() - 2h.
// Admin_rh NÃO edita feedback de outros — apenas deleta.
export async function deleteFeedback(id: string): Promise<ActionOk | ActionError>
// deleteFeedback autoriza: (autor AND created_at > now() - 2h) OR role=admin_rh.
```

Arquivo: `src/features/recruitment/actions/applications.ts` (estende o da Onda 1).

```ts
export async function hireCandidate(applicationId: string, input: HireCandidateInput): Promise<{ employeeId: string; applicationId: string } | ActionError>
export async function checkHireEligibility(applicationId: string): Promise<
  | { ok: true }
  | { ok: false; reason: 'CANDIDATE_ALREADY_HIRED'; hiredEmployeeId: string; hiredAt: string }
  | { ok: false; reason: 'EMAIL_ALREADY_EXISTS'; existingEmployee: { id: string; name: string; department: string | null } }
>
```

Arquivo: `src/features/employees/queries.ts` (estende).

```ts
export async function getRecruitmentSourceForEmployee(employeeId: string): Promise<{
  candidateId: string;
  jobOpeningId: string;
  jobTitle: string;
  hiredAt: string;
} | null>
```

---

## 8. Permissions (delta da Fundação)

Funções `can*` da Fundação já cobrem tudo. Checks desta Onda:

- **Criar feedback**: `canGiveFeedback(actor, applicationId)` (admin_rh ou gestor da vaga).
- **Editar feedback**: autor + dentro de 2h (lógica no action; RLS reforça via policy).
- **Deletar feedback**: (autor + dentro de 2h) OR admin_rh. Admin usa service client na action; RLS permite via policy `candidate_feedbacks_soft_delete_admin`.
- **Contratar**: `canHireCandidate(actor)` (admin_rh apenas).

Coluna "Contratado" vira ativa apenas para admin (UI mostra drop enabled; gestor continua bloqueado com toast "Contratação disponível apenas para admin RH" se tentar).

---

## 9. Auditoria — eventos novos

| Action | Quando | Metadata |
|---|---|---|
| `candidate_feedback.created` | createFeedback | `{ feedback_id, candidate_name, job_title, stage_name, author_name, recommendation }` |
| `candidate_feedback.deleted` | deleteFeedback (soft) | `{ feedback_id, candidate_name, job_title, deleted_by_admin: bool }` |
| `application.hired` | hireCandidate | `{ application_id, candidate_name, job_title, employee_id, archived_other_applications_count }` |
| `employee.created` (existente) | dentro de hireCandidate | `{ employee_id, name, source: 'recruitment', source_application, source_job_opening }` |
| `application.withdrawn` (existente) | hireCandidate com archive_other=true | `{ application_id, candidate_name, job_title, reason: 'aceitou_outra_proposta', auto: true, triggered_by_hire }` |

`humanizeActivityMetadata` em `src/lib/activity.ts` estende os switch-cases:
- "Feedback registrado: Maria Silva · Entrevista Gestor · por Carlos Pereira"
- "Feedback removido: Maria Silva · Analista de Suporte Jr (por admin)"
- "Contratado(a): Maria Silva → Analista de Suporte Jr (3 outras aplicações arquivadas)"

---

## 10. Notificações — delta

**Nenhum novo tipo de notificação é ativado nesta Onda.**

- `recruitment.candidate_in_manager_stage` (Onda 1) continua disparando normalmente.
- `recruitment.feedback_requested` — declarado na Fundação §9, **fica dormente nesta Onda** (feature "Pedir feedback de…" não entra — pós-MVP). Sem disparo, sem UI, sem modal.

---

## 11. Comportamento da coluna "Contratado" — mudanças pra Onda 2

| Aspecto | Onda 1 | Onda 2 |
|---|---|---|
| Coluna visível | sim | sim |
| Tom visual | cinza-claro inativa | ativa (destaque verde suave quando há cards) |
| Drop permitido | não (toast bloqueio) | sim, **se actor é admin_rh** — dispara wizard |
| Drop por gestor | não | não (toast "Contratação disponível apenas para admin RH") |
| Menu kebab "Marcar contratado" | oculto | visível pra admin_rh |
| Cards após contratação | — | somem do Kanban principal; aparecem na aba "Finalizados" com badge verde "Contratado" |

---

## 12. Testes

### Unit

- `features/recruitment/feedbacks/schema.test.ts`: `FeedbackInput` com content 10-3000 chars; recommendation enum opcional; rejeita conteúdos fora de range.
- `features/recruitment/feedbacks/permissions.test.ts`: admin dá feedback em qualquer vaga; gestor só nas suas; director/colaborador nunca.
- `features/recruitment/actions/feedbacks.test.ts`:
  - `updateFeedback` rejeita fora da janela 2h.
  - `updateFeedback` rejeita se actor != autor.
  - `deleteFeedback` aceita autor dentro da janela.
  - `deleteFeedback` aceita admin_rh a qualquer momento (mesmo sobre feedback de outro autor).
  - `deleteFeedback` rejeita autor fora da janela.
- `features/recruitment/actions/applications.test.ts` estendido:
  - `hireCandidate` bloqueia quando `hired_employee_id IS NOT NULL`.
  - `hireCandidate` bloqueia quando email colide.
  - `hireCandidate` arquiva outras aplicações quando `archive_other=true`.
  - `hireCandidate` NÃO arquiva quando `archive_other=false`.
  - Transação faz rollback se insert employee falha.
- `features/employees/queries.test.ts`: `getRecruitmentSourceForEmployee` retorna dados corretos; retorna null quando employee não veio de recrutamento.

### Integração (manual, documentada)

- Gestor tenta criar feedback em vaga de outro gestor → bloqueio RLS.
- Gestor tenta arrastar card pra "Contratado" → toast bloqueio, drop não executa.
- Admin contrata candidato Maria que tem 2 outras aplicações → após confirmar com checkbox ligado, as 2 outras aparecem em "Finalizados" como "Desistente (aceitou outra proposta)".
- Admin tenta contratar candidato com `hired_employee_id` setado → ErrorState; link leva ao colaborador antigo.
- Admin confirma contratação com email conflitante → wizard mantém campos, mostra erro inline com input de email alternativo; admin digita novo email e confirma com sucesso.
- Perfil do candidato contratado mostra banner + oculta "Vincular a vaga"; perfil do colaborador mostra badge discreto clickable.

---

## 13. Critérios de aceite

### Feedback
1. Admin cria feedback via card do Kanban → aparece na seção Feedbacks do perfil + badge `💬 1` no card.
2. Admin cria feedback via botão na seção Aplicações do perfil → mesmo resultado.
3. Gestor de vaga cria feedback em candidato da sua vaga; gestor NÃO consegue criar em candidato de vaga de outro gestor (RLS bloqueia).
4. Autor edita feedback dentro de 2h; depois de 2h, UI não mostra "Editar" (e UPDATE via RLS falha).
5. Autor deleta próprio feedback dentro de 2h; depois de 2h, UI não mostra "Deletar" pro autor.
6. Admin_rh deleta feedback de outro autor a qualquer momento; evento loga `candidate_feedback.deleted` com `deleted_by_admin: true`.
7. Perfil do candidato mostra feedbacks agrupados por aplicação: aplicação ativa aberta por default, terminadas colapsadas.
8. Dentro de cada grupo, feedbacks ordenados `created_at DESC`.
9. Cada card mostra autor, etapa, timestamp relativo, conteúdo com quebras de linha preservadas (texto plano), e recomendação colorida se presente.
10. Card do Kanban mostra badge `💬 N` **apenas se count ≥ 1**; card sem feedback não tem badge.
11. Clique no badge do card navega pra perfil na seção Feedbacks com aquela aplicação expandida.

### Contratação
12. Admin arrasta card de "Proposta" pra "Contratado" → `HireCandidateDialog` abre com dados pré-preenchidos (nome/email/telefone do candidato; cargo/depto/gestor da vaga; data=hoje).
13. Admin confirma → employee criado com `user_id=NULL`, candidato marcado (`hired_employee_id=new_employee_id`), aplicação `status='hired'`, stage_history inserido, toast "Contratado(a) com sucesso".
14. Gestor tenta arrastar pra "Contratado" → drop bloqueado, toast "Contratação disponível apenas para admin RH".
15. Candidato com outras 2 aplicações ativas, checkbox ligado → as 2 outras aparecem em "Finalizados" com status Desistente + motivo "aceitou outra proposta".
16. Candidato com outras aplicações ativas, checkbox desligado → outras aplicações permanecem `in_progress`.
17. Admin tenta contratar candidato que já tem `hired_employee_id` → dialog mostra ErrorState com link pro colaborador antigo; form não aparece; botão "Cancelar" fecha o dialog.
18. Admin submete com email que colide com employee existente → wizard mantém campos preenchidos; erro inline mostra nome+depto do colaborador conflitante + input "Email alternativo" editável + link "Ver colaborador".
19. Admin digita email alternativo e confirma → contratação completa com sucesso.
20. Perfil do candidato contratado mostra banner verde proeminente "É o colaborador [nome]" no topo; botão "+ Vincular a vaga" é ocultado.
21. Perfil do colaborador criado mostra badge discreto "📥 via recrutamento · [data]" no header, clickable para abrir o candidato em nova aba.
22. Após contratação, card some do Kanban principal; aparece em "Finalizados" com badge verde "Contratado".

### Aba "Finalizados" (renomeada)
23. Aba no detalhe da vaga chama-se "Finalizados" (não mais "Arquivados").
24. Aba mostra aplicações com `status IN ('hired', 'rejected', 'withdrawn', 'frozen')`.
25. Badge de status colorido por cada caso: verde "Contratado", vermelho "Reprovado", amarelo "Desistente", azul "Congelado".

### Auditoria
26. `/configuracoes/auditoria` mostra eventos `candidate_feedback.created`, `candidate_feedback.deleted`, `application.hired`, `employee.created` (com `source: 'recruitment'`), `application.withdrawn` (com `auto: true`) após contratação com archive_other.
27. Humanização dos eventos retorna strings pt-BR corretas.

### Notificações
28. Nenhum tipo novo de notificação é disparado nesta Onda (confirma que `recruitment.feedback_requested` NÃO dispara — feature postponed).
29. `recruitment.candidate_in_manager_stage` da Onda 1 continua disparando normalmente.

### Regressão
30. Todos os testes da Fundação + Onda 1 continuam verdes.
31. DnD, saídas laterais, filtros, busca do Kanban (Onda 1) continuam funcionando; único comportamento mudado é o da coluna "Contratado" (ativa para admin, bloqueada para gestor).

---

## 14. Ajuste retroativo ao spec 14 (Onda 1)

O spec 14 foi commitado antes desta decisão e precisa dos seguintes ajustes textuais ao ser implementado:

| Referência no spec 14 | Mudar de | Para |
|---|---|---|
| §2 "Escopo dentro" | Aba "Arquivados" na vaga | Aba "Finalizados" na vaga |
| §5.3 "Tabs" (detalhe da vaga) | `Kanban / Arquivados / Detalhes` | `Kanban / Finalizados / Detalhes` |
| §5.6 "Tab Arquivados" | Título da seção | "Tab Finalizados" |
| §13 "Critérios de aceite" #21 | aba "Arquivados" | aba "Finalizados" |

O conteúdo e o comportamento da aba da Onda 1 não mudam (continua mostrando rejected/withdrawn/frozen). A renomeação acontece já na Onda 1 para evitar inconsistência visual quando a Onda 2 adicionar o status `hired`.

**Implementação**: ao codar a Onda 1, usar "Finalizados" como label desde o início. Ao codar a Onda 2, apenas expandir a query da aba para incluir `status='hired'` e adicionar o badge verde.

---

## 15. Riscos e decisões em aberto

### Riscos

- **Edição de feedback após 2h**: se admin pedir pra editar feedback antigo do próprio, regra bloqueia. Deve reavaliar após 1 mês em produção.
- **Admin não pode editar feedback de outros (só deletar)**: se houver conteúdo com erro pequeno e autor não disponível, admin só consegue deletar; autor precisa recriar. Aceito no MVP.
- **Email duplicado em recontratação**: bloqueio B força email alternativo; cliente com política de "email único" tem dor. Mitigação: promover feature de recontratação formal pós-MVP.

### Decisões em aberto (pra ondas futuras ou reavaliação)

- **"Pedir feedback de…"** (notificação direcionada): postponed; ativar quando houver demanda real.
- **Toggle "Mostrar contratados" no Kanban**: não entra; abrir em Onda 3 se cliente reportar que "Finalizados" não é suficiente pra consultar contratações recentes sem sair da vaga.
- **Comentários encadeados em feedback**: postponed; reavaliar se cliente pedir thread de discussão.

---

## 16. Dependências

| Feature | Uso |
|---|---|
| Fundação | `job_applications`, `candidates`, `recruitment_stages`, `candidate_stage_history`, RLS, permissions |
| Onda 1 | Kanban, CandidateCard, menu kebab, drop handlers, aba "Finalizados" (renomeada) |
| FT-1 (Colaboradores) | `employees.INSERT`, link bidirecional, lista de employees no select de manager_id |
| FT-1 (Departamentos / Cargos) | selects no wizard |
| `src/lib/activity.ts` | novos actions + labels + humanize |
| `src/features/notifications/` | sem novo tipo ativado (feedback_requested segue dormente) |

---

## 17. Resumo das decisões desta Onda (perguntas granulares P17, P19–P31)

| # | Decisão | Escolha |
|---|---|---|
| P17 | Wizard de contratação | Modal com formulário único |
| P19 | Outras aplicações ativas ao contratar | Checkbox default ligado, arquiva como "aceitou outra proposta" |
| P20 | Candidato com `hired_employee_id` setado | Bloqueia recontratação sempre |
| P21 | Campos do feedback | Minimalista — content + recommendation opcional + stage auto |
| P22 | Janela de edição | 2h (igual FT-3) |
| P23 | Caminhos pro FeedbackSheet | Ambos — kebab do Kanban + card de aplicação no perfil |
| P24 | Organização no perfil | Agrupado por aplicação; ativa aberta, terminadas colapsadas |
| P25 | Formatação do conteúdo | Texto plano (coerente com FT-3; `whitespace-pre-wrap`) |
| P26 | Indicador no card do Kanban | Badge `💬 N` condicional (só se count ≥ 1) |
| P27 | Feature "Pedir feedback de..." | **Fora da Onda 2** — pós-MVP; notificação fica dormente |
| P28 | Aba pós-contratação | **Renomear "Arquivados" → "Finalizados"** (ajuste retroativo no spec 14) |
| P29 | Link bidirecional colaborador ↔ candidato | Misto — banner no candidato, badge discreto no colaborador |
| P30 | Email duplicado no wizard | Erro inline no modal com sugestão integrada |
| P31 | Deletar feedback | Autor (janela 2h) + admin_rh sempre |
