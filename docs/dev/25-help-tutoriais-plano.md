# Central de Ajuda — Plano de implementação

Plano detalhado para implementar a Central de Ajuda. Acompanha o spec `docs/superpowers/specs/2026-05-06-help-tutorials-design.md`.

Última atualização: 2026-05-06.

> **Como usar:** trabalhar em fases sequenciais. Cada fase tem entregáveis, arquivos tocados e critérios de aceite. Commits granulares por fase (1 commit = 1 fase consolidada). Não pular fases — a ordem reflete dependências reais.

---

## Resumo das fases

| # | Fase | Tempo estimado | Entregável |
|---|---|---|---|
| 1 | Dependências e estrutura inicial | 15 min | `next-mdx-remote` + `gray-matter` instalados; pastas criadas |
| 2 | Schema Zod + tipos + helpers de I/O | 45 min | `schema.ts`, `types.ts`, `content.ts` com testes |
| 3 | Lógica de visibilidade | 30 min | `visibility.ts` com matriz de testes verde |
| 4 | Botão flutuante de ajuda | 30 min | `HelpFloatingButton.tsx` fixo no shell logado |
| 5 | Página `/ajuda` (layout, page raiz, [slug]/page) | 1h | Rotas server-side + redirect + `notFound()` |
| 6 | Componentes de UI (`HelpTopicList`, `HelpVideoPlayer`, `HelpMdxComponents`) | 1h | Componentes cliente renderizados pela página |
| 7 | Setup do R2 sem seed real | 30 min | `docs/help-r2-setup.md`; seed MDX fica para quando houver URL real |
| 8 | Smoke test manual + ajustes finais | 20 min | Checklist manual passou; suite Vitest verde |

**Total estimado:** ~4h45 de implementação concentrada.

---

## Fase 1 — Dependências e estrutura inicial

**Objetivo:** preparar o terreno antes de tocar em código.

**Arquivos:**
- `package.json` (modificado via pnpm)
- `content/help/.gitkeep` (novo, garante a pasta versionada vazia)
- `src/features/help/` (pastas vazias `components/`, `__tests__/`, `__fixtures__/help/`)

**Passo a passo:**

1. Instalar dependências no servidor:
   ```
   pnpm add next-mdx-remote gray-matter
   ```
2. Criar `content/help/` com `.gitkeep`.
3. Criar a árvore vazia em `src/features/help/`:
   ```
   src/features/help/
     components/.gitkeep
     __tests__/.gitkeep
     __fixtures__/help/.gitkeep
     __fixtures__/.gitkeep (se necessário)
   ```
4. Confirmar build: `pnpm build` (ou pelo menos `pnpm tsc --noEmit`) ainda passa.

**Critérios de aceite:**
- `package.json` lista `next-mdx-remote` e `gray-matter`.
- `pnpm install` reproduz o lockfile sem warnings novos.
- `pnpm tsc --noEmit` passa.

**Commit:** `chore(help): adiciona deps e estrutura inicial da feature`

---

## Fase 2 — Schema Zod + tipos + helpers de I/O

**Objetivo:** ter as funções puras de leitura e validação de MDX antes de qualquer UI.

**Arquivos:**
- `src/features/help/schema.ts` (novo)
- `src/features/help/types.ts` (novo)
- `src/features/help/content.ts` (novo)
- `src/features/help/__fixtures__/help/topic-valid.mdx` (novo)
- `src/features/help/__fixtures__/help/topic-invalid.mdx` (novo)
- `src/features/help/__tests__/content.test.ts` (novo)

**Passo a passo:**

1. **`schema.ts`** — `helpFrontmatterSchema` Zod conforme §"Schema Zod" do spec. Exporta `HelpFrontmatterInput` (input) e `HelpFrontmatterParsed` (output, com defaults aplicados).
2. **`types.ts`** — exporta `HelpTopic` (frontmatter parsed + slug) e `HelpTopicSource` (`{ frontmatter, source }` para `[slug]/page.tsx`).
3. **`content.ts`** com:
   - Constante `HELP_DIR = path.join(process.cwd(), 'content/help')`.
   - Regex `SLUG_RE = /^[a-z0-9-]+$/`.
   - `getHelpTopics(): Promise<HelpTopic[]>`:
     - `fs.readdir(HELP_DIR)` filtrando `*.mdx`.
     - Para cada arquivo: `fs.readFile`, `matter()` para extrair frontmatter, `helpFrontmatterSchema.safeParse`.
     - Falha → `console.warn('[help] skipping <file>: <issues>')` e segue.
     - Sucesso → push `{ slug: filename sem .mdx, ...frontmatter }`.
     - Ordena `order ASC` então `title ASC`.
     - Embrulha com `cache()` do React.
   - `getHelpTopic(slug: string): Promise<HelpTopicSource | null>`:
     - Valida `SLUG_RE.test(slug)`; senão retorna `null`.
     - `path.join(HELP_DIR, `${slug}.mdx`)` + `fs.readFile`. `ENOENT` → null.
     - `matter()` separa `data` (frontmatter) e `content` (corpo MDX).
     - `helpFrontmatterSchema.safeParse(data)`. Falha → null + warn.
     - Retorna `{ frontmatter: { slug, ...parsed }, source: content }`.
     - Embrulha com `cache()`.
4. **Fixtures MDX** — criar dois arquivos curtos em `__fixtures__/help/`:
   - `topic-valid.mdx`: frontmatter completo válido + 2 linhas de corpo.
   - `topic-invalid.mdx`: frontmatter sem `videoUrl`.
5. **Teste `content.test.ts`** — usar `vi.spyOn` em `fs/promises` para apontar para um diretório temporário com fixtures, OU sobrescrever `process.cwd()`. Casos:
   - Frontmatter válido → retorna 1 tópico com `slug` derivado do filename.
   - Frontmatter inválido → descartado, `console.warn` chamado.
   - Misto (1 válido + 1 inválido) → retorna apenas 1.
   - Slug com `../` ou `/` → `getHelpTopic` retorna `null` sem tocar `fs`.
   - Ordenação por `order` e desempate por `title`.

**Critérios de aceite:**
- `pnpm test:run src/features/help` verde.
- `getHelpTopics` é estável a múltiplas chamadas (cache do React deduplicando dentro do mesmo escopo).
- Nenhuma exceção propaga de frontmatter inválido — apenas `console.warn`.

**Commit:** `feat(help): schema, tipos e helpers de leitura de MDX`

---

## Fase 3 — Lógica de visibilidade

**Objetivo:** isolar a regra de filtro pra que ela seja exaustivamente testável sem React.

**Arquivos:**
- `src/features/help/visibility.ts` (novo)
- `src/features/help/__fixtures__/actors.ts` (novo)
- `src/features/help/__tests__/visibility.test.ts` (novo)

**Passo a passo:**

1. **`actors.ts`** — exporta 4 actors fixtures alinhados ao tipo aceito por `canDo`:
   - `adminActor` (role `admin_rh`, screenPermissions completas).
   - `gestorActor` (role `gestor`).
   - `colaboradorPuroActor` (role `colaborador`, sem toggles extras).
   - `colaboradorComToggleActor` (role `colaborador`, com `recrutamento_candidatos.view: true`).
2. **`visibility.ts`**:
   ```ts
   export function isTopicVisible(fm, actor) { ... }   // conforme spec
   export function filterTopicsForActor(topics, actor) {
     return topics.filter(t => isTopicVisible(t, actor));
   }
   ```
3. **Teste `visibility.test.ts`** — matriz:
   - Tópico baseline (sem `screen` nem `adminOnly`) → todos os 4 actors veem.
   - `adminOnly: true` → só admin.
   - `screen: 'recrutamento_candidatos'` sem adminOnly:
     - admin vê.
     - gestor vê (papel-base).
     - colaborador puro NÃO vê.
     - colaborador-com-toggle vê.
   - `screen: 'auditoria'` + `adminOnly: true` → só admin.
   - `filterTopicsForActor` reduz lista corretamente.

**Critérios de aceite:**
- `pnpm test:run src/features/help/__tests__/visibility.test.ts` verde.
- `visibility.ts` não importa nada de React/Next/fs — só `canDo` e tipos.

**Commit:** `feat(help): filtro de visibilidade reusando canDo do FT-9`

---

## Fase 4 — Botão flutuante de ajuda

**Objetivo:** acesso à ajuda aparece em todas as rotas autenticadas sem ocupar espaço da sidebar.

**Arquivos:**
- `src/features/help/components/HelpFloatingButton.tsx` (novo)
- `src/features/shell/components/Sidebar.tsx` (remove contrato antigo de ajuda)
- `src/app/(app)/layout.tsx` (renderiza o botão flutuante)

**Passo a passo:**

1. Remover `HelpBanner.tsx`, a prop `helpBanner?: React.ReactNode` da `Sidebar` e o bloco renderizado entre `</nav>` e `{footer}`.
2. Criar **`HelpFloatingButton.tsx`** (cliente):
   - `'use client'` + `usePathname`.
   - `active = pathname === '/ajuda' || pathname.startsWith('/ajuda/')`.
   - Renderizar `Link` para `/ajuda`, circular, fixo no canto inferior direito, com conteúdo visual apenas `?`.
   - Usar `aria-label="Ajuda"`, tooltip "Ajuda" e `z-40` para ficar abaixo de dialogs/sheets.
3. Em **`(app)/layout.tsx`**, importar e renderizar `<HelpFloatingButton />` dentro dos providers do shell autenticado, fora da `Sidebar`.

**Critérios de aceite:**
- Botão circular `?` aparece em rotas dentro de `(app)` e não aparece em login/rotas públicas.
- Click navega para `/ajuda`.
- Estado ativo aparece em `/ajuda` e `/ajuda/*`.
- Sidebar não contém item, banner ou prop relacionada a Ajuda.
- `pnpm tsc --noEmit` passa.

**Commit:** `feat(help): adiciona botao flutuante de ajuda`

---

## Fase 5 — Página `/ajuda` (layout, page raiz, [slug]/page)

**Objetivo:** rotas server-side funcionando, com redirect e `notFound()` corretos. Conteúdo ainda renderizado de forma mínima — UI rica vem na Fase 6.

**Arquivos:**
- `src/app/(app)/ajuda/layout.tsx` (novo)
- `src/app/(app)/ajuda/page.tsx` (novo)
- `src/app/(app)/ajuda/[slug]/page.tsx` (novo)
- `src/app/(app)/ajuda/[slug]/not-found.tsx` (novo)

**Passo a passo:**

1. **`layout.tsx`** (server):
   - `getActorContext()` para extrair `actor` (role + screenPermissions).
   - `const topics = filterTopicsForActor(await getHelpTopics(), actor)`.
   - Render `<div className="grid grid-cols-1 md:grid-cols-[18rem_1fr] gap-6">` com aside (placeholder de `<HelpTopicList />` — virá na Fase 6, por ora um `<nav><ul>{topics.map(...)}</ul></nav>` simples) e `<main className="min-w-0">{children}</main>`.
2. **`page.tsx`** (server):
   - Mesma carga de actor + topics filtrados.
   - `topics.length === 0` → render `<EmptyState>` ("Nenhum tutorial disponível ainda.").
   - Senão → `redirect(`/ajuda/${topics[0].slug}`)`.
3. **`[slug]/page.tsx`** (server):
   - `params: Promise<{ slug: string }>` (Next 16).
   - `getActorContext()` + `getHelpTopic(slug)`.
   - `topic === null` → `notFound()`.
   - `!isTopicVisible(topic.frontmatter, actor)` → `notFound()`.
   - Render mínimo: `<h1>{title}</h1>`, `<p>{description}</p>`, `<video src={videoUrl} controls preload="metadata">`, `<MDXRemote source={source} />` (sem componentes custom ainda — Fase 6).
4. **`[slug]/not-found.tsx`** (server):
   - Mensagem "Tutorial não encontrado" + `<Link href="/ajuda">Ver tutoriais disponíveis</Link>`.

**Critérios de aceite:**
- `/ajuda` redireciona para o primeiro tópico ou mostra empty state se `content/help/` vazio.
- `/ajuda/<slug-inexistente>` retorna 404.
- `/ajuda/../etc/passwd` retorna 404 (slug guard).
- Tópico `adminOnly: true` acessado por gestor retorna 404.
- TopBar continua funcional (já usa `(app)/layout.tsx` parent).
- `pnpm tsc --noEmit` passa.

**Commit:** `feat(help): rotas server-side da página /ajuda`

---

## Fase 6 — Componentes de UI

**Objetivo:** substituir os placeholders da Fase 5 pela UI definitiva.

**Arquivos:**
- `src/features/help/components/HelpTopicList.tsx` (novo)
- `src/features/help/components/HelpVideoPlayer.tsx` (novo)
- `src/features/help/components/HelpMdxComponents.tsx` (novo)
- `src/app/(app)/ajuda/layout.tsx` (atualiza para usar `HelpTopicList`)
- `src/app/(app)/ajuda/[slug]/page.tsx` (atualiza para usar `HelpVideoPlayer` e passar `components` ao `MDXRemote`)

**Passo a passo:**

1. **`HelpTopicList.tsx`** (cliente):
   - Recebe `topics: HelpTopic[]`. Lê `usePathname` para deduzir `activeSlug` (último segmento de `/ajuda/<slug>`).
   - Em `md+`: lista vertical de `<Link>` em `<ul>`. Cada item: ícone `PlayCircle` + título + (description em text-xs) + duration formatada (`mm:ss`).
   - Em `< md`: vira `<select>` que muda a rota via `useRouter().push`.
2. **`HelpVideoPlayer.tsx`** (cliente):
   - Props: `videoUrl: string`, `title: string`.
   - `useState` para `error: boolean`. `<video onError={() => setError(true)} ...>`.
   - Se `error`: render `<div>` com mensagem "Não foi possível carregar o vídeo. Tente recarregar a página."
3. **`HelpMdxComponents.tsx`**:
   - Export de objeto `helpMdxComponents` com `h2`, `h3`, `a` (próximo/Link interno detectado por `href.startsWith('/')`), `code`, `pre`, e componente custom `Callout` ({ kind: 'info' | 'warning' | 'tip' }).
4. Atualizar `layout.tsx` para usar `<HelpTopicList topics={topics} />` no aside.
5. Atualizar `[slug]/page.tsx` para usar `<HelpVideoPlayer videoUrl={fm.videoUrl} title={fm.title} />` e `<MDXRemote source={source} components={helpMdxComponents} />`.

**Critérios de aceite:**
- Lista esquerda destaca o tópico ativo.
- Click em outro tópico navega rápido (Next prefetch).
- Vídeo HTML5 carrega e tem controles nativos. `preload="metadata"` evidente no DevTools (request inicial pequena).
- `Callout` no MDX renderiza como caixa colorida.
- Tela `< md`: seletor funciona; coluna esquerda some.
- `pnpm tsc --noEmit` passa.

**Commit:** `feat(help): UI da página de ajuda (lista, player, MDX)`

---

## Fase 7 — Setup do R2 sem seed real

**Objetivo:** documentar a operação de vídeos no R2 sem publicar um tutorial quebrado antes de existir URL HTTPS real.

**Arquivos:**
- `docs/help-r2-setup.md` (novo)
- `content/help/.gitkeep` (mantido; nenhum `onboarding.mdx` por enquanto)

**Passo a passo:**

1. Criar `docs/help-r2-setup.md` com:
   - criação do bucket `evoluteam-help`;
   - habilitação de subdomínio público R2.dev;
   - política CORS com `GET`/`HEAD`, `Range` e headers expostos;
   - recomendações de encode H.264 + AAC em MP4;
   - upload com key `help/<slug>.mp4`;
   - teste de Range com `curl -I -H "Range: bytes=0-100" <url>`;
   - template MDX para quando houver URL real.
2. Não criar `content/help/onboarding.mdx` nesta fase sem URL pública real.
3. Registrar que adicionar tutorial depois é: subir vídeo no R2, criar `content/help/<slug>.mdx`, commitar e deployar.

**Critérios de aceite:**
- `docs/help-r2-setup.md` é autocontido e não contém segredos.
- `/ajuda` continua mostrando empty state quando só existe `.gitkeep`.
- O primeiro `onboarding.mdx` fica para commit separado quando a URL HTTPS real existir.

**Commit:** `docs(help): documenta setup do R2 para tutoriais`

---

## Fase 8 — Smoke test manual + ajustes finais

**Objetivo:** verificar comportamento em cenários reais.

**Checklist manual:**

- [ ] Botão circular `?` aparece em `/dashboard`, `/colaboradores`, `/configuracoes/empresa`.
- [ ] Login e rotas públicas não exibem o botão `?`.
- [ ] Click no botão `?` → cai em `/ajuda` e redireciona para o primeiro tópico quando existir conteúdo.
- [ ] Coluna esquerda lista tópicos visíveis ao actor.
- [ ] Vídeo reproduz com controles nativos. Avançar/retroceder funciona (Range).
- [ ] Trocar de tópico via lista → navegação instantânea (prefetch).
- [ ] Logar como colaborador puro → tópicos `adminOnly` não aparecem.
- [ ] Acessar URL direta de tópico oculto → 404.
- [ ] Acessar URL `/ajuda/foo-inexistente` → 404 com link "Ver tutoriais disponíveis".
- [ ] Com apenas `content/help/.gitkeep` → `/ajuda` mostra `<EmptyState>`.
- [ ] Inserir frontmatter inválido em um MDX → arquivo sumiu da lista, demais carregaram. `console.warn` no terminal do dev server.
- [ ] `pnpm test:run` passa.
- [ ] `pnpm lint` passa.
- [ ] `pnpm build` passa.

**Ajustes que podem aparecer:**
- Posição do botão `?` vs ações fixas de páginas específicas — ajustar `bottom/right` se necessário.
- Largura `w-72` da coluna esquerda em telas médias — ajustar para `w-64` se ficar apertada.
- Mensagem do `EmptyState` — refinar copy.

**Critérios de aceite:**
- Todos os itens do checklist marcados.
- Suite Vitest verde.
- Lint e build limpos.

**Commit:** `chore(help): ajustes de polish pós smoke test` (se houver ajuste; pular o commit se nada precisar mudar)

---

## Pós-implementação (fora do escopo deste plano)

- Gravar e publicar tutoriais adicionais (sequência editorial, não mais de código).
- Migrar para custom domain do Cloudflare quando rate limit do `r2.dev` virar incômodo.
- Considerar adicionar tracking de "assistido" caso métricas indiquem necessidade.
