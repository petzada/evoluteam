# FT-7 · Sheet "Ver perfil" no Kanban

Data: 2026-04-21
Escopo: Recrutamento
Status: aprovado, pronto pra implementação

## 1. Objetivo

Permitir que usuário veja e aja sobre **feedbacks, scorecards e tarefas** de um candidato
**dentro do contexto da vaga atual**, sem sair do Kanban da vaga.

Hoje, pra acessar essas informações, é preciso sair do Kanban, ir em `/recrutamento/candidatos`,
buscar o candidato e abrir o perfil completo. Isso quebra o fluxo de trabalho de quem está
movendo candidatos no funil.

## 2. Solução

Novo Sheet lateral (drawer direita) chamado **`CandidateQuickSheet`**, disparado por um novo
item `"Ver perfil"` no dropdown kebab do card do Kanban, posicionado **abaixo** de
`"Marcar contratado"`.

### 2.1. Layout aprovado (V5)

- **Largura:** 640px (`side="right"` do shadcn/ui Sheet).
- **Header** (flex-shrink-0, border-bottom):
  - Nome do candidato (18px, font-bold).
  - E-mail (12px, text-muted-foreground).
  - Linha de contexto: `Título da vaga · badge da etapa atual`. Badge usa tons de laranja (`bg-orange-50 text-orange-700 border-orange-200`).
  - Botão X de fechar no canto superior direito.
  - **Sem avatar, sem stats.** Contagens ficam nas tabs.
- **Tabs horizontais** (logo abaixo do header, border-bottom):
  - `Feedbacks (N) · Scorecards (M) · Tarefas (K)`.
  - Tab ativa: underline laranja + texto `text-orange-700 font-semibold`.
- **Body** (`flex-1 overflow-y-auto`): lista de itens da aba ativa.
- **Footer sticky** (border-top, padrão Sheet do produto):
  - `[+ Tarefa] [+ Scorecard] [Dar feedback]` alinhados à direita.
  - "Dar feedback" é o primário laranja (`bg-primary text-primary-foreground`).
  - Os outros dois são ghost (`variant="outline"`).

### 2.2. Escopo intencionalmente contextual

O Sheet mostra **apenas** os feedbacks/scorecards/tarefas **daquela `application_id`**
(candidato × vaga específica). Intencionalmente **não** expõe:

- Aba "Dados" do candidato.
- Lista de outras aplicações do candidato (histórico em outras vagas).
- Histórico de etapas (stage history).

Quem quiser o perfil completo do candidato continua com o link existente `/recrutamento/candidatos/[id]`.

## 3. Arquitetura

### 3.1. Componente novo

`src/features/recruitment/components/CandidateQuickSheet.tsx`

**Props:**

```ts
interface CandidateQuickSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  application: ApplicationRow;          // application_id + dados básicos
  feedbacks: CandidateFeedbackRow[];    // já filtrado pela app
  scorecards: ScorecardRow[];           // já filtrado pela app
  tasks: TaskRow[];                     // já filtrado pela app
  currentEmployeeId: string | null;
  isAdmin: boolean;
  canGiveFeedback: boolean;             // já resolvido pela hierarquia de permissões
  canManageTasks: boolean;
  responsibleOptions: { id: string; full_name: string }[];
}
```

**Estado interno:**
- `activeTab: 'feedbacks' | 'scorecards' | 'tasks'`
- Sub-sheets/dialogs já existentes (`FeedbackSheet`, `ScorecardSheet`, `TaskDialog`) são
  renderizados dentro do QuickSheet e acionados pelos CTAs do footer + edição inline.

### 3.2. Reaproveitamento

Os cards de item (feedback/scorecard/task) **reusam** a renderização visual já existente em:
- `FeedbacksSection.tsx` → extrair o sub-componente `FeedbackCard` (linhas 219-276) para
  um arquivo próprio (`FeedbackCard.tsx`) e consumir de ambos os contextos.
- `ScorecardsSection.tsx` → extrair `SingleScorecardCard` e `ComparisonTable` para
  `ScorecardCards.tsx`.
- `TasksSection.tsx` → extrair `TaskRow` para `TaskRow.tsx`.

**Razão da extração:** hoje esses cards estão acoplados ao accordion por aplicação (padrão
multi-vaga do perfil full). No QuickSheet não há accordion — é uma única aplicação — então
precisamos dos cards "flat". Extrair em componentes compartilhados evita duplicação e mantém
o visual consistente entre os dois contextos.

### 3.3. Integração com Kanban

Em `src/features/recruitment/components/Kanban.tsx`:

1. Adicionar item `"Ver perfil"` no `DropdownMenuContent` do card, depois de
   `"Marcar contratado"` (linha ~437). Ícone: `Eye` ou `UserCircle` do lucide.
2. Estado novo no componente `Kanban`: `quickSheetState: { open: boolean; applicationId: string | null }`.
3. Click em "Ver perfil" → abre o sheet com a `application` atual.
4. Renderizar `<CandidateQuickSheet />` no final do componente `Kanban` (junto com os outros
   dialogs).

### 3.4. Data flow

**Fonte dos dados:** o componente `Kanban` já recebe `feedbackCounts` e `scorecardCounts`
e `taskStates` via props. Mas os **dados completos** dos feedbacks/scorecards/tasks não vêm
hoje (só as contagens). Precisamos trazer as listas.

**Opções consideradas:**

- **A — Trazer tudo do SSR:** o `JobOpeningDetail` (Server Component) já busca as applications;
  adicionar queries paralelas para `listFeedbacksByJob(jobOpeningId)`,
  `listScorecardsByJob(jobOpeningId)`, `listTasksByJob(jobOpeningId)`. Passar via props
  pro `Kanban`. Filtragem por `applicationId` acontece no client (Map com chave `appId`).
- **B — Lazy load no click:** ao clicar "Ver perfil", chamar server action
  `getApplicationDetail(applicationId)` que retorna os 3 arrays. Spinner enquanto carrega.

**Decisão: A.** Motivos:
- Vagas têm no máx ~30 candidatos ativos; as tabelas de feedback/scorecard/task são pequenas
  (total na ordem de centenas de linhas no pior caso).
- Evita spinner na abertura do Sheet — UX mais fluida.
- SSR pré-hidrata tudo; click abre instantaneamente.
- Se o volume crescer no futuro (>1000 apps), migração pra B é trivial.

### 3.5. Queries novas

Em `src/features/recruitment/queries/`:

```ts
// queries/feedbacks.ts
export async function listFeedbacksByJob(jobOpeningId: string): Promise<CandidateFeedbackRow[]>

// queries/scorecards.ts
export async function listScorecardsByJob(jobOpeningId: string): Promise<ScorecardRow[]>

// queries/tasks.ts
export async function listTasksByJob(jobOpeningId: string): Promise<TaskRow[]>
```

Filtro: `WHERE application_id IN (SELECT id FROM job_applications WHERE job_opening_id = $1)`
+ `deleted_at IS NULL` (para feedbacks/scorecards/tasks que têm soft delete).

### 3.6. Server actions

**Nenhuma nova.** Os CTAs do footer disparam os dialogs/sheets que já existem:
- `Dar feedback` → `FeedbackSheet` existente (usa `createFeedback`).
- `+ Scorecard` → `ScorecardSheet` existente (usa `createScorecard`).
- `+ Tarefa` → `TaskDialog` existente (usa `createTask`).

Após submit, `router.refresh()` recarrega o SSR do `JobOpeningDetail`, que repassa as listas
atualizadas para o `Kanban`, que repassa pro `CandidateQuickSheet`.

## 4. Estados e permissões

### 4.1. Empty states (por aba)

- Feedbacks vazio: "Nenhum feedback registrado ainda." (igual ao `FeedbacksSection`).
- Scorecards vazio: "Nenhum scorecard registrado ainda."
- Tarefas vazio: "Nenhuma tarefa ainda."

### 4.2. Permissões

Mesmas regras já aplicadas em `CandidateProfile`:

- **Admin RH (`admin_rh`):** vê e gerencia tudo.
- **Gestor da vaga (`employee_id === hiring_manager_id`):** vê tudo; pode dar feedback,
  preencher scorecard, criar tarefa, editar os próprios dentro da janela de 2h.
- **Outros usuários:** não chegam nesse Sheet (o kebab do card do Kanban já filtra isso;
  o item "Ver perfil" só aparece pra quem tem `canGiveFeedback || isAdmin`).

### 4.3. Edição inline

Cada item (feedback/scorecard/task) tem seu próprio kebab com opções de editar/remover,
respeitando:
- **Feedback/Scorecard:** autor pode editar dentro de 120min (`FEEDBACK_EDIT_WINDOW_MINUTES` /
  `SCORECARD_EDIT_WINDOW_MINUTES`). Admin sempre pode deletar.
- **Tarefa:** admin e criador podem editar/deletar. Qualquer um com escopo pode toggle
  concluída.

Essas lógicas já existem nos componentes-fonte; ao extrair pra componentes compartilhados
elas vêm juntas.

## 5. Critérios de aceite

- [ ] No kebab do card do Kanban, item "Ver perfil" aparece **abaixo** de "Marcar contratado".
- [ ] Clicar abre Sheet de 640px da direita com header (nome · email · vaga · badge etapa).
- [ ] Tabs "Feedbacks (N) · Scorecards (M) · Tarefas (K)" com contador refletindo dados da
      `application_id` específica.
- [ ] Navegação entre tabs sem perder rolagem da página principal.
- [ ] Aba Feedbacks mostra lista filtrada pela aplicação; edição dentro de 2h para autor;
      delete para admin/autor.
- [ ] Aba Scorecards mostra comparação de múltiplos avaliadores quando ≥2 na mesma etapa.
- [ ] Aba Tarefas permite marcar como concluída, reabrir, editar, deletar segundo regras
      vigentes.
- [ ] Footer sticky com 3 botões: `[+ Tarefa] [+ Scorecard] [Dar feedback]`.
- [ ] `Dar feedback` abre `FeedbackSheet` existente pré-configurado com `applicationId`
      + contexto da aplicação (candidato, vaga, etapa). Após salvar, lista atualiza.
- [ ] `+ Scorecard` análogo com `ScorecardSheet`.
- [ ] `+ Tarefa` análogo com `TaskDialog`.
- [ ] Fecha por: clique no X, clique fora (overlay), ESC.
- [ ] Kanban permanece visível (borrado pelo overlay padrão) atrás do Sheet.
- [ ] Item "Ver perfil" só aparece pra quem tem permissão (admin_rh OR hiring_manager da vaga).

## 6. Fora de escopo

- Aba "Dados" do candidato (ir ao perfil completo via link externo se quiser editar).
- Aba "Histórico" de etapas.
- Aba "Aplicações" (outras vagas do mesmo candidato).
- Avatar/iniciais no header (descartado no brainstorm).
- Indicador de tarefa atrasada no header (fica dentro da aba Tarefas, chip vermelho `-Nd`
  que já existe no `TaskRow`).
- Navegação prev/next entre candidatos direto do Sheet (usuário fecha e clica no próximo
  card do Kanban).

## 7. Edge cases

- **Etapa final (hired_terminal):** Sheet funciona normalmente, mas "Dar feedback" continua
  disponível (útil pra registrar nota pós-contratação). As RLS atuais já permitem.
- **Application arquivada (status != in_progress):** "Ver perfil" está disponível? Hoje
  o Kanban só mostra applications `in_progress`. Aplicações arquivadas vivem na aba
  "Finalizados" do `JobOpeningDetail` → fora do escopo inicial. A tabela
  `ArchivedApplicationsTable.tsx` não recebe o mesmo tratamento de agora.
- **Múltiplos feedbacks/scorecards criados em rápida sucessão:** `router.refresh()` é
  suficiente; não há race condition porque cada submit é server action sequencial.
- **Permissão muda durante a sessão:** improvável, mas se o usuário for despromovido
  enquanto o Sheet está aberto, a próxima ação vai falhar com erro da server action
  (comportamento atual, aceitável).

## 8. Não-decisões explicitamente adiadas

- Navegação prev/next dentro do Sheet (item de backlog).
- Cache client-side das listas pra evitar re-fetch SSR completo após cada submit
  (atual funciona bem até ~30 candidatos ativos por vaga).
- Deeplink pro Sheet (ex.: `?quickSheet=<appId>` no URL). Fora de escopo — abertura
  é sempre via ação do usuário.

## 9. Arquivos tocados (preview)

**Novos:**
- `src/features/recruitment/components/CandidateQuickSheet.tsx`
- `src/features/recruitment/components/cards/FeedbackCard.tsx` (extração)
- `src/features/recruitment/components/cards/ScorecardCards.tsx` (extração)
- `src/features/recruitment/components/cards/TaskRow.tsx` (extração)

**Modificados:**
- `src/features/recruitment/components/Kanban.tsx` — novo estado + item de menu.
- `src/features/recruitment/components/FeedbacksSection.tsx` — consome `FeedbackCard`.
- `src/features/recruitment/components/ScorecardsSection.tsx` — consome `ScorecardCards`.
- `src/features/recruitment/components/TasksSection.tsx` — consome `TaskRow`.
- `src/features/recruitment/queries/feedbacks.ts` — nova `listFeedbacksByJob`.
- `src/features/recruitment/queries/scorecards.ts` — nova `listScorecardsByJob`.
- `src/features/recruitment/queries/tasks.ts` — nova `listTasksByJob`.
- `src/app/(app)/recrutamento/vagas/[id]/page.tsx` — buscar 3 listas + passar props.
- `src/features/recruitment/components/JobOpeningDetail.tsx` — repassar props pro
  `Kanban`.
