# App UI Refresh — Design (2026-04-21)

Consolidação de 7 ajustes no app logado: refresh visual (fundo cinza + sombra de cards + cor da sidebar), reestruturação da sidebar (rename/reordenação/Configurações como label), fix do gráfico de departamentos e fix do bug de stale na edição de colaborador.

## Objetivos

- Dar mais respiro e hierarquia visual ao conteúdo sem reescrever componentes.
- Corrigir duas regressões de UX: barras horizontais quando se esperava verticais; sheet de edição de colaborador exibindo estado stale após save.
- Simplificar a sidebar: tornar Configurações uma seção tão previsível quanto as demais, reordenar Recrutamento e renomear Principal → Acompanhamento.

## Não-objetivos

- Redesenhar componentes (tipografia, inputs, botões, etc.). Esta é uma intervenção de superfície.
- Auditar ou alterar schema/DB. Não há migrations.
- Propagar o fix de stale para outros sheets sem evidência de bug. Limitado ao `EmployeeSheet`.
- Introduzir tokens de dark mode adicionais. Ajuste só do que já existe.

## Stack e tokens relevantes

- **Next.js 15 + Tailwind v4.** Tokens vivem em `src/app/globals.css` via `@theme` e CSS variables OKLCH.
- **Componentes:** shadcn-like customizado; `Card` em `src/components/ui/card.tsx` usa hoje `ring-1 ring-foreground/10` (sem `shadow-*`).
- **Sidebar:** `src/features/shell/components/Sidebar.tsx` renderiza itens via array de `NavItem`.
- **Gráfico:** `src/features/dashboard/components/DepartmentBarsChart.tsx` usa Recharts; atualmente `BarChart layout="vertical"` → barras horizontais.
- **Edição de colaborador:** `src/features/employees/components/EmployeeSheet.tsx` + `src/features/employees/actions.ts:updateEmployee`.

## Escopo — os 7 itens

### 1. Gráfico "média por departamento" → barras verticais

**Arquivo:** `src/features/dashboard/components/DepartmentBarsChart.tsx`.

**Mudança:** remover `layout="vertical"` do `<BarChart>`. Inverter `XAxis` (agora categoria, nomes de departamento) e `YAxis` (agora numérico, domínio 0–5). Ajustar margins: `{ top: 8, right: 16, left: 8, bottom: 24 }` (bottom maior para labels). `width` do YAxis volta ao default; `XAxis` ganha `interval={0}` + `tick={{ fontSize: 11 }}`.

**Labels horizontais.** Confirmado que departamentos tendem a ter nomes curtos — sem rotação 45°. Se em produção aparecer departamento com nome > 12 caracteres, a Recharts já faz wrap natural; não precisa lógica custom no MVP.

**Interatividade mantida:** clique em barra segue filtrando por `department_id`.

### 2. `PRINCIPAL` → `ACOMPANHAMENTO`

**Arquivo:** `src/features/shell/components/Sidebar.tsx:187`.

**Mudança:** substituir literal `Principal` (renderizado uppercase via `tracking-widest uppercase`) por `Acompanhamento`. Nenhuma outra alteração na seção.

### 3. Fix bug — edição de gestor direto não reflete na UI

**Root cause confirmado pelo usuário:** DB persiste, mas a UI de detalhes e o sheet reabrem com valor antigo. `revalidatePath` em `updateEmployee` marca o RSC stale, porém o client-side router não rebusca até uma navegação. O `SheetContent` re-renderiza com a prop `employee` stale do Server Component pai.

**Fix:** em `src/features/employees/components/EmployeeSheet.tsx`:

1. Adicionar import: `import { useRouter } from 'next/navigation';`
2. No corpo do componente: `const router = useRouter();`
3. Após sucesso do submit, chamar `router.refresh()` **antes** de `onOpenChange(false)`:

```tsx
// EmployeeSheet.tsx — dentro de onSubmit (substituir trecho a partir de toast.success)
toast.success(
  isEdit ? 'Colaborador atualizado!' : values.sendInvite ? ... : ...,
);
router.refresh();          // ← novo: força RSC pai a rebuscar employee
onOpenChange(false);
setLoading(false);
```

**Escopo limitado.** Não aplicar preventivamente em outros sheets — só estender se o usuário reportar o mesmo sintoma. Marcar como candidato em follow-up: `CandidateSheet`, `JobOpeningSheet`.

**Sem mudanças em `actions.ts`.** O `revalidatePath` já está correto; o problema estava no client.

### 4. Recrutamento: Candidatos → Vagas → Etapas

**Arquivo:** `src/features/shell/components/Sidebar.tsx:31-35` (`RECRUITMENT_NAV`).

**Nova ordem:**

```ts
const RECRUITMENT_NAV: NavItem[] = [
  { label: 'Candidatos', href: '/recrutamento/candidatos', icon: UserPlus },
  { label: 'Vagas',      href: '/recrutamento/vagas',      icon: Briefcase },
  { label: 'Etapas',     href: '/recrutamento/etapas',     icon: KanbanSquare, adminOnly: true },
];
```

Rotas não mudam; só a ordem visual.

### 5. Fundo cinza + sombra leve nos cards

Escolha aprovada: **variação B** — `bg: oklch(0.975 0 0)` (≈ `#f7f7f7`), `shadow: 3px 4px 10px -2px rgba(17,24,39,0.06), 1px 2px 3px rgba(17,24,39,0.04)`. Direção top-left → bottom-right.

**Mudança 5a — novo token `--surface` em `globals.css`:**

```css
/* :root (light) */
--surface: oklch(0.975 0 0);
--surface-foreground: oklch(0.145 0 0);

/* .dark — manter tom dark existente ou espelhar background atual do dark */
--surface: oklch(0.145 0 0);   /* ajustar após teste visual no dark mode */
--surface-foreground: oklch(0.985 0 0);
```

E no bloco `@theme inline`:

```css
--color-surface: var(--surface);
--color-surface-foreground: var(--surface-foreground);
```

**Mudança 5b — aplicar no layout do app logado.** Em `src/app/(app)/layout.tsx:67`, adicionar `bg-surface` ao `<main>` (hoje: `className="flex-1 overflow-y-auto p-6"`). A sidebar (renderizada no mesmo layout) permanece em `bg-sidebar`.

**Mudança 5c — `card.tsx` ganha sombra.** Em `src/components/ui/card.tsx`, remover `ring-1 ring-foreground/10` do componente raiz. Adicionar shadow via nova variável de sombra em `globals.css`:

```css
--shadow-card: 3px 4px 10px -2px rgb(17 24 39 / 0.06), 1px 2px 3px rgb(17 24 39 / 0.04);
```

Registrar no `@theme`:

```css
--shadow-card: var(--shadow-card);
```

Aplicar a classe resultante no root do `Card`, resultando em:

```tsx
// card.tsx — componente raiz
className={cn(
  "group/card flex flex-col gap-4 overflow-hidden rounded-xl bg-card py-4 text-sm text-card-foreground border border-border/60 shadow-card ...",
  className
)}
```

A `border border-border/60` garante contorno sutil quando o card estiver sobre fundo não-cinza (ex: dentro de um modal branco) — onde a sombra sozinha sumiria.

**Mudança 5d — auditoria de "onde incluir cards".** Antes de implementar, o plan executa uma varredura visual nas seguintes rotas e produz uma lista final de conteúdo solto que se beneficia de virar `<Card>`:

- `/dashboard`
- `/colaboradores`, `/colaboradores/[id]`
- `/recrutamento/vagas`, `/recrutamento/vagas/[id]`
- `/recrutamento/candidatos`, `/recrutamento/candidatos/[id]`
- `/recrutamento/etapas`
- `/pdi`
- `/feedbacks`
- `/avaliacoes`
- `/configuracoes/*` (empresa, departamentos, cargos, competências, auditoria)

Critério: seções com título + conteúdo sem container dedicado, onde adicionar card aumentaria a legibilidade contra o novo fundo cinza. Não virar card tudo — muita casca cansa. O plan decide caso a caso com justificativa por página.

### 6. Sidebar `#121212`

**Arquivo:** `src/app/globals.css`.

Atualizar `--sidebar` de `oklch(0.13 0 0)` (≈ `#0e0e0e`) para `oklch(0.178 0 0)` (equivalência de `#121212`). Aplicar tanto em `:root` quanto em `.dark` (a sidebar é escura em ambos os modos). Tokens acessórios (`--sidebar-border`, `--sidebar-accent`) permanecem em `oklch(0.22 0 0)`; contraste continua adequado.

### 7. Configurações → label expandida

**Arquivo:** `src/features/shell/components/Sidebar.tsx`.

**Remover:**
- Estado local `manualOpen`, `configOpen`, `isInConfig` (linhas 60–62).
- Botão toggle `<button type="button" onClick={...}>` com `ChevronDown` (linhas ~215–243).
- Função `renderConfigSubItem` (linhas 119–138).
- Função `renderConfigCollapsed` (linhas 140–164).
- Branch `collapsed ? renderConfigCollapsed() : ...`.

**Adicionar:** renderização idêntica a Recrutamento/Acompanhamento:

```tsx
{isAdmin && (
  <div>
    {!collapsed && (
      <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
        Configurações
      </p>
    )}
    <ul className="space-y-0.5">{CONFIG_NAV.map(renderItem)}</ul>
  </div>
)}
```

**Modo collapsed.** Cada sub-item vira ícone com tooltip (comportamento já implementado em `renderItem`). Consequência: sidebar collapsed fica mais alta (5 ícones extras). Aceitável — foi o comportamento validado no mockup.

**Imports a remover quando não usados mais:** `Settings`, `ChevronDown`. Verificar antes de remover — `Settings` só era usado no `renderConfigCollapsed` e no botão toggle.

## Estratégia de implementação — 3 waves

Cada wave é commitável independente. Entre waves, checklist manual rota/ação/resultado.

**Wave 1 — Refresh global (maior blast radius)**
- Itens #5 (surface + shadow), #6 (sidebar `#121212`).
- Arquivos: `globals.css`, `card.tsx`, layout do `(app)`.
- Auditoria de "onde incluir cards" executada como primeira etapa do plan; lista consolidada vira sub-tarefas dentro desta wave.
- Smoke: abrir todas as rotas auditadas e validar que (a) fundo é cinza claro, (b) cards têm sombra sutil bottom-right, (c) nada ficou ilegível.

**Wave 2 — Sidebar estrutura**
- Itens #2 rename, #4 reordenar, #7 Configurações expandida.
- Arquivo único: `Sidebar.tsx`.
- Smoke: navegar entre seções; modo collapsed e expandido; admin e não-admin; verificar que active state funciona em Configurações com 5 itens.

**Wave 3 — Correções pontuais**
- Itens #1 gráfico vertical, #3 fix bug gestor.
- Arquivos: `DepartmentBarsChart.tsx`, `EmployeeSheet.tsx`.
- Smoke: dashboard renderiza gráfico com barras verticais e labels horizontais; edição de gestor direto persiste e UI atualiza sem F5.

## Riscos e mitigação

- **Dark mode.** O token `--surface` no `.dark` é um chute razoável (`oklch(0.145 0 0)`). Testar visualmente e ajustar. Se dark mode não está em uso ativo, aceitar aproximação e iterar depois.
- **Cards dentro de modais/sheets.** Modal já tem fundo branco; card com sombra dentro de modal branco não tem "surface" por trás. A `border border-border/60` adicionada ao card evita que ele fique flutuando sem contorno.
- **Sidebar collapsed mais alta.** Aceita; se a altura da viewport for limitada, `overflow-y-auto` no `<nav>` resolve (já existe).
- **`router.refresh()` em outros sheets.** Não aplicar preventivamente — só quando bug for confirmado. Manter como follow-up.

## Fora do escopo (follow-ups possíveis)

- Propagar `router.refresh()` para outros sheets após confirmação de bug.
- Ajuste fino do `--surface` no dark mode baseado em feedback visual.
- Revisão de uso do `bg-muted` em outros componentes (pode ganhar contraste renovado com o novo surface ao redor).

## Aceite

Cada wave tem smoke manual executado. Marcio confirma rota/ação/resultado conforme checklist padrão. Sem mudanças destrutivas — todas reversíveis via git.
