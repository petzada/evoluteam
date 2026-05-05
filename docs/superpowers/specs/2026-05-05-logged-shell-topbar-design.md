# Shell logado — TopBar densa + toggle na sidebar (2026-05-05)

## Objetivos

1. **TopBar** com altura ~**2×** a anterior (`h-14` → ~`min-h-28` / 112px), fundo `bg-background`, `border-b` fino.
2. **Conteúdo da TopBar (esq. → dir.):** `<h1>` (título da página) + **breadcrumb** no mesmo grupo flex, à direita do título; **ações** (`ml-auto`); **NotificationBell** no extremo direito.
3. **Remover** subtítulo/`description` do cabeçalho global; copy essencial vai para o corpo (Alert/parágrafo).
4. **Sidebar:** toggle de recolher **dentro** da coluna — expandido: wordmark à esquerda (`px-3`), toggle à direita; recolhido: monograma “et”, toggle abaixo com `transition-all duration-200 ease-out`, depois `border-b` e navegação.
5. **Registro de título/ações:** contexto React + `<SetAppTopBar />` por rota; cleanup no unmount.

## Não-objetivos

- Parallel routes (`@topbar`) para SSR perfeito do título.
- Redesenho de tokens globais ou dark mode além do necessário.

## SSR / primeiro paint

- O título vem do cliente após `useLayoutEffect` em `SetAppTopBar`; pode haver **um frame** vazio.
- **Fallback:** mapear pathname → rótulo do último segmento “conhecido” (mesmo vocabulário dos breadcrumbs) quando o contexto ainda não tiver título.

## TopBar — duas linhas internas (filtros largos)

- **Linha 1:** grupo esquerdo (título + breadcrumb) + direita (ações parciais ou vazio) + sino.
- **Linha 2 (opcional):** `actions` em `w-full` com `flex-wrap` quando necessário; `min-h-28` acomoda quebra sem comprimir o `main`.

## Main

- Manter `p-6` no layout salvo decisão futura de `py-4`; ganho de área vem sobretudo da remoção do bloco `PageHeader` no fluxo.

## Polish opcional (pós-MVP)

- Omitir último crumb se for redundante com o título.
- `backdrop-blur` leve na TopBar.
