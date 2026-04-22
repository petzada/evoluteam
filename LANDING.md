# LANDING — Plano de implementação

**Referência:** `docs/superpowers/specs/2026-04-22-landing-page-design.md`
**Criado em:** 2026-04-22
**Status:** aguardando execução
**Escopo:** landing page editorial pública do evoluteam em `/`, 12 blocos narrativos.

> Este plano assume que o spec foi aprovado. Decisões estratégicas (tese, tom, arquitetura, cores, copy) **não** são revisitadas aqui — consulte o spec. Este documento cobre apenas **como** construir.

---

## Princípios de execução

1. **Fases entregáveis.** Cada fase deixa `main` em estado navegável (sem quebrar auth/dashboard já existentes). Commits por fase.
2. **Copy passa pelo skill `copywriting`.** A copy final de cada seção (especialmente FAQ e refinamento de microcopy) deve ser gerada via `copywriting`, usando como base o tom e as frases-tese já definidas no spec. O draft do spec é ponto de partida, não entrega final.
3. **Zero placeholder em produção.** Ao final da Fase 10, nenhum link do footer leva a 404 e nenhum screenshot é wireframe.
4. **Nenhum retrabalho nas decisões já tomadas.** Laranja só no contexto do PDI. Eyebrows usam `CONTÍNUO/FORMAL/AÇÃO`, nunca `ATO 1/2/3`. Zero headcount numérico em copy externa.
5. **Mobile-first na escrita do CSS**, mesmo que o design tenha sido pensado em desktop. Breakpoints: `<768px` (mobile), `≥768px` (tablet), `≥1024px` (desktop).

---

## Fase 0 — Preparação

**Goal:** preparar o ambiente e decidir a estrutura de arquivos.

1. Ler `docs/superpowers/specs/2026-04-22-landing-page-design.md` de ponta a ponta antes de iniciar. Este plano **depende** do spec.
2. Decidir estrutura de arquivos entre as 2 alternativas do spec §4.2:
   - **Recomendado:** route group `src/app/(marketing)/` com `layout.tsx` próprio (Header+Footer públicos), e `src/app/page.tsx` importa os componentes do grupo. Isola visual e mentalmente a landing do resto da app.
   - Alternativa: tudo em `src/features/landing/` importado por `app/page.tsx` — só se a opção 1 conflitar com convenções já existentes no repo.
3. Confirmar que a tabela `leads` ainda não existe no Supabase (vamos criar na Fase 7). Se existir com shape diferente, alinhar antes de começar a Fase 7.
4. Confirmar no painel da Resend que o domínio remetente está verificado. Se não, a Fase 7 depende dessa verificação acontecer em paralelo.

**Saída da fase:** decisão de estrutura documentada inline neste arquivo (editar esta linha quando decidir) + checklist de pré-requisitos verde.

---

## Fase 1 — Scaffold + rota pública

**Goal:** a rota `/` serve a landing (vazia ou stub) para não autenticados; autenticados continuam indo pra `/dashboard`.

### Arquivos

- `src/app/page.tsx` — remover `redirect('/dashboard')`. Virar server component que:
  - Cria cliente Supabase server-side.
  - Checa `supabase.auth.getUser()`.
  - Se autenticado, `redirect('/dashboard')`.
  - Se não, renderiza `<LandingPage />`.
- `src/app/(marketing)/layout.tsx` — novo. Layout minimalista apenas com `<Header />` e `<Footer />` e `{children}` no meio. **Sem** o sidebar/shell da app autenticada.
- `src/app/(marketing)/components/Header.tsx` — stub com wordmark + nav + CTA (ainda sem estilo final).
- `src/app/(marketing)/components/Footer.tsx` — stub.
- `src/app/(marketing)/components/LandingPage.tsx` — composição das 12 seções. Na Fase 1 renderiza só um `<main>` com placeholders `<section id="hero" />`, etc.

### Implementação

- Não alterar `src/proxy.ts` — a rota `/` continua pública no middleware.
- Tipo do Header: `'use client'` só se precisar interação JS (scroll behavior). Tentar manter server component sempre que possível.
- Footer: server component puro.

### Verificação

- [ ] Acessar `/` não autenticado → vê landing stub com header + footer + 12 seções vazias, sem crash.
- [ ] Acessar `/` autenticado → continua redirecionando pra `/dashboard`.
- [ ] `/dashboard`, `/login`, `/onboarding/*` continuam funcionando sem regressão.

---

## Fase 2 — Design system tokens + tipografia

**Goal:** preparar os tokens CSS que todas as seções consomem.

### Arquivos

- `src/app/globals.css` — adicionar variáveis CSS para a landing se não couberem nas já existentes:
  - `--landing-serif: Georgia, 'Times New Roman', serif;`
  - `--landing-bg-dark: #0a0a0a;`
  - `--landing-bg-soft: #fafafa;`
- `src/app/(marketing)/components/typography.tsx` (opcional) — componentes `<Eyebrow>`, `<DisplayHeadline>`, `<EditorialLead>` para reuso consistente entre seções.

### Implementação

- **Não carregar font serif custom.** Georgia (system font) é suficiente conforme §4.3 do spec. Reavaliar em v2.
- Escalas tipográficas sugeridas (consolidadas do spec):
  - Hero headline: `clamp(40px, 6vw, 64px)`
  - Section headline: `clamp(32px, 4.5vw, 44px)`
  - Feature headline: `clamp(28px, 3.8vw, 40px)`
  - Body: 17px / 1.55
  - Bullet/meta: 14px
  - Eyebrow: 11-12px, `letter-spacing: 0.08em`, `text-transform: uppercase`

### Verificação

- [ ] Abrir qualquer seção placeholder com um `<DisplayHeadline>` de teste — tipografia renderiza em Georgia em desktop e mobile.
- [ ] Tokens acessíveis via `var(--landing-bg-dark)` em qualquer componente do grupo `(marketing)`.

---

## Fase 3 — Header + Hero + Problema + Solução

**Goal:** renderizar a **abertura completa da página** (topo até o fim da seção Solução). A partir dessa fase, a landing começa a parecer com o mockup.

### Arquivos

- `src/app/(marketing)/components/Header.tsx` — wordmark, nav com âncoras (`#produto`, `#como-funciona`, `#precos`, `#faq`), links "Entrar" e botão preto "Agendar demo" (âncora para `#demo`). Sticky com `border-bottom` sutil; blur no scroll (`'use client'` para listener de scroll — usar `position: sticky` puro se possível para evitar JS).
- `src/app/(marketing)/components/Hero.tsx` — copy aprovada, dois CTAs (primário preto, secundário underline), screenshot placeholder (Fase 8 substitui por asset real).
- `src/app/(marketing)/components/Problem.tsx` — 3 dores numeradas + pull-quote.
- `src/app/(marketing)/components/Solution.tsx` — diagrama horizontal de 3 cards, o terceiro (PDI) em dark com laranja.

### Copy

Usar os textos do spec §3.2, §3.3, §3.4 **tal como estão**. Não reabrir copywriting nesta fase.

### Implementação

- Header: altura 60-64px. Logo à esquerda, nav centralizado em desktop, CTAs à direita.
- Hero: âncora `id="hero"` não necessária (é topo). Screenshot placeholder = `<div>` com dimensões 1200×720 e fundo `#fafafa` com label "PDI screenshot (Fase 8)".
- Problema: `<section>` com 3 `<article>` numerados. Números 01/02/03 em Georgia 36px cinza claro. Pull-quote com `<blockquote>` semântico, bordas superior e inferior.
- Solução: grid 5 colunas em desktop (card, seta, card, seta, card); em mobile vira 3 cards empilhados com setas verticais ou sem setas (decisão: omitir setas em mobile).

### Verificação

- [ ] Progressão cromática: branco → branco → branco → `#fafafa` (solução). PDI card dentro da solução é o único elemento dark.
- [ ] Laranja aparece só no dot do eyebrow do hero e no card do PDI em Solução.
- [ ] Pull-quote do Problema usa `<blockquote>` semântico.
- [ ] Scroll do CTA secundário "Ver como funciona" cai na Solução sem offset estranho.
- [ ] Responsivo a 360px sem overflow horizontal.

---

## Fase 4 — 3 atos de feature (Feedback / Ciclo / PDI)

**Goal:** renderizar as 3 subseções de feature desenvolvidas, com screenshots placeholder e o PDI em dark.

### Arquivos

- `src/app/(marketing)/components/FeatureFeedback.tsx` — Feedback contínuo (fundo branco, texto à esq, screenshot à dir).
- `src/app/(marketing)/components/FeatureCycle.tsx` — Ciclo de avaliação (fundo `#fafafa`, screenshot à esq, texto à dir).
- `src/app/(marketing)/components/FeaturePDI.tsx` — PDI (fundo `#0a0a0a`, texto à esq, screenshot à dir). Este é o clímax.

### Copy

- §3.5, §3.6, §3.7 do spec. Tomar cuidado especial com:
  - Eyebrow do PDI em laranja (`#f97316`): "AÇÃO — o diferencial".
  - Headline do PDI com itálico em laranja (não cinza).
  - Parágrafo do PDI amarra com a tese central: "A nota vira plano — o ciclo fecha com uma próxima ação, não com um relatório."

### Implementação

- Padrão alternado esq/dir/esq em desktop. **Em mobile, screenshot sempre acima do texto** independente da alternância (regra geral de legibilidade mobile).
- FeaturePDI: o screenshot é uma tela light-mode **dentro** do container dark — cria contraste máximo. A imagem do screenshot ainda mantém `border-radius` e sombra.
- Padding vertical generoso (96-112px desktop, 64px mobile).
- Bullets com prefixo `—` em cinza (cinza claro no dark do PDI).

### Verificação

- [ ] Progressão cromática dos fundos da página: branco (hero) → branco (problema) → `#fafafa` (solução) → branco (feedback) → `#fafafa` (ciclo) → **preto (PDI)**. Confirmada visualmente.
- [ ] PDI é a primeira seção em que a página inteira fica dark — o contraste é sentido ao scrollar.
- [ ] Laranja aparece no eyebrow, no itálico da headline do PDI e no card do PDI da seção Solução. Nenhum outro lugar.
- [ ] Em mobile, screenshots sempre aparecem antes do texto em cada feature.

---

## Fase 5 — Carta do fundador + FAQ

**Goal:** fechar a parte narrativa/argumentativa da página.

### Arquivos

- `src/app/(marketing)/components/FounderLetter.tsx` — 1 coluna, largura máxima 720px, corpo em Georgia 19px, 4 parágrafos, assinatura com avatar + nome + cargo.
- `src/app/(marketing)/components/FAQ.tsx` — 2 colunas (320px + resto), accordion à direita. Primeira pergunta aberta por padrão.

### Copy

- Carta: §3.8 do spec — usar **os 4 parágrafos tal como estão**. Essa é uma das poucas seções em que a copy é mais sensível (voz do fundador). **Não passar pelo copywriting automaticamente** — se houver ajuste, é decisão do próprio Marcio.
- FAQ pergunta 1: resposta completa está no spec. **Perguntas 2-7 precisam passar pelo skill `copywriting`** para redigir as respostas com o mesmo tom da pergunta 1.

### Implementação

- Carta: `<article>` com `<cite>` na assinatura para semântica correta.
- FAQ: accordion com `<details>` / `<summary>` nativos (acessíveis, sem JS). Se precisar de animação, usar `<details>` com CSS `interpolate-size` ou adotar `@base-ui/react` (já no projeto). Preferir nativo.
- Cada `<summary>` estilizado: Georgia 18px, chevron `+` / `−` à direita, cursor pointer, sem outline feio no focus.

### Verificação

- [ ] Carta: largura de leitura entre 640-720px desktop, 100% mobile.
- [ ] FAQ primeira pergunta aberta no load.
- [ ] FAQ navegável por teclado (tab + enter) e leitor de tela anuncia estado expanded/collapsed.
- [ ] Respostas 2-7 escritas via `copywriting` com tom de pergunta 1.

---

## Fase 6 — Pricing

**Goal:** renderizar a seção de pricing sob consulta com 1 card único.

### Arquivos

- `src/app/(marketing)/components/Pricing.tsx` — 2 colunas, texto sticky à esquerda, card à direita.

### Copy

§3.10 do spec. **Copy já aprovada e ajustada** para o tom natural que o usuário pediu. Não reabrir.

### Implementação

- Coluna esquerda: `position: sticky; top: 96px` em desktop. Em mobile, empilha acima do card sem sticky.
- Card direito: borda 1px, radius 14px, fundo `#fafafa`.
- 5 itens com separadores. Último item (Dashboard) não tem separador inferior.
- PDI: tag "diferencial" em laranja (`font-weight: 600`) — as outras tags "incluso" em cinza `#737373` normal.
- Rodapé compacto do card: `border-top` sutil, texto cinza 12px.
- CTA da coluna esquerda faz scroll para `#demo` (âncora da Fase 7).

### Verificação

- [ ] Nenhum preço visível em qualquer lugar da seção.
- [ ] Sticky funciona em desktop (texto acompanha o scroll até o fim do card).
- [ ] Em mobile, ordem: headline → parágrafos → CTA → micro-copy → card.
- [ ] "diferencial" é a única tag laranja do card.

---

## Fase 7 — CTA final + Formulário + backend

**Goal:** seção de conversão funcional de ponta a ponta — formulário envia lead e notifica vendas.

### Arquivos

#### Frontend

- `src/app/(marketing)/components/FinalCTA.tsx` — fundo preto, 2 colunas (pitch + form). Âncora `id="demo"`.
- `src/app/(marketing)/components/LeadForm.tsx` — `'use client'`, React Hook Form + Zod, submete via Server Action.

#### Backend

- `supabase/migrations/<timestamp>_leads.sql` — tabela `leads`:
  - `id uuid primary key default gen_random_uuid()`
  - `created_at timestamptz default now()`
  - `name text not null`
  - `email text not null`
  - `company text not null`
  - `role text not null check (role in ('rh','gestor','diretoria','outro'))`
  - `team_size text not null check (team_size in ('ate_20','21_50','51_150','151_300','mais_300'))`
  - `pain text` (nullable, opcional)
  - `user_agent text`
  - `ip inet` (optional, cuidado com LGPD)
  - RLS: insert público (via server action usando service role), select/update/delete restritos ao service role.
- `src/features/leads/lead.schema.ts` — Zod schema dos 6 campos.
- `src/features/leads/lead.action.ts` — Server Action `submitLead(formData)`:
  1. Valida com Zod.
  2. Insere em `leads` usando cliente service role.
  3. Dispara e-mail para vendas via Resend.
  4. Retorna `{ ok: true }` ou `{ ok: false, error }`.
- `src/emails/LeadNotification.tsx` — template React Email minimalista com os 6 campos formatados.

### Implementação

- Formulário com validação client-side (Zod resolver) + server-side (mesmo schema).
- Warning não-bloqueante se `email` termina em `gmail.com`, `hotmail.com`, `outlook.com`, `yahoo.com` — exibir abaixo do campo: "Prefira e-mail corporativo — agiliza o retorno." Sem impedir envio.
- `team_size` select exibe rótulos amigáveis na UI (ex: "Até 20 pessoas") mas grava a chave normalizada.
- Sucesso: substituir o card do formulário por uma mensagem confirmação:
  > "Recebido. Retorno em até 24 horas com horários disponíveis para a demo."
- Erro: toast via `sonner` (já no projeto).
- Endereço de vendas: variável de ambiente `SALES_EMAIL` — adicionar no `.env.example` e Railway.

### Verificação

- [ ] Submissão com dados válidos → registro aparece no Supabase + vendas recebe e-mail.
- [ ] Submissão com dados inválidos → erros de validação inline, não envia.
- [ ] E-mail pessoal (gmail/hotmail) → warning aparece mas envio funciona.
- [ ] Mensagem de confirmação substitui o form após sucesso.
- [ ] LGPD: link "política de privacidade" leva para `/privacidade` (stub da Fase 10 resolve isso).
- [ ] Variáveis de ambiente documentadas em `.env.example`.

---

## Fase 8 — Screenshots reais do produto

**Goal:** substituir os placeholders de screenshot por assets reais.

### Telas a capturar

| Uso | Tela da app | Estado |
|---|---|---|
| Hero | `/pdi/[id]` | PDI com 3 ações (concluída, em andamento, futura) |
| Feature Feedback | `/feedbacks/novo` | Form aberto com tipo "Elogio" selecionado |
| Feature Ciclo | `/avaliacoes/[cycleId]/responder/[assignmentId]` | Pergunta aberta + card lateral de contexto |
| Feature PDI | `/pdi/[id]` | Variante da tela do hero, mais focada em acompanhamento |

### Implementação

**Recomendação do spec §4.5:** opção 1 (capturar screenshots estáticos) para a v1.

1. Popular banco local com dados de demo realistas (nomes fictícios, competências reais, feedbacks plausíveis).
2. Navegar cada tela em viewport 1440×900, capturar com devtools em 2x para retina.
3. Otimizar com `next/image` e formato WebP. Salvar em `public/landing/` com nomes semânticos: `hero-pdi.webp`, `feature-feedback.webp`, `feature-cycle.webp`, `feature-pdi.webp`.
4. Gerar versões menores (1x) para mobile (Next/Image já lida com isso via `sizes`).
5. Substituir os placeholders em Hero/FeatureFeedback/FeatureCycle/FeaturePDI por `<Image>`.

### Verificação

- [ ] Nenhum placeholder visível na página.
- [ ] Lighthouse Performance não cai abaixo de 90 (usar `priority` só no screenshot do Hero).
- [ ] Assets servidos como WebP com fallback automático do Next/Image.

---

## Fase 9 — SEO + metadata + OG image

**Goal:** página ranqueável e compartilhável.

### Arquivos

- `src/app/page.tsx` — `export const metadata = { ... }` com title, description, openGraph, twitter.
- `public/og-image.png` — 1200×630, headline do hero em Georgia sobre fundo branco com wordmark evoluteam discreto. Criar estaticamente, não gerar em runtime.

### Metadata

- `title`: "evoluteam — avaliação, feedback e PDI no mesmo fluxo"
- `description`: "A plataforma de gestão de pessoas que transforma avaliação em plano de ação. Feedback contínuo, ciclo de avaliação e PDI sem depender de planilha."
- `openGraph.siteName`: "evoluteam"
- `openGraph.locale`: "pt_BR"
- `twitter.card`: "summary_large_image"
- `robots`: padrão (indexável).

### Verificação

- [ ] Compartilhar URL de staging no WhatsApp/LinkedIn renderiza preview correto.
- [ ] Ferramentas de debug do Meta e LinkedIn mostram OG image correta.
- [ ] Lighthouse SEO ≥ 95.

---

## Fase 10 — Stubs de páginas legais + QA final

**Goal:** zero link quebrado. QA responsivo completo. Pronto para merge/deploy.

### Arquivos

- `src/app/(marketing)/privacidade/page.tsx` — stub com título "Política de Privacidade" e parágrafo provisório ("Documento em elaboração. Contato: contato@evoluteam.com"). Metadata com `noindex`.
- `src/app/(marketing)/termos/page.tsx` — stub idem para "Termos de Uso".
- `src/app/(marketing)/sobre/page.tsx` — stub idem para "Sobre".
- `src/app/(marketing)/contato/page.tsx` — stub com e-mail de contato.

### QA responsivo

Testar em viewports e reportar regressões antes de merge:

- [ ] 360×640 (mobile pequeno)
- [ ] 414×896 (mobile grande)
- [ ] 768×1024 (tablet)
- [ ] 1280×800 (laptop)
- [ ] 1920×1080 (desktop grande)

### QA de conteúdo (vs spec)

- [ ] Nenhum preço numérico em qualquer lugar da página.
- [ ] Nenhuma menção a "20 a 300" ou faixa similar em copy externa (OK apenas no select interno do formulário).
- [ ] Eyebrows de feature usam `CONTÍNUO` / `FORMAL` / `AÇÃO` — nenhum "ATO N".
- [ ] Laranja aparece apenas em contextos associados ao PDI.
- [ ] Todos os CTAs primários ("Agendar demo/demonstração/proposta") fazem scroll para `#demo`.
- [ ] Footer sem redes sociais.

### QA técnico

- [ ] Lighthouse Performance ≥ 90 em mobile emulado.
- [ ] Lighthouse Accessibility ≥ 95.
- [ ] Sem warnings do React no console.
- [ ] Sem erros de hidratação.
- [ ] Screen reader (NVDA ou VoiceOver) consegue navegar a página inteira linearmente.

---

## Dependências entre fases

```
Fase 0  →  Fase 1  →  Fase 2  →  Fase 3  →  Fase 4  →  Fase 5
                                              ↓
                                           Fase 6  →  Fase 7
                                                         ↓
                                                      Fase 8
                                                         ↓
                                                      Fase 9
                                                         ↓
                                                      Fase 10
```

- Fase 7 pode começar em paralelo com Fase 6 se a pessoa que implementa for diferente.
- Fase 8 (screenshots) pode começar assim que a Fase 4 definir tamanhos/proporções — capturar em paralelo com Fases 5-7.

---

## Fora de escopo deste plano

- Tudo que está em §5 do spec: blog, páginas legais completas (só stubs aqui), analytics, animações Framer Motion, A/B testing, multilíngua, chat widgets.
- Dark mode automático via `prefers-color-scheme` — a landing é uma peça curada (§4.8 do spec).
- Decisão sobre ferramenta de analytics — deixar para spec próprio quando for tratada.

---

## Pontos para revisar antes de iniciar a execução

1. **Estrutura de arquivos** (Fase 0, item 2) — confirmar route group `(marketing)` ou alternativa antes de começar Fase 1.
2. **Endereço de vendas** — qual e-mail recebe as notificações? (variável `SALES_EMAIL`).
3. **Domínio remetente Resend** — verificado para enviar a notificação do formulário?
4. **Tabela `leads`** — criar na mesma migração ou separada? Conflito com schema existente?
5. **Copy das respostas 2-7 do FAQ** — quando entrar o `copywriting` no pipeline? Sugestão: início da Fase 5 antes do componente estar pronto, para o autor ter referência visual.

Responder essas 5 perguntas (inline aqui ou em conversa) antes de abrir a primeira branch de implementação.
