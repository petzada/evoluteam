---
slug: tour-admin-rh
persona: admin_rh
duration_estimate: "5–7 min"
related_screens:
  - /dashboard
  - /colaboradores
  - /avaliacoes
  - /feedbacks
  - /pdi
  - /recrutamento
  - /configuracoes
---

# Tour da plataforma para RH

## 🎯 Objetivo
Ao final, o RH entende como as áreas da plataforma se conectam — estrutura → colaboradores → ciclo → feedback contínuo → PDI → recrutamento — e sabe por onde começar a configuração da empresa.

## 📋 Pré-requisitos para gravar
- Empresa Acme Tecnologia já configurada (4 departamentos, 4 cargos, 2 unidades, 4 competências cadastradas).
- ~10 colaboradores ativos, incluindo Maria Silva e Carlos Oliveira (Carlos como gestor de Maria).
- Ciclo "Avaliação Q2 2026" no estado **publicado** com algumas respostas em andamento.
- 1 PDI ativo da Maria (objetivo Comunicação).
- 1 vaga "Desenvolvedor(a) Pleno" com Pedro Santos no kanban.
- Logado como Márcia Rocha (admin_rh).

## 🎬 Abertura (~15s)
**🎙️ Fala**
> "Olá! Eu vou te mostrar como o evoluteam organiza a gestão de pessoas da sua empresa em uma plataforma só. A ideia desse vídeo é te dar a visão geral — depois cada área tem um tutorial próprio com o passo a passo. Se você for o RH ou quem está tocando a implantação aí, é por aqui que você começa."

## 🎬 Bloco 1 — Dashboard como ponto de partida
**🖥️ Tela**
- Mostrar /dashboard logado como Márcia.
- Apontar os números do topo: colaboradores ativos, ciclo em andamento, avaliações pendentes.
- Apontar a sidebar do lado esquerdo com as 7 áreas.

**🎙️ Fala**
> "Essa é a sua tela inicial. Aqui em cima você já vê os números da empresa em tempo real — quantos colaboradores estão ativos, ciclo atual, avaliações que ainda faltam. E na lateral esquerda estão as sete áreas da plataforma. Vou te levar por cada uma rapidinho pra você entender a lógica."

## 🎬 Bloco 2 — Configurações: a base da empresa
**🖥️ Tela**
- Clicar em /configuracoes.
- Passar rápido: Empresa → Unidades (Matriz SP, Filial Recife) → Departamentos → Cargos → Competências.
- Destacar que tem 4 competências da Acme: Comunicação, Liderança, Entrega, Colaboração.

**🎙️ Fala**
> "Antes de cadastrar pessoa nenhuma, você configura aqui em Configurações a estrutura da empresa: unidades, departamentos, cargos e competências. As competências são especialmente importantes — elas vão aparecer depois nos formulários de avaliação, nos feedbacks e nos PDIs como o vocabulário comum da empresa. Tem um tutorial só de setup inicial pra você fazer isso na ordem certa."

## 🎬 Bloco 3 — Colaboradores: o coração do sistema
**🖥️ Tela**
- Clicar em /colaboradores.
- Mostrar listagem com filtros (depto, status, gestor).
- Clicar em Maria Silva pra abrir o perfil dela.
- Apontar: cargo, departamento, gestor direto (Carlos).

**🎙️ Fala**
> "Aqui ficam todas as pessoas. Você cadastra cada colaborador, vincula a um departamento, a um cargo e — esse é o ponto mais importante — define quem é o gestor direto. Esse vínculo de gestor é o que vai destravar tudo depois: avaliação do gestor, acompanhamento de PDI, feedback do time. Sem essa hierarquia configurada, o sistema não sabe quem responde por quem."

**💡 Observações**
- Mencionar que existe convite por e-mail no botão "Convidar" (mostra rapidinho).
- Não tem importação por CSV no momento — cadastro é manual ou via API direto no banco.

## 🎬 Bloco 4 — Avaliações: o ciclo de desempenho
**🖥️ Tela**
- Clicar em /avaliacoes.
- Mostrar lista com o ciclo "Avaliação Q2 2026" publicado.
- Abrir o ciclo, mostrar a barra de progresso (pendentes / em andamento / concluídas).
- Clicar em Resultados de exemplo (sem entrar em detalhe).

**🎙️ Fala**
> "Aqui é onde mora o ciclo de avaliação de desempenho. Você cria um ciclo, monta o formulário com perguntas agrupadas por competência, escolhe quem participa e quem avalia quem — autoavaliação, gestor, ou os dois. Depois de publicar, o sistema gera as avaliações automaticamente para cada colaborador e você acompanha por aqui. Quando encerrar, você lê os resultados e compara o que cada um achou de si com o que o gestor enxergou."

## 🎬 Bloco 5 — Feedbacks: o que acontece entre os ciclos
**🖥️ Tela**
- Clicar em /feedbacks.
- Mostrar abas Recebidos / Enviados / Time.
- Apontar tipos: elogio, orientação, desenvolvimento.

**🎙️ Fala**
> "Ciclo de avaliação acontece a cada 3 ou 6 meses, mas o reconhecimento e a orientação não podem esperar. Os feedbacks contínuos vivem aqui. Qualquer pessoa pode mandar elogio ou orientação pra qualquer colega, vinculado a uma competência, com a visibilidade que fizer sentido — privado entre as duas pessoas, visível pro gestor, ou compartilhado com o RH."

## 🎬 Bloco 6 — PDI: avaliação que vira ação
**🖥️ Tela**
- Clicar em /pdi.
- Mostrar o PDI da Maria com objetivo "Desenvolver comunicação assertiva".
- Apontar as ações com prazos e status.

**🎙️ Fala**
> "Avaliação só vale a pena se virar plano de ação. Os PDIs ficam aqui. Cada PDI tem um objetivo, normalmente vinculado a uma competência que apareceu fraca na avaliação, e um conjunto de ações práticas com prazo e responsável. Você acompanha o status de cada ação — não iniciado, em andamento, concluído, atrasado — direto da listagem."

## 🎬 Bloco 7 — Recrutamento: a porta de entrada
**🖥️ Tela**
- Clicar em /recrutamento.
- Mostrar listagem de vagas, abrir a vaga "Desenvolvedor(a) Pleno".
- Mostrar o kanban com Pedro Santos em uma das etapas.

**🎙️ Fala**
> "Recrutamento é o ciclo anterior à gestão: vagas abertas, candidatos no funil, kanban pra você arrastar entre etapas. Quando uma pessoa é contratada, o sistema cria o registro de colaborador automaticamente — então a Maria ou o Pedro que entrou pelo recrutamento já aparece direto em Colaboradores no dia seguinte, sem cadastro duplicado."

**💡 Observações**
- Mencionar rapidinho que cada vaga congela seu funil no momento da criação. Se você adicionar uma etapa nova depois, vagas em andamento não mudam.

## 🎬 Encerramento (~10s)
**🎙️ Fala**
> "Esse é o panorama. A partir daqui, cada área tem um tutorial próprio com o passo a passo. A sequência que eu recomendo pra começar é: setup inicial → cadastrar colaboradores → criar o primeiro ciclo. Bom trabalho aí."

## 📝 Notas de gravação
- Vídeo de panorama — **não** entrar em detalhes de formulário, kanban ou wizard. Cada um tem seu próprio tutorial.
- Manter rítmo ágil: cerca de 30–45s por bloco.
- Borrar e-mails reais que aparecerem na listagem de colaboradores. Usar dados `@acme-demo.com`.
- Tutorial seguinte sugerido: `admin-setup-inicial`.
