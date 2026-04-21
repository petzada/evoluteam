# Brainstorm de correções pós-lançamento — 2026-04-20

Spec consolidada das 16 correções levantadas em `correcoes.md` (+1 derivada). Cada item foi
brainstormado 1-a-1 com mockups no Visual Companion quando envolveu decisão de UX/UI. Este
documento é a fonte de verdade para a implementação subsequente.

> Processo: 1 pergunta por correção, opções A/B/C com pros/cons, recomendação justificada,
> mockup visual quando aplicável, decisão registrada antes de avançar.

---

## Sumário executivo

| # | Correção | Tipo | Decisão |
|---|---|---|---|
| 1 | Erro `Select` controlled/uncontrolled em company | Bug | Trocar `defaultValue` por `value={field.value ?? ''}` nos 3 arquivos afetados |
| 2+15 | Auditoria: linguagem + paginação + truncar IDs | UX + backend | Metadata compacta com whitelist por evento, IDs ocultos, paginação 20/página, ACTIVITY_LABELS completo |
| 3 | Máscara de telefone/CNPJ | UX + backend | `react-imask` enquanto digita, banco só dígitos, micro-migração dos existentes |
| 4 | Supabase Storage + upload de avatar/logo | Feature | Buckets `avatars`+`logos` via migration, RLS por user/company, upload clicável (JPG/PNG/WebP, 5 MB), onboarding sem upload |
| 5 | Padronizar posição dos filtros | UX | Toolbar abaixo do PageHeader em **todas** as páginas com filtro |
| 6 | Auditar lógicas de KPIs do dashboard | Diagnóstico | Relatório dos 10 indicadores com ✅/⚠/❌ e justificativa antes de corrigir |
| 7 | Padronizar tamanho dos KpiCards | UX | Reservar espaço do hint com placeholder invisível + `min-h` |
| 8 | Filtro "Gestor" incoerente + auditoria | Bug + Diagnóstico | Fix: cruzar com `subordinatesByManager`. Reportar demais filtros (colaboradores, avaliações, PDI, feedbacks) |
| 9 | "Atividade da conta" vs "Histórico" | UX | Remover "Atividade da conta" da tab Acesso, unificar em Histórico |
| 10 | Erro 500 em salvar rascunho | Bug | **Monitorar** — não reproduzido no retry; se reaparecer, capturar log do servidor |
| 11 | Permissão de responsável por ação do PDI | Regra de negócio | Criador + titular + intermediários + cadeia acima do criador. Auto-PDI: só o próprio. Manager_id obrigatório para criar PDI |
| 12+14 | Matriz de permissões por role | Spec | Matriz aprovada (ver §12 abaixo). Diretor = view-only empresa inteira. User comum = zero edição fora do escopo próprio |
| 13 | Indicador de seção ativa em configurações | UX + arquitetura | Accordion na sidebar principal, recolhido por padrão, auto-expande em `/configuracoes/*`. Remover mini-sidebar. Perfil sai (vai para avatar) |
| 14b | Truncar nome na footer da sidebar | UX + bug | Lógica híbrida: completo → primeiro+último → truncate. Fix CSS `min-w-0` |
| 16 | Breadcrumbs com IDs/tokens | UX + refactor | Híbrida: Context Provider por página + regex UUID como fallback (esconde) |
| 17 (novo) | Repensar dashboard do user comum | Spec pendente | Mural × "Minha área" × outro — brainstorm dedicado posteriormente |

---

## Detalhe por correção

### #1 — Select controlled/uncontrolled

**Sintoma:** Base UI warning em `/configurações/empresa` ao selecionar segmento.

**Causa:** `<Select defaultValue={field.value}>` começa com `field.value = undefined` e depois
muda para o valor persistido → troca uncontrolled → controlled no mesmo componente.

**Fix:** Trocar `defaultValue` por `value={field.value ?? ''}` (controlado desde o início) nos 3
arquivos afetados:

- `src/features/company/components/CompanyEditForm.tsx` (2 Selects: segment + teamSize)
- `src/features/company/components/OnboardingStep1Company.tsx` (2 Selects)
- `src/features/company/components/OnboardingStep2Profile.tsx` (1 Select)

---

### #2 + #15 — Auditoria: linguagem, metadata, paginação

**Três sub-problemas unificados:**

1. **ACTIVITY_LABELS incompleto** em `src/lib/activity.ts`: tipo `ActivityAction` cobre ~40 ações,
   mapa tem ~32 labels. Completar todas (ex: `user.invited`, `user.activated`, `department.*`,
   `role.*`, `competency.*`).

2. **Metadata renderizada bruta** em `ActivityLogList.tsx:48-53` (`${k}: ${v}` cru). Nova estratégia:
   **whitelist por tipo de evento** com humanização:

   - `invite.sent` → "Convidado: **João Silva** · Papel: **Colaborador**"
   - `review_cycle.published` → "Ciclo: **Q4 2025** · Participantes: **42**"
   - `user.role_changed` → "De **Colaborador** para **Gestor**"
   - `pdi.concluded` → "PDI de: **Carlos Oliveira** · Ações: **5/5**"

   Chaves técnicas (`plan_id`, `token`, `user_id`, UUIDs) são **omitidas**. Chaves humanas
   (nome, papel, contador) entram com valor em `<b>`.

3. **Paginação** seguindo padrão existente em `/colaboradores` (20 por página, `PaginationControls`).

---

### #3 — Máscaras telefone/CNPJ

**Escopo:** apenas telefone (employee, profile, onboarding) + CNPJ (company). CPF fica fora por ora.

**Comportamento:** máscara enquanto digita (`react-imask`), banco armazena apenas dígitos,
exibição formata ao ler.

**Implicação:** micro-migração `REGEXP_REPLACE` nos registros existentes (`phone`, `cnpj`) para
remover máscaras já persistidas.

**Componente:** novo `<MaskedInput mask="..."/>` reutilizável, substituindo `Input` nos campos
afetados.

---

### #4 — Supabase Storage + upload

**Checklist de infraestrutura (via migration nova):**

- [ ] Bucket `avatars` (public)
- [ ] Bucket `logos` (public)
- [ ] Policy: write em `avatars/{user.id}/*` apenas para o próprio user
- [ ] Policy: write em `logos/{company_id}/*` apenas para `admin_rh` da company
- [ ] Limites no bucket: 5 MB, mime types `image/jpeg|png|webp`

**Backend:**

- `uploadAvatar` já existe (`src/features/profile/actions.ts:28`) — adicionar validação server-side de tipo/tamanho
- Criar `uploadCompanyLogo` análogo para logos

**Frontend:**

- Componente `<AvatarUploader>` / `<LogoUploader>` estilo **clicável compacto** (avatar redondo com overlay "Trocar" no hover; logo retangular idem)
- Integrar em `ProfileForm.tsx` e `CompanyEditForm.tsx`
- **Onboarding não cobra** logo/avatar — ficam opcionais para preencher depois

---

### #5 — Posição dos filtros

**Padrão único para todas as páginas com filtro** (colaboradores, avaliações, PDI, feedbacks,
auditoria após #2):

```
┌──────────────────────────────────────┐
│ PageHeader: título + descrição │ CTA │
├──────────────────────────────────────┤
│ [busca] [filtro 1] [filtro 2] [...]  │  ← toolbar, flex-wrap
├──────────────────────────────────────┤
│ Conteúdo                             │
└──────────────────────────────────────┘
```

Busca à esquerda, filtros em linha à direita. Já é o padrão em `/colaboradores` e `/avaliacoes`;
consolidar em PDI, feedbacks e na nova auditoria.

---

### #6 — Auditoria dos KPIs do dashboard

**Entregável:** relatório de diagnóstico dos 10 indicadores, marcando ✅/⚠/❌ com justificativa,
**antes** de qualquer correção.

| Indicador | Fonte | Escopo |
|---|---|---|
| Colaboradores ativos | `countActiveEmployees(scope)` | scope |
| Ciclos ativos | `countActiveCycles(companyId)` | empresa (⚠ diverge dos demais — auditar intenção) |
| Avaliações pendentes | `assignmentStats` | scope |
| Taxa de conclusão | `assignmentStats.completionRate` | scope |
| Média geral | `getOverallAverage` | scope |
| Média por departamento | `getAveragePerDepartment` | scope |
| Radar de competências | `getCompetencyAverages` | scope |
| PDIs ativos | `countActivePdis` | scope |
| PDIs atrasados | `countOverduePdis` | scope |
| Sem feedback 90d | `countEmployeesWithoutRecentFeedback` | scope |

---

### #7 — Tamanho uniforme dos KpiCards

**Fix:** em `src/features/dashboard/components/KpiCard.tsx`, adicionar `min-h-[N]` no
`CardContent` e renderizar `<p aria-hidden>&nbsp;</p>` como placeholder quando `hint` é ausente.
Mantém "3 no total" onde faz sentido.

---

### #8 — Filtro "Gestor" + auditoria dos demais

**Fix do bug relatado** em `EmployeesList.tsx:196-200`:

```ts
const activeManagers = useMemo(
  () => employees.filter((e) =>
    e.status === 'active' && (subordinatesByManager[e.id] ?? 0) > 0  // ← cruzar
  ).map((e) => ({ id: e.id, full_name: e.full_name })),
  [employees, subordinatesByManager],
);
```

**Auditoria pendente:** status/cargo/departamento (colaboradores) + filtros de avaliações, PDI,
feedbacks. Mesmo formato do #6.

**Confirmado conceitualmente:** cargo é puramente descritivo, gestor é condição derivada
(`isManager = ∃ subordinado`). Supervisor/líder ainda vê apenas descendentes diretos+recursivos;
**não** criar badge "Gestor" — cliente é orientado a configurar cargos corretamente.

---

### #9 — "Atividade da conta" × "Histórico"

**Remover** a seção "Atividade da conta" da tab Acesso em
`src/features/employees/components/EmployeeProfile.tsx`. Tab Acesso mantém apenas dados de
acesso ao sistema (papel, convites, último login). Histórico torna-se fonte única de eventos da
ficha. Se aparecer demanda de recortar "ações feitas pelo user", adicionar filtro dentro de
Histórico (toggle "Apenas ações realizadas por este usuário").

---

### #10 — Erro 500 em salvar rascunho

**Status:** não reproduzido no retry. Sem ação por ora. Se reaparecer, usuário capturará log
do terminal `next dev` no momento do erro para diagnóstico preciso.

---

### #11 — Responsável por ação do PDI

**Regra (consolidada):** dado plano criado por **C**, titular = **T**, elegíveis a ser
responsável por uma ação:

1. **C** (criador) — sempre
2. **T** (titular) — sempre
3. **Gestores intermediários** entre C e T na cadeia hierárquica
4. **Toda a cadeia acima de C** (gestor direto, gestor do gestor, ..., até o topo — diretor)

**Exceção — auto-PDI (C == T):** apenas C.

**Pré-requisito de negócio:** PDI só pode ser criado **para/por colaboradores com `manager_id`
preenchido**. A coluna `manager_id` no cadastro **permanece opcional**; a validação vive no
server action `createPdi`/`addAction`.

---

### #12 + #14 — Matriz de permissões

**Spec oficial** (aprovada com ajustes — ver abaixo):

| Ação | Admin RH | Diretor | User gestor | User comum |
|---|---|---|---|---|
| **Dashboard** |
| Acessar | ✓ | ✓ | ◐ escopo | ✗ (redireciona, mas sidebar mantida para #17) |
| Filtrar por departamento | ✓ | ✓ | ✗ | ✗ |
| **Colaboradores** |
| Ver lista da empresa | ✓ | ✓ | ◐ subordinados | ✗ só o próprio |
| Ver ficha individual | ✓ | ✓ | ◐ subordinados | ✗ só a própria |
| Criar / convidar | ✓ | ✗ | ✗ | ✗ |
| Editar dados | ✓ | ✗ | ✗ | ✗ |
| Alterar role | ✓ | ✗ | ✗ | ✗ |
| Desligar / reativar | ✓ | ✗ | ✗ | ✗ |
| **Avaliações** |
| Ver ciclos | ✓ | ✓ | ◐ onde participa | ◐ onde participa |
| Criar / editar ciclo | ✓ | ✗ | ✗ | ✗ |
| Publicar / encerrar | ✓ | ✗ | ✗ | ✗ |
| Responder (designado) | ✓ | ✓ | ✓ | ✓ |
| Ver resultados | ✓ | ✓ | ◐ subordinados | ◐ próprio (se liberado) |
| Liberar resultado | ✓ | ✗ | ✗ | ✗ |
| **PDI** |
| Ver PDI | ✓ | ✓ | ◐ subordinados | ◐ só o próprio |
| Criar PDI | ✓ | ✗ | ◐ só subordinados | ◐ auto-PDI (ver #11) |
| Editar PDI | ✓ | ✗ | ◐ que criou | ◐ que criou |
| Editar ações | ✓ | ✗ | ◐ que criou | ◐ que criou |
| Atualizar status (responsável) | ✓ | ✓ | ✓ | ✓ |
| **Feedbacks** |
| Ver feedbacks da empresa | ✓ | ✓ | ◐ subordinados + enviados/recebidos | ◐ só enviados/recebidos |
| Enviar feedback | ✓ | ✓ | ✓ | ✓ |
| Remover feedback | ✓ | ✗ | ◐ que enviou | ◐ que enviou |
| **Configurações** |
| Acessar seção | ✓ | ✗ | ✗ | ✗ |
| Editar empresa | ✓ | ✗ | ✗ | ✗ |
| Cargos/depts/competências | ✓ | ✗ | ✗ | ✗ |
| Ver auditoria | ✓ | ✗ | ✗ | ✗ |
| Editar próprio perfil | ✓ | ✓ | ✓ | ✓ |

**Legenda:** ✓ pode · ✗ não pode · ◐ só escopo restrito

**Próximo passo:** auditar o código contra essa matriz e reportar divergências (mesmo formato
do #6).

---

### #13 — Indicador de seção ativa + arquitetura da sidebar

**Decisões combinadas:**

1. **Arquitetura:** accordion na sidebar principal. Item "Configurações" expande/colapsa inline.
   Remover a mini-sidebar de `src/app/(app)/configuracoes/layout.tsx`.
2. **Estado do accordion:** inicia recolhido; auto-expande quando `pathname.startsWith('/configuracoes/')`.
3. **Clique em "Configurações":** apenas expande/colapsa, **não navega**. Navegação acontece
   exclusivamente nos sub-itens.
4. **"Perfil" sai de CONFIG_NAV:** continua acessível **apenas** via avatar/nome no footer da
   sidebar (dropdown já existente).
5. **Todos os sub-itens restantes** viram `adminOnly: true` (Empresa, Departamentos, Cargos,
   Competências, Auditoria). Alinha com a matriz #12.
6. **`/configuracoes/page.tsx`** passa a redirecionar para `/configuracoes/empresa` (primeiro
   item admin).
7. **Estilo do item ativo:** background suave (`bg-accent` + `text-foreground` + `font-medium`),
   igual ao hover mas "travado" — discreto, consistente.

---

### #14b — Nome na footer da sidebar

**Lógica híbrida** (novo helper `formatSidebarName(fullName, maxWidth)`):

1. Se `fullName` cabe na largura disponível → mostra `fullName`
2. Senão, computa `primeiro + último sobrenome` e testa se cabe → mostra isso
3. Senão → aplica truncate com ellipsis em `primeiro + último`

**Fix CSS:** adicionar `min-w-0` no wrapper do `DropdownMenuTrigger` em `UserCard.tsx` para que
`truncate` funcione de fato (hoje o overflow extravasa a sidebar).

---

### #16 — Breadcrumbs com IDs/tokens

**Estratégia híbrida:**

1. **Context Provider** no `(app)/layout.tsx` expondo `Map<segment, label>`.
2. Cada página com rota dinâmica que já busca o nome para seu PageHeader renderiza
   `<BreadcrumbLabel segment={id} label={nome}/>` — **sem query adicional**, só reuso do dado
   já obtido.
3. **Fallback:** `Breadcrumbs.tsx` detecta segmento via regex UUID/token e **esconde** do
   caminho quando não há override no Context.

Resultado:

- `/colaboradores/abc-123` → "Colaboradores › **João Silva**"
- `/avaliacoes/c2f1/resultados/7a12` → "Avaliações › Q4 2025 › Resultados › **Maria Costa**"
- `/convite/token-jwt-gigante` → "Convite › **Aceitar**" (token oculto via fallback)

---

### #17 (novo) — Dashboard do user comum

**Aberto.** Hoje `/dashboard` redireciona user comum para `/colaboradores`, mas o item continua
na sidebar. Sessão dedicada de brainstorm pendente para escolher entre:

- Mural de avisos/informativos (nova entidade `announcements` — custo de feature)
- "Minha área" — agregador de tarefas/PDI/feedbacks existentes (custo quase zero, valor imediato)
- Outra abordagem

Enquanto #17 não fecha, **manter item "Dashboard" na sidebar** (será útil quando a spec sair).

---

## Agrupamentos de implementação sugeridos

O usuário pediu separação por tipo para evitar conflitos. Grupos propostos (podem virar PRs
separados ou commits sequenciais):

### Grupo A — Bugs técnicos rápidos (baixo risco, altos em valor)
- #1 Select controlled × 3 arquivos
- #7 KpiCard altura uniforme
- #8 (parte 1) Fix do filtro Gestor
- #9 Remover "Atividade da conta"
- #14b Nome da sidebar (bug CSS + helper híbrido)

### Grupo B — Auditorias/diagnósticos (entregas = relatórios)
- #6 KPIs do dashboard
- #8 (parte 2) Filtros restantes
- #12 Código vs matriz de permissões

### Grupo C — UX estrutural
- #5 Toolbar de filtros (consolidar padrão)
- #13 Accordion sidebar + remover mini-sidebar + /configuracoes/page.tsx redirect
- #16 Breadcrumbs híbridos (Provider + regex)
- #2+#15 Auditoria: labels + metadata + paginação

### Grupo D — Features novas com infraestrutura
- #3 Máscaras + react-imask + micro-migração
- #4 Supabase Storage + buckets + RLS + uploaders

### Grupo E — Regras de negócio (backend-heavy)
- #11 Permissão de responsável por ação do PDI

### Grupo F — Pendente de spec
- #17 Dashboard do user comum
- #10 (só se reaparecer)
