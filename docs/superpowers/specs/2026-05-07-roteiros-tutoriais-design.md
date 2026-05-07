# Roteiros de tutoriais em vídeo para a Central de Ajuda

**Data:** 2026-05-07
**Status:** Design aprovado, aguardando review antes do plano de implementação
**Autor:** Marcio + Claude (brainstorming)

## Contexto

A área `/ajuda` da aplicação já está implementada e consome MDX de `content/help/*.mdx` com schema Zod e player HTML5 que aponta para MP4 hospedados em Cloudflare R2 (ver `docs/help-r2-setup.md`). Hoje a feature está vazia — não há nenhum tutorial publicado.

Este documento define os **roteiros guiados** que serão escritos em `docs/roteiros/*.md` para servir de base de gravação. Cada roteiro vira **um vídeo MP4**, que depois é vinculado a um `content/help/<slug>.mdx` com `videoUrl` apontando para o R2. Os arquivos `.md` deste plano **não são consumidos pela aplicação** — são insumo de produção para o Marcio gravar.

## Objetivo

Produzir 17 roteiros prontos para gravação cobrindo todos os fluxos básicos de uso do evoluteam para os perfis **admin_rh**, **gestor** (conceito relacional via `manager_id`) e **colaborador**, baseados estritamente no que está implementado na codebase em `2026-05-07`.

Não-objetivos:

- Gravar os vídeos em si (responsabilidade do Marcio).
- Subir vídeos para o R2 ou criar os MDX em `content/help/` (acontece quando os vídeos existirem; cada roteiro inclui o slug pretendido para facilitar essa amarração).
- Documentar features que não estão implementadas (CSV import, export PDF, IA, upload de evidências em PDI). O escopo deste plano é o software como ele existe hoje.

## Auditoria de implementação (2026-05-07)

Verificado direto no código (não em specs/docs). Resumo do que afeta os roteiros:

**Implementado e cobrido:** /configuracoes (empresa, unidades, departamentos, cargos, competências), /colaboradores (CRUD, convite por e-mail via Resend, atribuir gestor com `validateManagerAssignment`, desativar/reativar/desligar), /avaliacoes (wizard de 5 passos, draft/publish, distribuição automática via `publishCycle`, `reassignReviewer`, `cancelAssignment`, `sendReminders`, `closeCycle`, `archiveCycle`, responder com rascunho, resultados com média geral / por competência / comparação auto vs gestor, `releaseResult`/`hideResult`), /feedbacks (3 tipos com visibilidade enforced por `enforceVisibilityForType`, vínculo a competência, recebidos/enviados/time), /pdi (criar, ações com prazo/responsável/status, comentários, listagens mine/team/all), /recrutamento (etapas com kind `applied_initial`/`intermediate`/`hired_terminal`, snapshot congelado por vaga, kanban drag-drop, `hireCandidate` que cria employee atomicamente, relatórios com time-to-hire / origem / duração por etapa).

**Não implementado — fora do escopo:**

- Importação de colaboradores por CSV.
- Exportar resultado de avaliação em PDF.
- Features de IA (resumo de avaliação, sugestão de PDI, devolutiva).

**Parcial — adaptado nos roteiros:**

- Anexos de PDI: só campo `attachment_url` (URL string), sem upload integrado. Roteiros vão narrar como "colar link de drive/Notion".

**Persona gestor — descoberta relevante para o tour:**

Não existe role formal `manager`. As roles do sistema são `admin_rh`, `director` e `user`. "Gestor" é um conceito **relacional**: um colaborador comum (`user`) vira gestor automaticamente quando outros colaboradores apontam `manager_id` para ele. Nesse momento aparecem visões "meu time" em PDI, feedbacks, avaliações e dashboard `MinhaArea`. Esse ponto é educacional e abre o `tour-gestor.md`.

## Decisões de design

### 1. Granularidade — híbrido

3 tours por persona (visão geral, 3–7 min cada) + 14 roteiros granulares (1–3 min cada, focados em uma tarefa). Casa com o filtro `screen` do schema FT-9 que permite mostrar tutorial contextual na tela em que o usuário está.

### 2. Formato — Fala + Tela em blocos

Cada roteiro é estruturado em blocos sequenciais, cada bloco com `**🖥️ Tela**` (o que clicar/mostrar) e `**🎙️ Fala**` (texto pronto pra narrar). Suporta listas, callouts e seção opcional `**💡 Observações**` para armadilhas reais da codebase (ex.: snapshot de funil, validação anti-ciclo de gestor).

### 3. Tom — profissional próximo

Tratamento "você", contrações naturais ("pra", "tá"), sempre que possível explicar o **porquê** das ações além do passo. Estilo Pipefy/Conta Azul/RD Station. Combina com o ICP (RH/Diretor de Pessoas em empresas de 20–300) e envelhece bem (sem gírias datadas).

### 4. Elenco fixo (continuidade entre vídeos)

Empresa demo: **Acme Tecnologia** (~80 colaboradores).

Estrutura: unidades **Matriz São Paulo** e **Filial Recife**; departamentos **Tecnologia**, **Comercial**, **Pessoas**, **Financeiro**; cargos **Desenvolvedor(a)**, **Analista Comercial**, **Gerente**, **Coordenador(a)**.

Personagens recorrentes:

- **Márcia Rocha** — admin_rh. Aparece em todos os tours admin e em todos os 8 roteiros admin.
- **Carlos Oliveira** — gerente de Tecnologia (gestor com 5 liderados). Aparece no tour gestor e nos 2 roteiros gestor; recebe avaliação como liderado em alguns roteiros admin.
- **Maria Silva** — desenvolvedora liderada por Carlos. Protagonista da maior parte dos vídeos: é cadastrada, responde ciclo, recebe feedback, ganha PDI de *Comunicação*.
- **Pedro Santos** — candidato. Aparece nos 2 roteiros de recrutamento (cadastro, kanban, contratação).

Cenário recorrente: ciclo demo **"Avaliação Q2 2026"**, vaga demo **"Desenvolvedor(a) Pleno — Tecnologia"**, competência fio condutor **Comunicação**, PDI fio condutor **"Maria desenvolver Comunicação"**.

## Estrutura de arquivos

```
docs/roteiros/
├── README.md                              ← índice + convenções
├── tour-admin-rh.md
├── tour-gestor.md
├── tour-colaborador.md
├── admin-setup-inicial.md
├── admin-gerenciar-colaboradores.md
├── admin-criar-ciclo-avaliacao.md
├── admin-distribuir-acompanhar-ciclo.md
├── admin-resultados-ciclo.md
├── admin-pdi-completo.md
├── admin-recrutamento-setup-vaga.md
├── admin-gerenciar-candidatos-vaga.md     ← inclui bloco final de relatórios
├── gestor-avaliar-e-resultados.md
├── gestor-desenvolver-time.md
├── colab-completar-perfil.md
├── colab-responder-avaliacao.md
├── colab-feedback.md
└── colab-acompanhar-pdi.md
```

`README.md` do diretório explica o pipeline (roteiro → gravação → R2 → MDX em `content/help/`) e o elenco demo, evitando que cada roteiro repita o contexto.

## Template de cada roteiro

```markdown
---
slug: <kebab-case>                          # mesmo slug pretendido para content/help/<slug>.mdx
persona: admin_rh | gestor | colaborador
duration_estimate: "3–5 min"
related_screens:                             # rotas que este vídeo cobre, alinhadas ao filtro `screen` da help
  - /colaboradores
  - /colaboradores/novo
---

# <Título do vídeo>

## 🎯 Objetivo
<Uma frase: o que o espectador deve saber fazer ao final.>

## 📋 Pré-requisitos para gravar
<Estado do banco demo necessário antes de apertar REC. Ex.: "Empresa Acme criada, 1 departamento existente, logado como Márcia (admin_rh).">

## 🎬 Abertura (~15s)
**🎙️ Fala**
> "Olá! Neste tutorial você vai aprender a..."

## 🎬 Bloco 1 — <título do bloco>
**🖥️ Tela**
- Passos visuais...

**🎙️ Fala**
> "Texto natural pra narrar..."

**💡 Observações** *(opcional)*
- Armadilhas conhecidas da feature (ex.: "snapshot do funil congela aqui").

## 🎬 Bloco N — <título>
...

## 🎬 Encerramento (~10s)
**🎙️ Fala**
> "No próximo tutorial vamos ver como..."

## 📝 Notas de gravação
- Dados sensíveis a borrar
- Cuidados específicos da feature
- Sugestão de tutorial seguinte (encadeamento)
```

## Catálogo dos 17 roteiros

Cada item descreve **escopo** (o que o vídeo cobre, dentro do implementado) e **fluxo principal** (roteiro narrativo de alto nível). Os roteiros completos com todos os blocos serão escritos no momento da implementação.

### Tours (3)

**1. `tour-admin-rh.md`** *(5–7 min)*
Escopo: visão geral da plataforma para RH. Não ensina a fazer cada tarefa em detalhe — mostra como as áreas se conectam.
Fluxo: Márcia abre /dashboard → mostra estrutura (configurações com competências e cargos) → vai em /colaboradores e mostra Maria já cadastrada → abre /avaliacoes e fala do ciclo Q2 → mostra /feedbacks como ferramenta contínua → /pdi como output da avaliação → /recrutamento como porta de entrada de novos colaboradores. Encerramento aponta para os tutoriais granulares.

**2. `tour-gestor.md`** *(3–5 min)*
Escopo: visão geral para Carlos. Abre explicando que ele **não tem permissão de gestor cadastrada** — basta o RH ter colocado liderados sob ele. Mostra como isso destrava as visões "meu time".
Fluxo: Carlos faz login → vê dashboard MinhaArea com seus 5 liderados → mostra avaliação pendente em /avaliacoes (ele precisa avaliar Maria) → abre PDI da Maria em /pdi (visão team) → manda feedback de reconhecimento. Encerramento aponta para `gestor-avaliar-e-resultados` e `gestor-desenvolver-time`.

**3. `tour-colaborador.md`** *(3–5 min)*
Escopo: visão geral para Maria. Foco em "o que aparece pra você no dia a dia".
Fluxo: Maria faz login pela primeira vez → completa perfil → vê notificação de avaliação Q2 pendente → abre e responde algumas perguntas → manda elogio para colega → vê seu PDI ativo. Encerramento aponta para `colab-responder-avaliacao` e `colab-acompanhar-pdi`.

### admin_rh (8)

**4. `admin-setup-inicial.md`** *(5–6 min)*
Escopo: primeira configuração da Acme — `/configuracoes` empresa + unidades + departamentos + cargos + competências.
Fluxo: Márcia entra em /configuracoes/empresa, ajusta logo e dados → vai em unidades e cria Matriz SP + Filial Recife → departamentos (Tecnologia, Comercial, Pessoas, Financeiro) → cargos (Desenvolvedor, Gerente, etc.) → competências (Comunicação, Liderança, Entrega, Colaboração). Observações: deletar vs arquivar (taxonomia bloqueia deleção se tiver vínculo); competências viram base do formulário de avaliação depois.

**5. `admin-gerenciar-colaboradores.md`** *(4–5 min)*
Escopo: cadastro manual + convite por e-mail + atribuir gestor/depto/cargo + desativar/reativar/desligar (sem CSV — não implementado).
Fluxo: Márcia em /colaboradores clica em "Novo colaborador" → cadastra Maria com nome/e-mail/cargo Desenvolvedora/depto Tecnologia/gestor Carlos → dispara convite → mostra como aparece o status "convite enviado" → abre Maria depois pra mostrar edição → demonstra desativação com transferência de subordinados (caso ela tivesse). Observações: validação anti-ciclo (`validateManagerAssignment`) bloqueia atribuir como gestor alguém que já é seu liderado.

**6. `admin-criar-ciclo-avaliacao.md`** *(5–7 min)*
Escopo: wizard completo em /avaliacoes/nova — 5 passos (Basics, Participants, Types, Form, Review) + draft + publish.
Fluxo: Márcia clica em "Novo ciclo" → Basics: nome "Avaliação Q2 2026", descrição, datas → Participants: seleciona toda a equipe de Tecnologia (incluindo Maria) → Types: ativa autoavaliação + avaliação do gestor → Form: cria seção "Comunicação" com 2 perguntas (1 de nota 1–5 e 1 de texto livre) e seção "Entrega" com 1 pergunta sim/não → Review: confere → Salva como rascunho → mostra que dá pra voltar e editar → publica. Observações: não dá pra alterar formulário depois de publicar.

**7. `admin-distribuir-acompanhar-ciclo.md`** *(4–5 min)*
Escopo: o que acontece após o publish — distribuição automática + reassign manual + cancel + reenviar lembretes + encerrar/arquivar.
Fluxo: Márcia abre /avaliacoes/[cycleId] do Q2 → mostra que assignments foram criados automaticamente (autoavaliação para cada e gestor para cada liderado) → muda manualmente um reviewer (caso Carlos esteja de férias) → cancela um assignment com motivo → vê barra de progresso (pending / in_progress / submitted) → clica em "Enviar lembrete" para Carlos que não respondeu → no fim do prazo, encerra o ciclo → arquiva ciclos antigos. Observações: não dá pra reabrir ciclo encerrado pelos colaboradores; só admin reabre individualmente.

**8. `admin-resultados-ciclo.md`** *(5–6 min)*
Escopo: leitura de resultados do ciclo encerrado — média geral, por competência, comparação auto vs gestor, comentários, liberar/ocultar para colaborador.
Fluxo: Márcia abre /avaliacoes/[cycleId]/resultados → vê listagem geral → entra no resultado da Maria → mostra média geral + radar/barras por competência → painel de comparação auto vs Carlos (gestor) onde Maria se deu 5 em Comunicação e Carlos deu 3 → lê comentários abertos → decide liberar resultado pra Maria (`releaseResult`) → mostra que Maria agora consegue ver. Observações: até liberar, Maria recebe redirect se tentar acessar a rota.

**9. `admin-pdi-completo.md`** *(4–5 min)*
Escopo: criar PDI + adicionar ações com prazo/responsável/status + comentários + acompanhar listagens (mine/team/all).
Fluxo: Márcia em /pdi clica "Novo PDI" → seleciona Maria como target → objetivo "Desenvolver comunicação assertiva", vincula ao ciclo Q2 e à competência Comunicação → adiciona 3 ações: "Fazer curso X" (prazo 30 dias, owner Maria), "Apresentar projeto Y" (prazo 60 dias, owner Maria), "Sessão 1:1 quinzenal" (prazo recorrente, owner Carlos) → comenta acompanhamento → mostra a aba "Todos PDIs" com filtros por status. Observações: anexar evidência hoje é colar URL de drive/Notion (sem upload integrado).

**10. `admin-recrutamento-setup-vaga.md`** *(4–5 min)*
Escopo: configurar etapas do funil + criar vaga (com snapshot congelado).
Fluxo: Márcia em /recrutamento/etapas mostra as etapas existentes (Triagem, Entrevista RH, Teste Técnico, Entrevista Gestor, Proposta, Contratado) → kinds explicados (entrada/intermediária/contratação) → cria etapa nova "Cultural Fit" → banner "Mudanças aqui se aplicam apenas a vagas novas" → vai em /recrutamento/vagas/nova e cria "Desenvolvedor(a) Pleno" → mostra "Funil congelado em dd/mm/aaaa" no header da vaga. Observações: vagas em andamento não recebem etapas adicionadas depois — decisão arquitetural intencional.

**11. `admin-gerenciar-candidatos-vaga.md`** *(5–7 min)* — **inclui bloco final de relatórios**
Escopo: cadastrar candidato + vincular à vaga + kanban + contratar + relatórios em /recrutamento/relatorios.
Fluxo: Márcia em /recrutamento/candidatos/novo cadastra Pedro Santos → vincula à vaga "Desenvolvedor(a) Pleno" → vai pro board kanban e mostra Pedro na primeira coluna → arrasta para Entrevista RH, depois Entrevista Gestor → clica em "Contratar" e aciona `hireCandidate` que cria o employee Pedro automaticamente → vai em /recrutamento/relatorios e mostra time-to-hire, origem dos candidatos, duração média por etapa. Observações: não dá pra arrastar direto para "Contratado" — precisa do wizard de contratação.

### gestor (2)

**12. `gestor-avaliar-e-resultados.md`** *(4–5 min)*
Escopo: Carlos respondendo avaliações do time e lendo resultados.
Fluxo: Carlos faz login → notificação `review.assignment_new` → abre /avaliacoes/[cycleId]/responder/[assignmentId] da Maria → responde com salvar rascunho → continua mais tarde e finaliza com submit → quando Márcia liberar, Carlos vê o resultado da Maria com a comparação auto vs ele mesmo. Observações: depois de submit, só admin reabre individualmente.

**13. `gestor-desenvolver-time.md`** *(4–5 min)*
Escopo: Carlos criando/acompanhando PDI de liderado e dando feedback ao time.
Fluxo: Carlos em /pdi aba "Time" cria PDI para Maria (mesma estrutura do admin, mas escopo limitado aos descendents dele) → adiciona ação "Sessão 1:1 quinzenal" com ele como owner → comenta evolução → vai em /feedbacks/novo e manda elogio para Maria com visibilidade `private` → manda orientação com visibilidade `manager`. Observações: gestor não vê PDIs/feedbacks fora do time dele.

### colaborador (4)

**14. `colab-completar-perfil.md`** *(2–3 min)*
Escopo: primeiro acesso de Maria + completar dados.
Fluxo: Maria recebe e-mail de convite → clica → cria senha → cai no /onboarding → preenche dados pessoais e foto → cai no dashboard. Observações: não dá pra mudar e-mail (vinculado ao login).

**15. `colab-responder-avaliacao.md`** *(3–4 min)*
Escopo: responder o ciclo Q2.
Fluxo: Maria vê notificação de avaliação pendente → clica → abre formulário → responde nota 1–5 nas perguntas de Comunicação, texto livre, sim/não em Entrega → salva rascunho → fecha → reabre depois pra terminar → submit. Observações: depois de submit não consegue editar (a menos que admin reabra).

**16. `colab-feedback.md`** *(2–3 min)*
Escopo: enviar feedback + ver recebidos/enviados.
Fluxo: Maria em /feedbacks clica "Novo feedback" → escolhe tipo Elogio para colega Ana → vincula competência Colaboração → visibilidade `manager` (também aparece pro Carlos) → envia → mostra abas "Recebidos" e "Enviados". Observações: existem 3 tipos no sistema (`elogio`, `orientacao`, `desenvolvimeto` — *sic* no código); cada tipo aplica visibilidade default que pode ser ajustada caso a caso.

**17. `colab-acompanhar-pdi.md`** *(2–3 min)*
Escopo: ver PDI atribuído + atualizar status de ação + comentar.
Fluxo: Maria em /pdi vê o PDI "Desenvolver comunicação assertiva" → abre detalhe → muda status da ação "Fazer curso X" de `nao_iniciado` → `em_andamento` → comenta "comecei aula 2 hoje" → mais tarde marca como `concluida` e cola URL do certificado em attachment_url. Observações: ações com prazo vencido viram `atrasada` automaticamente (`computePdiStatus`).

## Plano de implementação (alto nível)

1. Criar `docs/roteiros/README.md` com pipeline + elenco demo.
2. Escrever os 17 roteiros seguindo o template, em ondas:
   - **Onda 1 (3 tours)** — para destravar gravação rápida do conteúdo de mais alto valor.
   - **Onda 2 (8 admin_rh)** — fluxo principal de quem compra.
   - **Onda 3 (2 gestor + 4 colaborador)** — público mais amplo, mas complementar.
3. Cada roteiro será revisado contra a codebase real no momento da escrita (rotas, nomes de campos, mensagens reais da UI) — não confiar apenas neste catálogo.
4. Commitar tudo em `main` quando aprovado.

A produção do plano detalhado de implementação (em `writing-plans`) virá depois deste design ser aprovado.

## Pontos de atenção para o Marcio durante a gravação

- Borrar e-mails reais da Acme demo se forem `@gmail.com`/etc — usar domínio fictício consistente (`@acme-demo.com`).
- Sempre que o vídeo demonstrar uma feature com armadilha conhecida (snapshot de funil, anti-ciclo de gestor, sintaxe de manager_id no PostgREST), narrar a armadilha em vez de só clicar — vira **diferencial educacional** comparado a tutoriais genéricos de SaaS.
- Manter a competência **Comunicação** como fio condutor entre vídeos; quando o espectador pular do tour pro `colab-responder-avaliacao`, ele já reconhece o nome.
