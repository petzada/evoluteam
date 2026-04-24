# Migração de Paleta — Design (2026-04-24)

Migração completa da identidade visual do app logado, emails e assets de marca: laranja `#F97316` → azul `#2563EB`. Adoção das recomendações de `docs/paleta.md` (sidebar slate-900, fundo slate-50, badges pastel, status semânticos unificados) preservando 100% do layout/estrutura atual.

## Objetivos

- Substituir o laranja `#F97316` pelo azul `#2563EB` como cor primária em todo o sistema — tokens CSS, componentes, charts, favicon, OG image, templates de email.
- Unificar o sistema de cores de status em **7 tokens semânticos** (neutral, progress, success, warning, danger, muted, archived) para eliminar ~130 ocorrências hardcoded inconsistentes.
- Padronizar "Atrasado" como `warning` (amber) em todos os módulos — hoje é amber em Avaliações e red em PDI.
- Aplicar estilo sutil/moderno no item ativo da sidebar (translúcido + barra lateral) e logo bicolor na identidade.
- Centralizar cores em helpers únicos (dedupe de 4 utilitários espalhados).

## Não-objetivos

- **Nenhuma mudança de layout, posição, hierarquia, rota ou comportamento.** Só paleta (com exceções estruturais listadas abaixo).
- Não redesenhar componentes, formulários, modais ou telas.
- Não adicionar/remover features.
- Não mexer em schema, migrations, RLS ou server actions.
- Não escrever dark mode novo — as vars `.dark` existem e serão atualizadas em paralelo mas não é prioridade de validação (cliente não usa).
- Não criar CSS tokens custom para "status" — a implementação usa utilitários Tailwind via helper centralizado (mais simples e compatível com o sistema atual).

## Decisões validadas no brainstorm

| # | Tópico | Decisão |
|---|---|---|
| **P1** | Identidade primária | Migração completa laranja → azul `#2563EB` (inclui marca, favicon, OG, emails) |
| **P2** | Item ativo da sidebar | Translúcido `white/6%` (sem barra lateral — ajuste pós-revisão) |
| **P3** | Logo na sidebar | Bicolor: `<span class="text-white">Evolu</span><span class="text-blue-500">team</span>` (`#3B82F6`) |
| **P4** | Estilo dos badges | Pastel: `bg-*-100` + `text-*-800/900` |
| **P5** | Mapa semântico de status | **7 tokens** (neutral/progress/success/warning/danger/muted/archived). "Atrasado" = amber universal |
| **P6** | Cor no kanban | Por `kind`: `entry` blue, `intermediate` slate, `hired_terminal` emerald (border-top 3px) |
| **P7** | KPI cards | Ícone colorido no tom **sem fundo pastel** + número neutro + label cinza |
| **P8** | Charts | Mono-azul em todos (bars/radar/funil) EXCETO donut de origens que mantém 9 categorias distintas. LinkedIn `#F97316` → `#0A66C2` |
| **P9** | Marca externa | Bicolor consistente: favicon monograma "et", OG e emails usam Evolu/team em cores |

## Exceções estruturais acordadas

Todas as mudanças são **de cor**, exceto estes 4 pontos pontuais (cada um validado nas decisões acima):

1. **P3 — Logo bicolor:** `src/features/shell/components/Sidebar.tsx:156-162` — o `<span>Evoluteam</span>` vira dois spans aninhados para colorir "Evolu" e "team" em cores diferentes. No modo collapsed, continua "E" branco (sem bicolor em letra única). Nada se move; só o texto é dividido.

2. **P6 — Border-top no kanban:** `src/features/recruitment/components/Kanban.tsx` — colunas ganham `border-top: 3px solid <cor-do-kind>`. Visual novo (não existia hoje), mas limitado à borda superior; layout inalterado.

3. **P7 — KPI ícone colorido:** `src/features/dashboard/components/KpiCard.tsx` — a classe de cor vinda de `TONE_CLASS` sai do elemento do número e passa pro ícone. Mesmo JSX, cor muda de alvo. Posicionamento idêntico.

4. **P9 — Assets de marca reescritos:** `src/app/icon.tsx`, `src/app/apple-icon.tsx`, `src/app/opengraph-image.tsx`, `src/emails/_components/Layout.tsx` — reescrita completa da composição visual (monograma "et", fundo slate-900, bicolor). São arquivos de geração de imagem estática e header de email; não afetam o shell nem componentes do app.

## Stack e tokens relevantes

- **Next.js 16 + Tailwind v4.** Tokens vivem em `src/app/globals.css` via `@theme inline` e CSS variables.
- **Hoje o globals.css usa `oklch()`**. Vamos continuar com `oklch` para manter consistência com o sistema (valores derivados dos hex do documento).
- **shadcn/ui + @base-ui/react.** Todos os componentes de `src/components/ui/*` já consomem tokens (bg-primary, text-foreground, etc) — se beneficiam automaticamente ao trocar `:root`.
- **Tailwind utilities para status:** badges usam classes diretas (`bg-emerald-100 text-emerald-800`) centralizadas em helper. Sem criar tokens CSS custom de status — evita duplicação com a paleta do Tailwind.

## Tokens finais — `src/app/globals.css`

Bloco `:root` (claro) completo:

```css
:root {
  /* Primary — P1: azul #2563EB */
  --primary: oklch(0.546 0.245 262.88);            /* #2563EB */
  --primary-foreground: oklch(1 0 0);              /* #FFFFFF */

  /* Background / Card */
  --background: oklch(0.984 0.003 247.86);         /* #F8FAFC slate-50 */
  --foreground: oklch(0.208 0.042 265.75);         /* #0F172A slate-900 */
  --card: oklch(1 0 0);                            /* #FFFFFF */
  --card-foreground: oklch(0.208 0.042 265.75);    /* #0F172A */
  --shadow-card: 3px 4px 10px -2px rgb(15 23 42 / 0.06), 1px 2px 3px rgb(15 23 42 / 0.04);

  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.208 0.042 265.75);

  /* Secondary — teal token, uso ad-hoc (sem aplicação sistemática) */
  --secondary: oklch(0.434 0.081 188.41);          /* #0F766E teal-700 */
  --secondary-foreground: oklch(1 0 0);

  /* Muted / Accent */
  --muted: oklch(0.968 0.007 247.9);               /* #F1F5F9 slate-100 */
  --muted-foreground: oklch(0.554 0.046 257.42);   /* #64748B slate-500 */
  --accent: oklch(0.932 0.032 255.59);             /* #DBEAFE blue-100 */
  --accent-foreground: oklch(0.379 0.146 265.52);  /* #1E3A8A blue-900 */

  /* Destructive */
  --destructive: oklch(0.577 0.245 27.325);        /* #DC2626 red-600 */

  /* Border / Input / Ring */
  --border: oklch(0.929 0.013 255.51);             /* #E2E8F0 slate-200 */
  --input: oklch(0.929 0.013 255.51);
  --ring: oklch(0.546 0.245 262.88);               /* primary */

  /* Charts — P8-A: mono-azul (chart-1..5 em tons de azul) */
  --chart-1: oklch(0.546 0.245 262.88);            /* #2563EB blue-600 */
  --chart-2: oklch(0.624 0.214 259.81);            /* #3B82F6 blue-500 */
  --chart-3: oklch(0.707 0.163 254.62);            /* #60A5FA blue-400 */
  --chart-4: oklch(0.809 0.105 251.81);            /* #93C5FD blue-300 */
  --chart-5: oklch(0.932 0.032 255.59);            /* #DBEAFE blue-100 */

  --radius: 0.5rem;

  /* Sidebar — P2-C item ativo translúcido (sem barra) */
  --sidebar: oklch(0.208 0.042 265.75);            /* #0F172A slate-900 */
  --sidebar-foreground: oklch(0.869 0.022 252.89); /* #CBD5E1 slate-300 */
  --sidebar-primary: oklch(1 0 0);                 /* #FFFFFF — texto destaque na sidebar */
  --sidebar-primary-foreground: oklch(1 0 0);
  --sidebar-accent: oklch(1 0 0 / 6%);             /* rgba(255,255,255,0.06) — bg item ativo */
  --sidebar-accent-foreground: oklch(1 0 0);
  --sidebar-border: oklch(0.279 0.041 260.03);     /* #1E293B slate-800 */
  --sidebar-ring: oklch(0.546 0.245 262.88);       /* primary — focus ring */
}
```

Bloco `.dark` recebe os mesmos ajustes de primary/chart/sidebar (mantém background escuro), atualizado em paralelo.

### Constantes adicionais fixas (não viram token CSS)

Cor do **logo bicolor** na sidebar (P3-C): segunda parte "team" usa `text-blue-500` (`#3B82F6`) diretamente via Tailwind. Único uso, não justifica token.

Cor do **LinkedIn** no `DONUT_COLORS` (P8): troca de `#F97316` para `#0A66C2` diretamente no map em `OriginsDualDonut.tsx`.

## Helpers centralizados

### `src/lib/status-colors.ts` — NOVO

Util único para o mapa semântico da P5-B. Exporta função `statusClass(token)` que retorna classes Tailwind:

```ts
export type StatusToken =
  | 'neutral'    // rascunho, não iniciado
  | 'progress'   // em andamento, triagem
  | 'success'    // concluído, contratado
  | 'warning'    // atrasado (universal)
  | 'danger'     // reprovado, desistente
  | 'muted'      // cancelado, abandonado
  | 'archived';  // encerrado (ciclo fechado)

const MAP: Record<StatusToken, string> = {
  neutral:  'bg-slate-100 text-slate-700',
  progress: 'bg-blue-100 text-blue-900',
  success:  'bg-emerald-100 text-emerald-800',
  warning:  'bg-amber-100 text-amber-800',
  danger:   'bg-red-100 text-red-900',
  muted:    'bg-slate-100 text-slate-400',
  archived: 'bg-slate-200 text-slate-900',
};

export function statusClass(token: StatusToken): string {
  return MAP[token];
}
```

Todos os consumidores importam e usam `statusClass('success')` diretamente no JSX.

### `src/features/recruitment/utils/stage-color.ts` — NOVO

Cor por `kind` de etapa do kanban (P6-B):

```ts
import type { PipelineSnapshotStage } from '@/lib/supabase/types';

export function stageColumnBorder(kind: PipelineSnapshotStage['kind']): string {
  switch (kind) {
    case 'entry':          return 'border-t-blue-600';    // #2563EB
    case 'intermediate':   return 'border-t-slate-300';   // #CBD5E1
    case 'hired_terminal': return 'border-t-emerald-600'; // #16A34A
  }
}

export function stageColumnTint(kind: PipelineSnapshotStage['kind']): string {
  // fundo suave só para hired_terminal, resto fica transparente
  return kind === 'hired_terminal' ? 'bg-emerald-50/40' : '';
}
```

### Dedupe — utilitários existentes a remover

- `src/features/recruitment/components/cards/FeedbackCard.tsx:18-22` — `recommendationColor()` → usar `statusClass` (`advance` = success, `doubt` = warning, `reject` = danger).
- `src/features/recruitment/components/cards/ScorecardCards.tsx:20-24` — `recommendationColor()` duplicada → **deletar** e importar de FeedbackCard (ou do helper).
- `src/features/pdi/utils.ts:30-52` — `pdiStatusColor()` / `actionStatusColor()` → reescrever em cima de `statusClass`.
- `src/features/dashboard/components/KpiCard.tsx:17-22` — `TONE_CLASS` → passa a aplicar no ícone (não no número); valores trocam para `text-blue-600/amber-600/emerald-600/red-600`.
- `src/features/reviews/components/ResultCommentsSection.tsx:38-43` — `ROLE_TAG_STYLES` → manter específico (roles não são status), mas substituir hex por classes Tailwind consistentes (`bg-blue-500/10 text-blue-700 border-blue-500/30` etc mantém o padrão, só garante uso de blue em vez de outras cores quentes).

## Mapa de refactor por arquivo

Agrupado por fase (ver plano abaixo). Arquivos já 100% tokenizados não entram — eles se beneficiam automaticamente ao atualizar `globals.css`.

### Fonte de verdade (1 arquivo)

- `src/app/globals.css` — reescrever `:root` e `.dark`

### Shell (1 arquivo)

- `src/features/shell/components/Sidebar.tsx` — duas mudanças:

  **Logo (linha ~156-162):** hoje renderiza `<span className="text-sidebar-primary">Evoluteam</span>` (ou `E` se collapsed). Passa a ter duas variantes:

  ```tsx
  {collapsed ? (
    <span className="text-lg font-bold text-white">E</span>
  ) : (
    <span className="text-lg font-bold tracking-tight">
      <span className="text-white">Evolu</span>
      <span className="text-blue-500">team</span>
    </span>
  )}
  ```

  Removemos o uso do token `text-sidebar-primary` no logo — ele fica reservado para "texto de destaque genérico na sidebar" (usuário no UserCard, por exemplo).

  **Item ativo (linha ~126-130):** substituir `isActive ? 'bg-sidebar-accent text-sidebar-primary font-medium'` por:

  ```tsx
  isActive
    ? 'bg-sidebar-accent text-white font-medium'
    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
  ```

  Só o fundo translúcido (`bg-sidebar-accent` = `white/6%`) indica "ativo", tanto em expanded quanto collapsed. O `text-sidebar-primary` (que hoje é laranja) sai — texto ativo fica branco direto. Sem barra lateral.

### Helpers novos (2 arquivos)

- `src/lib/status-colors.ts` (novo)
- `src/features/recruitment/utils/stage-color.ts` (novo)

### Consumidores de status (19 arquivos)

Divididos em dois grupos pela fase em que entram (ver plano abaixo).

**Grupo 4A — reviews + pdi + colaboradores + dashboard-alert (13 arquivos, Fase 4):**

| Arquivo | Ocorrências |
|---|---|
| `src/features/pdi/utils.ts` | `pdiStatusColor`, `actionStatusColor` |
| `src/features/pdi/components/PdiCard.tsx` | progress bar + badge atrasado |
| `src/features/pdi/components/PdiDetail.tsx` | status atrasado |
| `src/features/pdi/components/PdiActionsSection.tsx` | ação atrasada |
| `src/features/reviews/components/CycleResults.tsx` | 2 status (liberado/análise) |
| `src/features/reviews/components/AssignmentResponder.tsx` | alerta amber |
| `src/features/reviews/components/PublishedCycleEditForm.tsx` | alerta amber |
| `src/features/reviews/components/ResultDetail.tsx` | 3 seções emerald/amber |
| `src/features/reviews/components/wizard/Step5Review.tsx` | aviso amber |
| `src/features/reviews/components/ResultCommentsSection.tsx` | `ROLE_TAG_STYLES` |
| `src/features/employees/components/EmployeeProfile.tsx` | badge role (sky) + convite pendente (amber) + status ativo (emerald inline) |
| `src/features/employees/components/EmployeesList.tsx` | banner aviso amber |
| `src/features/dashboard/components/MinhaArea.tsx` | alerta red |

**Grupo 5A — recruitment cards e detalhes (6 arquivos, Fase 5):**

| Arquivo | Ocorrências |
|---|---|
| `src/features/recruitment/components/cards/FeedbackCard.tsx` | `recommendationColor` |
| `src/features/recruitment/components/cards/ScorecardCards.tsx` | `recommendationColor` (dedupe) + divergência highlights |
| `src/features/recruitment/components/HireCandidateDialog.tsx` | badge hired + alerta amber |
| `src/features/recruitment/components/CandidateProfile.tsx` | status contratado |
| `src/features/recruitment/components/CandidateQuickSheet.tsx` | badge destaque |
| `src/features/recruitment/components/JobOpeningDetail.tsx` | nota amber |

### KPIs + charts (5 arquivos)

- `src/features/dashboard/components/KpiCard.tsx` — mover `TONE_CLASS` para ícone (P7-A ajustada)
- `src/features/dashboard/components/CompetencyRadarChart.tsx` — `oklch(0.62 0.19 258)` → `var(--primary)`
- `src/features/dashboard/components/DepartmentBarsChart.tsx` — idem
- `src/features/recruitment/components/RelatoriosDashboard.tsx` — gradiente laranja no funil → gradiente azul (blue-300 → blue-800)
- `src/features/recruitment/components/dashboard/OriginsDualDonut.tsx` — LinkedIn `#F97316` → `#0A66C2`

### Kanban (1 arquivo)

- `src/features/recruitment/components/Kanban.tsx` — aplicar `stageColumnBorder(kind)` + `stageColumnTint(kind)` no header/container das colunas; trocar badges de feedback/scorecard/tasks por `statusClass`

### Assets de marca (5 arquivos)

- `src/app/icon.tsx` — monograma "et" bicolor (branco + blue-500) sobre fundo slate-900
- `src/app/apple-icon.tsx` — mesma base do icon em escala 180×180
- `src/app/opengraph-image.tsx` — fundo slate-900, "Evolu"+"team" bicolor, barra blue-500 no rodapé
- `src/emails/_components/Layout.tsx` — logo bicolor, backgrounds mantêm `#F5F5F5`/`#FFFFFF` (neutros, não mudam)
- `src/emails/_components/Button.tsx` — CTA `#F97316` → `#2563EB`
- `src/emails/_components/Text.tsx` — cinzas mantêm (`#404040`, `#737373` são neutros adequados), sem mudança

## Plano de implementação por fase

Cada fase é um commit independente, com smoke test visual entre fases.

### Fase 1 — Fundação dos tokens

- Reescrever `:root` e `.dark` em `src/app/globals.css`
- Smoke test: rodar `pnpm dev`, entrar no app logado, verificar que nada quebrou (tela branca, contraste ilegível)
- Commit: `feat(theme): migra tokens CSS de primary laranja para azul`

### Fase 2 — Shell (sidebar logo + item ativo)

- `src/features/shell/components/Sidebar.tsx`: logo bicolor (P3-C) + item ativo translúcido com barra 3px (P2-C)
- Smoke test: navegar entre páginas, ver item ativo destacado corretamente
- Commit: `feat(shell): logo bicolor e item ativo com barra lateral azul`

### Fase 3 — Helpers centralizados

- Criar `src/lib/status-colors.ts` + `src/features/recruitment/utils/stage-color.ts`
- Sem consumidor ainda (só os arquivos novos)
- Commit: `feat(theme): helpers centralizados para status e stage color`

### Fase 4 — Refactor de status em reviews/PDI/colaboradores/dashboard-alert

- Substituir hardcodes por `statusClass(...)` nos **13 arquivos do Grupo 4A**
- Atualizar `pdi/utils.ts` para usar o novo helper como fonte única
- `EmployeeProfile.tsx` — badge role (sky-100/sky-900) reavaliado: roles não são status, mantém em sky como identidade de "papel", mas usando classes Tailwind diretas (não hex)
- Smoke test: abrir PDI (atrasado vira amber), avaliações, perfil de colaborador, /dashboard (MinhaArea)
- Commit: `refactor(theme): aplica mapa semântico de status em reviews/pdi/colaboradores`

### Fase 5 — Recrutamento (cards + kanban + relatórios)

- Substituir hardcodes por `statusClass(...)` nos **6 arquivos do Grupo 5A**
- Dedupe: `recommendationColor` duplicada em `ScorecardCards.tsx` → importa de `FeedbackCard.tsx` (ou extrai para helper se preferir isolar)
- Aplicar `stageColumnBorder(kind)` + `stageColumnTint(kind)` em `Kanban.tsx` (colunas + cards)
- Trocar badges de feedback count, scorecard count e tasks no Kanban por `statusClass`
- Gradiente laranja do funil em `RelatoriosDashboard.tsx` → gradiente azul (blue-300 `#93C5FD` → blue-800 `#1E40AF`)
- LinkedIn `#F97316` → `#0A66C2` em `OriginsDualDonut.tsx`
- Smoke test: kanban de uma vaga com candidatos, /recrutamento/relatorios, donut de origens (9 cores distintas + LinkedIn agora azul)
- Commit: `refactor(recruit): aplica paleta nova em kanban, funil, donut e badges`

### Fase 6 — Dashboard (KPI + charts)

- `KpiCard.tsx`: mover `TONE_CLASS` pro ícone, remover cor do número
- `CompetencyRadarChart.tsx`, `DepartmentBarsChart.tsx`: oklch indigo → `var(--primary)`
- Smoke test: dashboard, /colaboradores?filter=dept
- Commit: `refactor(dashboard): KPI ícone colorido e charts em primary azul`

### Fase 7 — Marca externa (icon + OG + emails)

- Reescrever `icon.tsx`, `apple-icon.tsx`, `opengraph-image.tsx` com monograma "et" bicolor
- `emails/_components/Layout.tsx`: logo bicolor
- `emails/_components/Button.tsx`: CTA azul
- Smoke test: renderizar emails localmente (`pnpm email:dev` em :3001), abrir favicon em nova aba, ver `/opengraph-image` no navegador
- Commit: `feat(brand): migra favicon, OG e emails para identidade azul bicolor`

### Fase 8 — Validação final e cleanup

- `grep` em `src/` por `#F97316`, `#EA580C`, `bg-orange-`, `text-orange-`, `border-orange-` — deve retornar zero ocorrências (exceto se algum ficheiro tiver comentário explicativo que queremos manter; improvável)
- Smoke test manual em toda tela do app logado (ver lista em "Critérios de validação")
- Se cleanup necessário, commit: `chore(theme): remove resíduos da paleta laranja`

## Critérios de validação

### Automatizados (rodar após Fase 8)

- `grep -r "#F97316\|#EA580C\|#f97316\|#ea580c" src/` → zero resultados
- `grep -rE "bg-orange-|text-orange-|border-orange-" src/` → zero resultados
- `pnpm tsc --noEmit` → zero erros
- `pnpm lint` → zero erros

### Smoke test visual (rodar após cada fase + uma varredura final)

Rotas do app logado a abrir e verificar visualmente:

- `/dashboard` — KPIs (ícones coloridos, número preto), charts azuis, donut com 9 cores
- `/colaboradores` + `/colaboradores/[id]` — lista + perfil, badges de role, convite pendente amber
- `/avaliacoes` + ciclo detail + resultados — badges rascunho/andamento/concluído/atrasado/encerrado
- `/feedbacks` — sheet de feedback, dropdown
- `/pdi` + `/pdi/[id]` — card PDI com progress, ação atrasada amber
- `/recrutamento/vagas` + detalhe da vaga — kanban com border-top por kind
- `/recrutamento/candidatos` + perfil de candidato — status contratado/reprovado
- `/recrutamento/relatorios` — funil azul, donut de origens com 9 cores distintas
- `/recrutamento/etapas` — lista de etapas
- `/configuracoes/*` — todas as 5 subtelas (tokenizadas, espera-se zero mudança percebida além do tema geral)
- Notificações (bell) — dropdown com badges
- `/login`, `/forgot-password` — páginas de auth

### Assets

- Favicon no title do browser (`<head>`)
- `/opengraph-image` direto na URL (ver geração OG)
- Emails renderizados em `pnpm email:dev` (porta 3001) — `employee-invite`, `review-reminder`

## Riscos e mitigações

- **Contraste insuficiente:** blue-100/blue-900 e amber-100/amber-800 podem parecer fracos em alguns contextos. Se no smoke test ficar ilegível, ajustar para `*-200`/`*-900` no helper — mudança isolada num arquivo.
- **Tela branca em rota específica:** se algum componente consumir token indireto (ex: `ring-2 ring-offset-background`), mudança em `--background` pode estourar. Mitigação: smoke test por fase, commits pequenos, rollback fácil.
- **Cache de OG image:** Next.js cacheia `opengraph-image`. Após deploy, forçar rebuild com timestamp no alt/metadata se necessário.
- **Cache de favicon no browser:** usuários podem ver ícone antigo por dias. Aceitar — auto-invalida com tempo.

## Ordem sugerida de commit

```
1. feat(theme): migra tokens CSS de primary laranja para azul
2. feat(shell): logo bicolor e item ativo com barra lateral azul
3. feat(theme): helpers centralizados para status e stage color
4. refactor(theme): aplica mapa semântico de status em reviews/pdi/colaboradores
5. refactor(recruit): aplica paleta nova em kanban, funil e donut
6. refactor(dashboard): KPI ícone colorido e charts em primary azul
7. feat(brand): migra favicon, OG e emails para identidade azul bicolor
8. chore(theme): remove resíduos da paleta laranja (se necessário)
```

Total: 7–8 commits. Tempo estimado: 1 sessão longa ou 2 curtas, dependendo de smoke test intermediário.
