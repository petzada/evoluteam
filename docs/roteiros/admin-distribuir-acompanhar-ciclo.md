---
slug: admin-distribuir-acompanhar-ciclo
persona: admin_rh
duration_estimate: "4–5 min"
related_screens:
  - /avaliacoes
  - /avaliacoes/[cycleId]
---

# Distribuir e acompanhar um ciclo

## 🎯 Objetivo
Ao final, o admin sabe revisar a distribuição automática de avaliadores, fazer ajustes manuais (reassign, cancelar), acompanhar o progresso e mandar lembretes — e como encerrar e arquivar o ciclo no fim.

## 📋 Pré-requisitos para gravar
- Ciclo "Avaliação Q2 2026" publicado, com algumas respostas em estados diferentes (pendente, em andamento, enviada).
- Carlos Oliveira ainda sem responder a avaliação da Maria (pra demonstrar lembrete).
- Logada como Márcia.

## 🎬 Abertura (~15s)
**🎙️ Fala**
> "Olá! Você publicou o ciclo, e agora? Esse vídeo é sobre o que acontece depois: como o sistema distribui as avaliações, como você ajusta caso precise, como acompanha quem respondeu e quem não, e como fechar o ciclo no fim. Vamos lá."

## 🎬 Bloco 1 — Abrindo um ciclo publicado
**🖥️ Tela**
- /avaliacoes → clicar no ciclo "Avaliação Q2 2026".
- Mostrar a tela do ciclo: barra de progresso no topo (X pendentes / Y em andamento / Z enviadas), abas de listagem, ações (Lembretes, Encerrar).

**🎙️ Fala**
> "Quando você abre um ciclo publicado, o sistema te mostra o painel de acompanhamento. Em cima, a barra de progresso: quantas avaliações ainda estão pendentes, quantas alguém abriu mas não enviou, e quantas já foram concluídas. Logo abaixo, a lista de todas as avaliações do ciclo."

## 🎬 Bloco 2 — Como funciona a distribuição automática
**🖥️ Tela**
- Mostrar a lista de avaliações.
- Apontar: pra cada participante apareceram 2 linhas — uma "autoavaliação" (avaliador = avaliado) e outra "avaliação do gestor" (avaliador = gestor direto).
- Filtrar por avaliador "Carlos" pra mostrar que ele vai avaliar 3 liderados.

**🎙️ Fala**
> "Repare aqui: pra cada participante o sistema gerou as avaliações conforme os tipos que você marcou. A Maria tem uma autoavaliação — onde ela é a avaliadora dela mesma — e uma avaliação do gestor, onde quem avalia é o Carlos. O Carlos, por ter três liderados em Tecnologia, recebeu três avaliações pra responder. Tudo feito automaticamente no momento que você publicou."

## 🎬 Bloco 3 — Ajustes manuais: reassign e cancelar
**🖥️ Tela**
- Clicar no menu de ações de uma avaliação.
- Mostrar opção "Trocar avaliador" — selecionar outra pessoa.
- Voltar e mostrar "Cancelar avaliação" — preencher motivo.

**🎙️ Fala**
> "Às vezes a vida bate e você precisa ajustar. Imagina que o Carlos saiu de férias prolongadas no meio do ciclo — clico em Trocar avaliador e indico outra pessoa pra responder no lugar. Ou cancela uma avaliação inteira, com um motivo registrado, se for o caso. Esses ajustes ficam no histórico do ciclo, então você sempre consegue justificar depois."

## 🎬 Bloco 4 — Mandando lembrete
**🖥️ Tela**
- Filtrar avaliações por status "pendente".
- Selecionar a do Carlos pra Maria.
- Clicar em "Enviar lembrete" pro avaliador.
- Mostrar opção "Enviar lembrete pra todos os pendentes" no topo.

**🎙️ Fala**
> "A cada poucos dias eu venho aqui, filtro por pendentes e mando lembrete. Posso mandar pra um avaliador específico — clico no Carlos e mando só pra ele —, ou pra todos os pendentes de uma vez, no botão de cima. O sistema dispara um e-mail simpático lembrando do prazo. Cuidado pra não mandar todo dia — uma vez por semana é o equilíbrio bom."

## 🎬 Bloco 5 — Encerrar e arquivar
**🖥️ Tela**
- Voltar pro topo do ciclo.
- Clicar em "Encerrar ciclo" → mostrar dialog de confirmação avisando que respostas serão bloqueadas.
- Confirmar (ou só demonstrar e cancelar).
- Mostrar status mudar pra "Encerrado".
- Apontar onde ficaria a opção de arquivar (esconder da listagem padrão).

**🎙️ Fala**
> "No fim do ciclo, eu encerro. Encerrar bloqueia respostas novas — quem não tinha enviado fica sem o registro. Se alguém precisar muito enviar com atraso, você consegue reabrir individualmente, mas pelo geral, encerrou, fechou. Depois de encerrar, eu vou ler os resultados, que é o próximo tutorial. E meses depois, quando o ciclo já cumpriu seu papel, eu arquivo, que tira ele da listagem padrão e deixa o painel limpo. Arquivado não some — fica disponível com o filtro 'Mostrar arquivados'."

## 🎬 Encerramento (~10s)
**🎙️ Fala**
> "Você já sabe acompanhar o ciclo do início ao fim. Próximo passo: ler os resultados, comparar autoavaliação com avaliação do gestor, e liberar pros colaboradores. Te vejo no próximo."

## 📝 Notas de gravação
- Não esquecer de mostrar o filtro "Mostrar arquivados" em /avaliacoes (foi implementado pra resolver bug do cliente — virou padrão).
- Tutorial seguinte sugerido: `admin-resultados-ciclo`.
