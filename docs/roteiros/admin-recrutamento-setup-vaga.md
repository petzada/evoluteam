---
slug: admin-recrutamento-setup-vaga
persona: admin_rh
duration_estimate: "4–5 min"
related_screens:
  - /recrutamento/etapas
  - /recrutamento/vagas
  - /recrutamento/vagas/nova
---

# Configurar funil e criar vaga

## 🎯 Objetivo
Ao final, o admin sabe configurar as etapas do funil de recrutamento e criar uma vaga — entendendo que o funil **congela na vaga** no momento da criação e o que isso significa na prática.

## 📋 Pré-requisitos para gravar
- Etapas iniciais já existem (Triagem, Entrevista RH, Teste Técnico, Entrevista Gestor, Proposta, Contratado).
- Carlos Oliveira cadastrado pra ser usado como hiring manager.
- Logada como Márcia.

## 🎬 Abertura (~15s)
**🎙️ Fala**
> "Olá! Vamos configurar o módulo de recrutamento e criar a primeira vaga no evoluteam. Antes da vaga, a gente precisa entender as etapas do funil — porque tem uma lógica importante de funil congelado por vaga que faz toda a diferença depois. Vamos."

## 🎬 Bloco 1 — As etapas do funil
**🖥️ Tela**
- Abrir /recrutamento/etapas.
- Mostrar a lista das etapas existentes.
- Apontar a coluna "Tipo" com os 3 tipos: entrada, intermediária, contratação.

**🎙️ Fala**
> "Em /recrutamento/etapas estão as etapas do seu funil de seleção. Aqui na Acme já temos seis: Triagem, Entrevista RH, Teste Técnico, Entrevista Gestor, Proposta e Contratado. Cada etapa tem um tipo — repare na coluna Tipo. Tem três: entrada, que é onde todo candidato cai quando entra na vaga; intermediárias, que é o miolo; e contratação, que é onde o candidato vira colaborador. Em cada vaga você só pode ter uma etapa de entrada e uma de contratação — a Triagem entra e a Contratado sai. As do meio você pode ter quantas precisar."

## 🎬 Bloco 2 — Criando uma etapa nova
**🖥️ Tela**
- Clicar em "Nova etapa".
- Criar "Cultural Fit" como tipo intermediária, posição entre Entrevista Gestor e Proposta.
- Salvar.
- Apontar o banner amarelo no topo: "Mudanças aqui se aplicam apenas a vagas novas".

**🎙️ Fala**
> "Vou adicionar uma etapa Cultural Fit, intermediária, entre a Entrevista do Gestor e a Proposta. Salvo e — repara nesse banner amarelo aqui em cima: 'Mudanças aqui se aplicam apenas a vagas novas'. Esse aviso é a parte mais importante do tutorial."

## 🎬 Bloco 3 — Por que o funil congela na vaga
**🖥️ Tela**
- Abrir uma vaga existente (se houver).
- Apontar a linha "Funil congelado em dd/mm/aaaa" no header.
- Mostrar que as colunas do kanban são as que existiam quando a vaga foi criada.

**🎙️ Fala**
> "Quando você cria uma vaga, o sistema tira uma foto do funil naquele momento e congela. Olha aqui — essa vaga foi criada em uma data específica, e ela mantém as etapas que existiam naquele dia. Por que isso? Porque imagina que você tem uma vaga rodando há dois meses, com 15 candidatos espalhados pelas etapas. Se eu chego e adiciono uma etapa nova no meio, ou renomeio uma etapa, todos esses candidatos se desorientavam — relatórios quebravam, o gestor da vaga ficava perdido. Então o evoluteam decide: a vaga em andamento não muda. A etapa Cultural Fit que acabei de criar só vai aparecer nas vagas que eu criar daqui pra frente."

**💡 Observações**
- Decisão arquitetural intencional. Cliente perguntou várias vezes — a resposta é sempre "sim, é assim de propósito, e é por isso que funciona".

## 🎬 Bloco 4 — Criando a vaga "Desenvolvedor(a) Pleno"
**🖥️ Tela**
- Ir em /recrutamento/vagas → "Nova vaga".
- Preencher: título "Desenvolvedor(a) Pleno", departamento Tecnologia, hiring manager Carlos Oliveira, descrição curta da vaga, modalidade (remoto/presencial), nível de senioridade.
- Salvar.
- Mostrar a vaga aberta com o kanban vazio + a linha "Funil congelado em <hoje>".

**🎙️ Fala**
> "Crio a vaga Desenvolvedor Pleno. Vinculo ao departamento Tecnologia, indico o Carlos como hiring manager — é ele que vai entrevistar e decidir, então recebe notificação quando candidato chegar na etapa de entrevista do gestor. Salvo. Pronto, vaga aberta, kanban vazio, e olha aqui: 'Funil congelado em hoje'. Essa vaga agora carrega minha etapa Cultural Fit, porque eu criei ela depois de adicionar a etapa. Vagas antigas não mudaram."

## 🎬 Encerramento (~10s)
**🎙️ Fala**
> "Vaga aberta e funil pronto. Agora é trazer candidato e mover no kanban — esse é o próximo tutorial."

## 📝 Notas de gravação
- O conceito de "funil congela na vaga" é o highlight desse vídeo — explicar duas vezes se precisar, com exemplo prático.
- Tutorial seguinte sugerido: `admin-gerenciar-candidatos-vaga`.
