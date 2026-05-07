---
slug: admin-criar-ciclo-avaliacao
persona: admin_rh
duration_estimate: "5–7 min"
related_screens:
  - /avaliacoes
  - /avaliacoes/nova
---

# Criar um ciclo de avaliação

## 🎯 Objetivo
Ao final, o admin sabe criar um ciclo do zero usando o wizard de 5 passos — Basics, Participants, Types, Form, Review — e entende a diferença entre rascunho e publicado.

## 📋 Pré-requisitos para gravar
- Setup completo: empresa, departamentos, cargos, competências (Comunicação, Liderança, Entrega, Colaboração).
- ~10 colaboradores cadastrados em Tecnologia, com Carlos como gestor de pelo menos 3 (incluindo Maria).
- Logada como Márcia.

## 🎬 Abertura (~15s)
**🎙️ Fala**
> "Olá! Vamos criar o primeiro ciclo de avaliação no evoluteam. O sistema te leva por um wizard de cinco passos — eu vou explicando cada um. No fim a gente vai ter o ciclo Q2 2026 montado, salvo como rascunho, pronto pra publicar quando quiser."

## 🎬 Bloco 1 — A tela de avaliações e o botão de novo ciclo
**🖥️ Tela**
- Abrir /avaliacoes.
- Mostrar listagem (vazia ou com ciclos antigos).
- Clicar em "Novo ciclo" → /avaliacoes/nova.

**🎙️ Fala**
> "Em Avaliações ficam todos os ciclos que a empresa já rodou. Pra criar um novo, clico em Novo ciclo. Vai abrir o wizard com cinco passos no topo — Básico, Participantes, Tipos, Formulário e Revisão. Você pode voltar e avançar entre eles, e a qualquer momento sair e voltar — o rascunho fica salvo."

## 🎬 Bloco 2 — Passo 1: Básico
**🖥️ Tela**
- Preencher: Nome "Avaliação Q2 2026", descrição curta, data de início e prazo final.
- Apontar que prazo vai bloquear respostas no fim.

**🎙️ Fala**
> "No Básico, dou um nome claro pro ciclo — eu uso 'Avaliação' mais o trimestre. Coloco uma descrição que vai aparecer pros avaliadores quando eles abrirem a avaliação. E defino o período: data de início, que é quando as avaliações ficam disponíveis, e data fim, que é o prazo limite pra responder. Depois do prazo, o sistema bloqueia respostas novas — ninguém consegue mais editar nem enviar."

## 🎬 Bloco 3 — Passo 2: Participantes
**🖥️ Tela**
- Avançar.
- Mostrar opções: filtrar por departamento, por cargo, ou seleção manual.
- Marcar todo o departamento de Tecnologia (10 pessoas).
- Mostrar contador "10 colaboradores selecionados".

**🎙️ Fala**
> "Aqui escolho quem vai ser avaliado. Tem três jeitos: por departamento — selecionei Tecnologia inteiro e o sistema marca os 10 colaboradores ativos —, por cargo, ou pessoa por pessoa quando o ciclo é menor. Importante: só colaboradores ativos entram. Quem está desativado ou desligado não aparece aqui, mesmo se você marcar o departamento dele."

## 🎬 Bloco 4 — Passo 3: Tipos de avaliação
**🖥️ Tela**
- Avançar.
- Marcar "Autoavaliação" e "Avaliação do gestor".
- Mostrar visualmente: para cada participante o sistema vai gerar 1 autoavaliação + 1 avaliação do gestor.

**🎙️ Fala**
> "Agora o tipo de avaliação. Tem dois principais: a autoavaliação — onde a pessoa reflete sobre o próprio trabalho — e a avaliação do gestor — onde o gestor direto avalia. Pode usar os dois juntos, e isso é o mais comum, porque depois você consegue comparar como cada um se viu versus como o gestor enxergou. Pra esse Q2 vou marcar os dois."

**💡 Observações**
- Se marcar "Avaliação do gestor" e algum participante não tiver gestor cadastrado, o sistema avisa antes de publicar.

## 🎬 Bloco 5 — Passo 4: Montando o formulário
**🖥️ Tela**
- Avançar.
- Adicionar seção "Comunicação" → adicionar pergunta tipo nota 1–5 ("Como você avalia a clareza na comunicação dessa pessoa?") + pergunta tipo texto livre ("Dê um exemplo concreto.").
- Adicionar seção "Entrega" → 1 pergunta sim/não ("Cumpriu os prazos combinados?").
- Mostrar que dá pra reordenar e marcar como obrigatória.

**🎙️ Fala**
> "Esse é o passo mais delicado — montar o formulário. Eu agrupo por competência: crio uma seção Comunicação, dentro adiciono perguntas. Tem quatro tipos de pergunta: nota de 1 a 5, texto livre, múltipla escolha e sim ou não. Combino do jeito que fizer sentido — uma pergunta de nota dá número pro relatório, uma de texto livre pega contexto. Marco quais são obrigatórias. Aqui na Acme eu uso uma seção por competência da empresa, com 2 ou 3 perguntas em cada — formulário grande demais cansa quem responde."

**💡 Observações**
- Depois de publicar o ciclo, o formulário **não pode mais ser alterado**. Por isso o passo 5 (Revisão) existe.

## 🎬 Bloco 6 — Passo 5: Revisão e salvar como rascunho
**🖥️ Tela**
- Avançar pra Revisão.
- Mostrar resumo: nome, período, 10 participantes, 2 tipos, X perguntas em Y competências.
- Clicar em "Salvar rascunho".
- Mostrar toast e voltar pra listagem com o ciclo em status "Rascunho".

**🎙️ Fala**
> "Na Revisão o sistema mostra o resumo: tudo que eu configurei. Confiro o número de avaliações que vai gerar — 10 autoavaliações mais 10 do gestor, total 20 — e clico em Salvar rascunho. O ciclo aparece na listagem com status Rascunho. Posso entrar de novo, ajustar qualquer passo, ou deixar fechado pra revisar com o time antes de soltar."

## 🎬 Bloco 7 — Publicar
**🖥️ Tela**
- Voltar na listagem, abrir o ciclo Rascunho.
- Clicar em "Publicar".
- Mostrar dialog de confirmação alertando que formulário fica congelado.
- Confirmar.
- Mostrar status mudando pra "Publicado" e os assignments aparecendo.

**🎙️ Fala**
> "Quando estiver tudo certo, eu publico. O sistema avisa que depois de publicar não dá mais pra mexer no formulário — então eu confirmo. Nesse momento, ele cria as 20 avaliações automaticamente, dispara notificação pra cada avaliador, e o ciclo fica oficialmente em andamento."

## 🎬 Encerramento (~10s)
**🎙️ Fala**
> "Ciclo publicado. A próxima etapa é acompanhar quem respondeu, mandar lembretes pros atrasados e, no fim, ler os resultados. Tem dois tutoriais a seguir: distribuir e acompanhar, e ler resultados."

## 📝 Notas de gravação
- Vídeo mais longo que a média — bloco do formulário é o que tem mais conteúdo.
- Não pular o aviso de "formulário congela após publicar" — é dor real de cliente que muda perguntas no meio.
- Tutoriais seguintes sugeridos: `admin-distribuir-acompanhar-ciclo`, depois `admin-resultados-ciclo`.
