# Shell logado — TopBar densa + toggle na sidebar (2026-05-05)

## Objetivos

1. **TopBar** com **barra de comando**: `border-b` fino, `bg-background/95`, `backdrop-blur-sm`; contraste legível com sidebar e área de conteúdo/cards.
2. **Conteúdo da TopBar (esq. → dir.):** `<h1>` + **breadcrumb** no **mesmo** grupo flex (à direita do título, separador vertical em `sm+`); **ações** (`ml-auto`); **NotificationBell** no extremo direito.
3. **Remover** subtítulo/`description` do cabeçalho global; copy essencial vai para o corpo (Alert/parágrafo).
4. **Sidebar:** toggle de recolher **dentro** da coluna — expandido: wordmark à esquerda (`px-3`), toggle à direita; recolhido: monograma “et”, toggle abaixo com `transition-all duration-200 ease-out`, depois `border-b` e navegação.
5. **Registro de título/ações:** contexto React + `<SetAppTopBar />` por rota; cleanup no unmount.

## Não-objetivos

- Parallel routes (`@topbar`) para SSR perfeito do título.
- Redesenho de tokens globais ou dark mode além do necessário.

## SSR / primeiro paint

- O título vem do cliente após `useLayoutEffect` em `SetAppTopBar`; pode haver **um frame** vazio.
- **Fallback:** mapear pathname → rótulo do último segmento “conhecido” (mesmo vocabulário dos breadcrumbs) quando o contexto ainda não tiver título.

## TopBar — relatórios

- Em `/recrutamento/relatorios`, chips **7d / 30d / 90d / Personalizado** e botão **Filtros avançados** ficam no slot **`actions`** da TopBar (não no corpo da página).

## Main

- **`px-6 py-4`** no layout da área logada (ganho vertical de conteúdo).

## Polish opcional (pós-MVP)

- Omitir último crumb se for redundante com o título.
