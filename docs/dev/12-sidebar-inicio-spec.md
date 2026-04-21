# Spec — Sidebar: Início + grupo Principal (tema #2)

Design validado em brainstorm 2026-04-20. Separa o item principal de navegação do grupo "Principal",
com label e ícone condicionais à role.

## Regras

1. Item de entrada fica **solto no topo da sidebar**, antes do grupo "Principal" (sem label acima).
2. Label/ícone condicional à role:
   - `canAccessDashboard(actor)` = true → **"Dashboard"** + ícone `LayoutDashboard`
   - `canAccessDashboard(actor)` = false → **"Início"** + ícone `Home`
3. Rota única `/dashboard` em ambos os casos (página já bifurca conteúdo por role).
4. Grupo "Principal" passa a conter apenas: Colaboradores · Avaliações · Feedbacks · PDI.
5. Grupo "Configurações" (accordion, admin-only) permanece inalterado.

## Implementação

### Arquivos tocados

- `src/features/shell/components/Sidebar.tsx`
  - `MAIN_NAV` removido o item Dashboard
  - Novo prop `isOperationalOnly: boolean` (true = user comum, mostra "Início"/Home)
  - Renderização do item "top" antes do grupo Principal usando o mesmo helper `renderItem`
- `src/app/(app)/layout.tsx`
  - Calcular `canAccessDashboard(actor)` no server (reusa `src/features/dashboard/permissions.ts`)
  - Passar `isOperationalOnly={!canAccessDashboard(actor)}` para `<Sidebar>`

### Arquivos NÃO tocados

- `src/app/(app)/dashboard/page.tsx` — já bifurca conteúdo por role
- `src/proxy.ts` — rota continua `/dashboard`
- `src/features/shell/components/Breadcrumbs.tsx` — `SEGMENT_LABELS['dashboard'] = 'Dashboard'` permanece (aceitável para o caso do user comum; só aparece raramente pois não há segmentos profundos)
- Links internos (`href="/dashboard"` em KpiCards, redirects) — rota preservada

## Testes

Smoke visual (manual):

1. Login como admin_rh → sidebar mostra "Dashboard" + ícone painel no topo, depois grupo "Principal" com 4 itens.
2. Login como user comum (sem subordinados) → sidebar mostra "Início" + ícone casa no topo, resto igual.
3. Clicar no item → `/dashboard` carrega (gerencial vs. Minha área, respectivamente).

Sem testes unitários novos.

## Fora do escopo

- Mudar rota para `/inicio` (decidido manter `/dashboard`)
- Customizar breadcrumb com label dinâmico
- Mudar comportamento do proxy
- Mudar `MinhaArea.tsx` (título "Olá, {nome}" continua)

## Ordem de implementação

1. Extrair `canAccessDashboard` no `(app)/layout.tsx` e passar flag para Sidebar
2. Refatorar `Sidebar.tsx` — MAIN_NAV sem Dashboard + item top condicional
3. Smoke test manual com 2 roles
