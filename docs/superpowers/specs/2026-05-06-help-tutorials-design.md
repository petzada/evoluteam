# Central de Ajuda — tutoriais em vídeo (2026-05-06)

## Objetivos

1. **Banner "Ajuda"** fixo na sidebar logada, posicionado acima do `UserCard` (footer) e abaixo do `<nav>` rolável; clicável → `/ajuda`.
2. **Página `/ajuda`** em layout 2-colunas: lista de tópicos à esquerda; vídeo + descrição MDX à direita. URL canônica por tópico (`/ajuda/[slug]`) com link compartilhável.
3. **Conteúdo MDX versionado** em `content/help/*.mdx`; descrição rica ao lado do player; sem CMS, sem banco.
4. **Visibilidade alinhada ao FT-9**: tutoriais aparecem conforme `canDo(actor, screen, 'view')` (mesmo padrão da Sidebar) + flag `adminOnly`. Tutorial sem gate é baseline (todos os autenticados veem).
5. **Vídeos hospedados no Cloudflare R2** com bucket público via subdomínio R2.dev; player HTML5 nativo; zero env vars; zero proxy server-side.

## Não-objetivos

- CMS / admin UI para curadoria de tutoriais (YAGNI — versionar no repo é suficiente).
- Tracking de "assistido / não assistido", progresso, ou certificados.
- Múltiplos vídeos por tópico (capítulos). Um tópico = um vídeo. Se o assunto crescer, divide em dois tópicos.
- Thumbnails/posters customizados — browser usa o primeiro frame.
- HLS/DASH/streaming adaptativo. MP4 progressivo via `<video>` HTML5 cobre o caso.
- URLs assinadas / bucket privado. Tutoriais de "como usar a plataforma" não têm sensibilidade que justifique a complexidade extra.
- SEO / metadata — `/ajuda/*` está dentro do shell logado.

## Decisões-chave

### Conteúdo MDX

- Arquivos em `content/help/<slug>.mdx`. **Slug = filename** (sem extensão); frontmatter `slug` é ignorado se presente. Elimina conflito slug-duplicado e simplifica `getHelpTopic`.
- Render via `next-mdx-remote@^5` em Server Component. Frontmatter via `gray-matter@^4`. Ambas as deps são server-only.
- Validação Zod do frontmatter por arquivo. Arquivo inválido é descartado com `console.warn('[help] skipping <file>: <error>')`; demais arquivos continuam carregando. Falha de um MDX nunca derruba a página.
- Allow-list de componentes MDX em `HelpMdxComponents.tsx` (h2, h3, a, code, pre, Callout). Sem syntax highlighting de código.

### Visibilidade

Espelha `isItemVisible` da Sidebar:

```ts
function isTopicVisible(fm: HelpFrontmatter, actor: Actor): boolean {
  if (fm.adminOnly && actor.role !== 'admin_rh') return false;
  if (fm.screen && !canDo(actor, fm.screen, 'view')) return false;
  return true;
}
```

Casos:

| `adminOnly` | `screen` | Visível para |
|---|---|---|
| ausente / `false` | ausente | todos os autenticados (baseline) |
| ausente / `false` | `<key>` | quem tem `canDo(actor, key, 'view')` (papel-base **ou** toggle FT-9) |
| `true` | ausente | só `admin_rh` |
| `true` | `<key>` | `admin_rh` **e** `canDo(...)` (ambos) |

Slug existente mas oculto pelo filtro → `notFound()` (mesmo tratamento que slug inexistente). Não vazamos a existência do tutorial para quem não tem a screen.

### Hospedagem (R2)

- Bucket **público** via subdomínio R2.dev. URL completa do objeto fica no frontmatter (`videoUrl: https://pub-<hash>.r2.dev/help/<slug>.mp4`).
- Zod do frontmatter exige `videoUrl` HTTPS (`z.string().url().startsWith('https://')`).
- CORS no bucket libera origens da app (produção + `localhost:3000`), métodos `GET`/`HEAD`, header `Range` exposto (necessário para seek do `<video>`).
- Sem AWS SDK, sem env vars, sem rota proxy. Custo de implementação < custo do A (privado + assinada). Risco aceito: link vazado funciona fora da app — irrelevante para material educacional.

### Banner na sidebar

- Cartão expandido (~72px): `bg-sidebar-accent/40` + borda sutil, ícone `LifeBuoy` + título "Precisa de ajuda?" + subtítulo "Tutoriais em vídeo".
- Estado colapsado: ícone 36×36 com `Tooltip` "Ajuda" — mesmo padrão dos itens de nav.
- Posicionado **fora** do `<nav>` rolável → fica naturalmente fixo acima do footer; nav rola por trás dele.
- Componente em `src/features/help/components/HelpBanner.tsx`; injetado pelo `(app)/layout.tsx` via novo prop `helpBanner` da `Sidebar`.

## Estrutura de arquivos

```
content/
  help/
    onboarding.mdx
    criar-vaga.mdx
    ...

src/features/help/
  content.ts                  # getHelpTopics(), getHelpTopic(slug)  (server, fs + gray-matter)
  visibility.ts               # filterTopicsForActor(), isTopicVisible() (puro)
  schema.ts                   # Zod schema do frontmatter
  types.ts                    # HelpTopic, HelpFrontmatter
  components/
    HelpBanner.tsx            # cliente — respeita collapsed
    HelpTopicList.tsx         # cliente — coluna esquerda, marca ativo
    HelpVideoPlayer.tsx       # cliente — <video controls preload="metadata">
    HelpMdxComponents.tsx     # mapa de tags MDX → estilo do projeto
  __tests__/
    visibility.test.ts
    content.test.ts
  __fixtures__/
    actors.ts
    help/                     # MDX fixtures (NÃO conteúdo real)

src/app/(app)/ajuda/
  layout.tsx                  # server — 2 colunas, carrega visibleTopics e renderiza HelpTopicList
  page.tsx                    # server — redirect pro primeiro tópico visível ou EmptyState
  [slug]/
    page.tsx                  # server — render do tópico, notFound() em qualquer falha
    not-found.tsx             # mensagem amigável + link "ver tutoriais disponíveis"
```

## Mudanças em arquivos existentes

- **`src/features/shell/components/Sidebar.tsx`** — adiciona prop opcional `helpBanner?: React.ReactNode`. Renderiza num bloco com `border-t border-sidebar-border` entre `</nav>` e `{footer}`. Telas que não passam o prop não são afetadas.
- **`src/app/(app)/layout.tsx`** — passa `helpBanner={<HelpBanner />}` para a `Sidebar`.

## Fluxo de dados

```
Request /ajuda
  ↓
page.tsx (server)
  → getActorContext()
  → filterTopicsForActor(getHelpTopics(), actor)
  → lista vazia → <EmptyState /> | senão → redirect(`/ajuda/${topics[0].slug}`)

Request /ajuda/<slug>
  ↓
layout.tsx (server)         carrega visibleTopics e renderiza <HelpTopicList /> à esquerda
  ↓
[slug]/page.tsx (server)
  → getActorContext()
  → getHelpTopic(slug) → null? → notFound()
  → !isTopicVisible(fm, actor) → notFound()
  → render <HelpVideoPlayer videoUrl={fm.videoUrl} />
         + título / descrição
         + <MDXRemote source={source} components={helpMdxComponents} />
```

`getHelpTopics` e `getHelpTopic` usam `cache()` do React (escopo por request) para deduplicar leitura entre `layout.tsx` e `[slug]/page.tsx`. Não usa `unstable_cache` (alinhado à decisão de cache do projeto: TanStack Query no cliente, Redis no servidor; sem cache em filesystem).

## Edge cases

| Cenário | Comportamento |
|---|---|
| `content/help/` vazio | `<EmptyState>` "Nenhum tutorial disponível ainda." Banner permanece visível |
| Frontmatter inválido (Zod) | Arquivo descartado, `console.warn`, demais carregam |
| Slug inválido / inexistente | `notFound()` |
| Slug existe mas filtrado pela visibilidade | `notFound()` (sem revelar existência) |
| Slug com path traversal (`../`, `/`, etc.) | Regex `^[a-z0-9-]+$` rejeita antes do `fs.readFile` |
| Vídeo deletado / bucket fora | `<video onError>` mostra mensagem inline; resto da página continua acessível |
| `videoUrl` não-HTTPS no frontmatter | Schema Zod rejeita → arquivo descartado |
| Admin remove toggle FT-9 | Próximo request: tutorial some da lista; quem estava na URL daquele tópico vê `notFound()` |
| MDX malicioso | Conteúdo é versionado no repo; allow-list de componentes em `HelpMdxComponents` |
| Telas estreitas (`< md`) | `HelpTopicList` vira `<select>` no topo; coluna desaparece. Sem responsivo elaborado pra MVP |

## Schema Zod

```ts
// src/features/help/schema.ts
export const helpFrontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  videoUrl: z.string().url().refine((v) => v.startsWith('https://'), 'videoUrl must be https'),
  duration: z.number().int().positive().optional(),
  screen: z.string().optional(),       // valor desconhecido faz canDo retornar false → tópico oculto
  adminOnly: z.boolean().optional().default(false),
  order: z.number().int().optional().default(100),
});
```

Ordenação dos tópicos: `order` ASC (default 100) → `title` ASC para empate.

## Dependências novas

```
pnpm add next-mdx-remote gray-matter
```

Ambas server-only — não impactam bundle do cliente.

## Variáveis de ambiente

**Nenhuma.** Bucket é público; URL completa fica no frontmatter MDX.

## Testes

Vitest, alinhado ao padrão do projeto:

- **`visibility.test.ts`** — matriz de combinações (baseline / `screen` / `adminOnly` / `screen + adminOnly`) × actores fixtures (admin, gestor, colaborador puro, colaborador-com-toggle).
- **`content.test.ts`** — fixtures em `__fixtures__/help/` (não conteúdo real). Frontmatter válido, frontmatter inválido descartado, ordenação, slug derivado de filename, slug guard contra path traversal.

Sem testes E2E ou de componente para MVP — Sidebar/banner/player são thin wrappers em `<Link>` e `<video>` HTML5; valor está na lógica pura.

## Setup do Cloudflare R2 — passo a passo

Vai virar um README em `docs/help-r2-setup.md` durante a implementação.

1. **Criar bucket.** Cloudflare Dashboard → R2 → "Create bucket". Nome sugerido: `evoluteam-help`. Região: `Automatic`.
2. **Habilitar acesso público via R2.dev.** Bucket → Settings → "Public access" → "R2.dev subdomain" → "Allow Access". Cloudflare gera `https://pub-<hash>.r2.dev`. Esse é o domínio base; cada objeto vira `<base>/<key>`.
   - Atenção ao aviso de rate limit do `r2.dev`. Suficiente para MVP. Migração futura para custom domain (passo 6) não exige mudança de código — só atualizar a base URL nos MDX.
3. **Configurar CORS.** Bucket → Settings → "CORS Policy" → Add:
   ```json
   [
     {
       "AllowedOrigins": ["https://app.seudominio.com.br", "http://localhost:3000"],
       "AllowedMethods": ["GET", "HEAD"],
       "AllowedHeaders": ["Range", "Content-Type"],
       "ExposeHeaders": ["Content-Length", "Content-Range", "Accept-Ranges"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```
   Substituir `app.seudominio.com.br` pelo domínio real de produção. `Range` + `Accept-Ranges` permitem seek (avançar/retroceder) sem baixar o vídeo inteiro.
4. **Encodar o vídeo.** H.264 + AAC, MP4, ≤1080p, ~3–5 Mbps (HandBrake serve). Tutoriais ≤30 min cabem confortavelmente em MP4 progressivo.
5. **Subir o vídeo.** Bucket → Objects → Upload. Usar key com prefixo `help/` (ex.: `help/onboarding.mp4`). Copiar a URL pública gerada.
6. **(Opcional, futuro) Custom Domain.** Quando o rate limit do `r2.dev` virar incômodo: Settings → Public access → Custom Domains → adicionar `cdn.seudominio.com.br` (precisa estar em zone Cloudflare). Atualizar base URL nos MDX.
7. **Criar o primeiro MDX.** `content/help/onboarding.mdx` com frontmatter apontando para a URL copiada no passo 5. Commit + deploy.

## Sucesso

- Banner "Ajuda" aparece em todas as telas autenticadas, fixo acima do `UserCard`, respeitando colapso da sidebar.
- `/ajuda` lista todos os tutoriais visíveis ao actor (filtragem por `screen`/`adminOnly` correta) e redireciona para o primeiro.
- `/ajuda/<slug>` reproduz o vídeo do R2 com controles HTML5 nativos; descrição MDX renderizada ao lado.
- Adicionar um novo tutorial = criar um `.mdx` em `content/help/` + subir vídeo no R2 + commit. Sem migração, sem env var, sem rebuild de schema.
- Remover acesso a uma screen via FT-9 → tutorial da screen some da lista do colaborador no próximo request.
- Suite Vitest verde (`pnpm test:run`).
