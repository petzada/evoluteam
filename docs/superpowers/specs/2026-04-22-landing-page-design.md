# Landing Page — Design Spec

**Data:** 2026-04-22
**Escopo:** Landing page pública editorial B2B para o produto evoluteam.
**Rota:** `/` (atualmente redireciona para `/dashboard` — será substituída; redirect passa a depender do estado de autenticação).
**Formato:** uma única página longa, renderizada server-side, **12 blocos em sequência** (os 9 pedidos originalmente, com o bloco "Feature" expandido em 3 atos — Feedback, Ciclo e PDI — e acrescido de uma "Carta do fundador" que substitui a prova social ausente).

---

## 1. Decisões estratégicas

### 1.1. Tese editorial
> **"Avaliar é fácil. Transformar em desenvolvimento é o problema."**

A página é organizada como uma **jornada linear em 3 atos narrativos**, com o **PDI como clímax**. A tese não é decorativa — ela define a hierarquia cromática, a progressão de fundos e a escolha das palavras em cada seção.

### 1.2. ICP
Empresas em crescimento que já têm preocupação com gestão de pessoas, mas ainda avaliam desempenho de forma manual (planilhas, Forms, documentos soltos).

**Restrição de copy:** a página não menciona faixas numéricas de headcount (ex: "20 a 300 colaboradores"). Sinalização do ICP é feita por contexto, não por número. Ver memory `feedback_copy_no_headcount.md`.

### 1.3. Objetivo de conversão
**Demo agendada com vendas.** Pricing é **sob consulta** — sem preço visível em nenhum lugar da página. Todo CTA primário leva para o formulário de qualificação no final da página.

### 1.4. Tom & referência visual
**Sério & afiado** — referência Stripe, Linear, Vercel.

- Headlines em **serif (Georgia/Times)**, segunda linha frequentemente em itálico cinza como pivot narrativo.
- Corpo em sans-serif (Geist Sans já configurada no projeto).
- Frases curtas. Zero jargão de RH. Metáforas concretas ("arqueologia", "sai do estômago") em vez de adjetivos superlativos.
- Paleta sóbria. Laranja (`#f97316` — primary já configurada) é usado com **restrição cromática deliberada**: aparece apenas associado ao **PDI** (ato 3) — no dot do eyebrow do hero, no card do ato 3, no acento do CTA final. Fora do PDI, a página vive em preto, branco, cinza.

### 1.5. Prova social
**Zero.** Produto pré-tração. A ausência é compensada com:
- Screenshots reais do produto em cada seção de feature.
- Carta do fundador (seção própria) como sinal de autoridade/ponto de vista.
- Ausência de badges inventados ou depoimentos genéricos.

---

## 2. Arquitetura da página

9 seções, sequenciais, em uma única rota (`/`):

| # | Seção | Fundo | Função narrativa |
|---|---|---|---|
| 01 | Header (sticky) | Branco | Navegação + CTA persistente |
| 02 | Hero | Branco | Tese + CTA primário + screenshot PDI |
| 03 | Problema | Branco | Ato 1 — armar a tensão |
| 04 | Solução | Cinza `#fafafa` | Apresentar os 3 atos em diagrama |
| 05 | Features — Feedback contínuo | Branco | Ato 1 desenvolvido (Contínuo) |
| 06 | Features — Ciclo de avaliação | Cinza `#fafafa` | Ato 2 desenvolvido (Formal) |
| 07 | Features — PDI | **Preto** | Ato 3 desenvolvido (Ação) — clímax |
| 08 | Carta do fundador | Branco | Voz pessoal no lugar de prova social |
| 09 | FAQ | Cinza `#fafafa` | Derrubar objeções |
| 10 | Pricing | Branco | Um plano, todas as features, sob consulta |
| 11 | CTA final + formulário | **Preto** | Conversão — retorna ao dark do ato 3 |
| 12 | Footer | Branco | Navegação mínima + legal |

**Progressão cromática:** branco → cinza → **preto** → branco → cinza → branco → **preto** → branco. O preto marca os dois momentos de maior intensidade narrativa: o PDI e o CTA final.

**Nomenclatura:** eyebrows de cada seção de feature usam **apenas a natureza temporal** (`CONTÍNUO`, `FORMAL`, `AÇÃO`). Nunca `ATO 1` / `ATO 2` / `ATO 3`.

---

## 3. Seção a seção

### 3.1. Header (sticky)

- **Logo:** wordmark "evoluteam" apenas. Sem ícone/símbolo ao lado.
- **Nav:** 4 links âncora — Produto, Como funciona, Preços, FAQ.
- **Direita:** texto "Entrar" (link para `/login`) + botão preto "Agendar demo" (scroll para CTA final).
- **Comportamento:** sticky com `border-bottom` sutil. No scroll, ganha leve blur/translucidez.

### 3.2. Hero

- **Eyebrow:** dot laranja + "Performance · Feedback · Desenvolvimento".
- **Headline (Georgia, 64px desktop):** "Avaliar é fácil. *Desenvolver* é difícil." — palavra "Desenvolver" em itálico cinza.
- **Subhead:** "O evoluteam reúne feedback contínuo, ciclo de avaliação e PDI em um único fluxo — para que cada nota vire um próximo passo claro."
- **CTAs:** primário preto "Agendar demonstração →" + secundário texto com underline "Ver como funciona" (scroll para Solução).
- **Screenshot hero:** tela real de PDI (Ana Souza · Comunicação) com grid de ações em progresso. Posicionado abaixo dos CTAs em desktop. Anti-padrão proposital: outras ferramentas mostram dashboard; nós mostramos plano de ação.
- **Restrição:** a palavra "PDI" **não aparece** no hero. Só no ato 3.

### 3.3. Problema

- **Eyebrow:** "O problema".
- **Headline:** "A planilha é só o sintoma. *O problema é outro.*"
- **Lead:** "Empresas em crescimento já tentaram Forms, Sheets e ferramentas 'enterprise' demais. Três coisas continuam acontecendo em todo ciclo:"
- **3 dores numeradas** (01/02/03 em Georgia 36px cinza claro):
  1. **Planilhas se perdem.** "Cada ciclo vira um arquivo novo em uma pasta nova. Ninguém vai achar a avaliação de Ana do semestre passado daqui a dois anos. O histórico não existe — existe arqueologia."
  2. **Feedback vira memória.** "Gestor lembra do último mês. O time passou um ano aprendendo coisas que ninguém registrou. Na hora de avaliar, a nota sai do estômago — e o colaborador percebe."
  3. **Nota não vira plano.** "O ciclo fecha, o resultado fica bonito no relatório, e nada muda. A avaliação virou entrega — não virou decisão. É aqui que o desenvolvimento real morre."
- **Pull-quote final** (Georgia 24px itálico, entre linhas separadoras):
  > "A maior parte das avaliações termina em uma planilha arquivada. O evoluteam existe pra mudar essa última parte — e só essa."

### 3.4. Solução

- **Eyebrow:** "A solução".
- **Headline:** "Feedback, ciclo e PDI *no mesmo fluxo.*"
- **Subhead:** "Cada peça alimenta a próxima. Nada se perde entre ferramentas, nada vira memória, nada fica sem próximo passo."
- **Diagrama horizontal** — 3 cards com setas `→` entre eles:
  - Card 1 (branco): eyebrow "CONTÍNUO" + título "Feedback" + 1 linha.
  - Card 2 (branco): eyebrow "FORMAL" + título "Ciclo" + 1 linha.
  - Card 3 (**preto com laranja**): eyebrow "AÇÃO" (em laranja) + título "PDI" + 1 linha.
- **Linha final (centrada, itálica cinza):** "Toda avaliação termina em uma decisão. Nenhuma termina em uma planilha."

### 3.5. Features — Feedback contínuo

- **Layout:** 2 colunas, texto à esquerda, screenshot à direita.
- **Eyebrow:** "CONTÍNUO".
- **Headline:** "O contexto do ano, *registrado.*"
- **Parágrafo:** "Qualquer pessoa registra um feedback em 30 segundos — elogio, ponto de melhoria ou contexto. No ciclo seguinte, tudo aparece ao lado do formulário de avaliação."
- **Bullets (prefixo `—`):**
  - Visibilidade granular: privado, gestor, RH ou público
  - Vínculo com competência para relatórios
  - Histórico no perfil do colaborador
- **Screenshot:** tela `/feedbacks/novo` com tags de tipo, textarea de mensagem, campo de competência, botão Enviar.

### 3.6. Features — Ciclo de avaliação

- **Layout:** 2 colunas, screenshot à esquerda, texto à direita (alternado em relação ao bloco anterior).
- **Fundo:** cinza `#fafafa`.
- **Eyebrow:** "FORMAL".
- **Headline:** "Avaliação com *histórico do lado.*"
- **Parágrafo:** "Quando o gestor abre o formulário, tudo que foi registrado no ano aparece na lateral. Autoavaliação e avaliação do gestor, no mesmo fluxo — com contexto, não memória."
- **Bullets:**
  - Wizard de criação em 5 etapas
  - Autoavaliação + gestor, com comparativo automático
  - Progresso do ciclo acompanhado pelo RH em tempo real
- **Screenshot:** tela `/avaliacoes/[cycleId]/responder` com progresso (4 de 8), pergunta em serif, escala 1-5 com 4 selecionado, **card de contexto abaixo** listando feedbacks do ano sobre a competência avaliada. Esse card vende visualmente o argumento principal da seção.

### 3.7. Features — PDI (seção de destaque)

- **Layout:** 2 colunas, texto à esquerda, screenshot à direita.
- **Fundo:** `#0a0a0a` (preto). **Primeira vez que a página fica totalmente dark.** Marca o clímax da jornada.
- **Eyebrow (em laranja):** "AÇÃO — o diferencial".
- **Headline (texto branco, itálico em laranja):** "Toda avaliação termina *em uma decisão.*"
- **Parágrafo:** "A partir do resultado da avaliação, o gestor cria um PDI com ações concretas, prazos e acompanhamento. A nota vira plano — o ciclo fecha com uma próxima ação, não com um relatório."
- **Bullets:**
  - Vinculado à avaliação que o originou
  - Ações com responsável, prazo e status
  - Colaborador atualiza progresso, gestor acompanha
- **Screenshot:** tela `/pdi/[id]` em light mode dentro do fundo escuro — cria contraste máximo. Lista de 3 ações com status (Concluída verde, 70% laranja, data futura cinza).

### 3.8. Carta do fundador

- **Layout:** 1 coluna, largura 640-720px, centralizada.
- **Fundo:** branco.
- **Eyebrow:** "Carta do fundador".
- **Headline:** "Por que construímos assim."
- **Corpo (Georgia 19px / line-height 1.7), 4 parágrafos curtos:**

  > Quase toda empresa que já rodou um ciclo de avaliação vive o mesmo fim: a pasta com os resultados entra no Drive, o time volta ao trabalho, e na avaliação seguinte ninguém se lembra do que foi combinado.
  >
  > O problema nunca foi a nota. Foi o que vem depois dela.
  >
  > O evoluteam começou como uma decisão simples: nenhuma avaliação termina sem um PDI. Nenhum PDI existe sem o histórico que o originou. Nenhum histórico é construído só no mês do ciclo.
  >
  > Você pode continuar usando planilha. Ela só não vai te ajudar na parte que importa.

- **Assinatura:** avatar circular 44px + "Marcio Petigrosso · Fundador · evoluteam".

### 3.9. FAQ

- **Layout:** 2 colunas. Esquerda (320px): eyebrow + headline + lead. Direita: accordion de 7 perguntas.
- **Fundo:** cinza `#fafafa`.
- **Eyebrow:** "Dúvidas comuns".
- **Headline:** "Perguntas que *escutamos muito.*"
- **Lead:** "Se a sua pergunta não está aqui, a demo é o melhor lugar pra resposta."
- **Perguntas (em Georgia 18px, accordion — primeira aberta):**
  1. **Serve pra empresa que nunca fez avaliação formal?** "Sim, é especificamente pensado pra isso. O onboarding do RH assume que é o primeiro ciclo. Templates de formulário, competências padrão e fluxo sugerido já vêm prontos — dá pra rodar um ciclo em uma semana."
  2. E se já usamos Google Forms / planilhas?
  3. Como funciona a permissão entre RH, gestor e colaborador?
  4. O PDI é obrigatório em todo ciclo?
  5. Os dados dos colaboradores são isolados por empresa?
  6. Tem avaliação 360, 9-box ou OKR? *(Resposta honesta: "Não no momento. O MVP atual foca em ciclo, feedback e PDI — os 3 pilares que resolvem o problema real. Roadmap 1.5 e 2.0 considera essas adições.")*
  7. Como funciona a implantação?

  Respostas completas para 2-7 a serem redigidas durante a implementação (passam pelo skill de copywriting). Tom igual ao da pergunta 1 acima.

### 3.10. Pricing

- **Layout:** 2 colunas. Esquerda: texto editorial sticky + CTA. Direita: card único com features.
- **Fundo:** branco.

**Coluna esquerda:**

- **Eyebrow:** "Planos".
- **Headline:** "Um plano. *Todas as funcionalidades.*"
- **Parágrafo 1:** "Todo cliente acessa a plataforma inteira — ciclo, feedback, PDI e dashboard. O preço acompanha o tamanho da empresa, só isso."
- **Parágrafo 2:** "A cobrança é por colaborador ativo. Conta um pouco sobre a sua empresa e a proposta vai pro seu e-mail em até 24 horas."
- **CTA:** botão preto "Solicitar proposta →" (scroll para CTA final).
- **Micro-copy:** "Mensal ou anual · Nota fiscal emitida · Sem cobrança de implantação".

**Coluna direita — card único (`#fafafa` com borda):**

- Título serif 26px: "Evoluteam".
- Subtítulo: "A plataforma completa, liberada desde o primeiro dia."
- **5 itens**, cada um com título serif + micro-tag à direita + 1 frase descritiva:

  | Item | Tag | Descrição |
  |---|---|---|
  | Ciclos de avaliação | incluso | Wizard de criação, formulários customizáveis, autoavaliação + gestor e progresso em tempo real. |
  | Resultados comparados | incluso | Médias por competência e comparativo autoavaliação × gestor, com liberação controlada. |
  | Feedback contínuo | incluso | Registrado ao longo do ano com visibilidade granular, aparece como contexto na avaliação do gestor. |
  | **PDI — Plano de Desenvolvimento** | **diferencial** (em laranja) | Vinculado à avaliação que o originou, com ações, prazos, responsáveis e acompanhamento. |
  | Dashboard de gestão | incluso | KPIs do ciclo, médias por departamento, PDIs atrasados e alertas de colaboradores sem feedback recente. |

- **Rodapé compacto do card:** "Também incluído: 4 papéis com permissões nativas (RH, Gestor, Colaborador, Diretoria), isolamento de dados por empresa e log de auditoria."

### 3.11. CTA final + Formulário

- **Layout:** 2 colunas. Esquerda: pitch final. Direita: formulário.
- **Fundo:** `#0a0a0a` (preto). Retorno ao dark do ato 3.

**Coluna esquerda:**

- **Eyebrow em laranja:** "Agendar demonstração".
- **Headline (Georgia 52px, branco):** "O próximo ciclo *pode terminar diferente.*" (itálico em laranja).
- **Subhead (cinza claro):** "Uma conversa de 30 minutos: mostramos o produto rodando com os dados da sua empresa e alinhamos proposta. Nenhum compromisso."
- **Bullets (com prefixo `—` laranja):**
  - Demo ao vivo com RH + gestor da sua empresa
  - Proposta personalizada em até 24 horas
  - Plano de implantação para o primeiro ciclo

**Coluna direita — formulário em card branco:**

Campos (todos obrigatórios exceto último):

1. Nome completo (text)
2. E-mail corporativo (email) — validar que não é provedor pessoal (gmail.com, hotmail.com, etc.) com warning não-bloqueante
3. Empresa (text)
4. Seu papel (select: RH, Gestor, Diretoria, Outro)
5. Tamanho do time (select: faixas internas de qualificação comercial — **as faixas NÃO são copy externa na landing**, só aparecem no select. Sugestão de faixas: até 20, 21-50, 51-150, 151-300, +300)
6. O que te trouxe ao evoluteam? (textarea, opcional, placeholder "Conte em 1-2 frases a principal dor que você quer resolver.")

- **Botão:** preto "Agendar demonstração →".
- **LGPD:** "Ao enviar, você concorda com a política de privacidade. Retorno em até 24h com horários disponíveis."

**Backend:** submissão via Server Action do Next. Gravar lead em tabela `leads` (Supabase) + disparar e-mail transacional para vendas via Resend (template simples com os dados do lead).

### 3.12. Footer

- **Fundo:** branco, `border-top` sutil.
- **Layout:** 4 colunas (desktop) → empilha em mobile.

| Coluna | Conteúdo |
|---|---|
| Marca | Wordmark "evoluteam" + tagline "Avaliação de desempenho, feedback contínuo e PDI no mesmo fluxo." |
| Produto | Como funciona · Planos · FAQ (links âncora) |
| Empresa | Sobre · Contato |
| Legal | Privacidade · Termos de uso |

- **Linha inferior:** `© 2026 evoluteam · Todos os direitos reservados` (esquerda) + `contato@evoluteam.com` (direita).
- **Sem redes sociais** enquanto o produto não tiver presença real.

---

## 4. Decisões técnicas

### 4.1. Rota
- A rota `/` atualmente faz `redirect('/dashboard')`. Novo comportamento: renderizar a landing page como página pública.
- Adicionar redirecionamento para `/dashboard` apenas se usuário **autenticado** acessar `/`. Auth check feito em server component.
- Rotas do grupo `(auth)` e `(app)` continuam como estão.

### 4.2. Estrutura de arquivos

```
src/app/
  page.tsx                           ← landing (pública)
  (marketing)/
    layout.tsx                       ← layout com header+footer públicos
    components/
      Header.tsx
      Footer.tsx
      Hero.tsx
      Problem.tsx
      Solution.tsx
      FeatureFeedback.tsx
      FeatureCycle.tsx
      FeaturePDI.tsx
      FounderLetter.tsx
      FAQ.tsx
      Pricing.tsx
      FinalCTA.tsx
      LeadForm.tsx
  actions/
    submitLead.ts                    ← Server Action do formulário
```

Alternativa: se não quisermos route group, manter tudo em `src/features/landing/` e importar de `app/page.tsx`. A decisão final fica para o plano de implementação.

### 4.3. Tipografia
- **Serif:** Georgia (system font — `font-family: Georgia, 'Times New Roman', serif`). Decisão: não carregar font custom nessa versão. Georgia é robusta, presente em todos os sistemas, e combina com o tom editorial. Trocar por serif custom (ex: Söhne, GT Sectra) é um polish futuro se o produto se posicionar mais alto.
- **Sans:** Geist Sans (já configurada no projeto via `--font-geist-sans`).

### 4.4. Responsive
- Grid de 2 colunas colapsa para 1 coluna em `<1024px`.
- Header: nav vira hamburguer em `<768px`.
- Hero screenshot: abaixo do texto em mobile, com escala reduzida.
- Features (atos): imagem sempre acima do texto em mobile, independente da alternância desktop.
- Pricing: coluna esquerda não é mais sticky em mobile — empilha acima do card.
- CTA final: formulário empilha abaixo do pitch.

### 4.5. Screenshots do produto
Os screenshots mostrados nos mockups do brainstorming são **mocks HTML próximos da UI real**. Na implementação real, duas opções:
1. **Capturar screenshots reais** das telas `/pdi/[id]`, `/feedbacks/novo`, `/avaliacoes/[cycleId]/responder` em um ambiente com dados de demo, exportar como PNG/WebP otimizado.
2. **Renderizar componentes reais** da aplicação em modo "preview" (sem autenticação, com dados mockados). Mais trabalhoso mas mantém sincronia automática.

**Recomendação:** opção 1 na v1 — mais simples e rápido. Migrar para opção 2 se a taxa de atualização da UI exigir.

### 4.6. SEO e metadata
- `metadata` no `page.tsx` com title, description, OG image.
- Title: "evoluteam — avaliação, feedback e PDI no mesmo fluxo"
- Description: "A plataforma de gestão de pessoas que transforma avaliação em plano de ação. Feedback contínuo, ciclo de avaliação e PDI sem depender de planilha."
- OG image: imagem 1200x630 com headline do hero.

### 4.7. Analytics e tracking
- Fora do escopo do spec. Decidir em implementação: GA4, Plausible, PostHog? Nenhuma telemetria de produto adicionada automaticamente.

### 4.8. Dark mode
- A landing **não** respeita `prefers-color-scheme`. Sempre renderiza no esquema projetado (branco, cinza, com seções específicas em preto). Landing editorial é uma peça visual curada, não uma app.

---

## 5. Fora de escopo

Não entram nesta v1:
- Página `/sobre`, `/contato`, `/privacidade`, `/termos` — criadas depois, como stubs, para os links do footer não quebrarem.
- Blog, case studies, centro de ajuda.
- Integração com chat (Intercom, Crisp).
- Animações de scroll (Framer Motion etc.) — página totalmente estática, só hover e focus states.
- A/B testing de copy / headlines.
- Multilíngua — só português nesta v1.

---

## 6. Ordem sugerida de implementação

1. Estrutura de arquivos + Header + Footer + rota pública (scaffold).
2. Hero + Problema + Solução (topo da página — define padrão visual).
3. Features dos 3 atos (Feedback → Ciclo → PDI) com screenshots placeholder.
4. Carta do fundador + FAQ.
5. Pricing.
6. CTA final + Formulário + Server Action + e-mail para vendas.
7. Captura/produção dos screenshots reais.
8. Metadata SEO + OG image.
9. QA responsivo (desktop grande, laptop, tablet, mobile).
10. Stubs de páginas legais (`/privacidade`, `/termos`) para não quebrar footer.

---

## 7. Critérios de aceite

- [ ] Usuário não autenticado que acessa `/` vê a landing completa em português.
- [ ] Usuário autenticado que acessa `/` é redirecionado para `/dashboard`.
- [ ] Todos os CTAs "Agendar demo / demonstração / proposta" fazem scroll suave para o formulário final.
- [ ] Formulário envia os 6 campos (5 obrigatórios + 1 opcional) via Server Action.
- [ ] Lead é persistido em banco + disparado e-mail para o endereço de vendas.
- [ ] Página responsiva em mobile (≥360px), tablet (≥768px), desktop (≥1024px).
- [ ] Nenhum preço numérico aparece em qualquer seção.
- [ ] Nenhuma faixa de headcount (ex: "20 a 300") aparece em copy externa — apenas nas faixas internas do select "Tamanho do time".
- [ ] Nenhum eyebrow usa "ATO 1/2/3" — apenas CONTÍNUO / FORMAL / AÇÃO.
- [ ] Laranja aparece exclusivamente em contextos associados ao PDI.
- [ ] Lighthouse score ≥ 90 em Performance e Accessibility.

---

## 8. Próximo passo

Após aprovação deste spec, invocar o skill `writing-plans` para gerar o plano de implementação detalhado passo-a-passo.
