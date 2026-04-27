# Reestruturação visual da Landing Page (preservando 100% da copy)

## Contexto

A landing atual em `src/features/landing/LandingPage.tsx` tem copy validada e mockups próprios de produto, mas o tratamento visual carece do rigor estrutural típico de uma landing B2B editorial. O objetivo é **aplicar o blueprint de `landing.md`** — que valida tipografia editorial, espaçamento (120px section), ritmo de fundo e padrões estruturais (eyebrow pill, problema 2-col com numeração, card PDI dark, pricing 2-col) — **sobre as 9 seções existentes**, sem alterar nenhuma palavra de copy e sem cortar seções.

`docs/landingjson.md` foi descartado como referência (exige ativos que ainda não existem: 1500 logos, depoimentos, métricas acumuladas, awards, blog).

## Decisões alinhadas

1. **Referência única**: `landing.md` (na raiz do repo). `docs/landingjson.md` ignorado.
2. **Sobrevivência**: todas as 9 seções preservadas integralmente, ordem mantida.
3. **Tokens**:
   - **Sans**: Geist Sans (mantido — consistência com produto inteiro)
   - **Serif**: **Newsreader** (Google Font, novo) — substitui Georgia só na landing
   - **CTA primário público**: `#0a0a0a` preto puro
   - **Identidade**: coral `primary` mantida em pill/eyebrow/dots
   - **Spacing**: novos tokens em `tailwind.config` — `section-padding: 120px`, `gutter: 24px`, `stack-sm: 8px`, `stack-md: 16px`, `stack-lg: 32px`
4. **Ritmo de fundo por arco narrativo (5 zonas)**:

| Zona | Seções | Fundo |
|---|---|---|
| Promessa | Hero | `#fcf8f8` (surface quente) |
| Diagnóstico | Problema + Como Funciona | branco com `border-t` |
| Prova | Feedback + Review + PDI | `#fafafa`, PDI dark `#0a0a0a` fechando |
| Confiança | Carta + FAQ | branco |
| Conversão | Planos branco + Demo dark `#0a0a0a` | (Demo já é hoje) |

## Tratamento por seção

### Header (`LandingHeader.tsx`)
- Sticky `bg-white/80 backdrop-blur-md border-b border-outline-variant`, max-w-[1200px]
- Logo: Newsreader bold tracking-tighter
- Nav: Produto / Como Funciona / Planos / FAQ
- Trailing: "Entrar" (link) + "Agendar demo" (preto `#0a0a0a`)
- Sem mudança estrutural — só refino de tokens

### Hero
- **Eyebrow pill**: `inline-flex items-center gap-2 mb-stack-lg border border-outline-variant rounded-full px-4 py-1.5` com bolinha coral `bg-primary` e label uppercase tracking-widest 12px ("Performance · Feedback · Desenvolvimento")
- **H1**: Newsreader 48px weight 500 leading-[1.1] tracking-[-0.02em], `<em class="italic">Desenvolver</em>` preservado
- **Subhead**: Newsreader 24px leading-[1.4] max-w-2xl
- **CTAs**: primário preto `#0a0a0a`, secundário `border border-outline` outlined
- **Mockup**: HeroProductMockup envolvido em frame `border border-outline-variant rounded-lg overflow-hidden bg-white shadow-sm p-2`
- Padding: `pt-section-padding pb-section-padding`, max-w-[1200px], text-center

### Problema (id `#produto`)
- **Refator estrutural**: `grid md:grid-cols-2 gap-16 items-center`
- **Esquerda**: 3 dores empilhadas com `space-y-12`, cada uma:
  - Numeração 01/02/03 em Newsreader 32px cor `outline-variant`
  - h3 Newsreader 32px (texto da dor existente)
  - Body Geist 18px leading-[1.6] cor `on-surface-variant`
- **Direita**: blockquote do fundador (existente) com `border-l border-outline-variant pl-8 md:pl-16 py-8`, Newsreader italic 24px max-w-md
- Fundo branco, `border-t border-outline-variant`

### Como Funciona (id `#como-funciona`)
- h2 Newsreader 32px (texto existente "Feedback, ciclo e PDI no mesmo fluxo") centralizado em cima dos cards
- 3-card grid `md:grid-cols-3 gap-8`
- **Cards 1 e 2** (Feedback / Ciclo): `bg-white border border-outline-variant p-8 rounded-lg`
  - Eyebrow uppercase tracking-widest 12px ("Contínuo" / "Formal")
  - h3 Newsreader 32px
  - Body Geist 16px
- **Card 3** (PDI): `bg-[#0a0a0a] border border-[#333] p-8 rounded-lg relative overflow-hidden`
  - Decoração coral: `absolute top-0 right-0 w-32 h-32 bg-primary opacity-10 rounded-bl-full transform translate-x-16 -translate-y-16`
  - Eyebrow coral
  - h3 Newsreader 32px branco
  - Body neutral-400
- Fundo branco, `border-t`

### Feature: Feedback (deep-dive)
- 2-col `md:grid-cols-2 gap-16 items-center`: text esquerda, FeedbackMockup direita
- Text block: label-caps eyebrow + h2 Newsreader 32px (existente "O contexto do ano, registrado.") + body Geist 18px leading-[1.6]
- Mockup container: `border border-outline-variant rounded-lg overflow-hidden bg-white shadow-sm p-2`
- Fundo `#fafafa`, padding `py-section-padding`

### Feature: Review (deep-dive)
- 2-col reversed: ReviewMockup esquerda, text direita
- Mesma anatomia
- Fundo `#fafafa`

### Feature: PDI (deep-dive)
- Fundo dark `#0a0a0a` full-width
- 2-col text + PdiMockup; texto branco, body neutral-300
- Mockup PdiMockup já é dark — preservar
- Fecha a zona Prova com peso

### Carta do Fundador (id `#fundador`)
- Container `max-w-3xl mx-auto`
- Eyebrow label-caps "Carta do fundador"
- h2 Newsreader 32px "Por que construímos assim"
- Body: 4 parágrafos Newsreader **regular** 18px leading-[1.7], primeira frase em Newsreader italic como entrada editorial
- Fundo branco

### FAQ (id `#faq`)
- Container `max-w-3xl mx-auto`
- h2 Newsreader 32px "Perguntas que escutamos muito"
- `FaqAccordion` preservado, refino de bordas (`border-outline-variant`) e tipografia
- Fundo branco

### Planos (id `#planos`)
- **Refator estrutural**: `grid md:grid-cols-2 gap-16 items-start`
- **Esquerda**: h1 Newsreader 48px (existente "Um plano. _Todas as funcionalidades._") + body Geist 18px + CTA preto "Solicitar proposta"
- **Direita**: card `bg-white border border-outline-variant rounded-lg p-8 md:p-12`
  - Header: h3 Newsreader "Plano Evoluteam" + descrição "Preço sob consulta..." separados por `border-b border-outline-variant pb-8`
  - Lista de features com ícone Lucide `Check` (consistência com produto, não usar material-symbols-outlined que `landing.md` mostra)
- Fundo branco

### Demo (id `#demo`)
- Fundo dark `#0a0a0a` — preservado
- h2 Newsreader em branco (existente "O próximo ciclo pode terminar diferente.")
- LeadForm preservado; CTA dentro do form vira preto sobre fundo branco/coral
- Padding `py-section-padding`

### Footer
- Branco com `border-t border-outline-variant`
- Logo Newsreader + tagline + copyright (col-span-2 em md)
- 2 colunas de links (Termos/Privacidade · Contato/Imprensa)
- Estrutura atual mantida, só refino de tokens (Newsreader no logo)

## Arquivos a modificar

**Foundation (tokens):**
- `tailwind.config.*` — adicionar `fontFamily.newsreader`, spacing (`section-padding`, `gutter`, `stack-sm/md/lg`)
- `src/app/layout.tsx` — `next/font/google` import de `Newsreader` com weights 400/500/700 + italic 400, exposto via CSS variable `--font-newsreader`
- `src/app/globals.css` — confirmar token `--color-outline-variant` existe; adicionar se faltar

**Componentes:**
- `src/features/landing/LandingPage.tsx` — refator orquestral (estrutura de seções, fundos, espaçamentos, fontes serif)
- `src/features/landing/components/LandingHeader.tsx` — Newsreader no logo, CTA preto
- `src/features/landing/components/ProductMockups.tsx` — ajustar container frame (border + shadow-sm + p-2) nos 4 mockups
- `src/features/landing/components/LeadForm.tsx` — CTA submit preto
- `src/features/landing/components/FaqAccordion.tsx` — refino visual (bordas)

**Não tocar:**
- Lógica de auth/redirect em `src/app/page.tsx`
- Conteúdo interno dos mockups (Feedback/Review/Pdi continuam exibindo o mesmo dataset)
- Qualquer arquivo fora de `src/features/landing/` exceto os 3 foundation files acima

## Reuso

- `next/font/google` já é convenção (Geist já está assim) — adicionar Newsreader na mesma configuração
- Ícone Lucide `Check` (já presente no projeto) em vez de material-symbols-outlined que `landing.md` usa
- Tokens CSS de cor (`outline-variant`, `on-surface-variant`, `surface`) já existem em `globals.css`
- HeroProductMockup, FeedbackMockup, ReviewMockup, PdiMockup preservados como caixas-pretas — só o container externo muda

## Verificação

1. **Antes/depois visual**: `pnpm dev`, abrir `/` em incógnito, comparar com `landing.md` aberto em aba paralela. Cada seção deve refletir os padrões do blueprint nos pontos mapeados acima.
2. **Responsivo**: 360px (mobile) / 768px (tablet) / 1280px (desktop). Confirmar colapso pra 1-col em <768px nas seções 2-col (Problema, Features, Planos).
3. **Tipografia carregando**: Network tab → Newsreader baixou; computed style do h1 do hero mostra `Newsreader`, não Georgia.
4. **Tokens Tailwind**: `pnpm build` sem warnings; classes `pt-section-padding`, `mb-stack-lg` resolvem.
5. **Hierarquia**: h1 = 48px, h2 = 32px, h3 = 24px, body = 16/18px. Inspecionar 1 de cada.
6. **Lighthouse**: rodar antes/depois; Newsreader (~30KB) não deve derrubar Performance >5 pontos. Servir só weights 400/500/700 + italic 400.
7. **Brand consistency end-to-end**: clicar "Agendar demo" → scroll pra `#demo` → preencher form → submit. Após submit, conferir transição visual pro produto autenticado: produto continua Geist + coral, sem dissonância de identidade.
8. **Acessibilidade rápida**: contraste do texto branco em fundo dark `#0a0a0a` (PDI card, PDI deep-dive, Demo) ≥ 4.5:1 — Newsreader 16px+ branco em #0a0a0a passa.

## Trabalho remanescente (fora deste plano)

Decisões de polish puramente visual (cor exata da bolinha do eyebrow pill, microanimações, qual peso de Newsreader fica melhor por seção, eventual ajuste de hierarquia entre h2 da Carta vs h2 do FAQ) ficam pra fase de implementação **com Visual Companion ligado** (sair do Plan Mode, mockups lado-a-lado em browser pra cada seção que precisar refinamento de pixel).
