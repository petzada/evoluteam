# FT-8 — Auditoria de Acessos e Decisão do Modelo

Gerado em 2026-04-21 após 5 reports de inconsistência em teste manual do Marcio.
Base: código em `main` pós-commit `f783091` + spec `docs/dev/19-ft-8-granularidade-rh.md`.

---

## 1. Sumário executivo

O modelo atual é **4 roles (`admin_rh`, `director`, `rh`, `user`) × 6 toggles** (`can_employees`, `can_reviews`, `can_recruitment`, `can_pdi_feedback`, `can_invites`, `can_audit`). Em teoria, 64 combinações pra `rh` + 3 roles fixos = 67 personas possíveis.

A auditoria identificou **4 bugs reais + 1 gap de design + 3 inconsistências transversais**. Não são falhas isoladas: compartilham causa-raiz em **conceitos sobrepostos no código** (`isAdmin`, `hasAdminPower`, `canInviteAs`) e em **ordem de operações frágil** (cria antes de validar tudo).

Não é refactor pontual que conserta com solidez. É decisão de direção.

---

## 2. Os 5 reports — diagnóstico técnico

### Bug 1 — Sheet de edição não salva "Acesso"
- **Onde:** `src/features/employees/components/EmployeeSheet.tsx` em modo `isEdit=true`.
- **Causa:** `updateEmployee` em `src/features/employees/actions.ts:67` só atualiza dados cadastrais (nome, email, position, department, manager, hire_date, phone, internal_notes). **Nunca** atualiza `profile.role` nem `rh_permissions`. O Select de role no sheet era decorativo mesmo antes de FT-8.
- **Por quê:** mudança de role vai pelo drawer "Gerenciar acesso" via `updateUserAccess` (action separada em `src/features/permissions/actions.ts`). O sheet continua mostrando o Select, dando impressão falsa.
- **Classificação:** bug de **contrato de UI**. Nada mal funcionando no backend; o sheet só não deveria expor o campo.

### Bug 2 — RH sem toggle não cria PDI próprio
- **Onde:** `src/features/pdi/actions.ts:83`.
- **Causa:** `createPdi` exige `target.manager_id != null` pra criar qualquer PDI, mesmo o próprio.
- **Por quê:** regra foi pensada como "PDI precisa de gestor pra acompanhar". Faz sentido pra PDI de terceiro. Mas pra auto-PDI de RH (que tipicamente não tem gestor direto), vira bloqueio.
- **Classificação:** bug de **invariante de negócio** — regra correta em contexto geral, errada em self-PDI.

### Bug 3 — RH com toggle consegue convidar Admin/Diretor
- **Onde:** `src/features/employees/components/EmployeeSheet.tsx` prop `isAdmin`.
- **Causa:** A prop `isAdmin` passada para o sheet vem de `hasAdminPower(..., 'can_employees')` nas pages. Eu escrevi `disabled: !isAdmin && value !== 'user'` pros SelectItems de role. Mas RH com `can_employees=true` **também** vira `isAdmin=true` nessa lógica — os itens ficam habilitados.
- **Por quê:** `isAdmin` virou um conceito ambíguo no código:
  - Em alguns lugares significa "pode ver notas internas" (= can_employees).
  - Em outros significa "pode escalar roles" (= só admin_rh puro).
  - No sheet, confundimos os dois.
- **Server-side** `canInviteAs` bloqueia correto (`canInviteAs(RH_com_can_invites, 'admin_rh')` → false), mas só no ato de enviar o convite — ver bug 4.
- **Classificação:** bug de **conceito ambíguo**. Corrigir exige distinguir `canGrantPrivilegedRoles` (só admin_rh) de `canManageEmployees`.

### Bug 4 — RH sem `can_invites` cria colaborador + deixa órfão
- **Onde:** `src/features/employees/actions.ts:161` (insert) → `:181` (validação de invite role).
- **Causa:** ordem das operações:
  1. Valida `canManageEmployees || canInviteUsers` (L127).
  2. **INSERT em `employees`** (L161). Sucesso.
  3. Se `sendInvite=true`, chama `canInviteAs(actor, inviteRole)` (L182).
  4. Se falha, retorna `{ error }` **mas não faz rollback**. Employee fica persistido sem `user_id` e sem `invite` emitido.
- **Por quê:** typical ordering bug. Validar tudo antes de escrever, ou envolver em transação.
- **Classificação:** bug de **transação** — grave porque produz estado inconsistente no banco.

### Bug 5 — RH sem `can_recruitment` não vê "Etapas"
- **Onde:** Sidebar + `src/features/recruitment/permissions.ts:122` (`canManageStages`).
- **Causa:** "Etapas" é configuração administrativa do funil (mudar nomes, adicionar novas). Não é baseline de recrutamento.
- **Conclusão:** **comportamento correto por design**. RH sem `can_recruitment` pode ser `hiring_manager` numa vaga (baseline), mas não deve mexer no funil da empresa. Equivalente a RH sem `can_employees` não ver `/configuracoes/cargos`.
- **Classificação:** não é bug. Se incomoda visualmente, é ajuste de UX (ocultar aba com tooltip).

---

## 3. Gaps adicionais encontrados na auditoria

| # | Local | Gap |
|---|---|---|
| G1 | `src/app/(app)/avaliacoes/[cycleId]/page.tsx:72` | `isAdmin = profile.role === 'admin_rh'` hardcoded — não reconhece RH com `can_reviews`. Botões de edição de ciclo somem pra RH. |
| G2 | `src/app/(app)/feedbacks/page.tsx:57` | `isAdmin = profile.role === 'admin_rh'` hardcoded — RH com `can_pdi_feedback` não vê botão "Deletar". |
| G3 | `src/features/reviews/permissions.ts` | Função `canCommentOnResult` da spec §7.4 **não existe**. Componente `ResultCommentsSection` já foi integrado mas o caller não computa a prop. Feature de "Comentários da liderança" está quebrada no app (RLS cobre no banco). |
| G4 | `canViewEmployee`, `canSeeCycle`, `canSeeResultOf`, `canViewPdi`, `canAccessRecruitmentModule`, `canAccessDashboard` | **Misturam** `role === 'admin_rh' \|\| role === 'director'` hardcoded com `hasAdminPower` na mesma função. Dois padrões, mesmo objetivo. |
| G5 | `src/features/pdi/permissions.ts:canViewPdi` | Usa branch hardcoded pra director em vez de helper consistente. Spec FT-8 §6.3.2 prevê director, mas a lógica fica duplicada de módulo pra módulo. |

---

## 4. Matriz persona × action (zonas críticas)

Legenda: ✅ OK · ❌ BUG · ⚠️ GAP de design · 🔒 bloqueio intencional

| Persona ↓ \\ Action → | Criar PDI próprio | Editar acesso no sheet | Convidar user | Convidar admin/dir/rh | Deletar feedback | Ver Etapas | Criar vaga |
|---|---|---|---|---|---|---|---|
| `admin_rh` | ❌ se sem gestor | ❌ não grava | ✅ | ✅ | ✅ | ✅ | ✅ |
| `director` | ❌ se sem gestor | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 |
| `rh` sem toggle | ❌ se sem gestor (bug 2) | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 |
| `rh` + `can_employees` | ❌ se sem gestor | ❌ Select ativo mas não salva | ✅ | ❌ UI habilita (bug 3) | 🔒 | 🔒 | 🔒 |
| `rh` + `can_reviews` | ❌ se sem gestor | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 |
| `rh` + `can_recruitment` | ❌ se sem gestor | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 (design) | ✅ |
| `rh` + `can_pdi_feedback` | ❌ se sem gestor | 🔒 | 🔒 | 🔒 | ⚠️ G2: UI esconde botão | 🔒 | 🔒 |
| `rh` + `can_invites` | ❌ se sem gestor | 🔒 | ✅ | ❌ bug 4: cria+órfão | 🔒 | 🔒 | 🔒 |
| `rh` + `can_audit` | ❌ se sem gestor | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 |
| `user` comum | ✅ | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 |

**Leitura rápida:**
- Bug 2 afeta **todo mundo sem gestor** — não é issue exclusivo de RH.
- Bug 3 e 4 afetam combinações específicas de RH com toggles.
- Bug 1 afeta admin_rh (único que hoje consegue mudar role) e aparece também pra RH+can_employees (UI enganosa).

---

## 5. Causa-raiz sistêmica

Três padrões estruturais estão gerando os bugs:

**(a) Conceitos sobrepostos no código**
- `isAdmin` em props de UI (EmployeeSheet, CycleDetail, FeedbacksList) significa coisas diferentes em cada lugar — às vezes "admin_rh puro", às vezes "tem poder administrativo".
- Corrigir um por um não impede o próximo.

**(b) Ordem de operações sem transação**
- `createEmployee` escreve antes de validar tudo. Um tipo de bug que repete em qualquer action que tenha side-effect condicional.

**(c) Permissions de visibilidade duplicam padrão**
- 6 funções (`canView*`, `canAccess*`, `canSee*`) repetem `admin_rh || director || hasAdminPower(...)`. Cada módulo escreve à mão. Divergem com facilidade.

Esses três padrões **crescem linearmente** com cada nova feature. Simplificar o modelo reduz a superfície, mas não resolve (a) e (c); consertar pontualmente resolve o sintoma, não a causa.

---

## 6. Três caminhos com custo real

### A — Manter FT-8 + corrigir 4 bugs + 3 gaps + consolidar conceitos
**Escopo:**
1. Bug 1: remover Select de role do sheet em modo edit; CTA "Gerenciar acesso" leva ao drawer.
2. Bug 2: em `createPdi`, se `isSelf`, não exigir `target.manager_id`.
3. Bug 3: sheet usa `profile.role === 'admin_rh'` pra habilitar roles privilegiados; nova prop `canGrantPrivilegedRoles`.
4. Bug 4: revalidar `canInviteAs` **antes** do INSERT em `employees`.
5. G1, G2: pages de ciclo/editar e feedbacks usam `hasAdminPower(..., 'can_reviews')` / `can_pdi_feedback`.
6. G3: implementar `canCommentOnResult` + passar prop do caller.
7. G4, G5: criar helper `isAdminOrDirector(actor)` e substituir padrão duplicado.

**Custo estimado:** ~8-12 arquivos, ~200-300 linhas. 1 sessão focada.
**Risco:** bugs similares continuam aparecendo a cada nova feature (complexidade não diminui). Spec FT-8 permanece íntegra com cliente.

### B — Simplificação moderada: matar os 6 toggles, manter os 4 roles
**Escopo:**
1. Cada role ganha escopo funcional **fixo** (sem granularidade):
   - **Administrador** (`admin_rh`): tudo, inclusive convidar qualquer role e editar empresa.
   - **RH** (`rh`): tudo que é RH — CRUD colaborador, estrutura (cargos/deps/competências), ciclos, PDI/feedbacks, recrutamento, auditoria, convite de Colaborador. **Não** escala roles.
   - **Diretor** (`director`): leitura + comentários + feedback em candidato/PDI/resultado (spec P4·B).
   - **Colaborador** (`user`): próprio + árvore se gestor.
2. Migration: `rh_permissions.can_*` ignorados. Tabela pode ser mantida ou dropada — decisão separada. Tenant com RH atual vira RH pleno (aditivo, ninguém perde acesso).
3. Cada `hasAdminPower(actor, 'can_X')` vira `actor.role === 'admin_rh' || actor.role === 'rh'`. Uma função só: `canAdminister(actor)`.
4. `canInviteAs`: Admin convida qualquer role; RH convida só Colaborador.
5. Remove UI: PermissionsToggles, drawer de toggles individuais. Mantém RoleCards (4 opções).
6. Spec: escrever `docs/dev/21-ft-8-simplificacao.md` documentando a decisão e justificativa.

**Custo estimado:** ~20-30 arquivos, ~500-700 linhas (muita remoção, pouca adição). 1-2 sessões.
**Risco:** FT-8 vendido ao cliente como "granularidade". Precisa alinhamento — mas o alinhamento é **simplificar pra menos confusão**, que tende a ser bem recebido em PME. Bugs 1, 3, 4 somem por design; bug 2 ainda precisa fixar (é invariante).

### C — Simplificação radical: matar roles `rh` e `director`; 2 roles + capabilities aditivas
**Escopo:**
1. Reduzir a: `admin_rh` (tudo) e `user` (próprio + hierarquia).
2. Qualquer colaborador `user` pode receber 1 ou mais "capabilities" individuais (= 6 toggles virados independentes do role) — ex.: um Gerente de Projeto pode ter `can_recruitment=true` sem ser RH nem Admin.
3. Diretor vira `user` com capability especial `can_comment_anywhere`.
4. Escalação: qualquer capability de admin power só Admin concede.

**Custo estimado:** ~40+ arquivos, ~1000+ linhas. Reflete na experiência do cliente (rename completo).
**Risco alto:** refactor profundo, mental model novo pro cliente, risco de regressões. **Não recomendo agora** — vale considerar só se B ainda se mostrar complexo demais em 3-6 meses.

---

## 7. Recomendação honesta

**Caminho B (simplificação moderada).** Razões:

1. Os bugs 1, 3 e 4 são efeitos da combinatória de toggles. Matar toggles elimina a classe inteira.
2. Causa-raiz (a) "conceitos sobrepostos" — simplifica drasticamente: `canAdminister(actor)` vira 1 helper, não 6.
3. Causa-raiz (c) "permissões de visibilidade duplicadas" — com só 2 flavors (admin or not), consolidar helper é trivial.
4. Causa-raiz (b) "ordem de operações" — **não some** com B, precisa fix explícito em `createEmployee`.
5. Do ponto de vista do cliente PME: "RH que faz tudo de RH" é **mais intuitivo** que "RH que talvez faça X, Y, Z dependendo de 6 toggles". A granularidade foi um requisito levantado mas o valor prático tem sido especulativo.
6. Migration aditiva: zero perda de acesso em produção atual.

**Se preferir A:** aceite que cada feature nova vai exigir cuidado extra com matriz. Plano de contingência: criar um arquivo `docs/dev/permissions-matrix.md` atualizado a cada PR.

**Próxima decisão dependente:** se B, precisamos decidir juntos:
- Mantém a tabela `rh_permissions` (zombie) ou dropa via migration?
- Director ganha `can_comment_on_result` especial (spec FT-8 P10) ou cai na regra genérica "Diretor comenta em tudo que vê"?
- RH pode editar Empresa? Spec hoje diz só admin_rh; em B, faria sentido incluir RH também.

Essas decisões entram no brainstorm seguinte, se você escolher B.

---

## 8. Se escolher A (preservar FT-8)

Checklist mínimo pra estabilizar:

1. `src/features/pdi/actions.ts:83` — `if (!target.manager_id && !isSelf) return { error: ... }`.
2. `src/features/employees/actions.ts` — mover `canInviteAs` pra **antes** do INSERT (L127-135); rejeitar combinação inválida role×permissão do actor antes de tocar banco.
3. `src/features/employees/components/EmployeeSheet.tsx` — nova prop `canGrantPrivilegedRoles: boolean` separada de `isAdmin`; `canGrantPrivilegedRoles = profile.role === 'admin_rh'` nas pages.
4. `src/features/employees/components/EmployeeSheet.tsx` — em modo edit, ocultar Select de role (mostrar só valor atual + link "Gerenciar acesso").
5. `src/app/(app)/avaliacoes/[cycleId]/page.tsx:72` e `src/app/(app)/feedbacks/page.tsx:57` — substituir hardcoded por `hasAdminPower` com toggle correspondente.
6. `src/features/reviews/permissions.ts` — implementar `canCommentOnResult` e `canViewResultComments`.
7. Criar helper `isAdminOrDirector(actor)` em `@/features/permissions/permissions` e substituir as 6 duplicatas.

Essa é a rota se você quiser manter o modelo atual; seria ~1 sessão, um único commit consolidado.

---

## Estado dos arquivos agora

- **Código em `main`**: commit `f783091` (último FT-8). Nada quebrado além do que foi reportado.
- **Working tree**: limpa (zero modificações pendentes).
- **Nada pushado ainda**. Os commits `5bbf065`, `a949ca1`, `f783091`, `369f30d` estão local, aguardando sua decisão.
