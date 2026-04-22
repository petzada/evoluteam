# Auditoria FT-7 — Funil de Recrutamento
_Data: 2026-04-21_

Confronto ponto-a-ponto entre as specs em `docs/features/new-module/FT-7*.md` e a codebase atual (módulo `src/features/recruitment/` + rotas `src/app/(app)/recrutamento/`). Escopo: **visualização**, sem implementar correções.

Legenda: ✅ implementado · ⚠️ parcial ou divergente · ❌ ausente

---

## Resumo executivo

O módulo está **funcionalmente completo em ~95% das user stories do PRD**. Arquitetura alinhada com a spec (fluxo Vaga → Candidato → Aplicação → Funil → Feedback/Scorecard/Tarefa → Contratação → Colaborador). Todas as 8 tabelas conceituais existem no schema. As três ondas (Onda 1 Vagas+Candidatos+Etapas, Onda 2 Feedback+Hire, Onda 3 Scorecard+Tasks+Métricas) foram commitadas e as correções pós-auditoria (#1, #3a, #3b, #4 + padronização de UX do perfil do candidato) também.

**Gaps identificados (em ordem de prioridade):**

| # | Gap | Prioridade | Story afetada |
|---|---|---|---|
| G1 | **Filtros ausentes na tabela de Vagas** (status, departamento, responsável) | Alta | FT-7.1 |
| G2 | **Filtros ausentes no Kanban da vaga** (etapa, origem, responsável, parados >N dias) | Média | FT-7.3 |
| G3 | Busca de candidatos **não cobre telefone** — só nome/e-mail | Baixa | FT-7.2 |
| G4 | Ação "Arquivar vaga" existe no backend mas **não está exposta na UI** — só Pausar/Fechar/Cancelar | Baixa | FT-7.1 |
| G5 | Métricas agrupam **"reprovados + desistentes"** numa coluna só no hovercard do funil — spec pede **taxas separadas** | Baixa | FT-7.5 |
| G6 | Migration `20260620_0001_ft7_onda1_notifies_hiring_manager.sql` **pode não estar aplicada no Supabase do usuário** (flagged na memória do projeto) | Bloqueante se não aplicada | FT-7.3 / FT-7.5 |

**Nada bloqueante no comportamento do produto principal.** Os gaps G1 e G2 afetam escala (20+ vagas ou 30+ candidatos por vaga já pedem filtro). Os demais são ajustes pequenos.

---

## FT-7.1 — Vagas

| Story | Status | Evidência |
|---|---|---|
| Criar vaga | ✅ | `createJobOpening` em `src/features/recruitment/actions/jobOpenings.ts:24` |
| Editar vaga | ✅ | `updateJobOpening` idem:68 |
| Arquivar vaga | ⚠️ | `archiveJobOpening` existe (jobOpenings.ts:160) mas chama `changeJobStatus('cancelled')`; **UI só mostra Pausar / Fechar / Cancelar** — não existe item "Arquivar" explícito em `JobOpeningDetail.tsx:89-114`. Semântica coerente, mas ausente no vocabulário da UI. |
| Título, descrição, dept, gestor, posições, tipo, modalidade, localidade | ✅ | `JobOpeningInputSchema` em schema.ts:128 + migration `20260615_0001_ft7_stages_and_jobs.sql` |
| Status da vaga (open, paused, closed, cancelled) | ✅ | Enum `job_opening_status` + `JOB_OPENING_STATUSES`. Obs: a spec lista `draft` como valor possível no rodapé, mas a user story explicita só 4 valores — sem gap real. |
| Listar todas as vagas | ✅ | `JobOpeningsTable.tsx` |
| **Filtrar vagas por status, departamento e responsável** | ❌ | `JobOpeningsTable.tsx:27-113` não tem nenhum controle de filtro — renderiza lista bruta. |

**Ação sugerida (G1):** adicionar em `JobOpeningsTable.tsx` uma barra de filtros (padrão `CandidatesTable.tsx:89-118`) com:
- `MultiSelectFilter` para Status (usar `JOB_OPENING_STATUSES` + `JOB_OPENING_STATUS_LABELS`),
- `MultiSelectFilter` para Departamento (props já recebem `departments`),
- `MultiSelectFilter` para Responsável / Hiring Manager (props já recebem `managers`),
- Input de busca por título (opcional).

**Ação sugerida (G4):** renomear na UI "Cancelar vaga" para "Arquivar vaga" **ou** adicionar item separado "Arquivar" no dropdown — alinha com vocabulário da spec.

---

## FT-7.2 — Candidatos

| Story | Status | Evidência |
|---|---|---|
| Cadastrar manualmente | ✅ | `createCandidate` em `src/features/recruitment/actions/candidates.ts` + rota `/recrutamento/candidatos/novo` |
| Editar dados | ✅ | `updateCandidate` + rota `/candidatos/[id]/editar` + `CandidateSheet.tsx` |
| Vincular candidato a uma vaga | ✅ | `linkCandidateToJob` (applications.ts:62) + `createAndLinkCandidate` (applications.ts:147) + `AddCandidateSheet.tsx` |
| Listar candidatos por vaga | ✅ | `JobOpeningDetail.tsx` aba Kanban mostra apps por vaga |
| **Buscar por nome, e-mail ou telefone** | ⚠️ | `CandidatesTable.tsx:48-60` filtra por `name` + `email`, **não testa `phone`** |
| Origem (9 valores) | ✅ | Enum `candidate_source`; todas as 9 origens batem com a spec |
| Observações internas | ✅ | Campo `notes` |
| Marcar desistente / reprovado | ✅ | `markApplicationWithdrawn` / `markApplicationRejected` (applications.ts:490, 503) |
| Marcar contratado + converter em colaborador | ✅ | `hireCandidate` (hire.ts:117) — cria employee, marca candidate.hired_employee_id, fecha app |
| Campos (name, email, phone, linkedin, resume, source, notes) | ✅ | Migration 0002 + schema.ts:141 |
| ~~status no candidate~~ | n/a | Spec lista `status` no candidate, mas código coloca status na `job_application`. **Decisão correta de modelagem** (um candidato pode ter N aplicações). Não conta como gap. |

**Ação sugerida (G3):** em `CandidatesTable.tsx:52-54`, estender o filtro para incluir `c.phone?.toLowerCase().includes(q)`. Duas linhas.

---

## FT-7.3 — Funil de Recrutamento

| Story | Status | Evidência |
|---|---|---|
| Kanban por etapa | ✅ | `Kanban.tsx` com dnd-kit |
| Mover entre etapas | ✅ | `moveApplicationStage` (applications.ts:268); bloqueia drop em `hired_terminal` e abre wizard |
| Registrar data de entrada na etapa | ✅ | Coluna `stage_entered_at` + badge "Xd" no card |
| Histórico de movimentação | ✅ | Tabela `candidate_stage_history` (append-only) + aba Histórico em `CandidateProfile.tsx:191-211` com `describeHistoryEvent` |
| Motivo de saída / desistência / reprovação | ✅ | Enums `withdrawal_reason` (9 valores) e `rejection_reason` (8 valores) batem com a spec; `ArchiveReasonDialog.tsx` captura motivo + "outro" |
| Saídas laterais: Desistente, Reprovado, **Congelado** | ✅ | Status `frozen` presente; ação "Congelar" no dropdown do card do Kanban (`Kanban.tsx:428`) |
| **Filtrar candidatos por etapa** | ⚠️ | Implícito — Kanban já mostra por coluna. Mas não tem filtro ativo (ex. esconder etapa X). |
| **Filtrar candidatos por origem** | ❌ | `Kanban.tsx` não tem nenhum filtro. Origem aparece no chip do card mas não filtra. |
| **Filtrar candidatos por responsável** | ❌ | Ausente no Kanban. (Existe no dashboard de relatórios como `ownerIds`.) |
| **Filtrar candidatos parados há muitos dias** | ⚠️ | Badge visual no card (`STALLED_THRESHOLD_DAYS = 5` → chip amarelo) + tabela no dashboard. **Não existe filtro no Kanban** que isole só os parados. |

**Ação sugerida (G2):** adicionar barra de filtros em `JobOpeningDetail.tsx` (antes das `Tabs`) ou dentro da aba Kanban:
- Input busca por nome de candidato
- `MultiSelectFilter` Origem
- Toggle "Apenas parados > 5d"
- (Responsável só faz sentido se a vaga tiver múltiplos hiring_managers — baixa prioridade)

---

## FT-7.4 — Feedbacks e Scorecards

| Story | Status | Evidência |
|---|---|---|
| Registrar feedback sobre candidato | ✅ | `createFeedback` + `FeedbackSheet.tsx` |
| Feedback vinculado a etapa | ✅ | Coluna `stage_id` em `candidate_feedbacks` |
| Dar nota em etapa | ✅ | Via scorecard (4 dimensões × 1-5) |
| Criar scorecard simples | ✅ | `ScorecardInputSchema` (schema.ts:214) + `ScorecardSheet.tsx` |
| Visualizar feedbacks anteriores | ✅ | `FeedbacksSection.tsx` agrupado por aplicação com accordion |
| Ver quem avaliou | ✅ | `author` join + exibição no card |
| **Comparar avaliações de RH e gestor** | ✅ | `ScorecardsSection.tsx:336-436` tem `ComparisonTable` com highlight de divergências (amarelo) quando ≥2 avaliadores na mesma etapa. **Implementação acima da spec.** |
| Scorecard: Comunicação, Experiência, Aderência, Fit cultural, Pretensão salarial, Comentário, Recomendação | ✅ | Todos os 7 campos presentes em `ScorecardInputSchema` + labels em `SCORECARD_DIMENSION_LABELS` |
| Janela de edição 2h | ✅ | `FEEDBACK_EDIT_WINDOW_MINUTES = SCORECARD_EDIT_WINDOW_MINUTES = 120` (decisões P22/P35) |

**Sem gaps.** Seção acima do esperado — comparação de scorecards com destaque de divergência é refinamento não explicitamente pedido pela spec.

---

## FT-7.5 — Métricas

| Story | Status | Evidência |
|---|---|---|
| Quantidade por etapa | ✅ | `getFunnel` + barra "Funil de conversão" |
| Taxa de conversão entre etapas | ✅ | `conversionFromFirst` + `conversionFromPrev` no hovercard |
| **Taxa de desistência por etapa** | ⚠️ | `rejectedOrWithdrawnCount` no hovercard **agrupa reprovados + desistentes** numa linha só. Spec pede separação. |
| **Taxa de reprovação por etapa** | ⚠️ | Idem — agrupado. |
| Tempo médio em cada etapa | ✅ | `getStageDurations` → `StageDurationsLollipop` + mediana no hovercard do funil |
| Tempo total médio até contratação | ✅ | KPI "Tempo até contratação" (mediana em dias) — `medianTimeToHireDays` |
| Origem dos candidatos | ✅ | `OriginsDualDonut` — duas rosquinhas (candidatos × contratados) |
| Origem dos contratados | ✅ | Donut direita |
| Candidatos parados por muitos dias | ✅ | Tabela "Candidatos parados > 5d" (via `getStalledCandidates`) |
| Filtrar por vaga | ✅ | `DashboardFilters` → MultiSelect Vagas |
| Filtrar por período | ✅ | Chips (7d/30d/90d/tudo) + Popover custom com calendário duplo |
| Filtrar por responsável | ✅ | MultiSelect "Responsável" (oculto para gestor) |
| KPIs: Total, Ativos, Contratados, Reprovados, Desistentes, Conversão geral, Desistência, Tempo até contratação, Etapa com maior abandono, Origem com maior conversão | ⚠️ | Dashboard tem **4 KPIs** (Ativos, Contratados, Tempo, Tarefas atrasadas). Faltam KPIs explícitos: Reprovados no período, Desistentes no período, Taxa de conversão geral, Etapa com maior abandono. Boa parte está inferível pelo funil + hovercard, mas não é "KPI em card". Não é exatamente um gap — é escopo mínimo enxuto que o PRD já permite ("não encheria de gráfico no começo"). |

**Ação sugerida (G5):** no hovercard do funil em `RelatoriosDashboard.tsx:119`, desdobrar `rejectedOrWithdrawnCount` em dois valores. Requer ajuste em `getFunnel` (metrics.ts:244-263) para separar `rejectedAtStage` e `withdrawnAtStage` com base em `status_change.to`. Mudança contida.

---

## FT-7.6 — Tarefas

| Story | Status | Evidência |
|---|---|---|
| Criar tarefa vinculada a candidato | ✅ | `createTask` + `TaskDialog.tsx` |
| Definir responsável | ✅ | `responsible_id` obrigatório (Zod) + dispatcher `notifyTaskAssigned` |
| Definir prazo | ✅ | `due_date` opcional |
| Marcar como concluída | ✅ | `completeTask` / `reopenTask` |
| Visualizar pendentes por vaga | ✅ | `TasksSection.tsx` agrupado por aplicação (que é a conexão vaga × candidato), contagem de pendentes no header do grupo |
| Visualizar atrasadas | ✅ | Dashboard "Tarefas atrasadas" + pill vermelha no card do Kanban (`renderTaskPill` em `Kanban.tsx:495`) + KPI |

**Sem gaps.**

---

## FT-7.7 — Conversão em colaborador

| Story | Status | Evidência |
|---|---|---|
| Marcar contratado | ✅ | `HireCandidateDialog.tsx` |
| Converter em colaborador | ✅ | `hireCandidate` cria linha em `employees` com `user_id=null` (convite manual depois) |
| Pré-preencher com dados do candidato | ✅ | `HireCandidateInputSchema` recebe name/email/phone pré-preenchidos |
| Definir cargo, departamento e gestor | ✅ | `positionId` obrigatório; `departmentId`/`managerId` opcionais |
| Manter histórico do processo após contratação | ✅ | `candidates.hired_employee_id` preservado; `candidate_stage_history` mantém trilha; alert "Contratado(a) — agora é o colaborador …" em `CandidateProfile.tsx:91-109` com link pro perfil do employee |
| Bloqueios (email já existe; candidato já contratado) | ✅ | `checkHireEligibility` + `hireCandidate` (hire.ts:59, 117) tratam ambos os cenários — retornam `CANDIDATE_ALREADY_HIRED` / `EMAIL_ALREADY_EXISTS` |
| Arquivar outras aplicações ativas | ✅ | Checkbox `archiveOtherApplications` (decisão P19); arquiva como `withdrawn` com reason `aceitou_outra_proposta` |

**Sem gaps.** Implementação cobre todos os edge cases (bloqueios A e B).

---

## Achados extras

1. **Migration pendente (G6)** — `supabase/migrations/20260620_0001_ft7_onda1_notifies_hiring_manager.sql` adiciona a coluna `notifies_hiring_manager` em `recruitment_stages`. Memória do projeto marca que pode não estar aplicada no Supabase do usuário. **Se não estiver**, quebra:
   - UI de Etapas (`RecruitmentStagesManager.tsx`) ao tentar editar o toggle
   - `moveApplicationStage` lê `target.notifies_hiring_manager` (applications.ts:295) — vai retornar `undefined` (coluna inexistente) e a notificação nunca será disparada (comportamento degrada silenciosamente)

   **Verificar:** rodar `select column_name from information_schema.columns where table_name='recruitment_stages'` no Supabase — se não aparece `notifies_hiring_manager`, aplicar a migration.

2. **Divergência de rota intencional** — Specs 13 §6.1/§6.2 e 14 §5.11 falam em `/configuracoes/etapas-recrutamento`. Implementação usa `/recrutamento/etapas`. Documentado no commit `6137145` como decisão consciente. Memória do projeto reforça: "implementação é a fonte de verdade".

3. **Arquivo de migrations helpers** — Há 3 migrations auxiliares (`_0003_ft7_helpers.sql`, `_0004_ft7_rls.sql`, `_0005_ft7_seed_stages.sql`) não listadas no mapa inicial, mas coerentes com o escopo e importantes para RLS/seed. Nenhum gap.

4. **Permissões e RLS** — `src/features/recruitment/permissions.ts` expõe matriz completa (11 funções); casa com as decisões de papel (admin_rh / director / gestor via hiring_manager_id / user comum). Coerente com spec.

5. **Notificações** — Apenas `recruitment.candidate_in_manager_stage` e `recruitment.task_assigned` estão disparando. Spec não exige mais, mas a migration 0002 referencia outros tipos no schema — sem impacto, só informativo.

---

## Plano de correção (recomendado, ordem de prioridade)

### P1 — Funcional, afeta produto com escala

**G6** (se não aplicada) — Aplicar migration `20260620_0001_ft7_onda1_notifies_hiring_manager.sql` no Supabase do usuário. Pré-requisito para tudo mais funcionar.

**G1** — `JobOpeningsTable.tsx`: adicionar filtros Status / Departamento / Responsável (padrão `CandidatesTable.tsx`). ~50 linhas.

**G2** — Kanban: adicionar barra com busca por candidato + MultiSelect Origem + toggle "Apenas parados >5d". ~60 linhas em `JobOpeningDetail.tsx` ou novo `KanbanFilters.tsx`.

### P2 — Refinamento cosmético

**G3** — `CandidatesTable.tsx:52-54`: estender filtro com `c.phone`. 1 linha.

**G4** — `JobOpeningDetail.tsx`: renomear "Cancelar vaga" para "Arquivar vaga" ou adicionar item separado. Decisão de vocabulário.

**G5** — `getFunnel` (metrics.ts) + `RelatoriosDashboard.tsx`: separar `rejectedAtStage` vs `withdrawnAtStage` no hovercard. ~30 linhas.

### Fora de escopo

KPIs extras (Reprovados/Desistentes/Conversão geral/Etapa maior abandono/Origem maior conversão) — o dashboard atual está aderente à filosofia "MVP enxuto" do próprio PRD. Considerar se for expandido no futuro.

---

## Conclusão

A implementação do FT-7 está **sólida e coerente com as specs**, com trabalho já feito em auditoria prévia (`17-ft-7-correcoes-pos-auditoria.md`) e rodada de padronização de UX (CandidateProfile alinhado ao EmployeeProfile). Dos 6 gaps identificados, 2 são funcionais (G1 e G2 — filtros que o produto vai pedir com escala), 1 é bloqueante condicional (G6 — migration), e 3 são refinamentos pequenos (G3 / G4 / G5).

**Nenhuma funcionalidade crítica do PRD está ausente.** O módulo está pronto para uso real; os gaps são de UX em volumes maiores.
