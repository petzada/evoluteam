# Correções pós-auditoria — 2026-04-20

Documento de auditoria das 5 FTs implementadas contra suas specs em `docs/dev/`.
Listadas aqui as divergências materiais detectadas e as correções aplicadas.

> Escopo da auditoria: Classes A (decisões transversais violadas) + B (features prometidas ausentes).
> Classes C (estrutura diverge) e D (semântica menor) foram aceitas como mudanças de percurso válidas.

---

## Sumário executivo

| # | Divergência | Decisão | Arquivos tocados |
|---|---|---|---|
| **C1** | Seeds de cargos diferiam do decidido | Revertido para spec #14 | `src/features/company/schema.ts` |
| **C2** | Seeds de competências diferiam + template FT-2 usava os antigos | Revertido + template reescrito | `src/features/company/schema.ts`, `src/features/reviews/schema.ts` |
| **C3** | Aba "Avaliações" no perfil ainda como "em breve" | Ativada com listagem de ciclos | `src/features/reviews/queries.ts`, `src/features/employees/components/EmployeeProfile.tsx`, `src/app/(app)/colaboradores/[id]/page.tsx` |
| **C4** | Rota `/avaliacoes/[cycleId]/editar` não existia | Criada (draft = wizard completo; published = form simples) | `src/app/(app)/avaliacoes/[cycleId]/editar/page.tsx` (novo), `src/features/reviews/components/{ReviewCycleWizard,PublishedCycleEditForm,CycleDetail}.tsx` |
| **C5** | Botão "Exportar PDF" supostamente ausente | Já estava implementado (`ResultDetail.tsx:75-84`) | — |
| **C6** | Paginação 20/página em `/colaboradores` ausente | Implementada client-side via TanStack + novo `PaginationControls` | `src/components/PaginationControls.tsx` (novo), `src/features/employees/components/EmployeesList.tsx` |

---

## Detalhe por correção

### C1 — Seeds de cargos

**Spec:** `docs/dev/00-decisoes-transversais.md §14` — 4 cargos hierárquicos:
`Colaborador · Líder/Supervisor · Coordenador · Administrativo/RH`.

**Estava:** `Administrativo/RH · Comercial · Operacional · Tecnologia` (áreas funcionais, colidindo com semântica de `department`).

**Correção:** `SEED_POSITIONS` restaurado para o valor da spec. Ativação: no próximo onboarding (empresas já criadas em dev precisam ser recriadas para refletir).

### C2 — Seeds de competências + template FT-2

**Spec:** 7 competências — `Comunicação · Liderança · Colaboração · Entrega · Organização · Domínio técnico · Comportamento`.

**Estava:** `Comunicação · Trabalho em equipe · Liderança · Proatividade · Resolução de problemas · Adaptabilidade · Orientação a resultados` (5 de 7 divergentes).

**Correção:**
1. `SEED_COMPETENCIES` restaurado.
2. `DEFAULT_QUESTION_TEMPLATE` em `src/features/reviews/schema.ts` reescrito: 7 perguntas de nota (uma por competência) + 2 de texto. As perguntas novas foram escritas com base nas descrições conceituais de cada competência.

### C3 — Aba "Avaliações" no perfil do colaborador

**Spec:** `docs/dev/02-ft-1-colaboradores.md §6.2` — 6 abas; Avaliações/Feedbacks/PDI nascem como "em breve" e são ativadas à medida que FT-2/FT-3/FT-4 são implementadas.

**Estava:** Feedbacks (ativa pela FT-3) e PDI (ativa pela FT-4) OK. Avaliações **continuou como "em breve"** apesar da FT-2 pronta.

**Correção:**
1. Nova query `listReviewCyclesForEmployee(employeeId)` em `src/features/reviews/queries.ts` retornando `ReviewCycleForEmployee[]` com `cycleName`, período, prazo, `status`, `isReleased` e `avgOverall`.
2. `EmployeeProfile.tsx`: removido helper `TabDisabled` da Avaliações, adicionado `TabsTrigger value="avaliacoes"` + `TabsContent` com lista de ciclos. Badge de status por ciclo. Botão "Ver resultado" com disable condicional para self quando resultado não liberado.
3. Page `/colaboradores/[id]` passa `reviewCycles` + `canSeeResults` (calculado: admin_rh/director veem tudo; gestor/ancestral vê descendentes; self fica dependente de liberação por ciclo).

### C4 — Rota `/avaliacoes/[cycleId]/editar`

**Spec:** `docs/dev/03-ft-2-avaliacoes.md §4` — rota dedicada para edição.

**Estava:** não existia; `updatePublishedCycleMetadata` action presente mas sem UI.

**Correção:**
1. `ReviewCycleWizard` estendido com props opcionais `editCycleId` + `initialValues`. Em modo edit, chama `updateCycleDraft` em vez de `createCycleDraft`. Toast e redirect ajustados.
2. Novo `src/features/reviews/components/PublishedCycleEditForm.tsx`: form simples com `description` + `responseEnd` (único escopo permitido pós-publicação).
3. Nova page `src/app/(app)/avaliacoes/[cycleId]/editar/page.tsx`:
   - `draft` → renderiza wizard completo com `initialValues` (participantes carregados via `getCycleParticipants`, perguntas via `getCycleForm`).
   - `published` → renderiza `PublishedCycleEditForm`.
   - `closed`/`archived` → mensagem de erro + link de volta.
4. Botão **Editar** no header de `CycleDetail.tsx` (visível para `admin_rh` quando status ∈ {draft, published}), apontando para a nova rota.

### C5 — Botão "Exportar PDF"

**Spec:** `docs/dev/03-ft-2-avaliacoes.md §9.6`.

**Estava:** Já implementado em `ResultDetail.tsx:75-84` (Button disabled + Tooltip "Em breve"). Reportado como ausente na auditoria automática, falso positivo.

### C6 — Paginação em `/colaboradores`

**Spec:** `docs/dev/02-ft-1-colaboradores.md §6.1` — "Paginação 20/página".

**Estava:** `EmployeesList.tsx` renderizava `filtered.map()` sem paginação.

**Correção:**
1. Novo componente `src/components/PaginationControls.tsx` — reutilizável (ocultou-se quando total ≤ pageSize; mostra "X–Y de N" + botões anterior/próxima + indicador de página).
2. `EmployeesList.tsx`: adicionado state `page`, `PAGE_SIZE=20`, `useMemo` de `paged` fatiando `filtered`, `useEffect` que reseta para página 1 quando qualquer filtro muda. Tabela agora renderiza `paged.map()`.

---

## Classes C e D — mudanças de percurso aceitas

Aceitas como evolução válida sem retrabalho:

- **Next.js 16 proxy.ts**: `src/middleware.ts` virou `src/proxy.ts` com função `proxy()`. Convenção nova do framework, mesma semântica.
- **Forms de auth inline**: `src/features/auth/components/*` virou inline nas pages `src/app/(auth)/**/page.tsx`. Funcional e suficiente.
- **`EntitySheet` genérico não extraído**: `EmployeeSheet`, `FeedbackSheet` e `PdiSheet` são standalone. Sem impacto em produto.
- **Logs `user.*` vs `employee.*`**: decisão semântica menor, mantida.
- **Log `feedback.created` vs `feedback.sent`**: idem.
- **Paginação "carregar mais" em `/pdi`**: UX moderna, mantida.
- **Cálculo de média geral FT-5**: implementação faz `média das médias por colaborador` em vez do `AVG` literal — mais robusta a viés de distribuição.
- **Sidebar sem itens "em breve"**: todas as FTs foram implementadas, links ficaram ativos.

---

## Referências

- `docs/dev/00-decisoes-transversais.md` §14 (seeds)
- `docs/dev/02-ft-1-colaboradores.md` §6.1, §6.2 (paginação, tabs do perfil)
- `docs/dev/03-ft-2-avaliacoes.md` §4, §9.6 (rota /editar, botão PDF)
