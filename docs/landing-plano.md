# Reestruturação visual da Landing Page (preservando 100% da copy)

## Contexto

A landing atual em `src/features/landing/LandingPage.tsx` tem copy validada e mockups próprios de produto, mas o tratamento visual carece do rigor estrutural típico de uma landing B2B editorial. O objetivo é **aplicar o blueprint de `landing.md`** — que valida tipografia editorial, espaçamento (120px section), ritmo de fundo e padrões estruturais (eyebrow pill, problema 2-col com numeração, card PDI dark, pricing 2-col) — **sobre as 9 seções existentes**, sem alterar o sentido da copy validada e sem cortar seções.

Este plano foi consolidado após uma conferência visual (Visual Companion), seção por seção, comparando blueprint vs estado atual e resolvendo cada omissão e conflito do plano original. O resultado abaixo é a fonte única de verdade para a fase de implementação.

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
4. **Setinhas (`ArrowRight`)**: somente nos CTAs grandes (Hero). Removidas dos CTAs do Header e demais lugares.
5. **Italic splits no h2**: preservados onde reforçam ritmo editorial (Hero "Desenvolver", Planos "Todas as funcionalidades", Carta primeira frase). Unificados em FAQ e Demo.
6. **Ritmo de fundo por arco narrativo (5 zonas)** — preservado conforme plano original:

| Zona | Seções | Fundo |
|---|---|---|
| Promessa | Hero | `#fcf8f8` (surface quente) |
| Diagnóstico | Problema + Como Funciona | branco com `border-t` |
| Prova | Feedback + Review + PDI | `#fafafa`, PDI dark `#0a0a0a` fechando |
| Confiança | Carta + FAQ | branco |
| Conversão | Planos branco + Demo dark `#020617` (slate-950) | (Demo já é hoje) |

## Conflitos resolvidos contra o plano original

Após conferência visual, três pontos divergentes foram decididos e merecem registro explícito:

1. **FAQ mantém layout 2-col** `lg:grid-cols-[320px_1fr]` (SectionIntro à esquerda + FaqAccordion à direita). O plano original propunha layout vertical `max-w-3xl mx-auto`; mantido o atual por preservar densidade informativa do lado esquerdo (eyebrow + h2 + body de redirecionamento ao suporte).
2. **Footer mantém 3 colunas** (Produto / Empresa / Legal) com headings semibold. O plano original propunha 2 colunas (Termos+Privacidade / Contato+Imprensa); mantido o atual por preservar navegação interna ao site.
3. **Demo mantém fundo `slate-950` (#020617)** em vez de `#0a0a0a` exato do plano. Diferença visual desprezível; evita uma mudança sem ganho.

## Tratamento por seção

Legenda: **MANTER** = elemento atual fica como está · **REMOVER** = corte explícito · **MUDAR** = refino · **ADICIONAR** = novo (não existe hoje).

### Header (`LandingHeader.tsx`)
- **MANTER** sticky `bg-white/80 backdrop-blur-md border-b border-outline-variant`, max-w-[1200px], h-16, MobileMenu
- **MANTER** nav: Produto / Como funciona / Planos / FAQ
- **MANTER** trailing: "Entrar" (link) + "Agendar demo"
- **MUDAR** logo: Georgia → Newsreader bold tracking-tighter
- **MUDAR** CTA "Agendar demo": `bg-slate-950` → `bg-[#0a0a0a]`
- **REMOVER** setinha `ArrowRight` do CTA do header (setinhas só nos CTAs grandes do Hero)

### Hero
- **MANTER** fundo `#fcf8f8`, `pt-section-padding pb-section-padding`, max-w-[1200px], text-center
- **MANTER** CTAs: primário `bg-[#0a0a0a]` + secundário `border border-outline` outlined, **com setinha** `ArrowRight` em ambos
- **MANTER** `HeroProductMockup` com seu container interno `border + rounded-lg + shadow-sm + p-2 + bg-white`
- **MANTER** copy do H1 ("Avaliar é fácil. *Desenvolver* é difícil.") com `<em italic>` preservado
- **MANTER** copy do subhead atual ("O Evoluteam reúne feedback contínuo, ciclo de avaliação e plano de ação em um único fluxo, para que cada nota vire um próximo passo claro.")
- **MUDAR** H1: Georgia 76px → Newsreader 48px weight 500 leading-[1.1] tracking-[-0.02em], `max-w-4xl mx-auto text-balance`
- **MUDAR** subhead: Inter 20px → Newsreader 24px leading-[1.4] max-w-2xl
- **REMOVER** eyebrow pill "Performance · Feedback · Desenvolvimento" (com bolinha coral)
- **REMOVER** `trustItems` (4 ícones entre CTAs e mockup)

### Problema (id `#produto`)
- **MANTER** fundo branco, `border-t border-outline-variant`
- **MANTER** layout 2-col (refator de `[1fr_0.78fr]` → `md:grid-cols-2 gap-16 items-center`)
- **MANTER** `SectionIntro` à esquerda: h2 "A planilha é só o sintoma. *O problema é outro.*" + body "Empresas em crescimento já tentaram formulários, documentos soltos e ferramentas grandes demais. No fim do ciclo, as mesmas tensões voltam."
- **MANTER** separadores `border-t` entre cada uma das 3 dores
- **MANTER** copy do blockquote do fundador ("A maior parte das avaliações termina em uma planilha arquivada. O Evoluteam existe pra mudar essa última parte.")
- **MUDAR** intro h2: Georgia 48px → Newsreader 32px
- **MUDAR** 3 dores numeradas (01/02/03):
  - Numeração Newsreader 32px cor `outline-variant`
  - h3 Newsreader 32px
  - body Geist 18px leading-[1.6] cor `on-surface-variant`
- **MUDAR** blockquote: Georgia 30px → Newsreader italic 24px max-w-md, container `border-l border-outline-variant pl-8 md:pl-16 py-8`
- **REMOVER** eyebrow "O problema" acima do h2 da intro

### Como Funciona (id `#como-funciona`)
- **MANTER** layout: `SectionIntro` centralizado em cima dos 3 cards
- **MANTER** body abaixo do h2 ("Cada peça alimenta a próxima. Nada se perde entre ferramentas, nada vira memória, nada fica sem próximo passo.")
- **MANTER** 3-card grid `md:grid-cols-3 gap-8`
- **MANTER** card 3 (PDI) dark com decoração coral
- **MUDAR** fundo: `#fafafa` → **branco** com `border-t border-outline-variant` (zona Diagnóstico)
- **MUDAR** h2: Georgia 48px → Newsreader 32px centralizado, copy mantida ("Feedback, ciclo e PDI no mesmo fluxo.")
- **MUDAR** cards 1 e 2 (Feedback / Ciclo): `bg-white border border-outline-variant p-8 rounded-lg`
  - Eyebrow uppercase tracking-widest 12px
  - h3 Newsreader 32px
  - body Geist 16px
- **MUDAR** card 3 (PDI): `bg-[#0a0a0a] border border-[#333] p-8 rounded-lg relative overflow-hidden`
  - Decoração coral: `absolute top-0 right-0 w-32 h-32 bg-primary opacity-10 rounded-bl-full transform translate-x-16 -translate-y-16`
  - Eyebrow coral
  - h3 Newsreader 32px branco
  - body neutral-400
- **REMOVER** eyebrow "A solução" acima do h2
- **REMOVER** frase italic centralizada abaixo dos cards ("Toda avaliação termina em uma decisão. Nenhuma termina em uma planilha.")

### Feature: Feedback (deep-dive)
- **MANTER** 2-col `md:grid-cols-2 gap-16 items-center`: text esquerda, `FeedbackMockup` direita
- **MANTER** copy h2 ("O contexto do ano, *registrado.*") com italic split preservado
- **MANTER** body atual
- **MANTER** `BulletList` com 3 bullets coral (`featureBullets.feedback`) abaixo do body
- **MUDAR** fundo: branco → `#fafafa` (zona Prova)
- **MUDAR** h2: Georgia 48px → Newsreader 32px
- **ADICIONAR** wrapper duplicado no mockup: `border border-outline-variant rounded-lg overflow-hidden bg-white shadow-sm p-2` (intencional, mesmo o `Shell` interno já tendo border — produz frame editorial)

### Feature: Review (deep-dive)
- **MANTER** fundo `#fafafa`
- **MANTER** layout reversed (`ReviewMockup` esquerda, text direita)
- **MANTER** copy h2 ("Avaliação com *histórico do lado.*"), body, e `BulletList` (`featureBullets.reviews`)
- **MUDAR** h2: Georgia 48px → Newsreader 32px
- **ADICIONAR** wrapper duplicado no mockup (mesma anatomia da Feedback)

### Feature: PDI (deep-dive)
- **MANTER** fundo dark (slate-950 ou `#0a0a0a` — ambos aceitos)
- **MANTER** layout 2-col text + `PdiMockup`
- **MANTER** copy h2 ("Toda avaliação termina *em uma decisão.*"), body, `BulletList` (`featureBullets.pdi`)
- **MANTER** texto branco, body neutral-300, eyebrow coral `#F09469` (ou token equivalente)
- **MANTER** `PdiMockup` já dark com container `rounded-lg border border-white/10 bg-white/5 p-2`
- **MUDAR** h2: Georgia 48px → Newsreader 32px
- Fecha a zona Prova com peso

### Carta do Fundador (id `#fundador`)
- **MANTER** fundo branco, container `max-w-3xl mx-auto`
- **MANTER** eyebrow label-caps "Carta do fundador"
- **MANTER** copy h2 ("Por que construímos assim.")
- **MANTER** copy dos 4 parágrafos
- **MUDAR** h2: Georgia 48px → Newsreader 32px
- **MUDAR** body: Georgia 20px leading-9 → Newsreader 18px leading-[1.7]
- **MUDAR** assinatura sem avatar: nome **"Marcio Petigrosso" em Newsreader italic grande** + "Fundador · Evoluteam" abaixo em estilo normal
- **ADICIONAR** primeira frase do primeiro parágrafo em Newsreader italic como entrada editorial
- **REMOVER** avatar circular "MP" (substituído pela assinatura italic)

### FAQ (id `#faq`)
- **MANTER** fundo branco (zona Confiança)
- **MANTER** layout 2-col `lg:grid-cols-[320px_1fr]` (decisão contra plano original — preserva densidade informativa)
- **MANTER** eyebrow "Dúvidas comuns"
- **MANTER** `FaqAccordion` preservado, refino de bordas (`border-outline-variant`) e tipografia
- **MUDAR** fundo: `#fafafa` → branco (alinha com arco narrativo)
- **MUDAR** h2 unificado sem italic split: "Perguntas que escutamos muito" (Newsreader 32px)
- **MUDAR** copy do body para: **"Caso ainda fique alguma dúvida, entre em contato com nosso suporte."**

### Planos (id `#planos`)
- **MANTER** fundo branco, `border-t`
- **MANTER** layout 2-col `md:grid-cols-2 gap-16 items-start`
- **MANTER** copy h1/h2 esquerda ("Um plano. *Todas as funcionalidades.*") com italic split preservado
- **MANTER** body esquerda principal ("Todo cliente acessa a plataforma inteira: ciclo, feedback, PDI e dashboard. A cobrança acompanha o tamanho da empresa, só isso.")
- **MANTER** CTA preto "Solicitar proposta"
- **MANTER** card direita: `bg-white border border-outline-variant rounded-lg p-8 md:p-12`
- **MUDAR** h2 esquerda: Georgia 48px → Newsreader 48px (mesma escala do Hero — promovido a h1 visual)
- **MUDAR** copy h3 do card: "Evoluteam" → **"Plano Enterprise"**
- **MUDAR** descrição do card: "Preço sob consulta, ajustado à dimensão da sua operação." (separada por `border-b border-outline-variant pb-8`)
- **MUDAR** lista de features: substituir 5 `pricingFeatures` rich (icon + h4 serif + body + tag badge + border-b) por **lista simples com ícone Lucide `Check`** — uma linha por feature, sem h4/body/tag/separadores. Copy mantida das 5 features (Ciclos / Resultados / Feedback / PDI / Dashboard).
- **REMOVER** eyebrow "Planos"
- **REMOVER** body extra ("Conta um pouco sobre a sua operação e a proposta vai para o seu e-mail com o escopo correto.")
- **REMOVER** linha legal abaixo do CTA ("Mensal ou anual · Nota fiscal emitida · Sem cobrança de implantação")
- **REMOVER** sticky lateral esquerda (`md:sticky md:top-24`)
- **REMOVER** footer do card ("Também incluído: papéis com permissões nativas, isolamento de dados por empresa e log de auditoria.")

### Demo (id `#demo`)
- **MANTER** fundo dark `slate-950 (#020617)` — decisão contra plano original (`#0a0a0a`); diferença desprezível
- **MANTER** layout 2-col text + `LeadForm`
- **MANTER** copy h2 ("O próximo ciclo pode terminar diferente.")
- **MANTER** body atual
- **MANTER** 3 bullets com Check coral abaixo do body ("Demo ao vivo com RH e gestor da sua empresa", "Proposta personalizada depois da conversa", "Plano de implantação para o primeiro ciclo")
- **MANTER** `LeadForm` preservado; CTA submit do form vira preto sobre fundo branco/coral
- **MUDAR** h2 unificado sem italic split (Newsreader em branco)
- **REMOVER** eyebrow "Agendar demonstração"

### Footer
- **MANTER** branco com `border-t border-outline-variant`
- **MUDAR** layout para 4 colunas iguais (`md:grid-cols-4`): brand · Produto · Empresa · Legal (sem `col-span-2` no brand)
- **MANTER** headings semibold das 3 colunas
- **MANTER** bottom bar com separador `border-t` contendo copyright à esquerda + email à direita
- **MUDAR** logo: Georgia → Newsreader
- **MUDAR** email exibido (e link mailto na coluna Empresa que aponta para "Contato"): `contato@evoluteam.com` → **`marcio@marct.co`**
- **REMOVER** tagline da coluna brand ("Avaliação de desempenho, feedback contínuo e PDI no mesmo fluxo.")

## Arquivos a modificar

**Foundation (tokens):**
- `tailwind.config.*` — adicionar `fontFamily.newsreader`, spacing (`section-padding`, `gutter`, `stack-sm/md/lg`)
- `src/app/layout.tsx` — `next/font/google` import de `Newsreader` com weights 400/500/700 + italic 400, exposto via CSS variable `--font-newsreader`
- `src/app/globals.css` — confirmar token `--color-outline-variant` existe; adicionar se faltar

**Componentes:**
- `src/features/landing/LandingPage.tsx` — refator orquestral (estrutura de seções, fundos, espaçamentos, fontes serif, cortes listados acima, footer 4 colunas iguais)
- `src/features/landing/components/LandingHeader.tsx` — Newsreader no logo, CTA `bg-[#0a0a0a]`, remover setinha do CTA
- `src/features/landing/components/ProductMockups.tsx` — substituído por `next/image` apontando para `public/landing/mockups/{Hero,Feedback,Review,Pdi}Mockup.webp`; wrappers externos com border + shadow continuam em `LandingPage.tsx`
- `src/features/landing/components/LeadForm.tsx` — CTA submit preto
- `src/features/landing/components/FaqAccordion.tsx` — refino visual (bordas)
- `src/features/landing/content.ts` — atualizar email mailto de "Contato" para `marcio@marct.co`

**Assets:**
- `public/landing/mockups/HeroProductMockup.webp` — print do dashboard (~1295×804)
- `public/landing/mockups/FeedbackMockup.webp` — print da tela de novo feedback (~1297×807)
- `public/landing/mockups/ReviewMockup.webp` — print da tela de avaliação (~1294×806)
- `public/landing/mockups/PdiMockup.webp` — print da tela de PDI (~1296×808)

**Não tocar:**
- Lógica de auth/redirect em `src/app/page.tsx`
- Conteúdo interno dos mockups (Feedback/Review/Pdi continuam exibindo o mesmo dataset)
- `MobileMenu.tsx` (preservado integralmente)
- Qualquer arquivo fora de `src/features/landing/` exceto os 3 foundation files acima

## Reuso

- `next/font/google` já é convenção (Geist já está assim) — adicionar Newsreader na mesma configuração
- Ícone Lucide `Check` (já presente no projeto) em vez de material-symbols-outlined que `landing.md` usa
- Tokens CSS de cor (`outline-variant`, `on-surface-variant`, `surface`) já existem em `globals.css`
- `HeroProductMockup`, `FeedbackMockup`, `ReviewMockup`, `PdiMockup` preservados como caixas-pretas — só o container externo muda

## Verificação

1. **Antes/depois visual**: `pnpm dev`, abrir `/` em incógnito, comparar com `landing.md` aberto em aba paralela. Cada seção deve refletir os padrões do blueprint nos pontos mapeados acima.
2. **Responsivo**: 360px (mobile) / 768px (tablet) / 1280px (desktop). Confirmar colapso pra 1-col em <768px nas seções 2-col (Problema, Features, Planos).
3. **Tipografia carregando**: Network tab → Newsreader baixou; computed style do h1 do hero mostra `Newsreader`, não Georgia.
4. **Tokens Tailwind**: `pnpm build` sem warnings; classes `pt-section-padding`, `mb-stack-lg` resolvem.
5. **Hierarquia**: h1 = 48px, h2 = 32px, h3 = 24px, body = 16/18px. Inspecionar 1 de cada.
6. **Lighthouse**: rodar antes/depois; Newsreader (~30KB) não deve derrubar Performance >5 pontos. Servir só weights 400/500/700 + italic 400.
7. **Brand consistency end-to-end**: clicar "Agendar demo" → scroll pra `#demo` → preencher form → submit. Após submit, conferir transição visual pro produto autenticado: produto continua Geist + coral, sem dissonância de identidade.
8. **Acessibilidade rápida**: contraste do texto branco em fundo dark (PDI card, PDI deep-dive, Demo) ≥ 4.5:1 — Newsreader 16px+ branco em `#020617` passa.
9. **Email no footer**: confirmar `marcio@marct.co` aparece na bottom bar e que o link "Contato" da coluna Empresa também aponta pra esse mailto.
10. **Cortes aplicados**: confirmar que sumiram visualmente — eyebrow pill do Hero, trustItems, eyebrows ("O problema", "A solução", "Planos", "Agendar demonstração"), frase italic do Como Funciona, body extra/legal/footer/sticky de Planos, tagline do Footer, avatar "MP" da Carta.

## Trabalho remanescente (fora deste plano)

Decisões de polish puramente visual (peso exato da fonte da assinatura italic da Carta, microanimações, qual peso de Newsreader fica melhor por seção, alinhamento vertical fino do email vs copyright na bottom bar) ficam pra fase de implementação **com Visual Companion ligado** novamente quando necessário (mockups lado-a-lado em browser pra cada seção que precisar refinamento de pixel).
