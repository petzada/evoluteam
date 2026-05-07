---
slug: admin-gerenciar-candidatos-vaga
persona: admin_rh
duration_estimate: "5–7 min"
related_screens:
  - /recrutamento/candidatos
  - /recrutamento/candidatos/novo
  - /recrutamento/vagas/[id]
  - /recrutamento/relatorios
---

# Gerenciar candidatos e contratar

## 🎯 Objetivo
Ao final, o admin sabe cadastrar um candidato, vincular à vaga, mover pelo kanban, contratar (que cria o colaborador automaticamente) e ler os relatórios do funil.

## 📋 Pré-requisitos para gravar
- Vaga "Desenvolvedor(a) Pleno — Tecnologia" aberta com Carlos como hiring manager.
- Pedro Santos como candidato a ser cadastrado.
- 2 ou 3 outros candidatos já distribuídos pelo kanban da vaga (pra demonstrar relatórios).
- Logada como Márcia.

## 🎬 Abertura (~15s)
**🎙️ Fala**
> "Olá! Com a vaga aberta, a gente vai trabalhar candidatos: cadastrar, vincular, mover pelo funil, e — quando rolar — contratar. E no fim eu mostro os relatórios pra você medir saúde do processo. Vamos."

## 🎬 Bloco 1 — Cadastrando o Pedro
**🖥️ Tela**
- /recrutamento/candidatos → "Novo candidato".
- Preencher Pedro Santos: e-mail "pedro@candidato-demo.com", telefone, LinkedIn URL, link do currículo (drive ou outro).
- Origem (source): "Indicação".
- Notas internas: "Indicado pelo Carlos, conhece bem React".
- Salvar.

**🎙️ Fala**
> "Vou cadastrar o Pedro. Nome, e-mail, telefone, LinkedIn, e o link do currículo — pode ser drive, dropbox, o que sua empresa usar. A Origem é onde você marca de onde o candidato veio: indicação, LinkedIn, anúncio, banco interno. Esse campo vira gráfico no relatório depois — vale capricho. As notas internas ficam só pra equipe de recrutamento; o candidato nunca vê."

## 🎬 Bloco 2 — Vinculando à vaga
**🖥️ Tela**
- Logo após salvar (ou na ficha do Pedro), clicar em "Vincular a vaga".
- Selecionar "Desenvolvedor(a) Pleno".
- Confirmar.
- Mostrar o Pedro caindo na primeira coluna do kanban (etapa de entrada — Triagem).

**🎙️ Fala**
> "Cadastrado, vinculo à vaga Desenvolvedor Pleno. O Pedro entra automaticamente na etapa de entrada — aqui é Triagem. Repare que ele entrou no funil congelado dessa vaga específica: as colunas do kanban são as que existiam quando a vaga foi criada. Se você cadastrou o candidato sem vincular, ele fica no banco geral de candidatos e você vincula depois — também funciona."

## 🎬 Bloco 3 — Movendo no kanban
**🖥️ Tela**
- Abrir o kanban da vaga.
- Arrastar o card do Pedro de Triagem → Entrevista RH → Entrevista Gestor.
- Mostrar o tempo dele em cada etapa aparecendo no card.

**🎙️ Fala**
> "Conforme o Pedro avança, eu arrasto. Triagem → Entrevista RH → Entrevista Gestor. Cada movimento fica registrado com data e hora — repare que o card mostra quanto tempo ele está parado na coluna atual. Isso é precioso pra identificar gargalo: se candidato fica 15 dias parado na Entrevista do Gestor, tem alguém que precisa ser cobrado. Quando o Pedro chega na Entrevista do Gestor, o sistema notifica o Carlos automaticamente — porque ele é o hiring manager dessa vaga."

## 🎬 Bloco 4 — Contratar (e o que acontece automaticamente)
**🖥️ Tela**
- Card do Pedro na coluna Proposta.
- Clicar no card → botão "Contratar".
- Wizard de contratação: confirmar dados, preencher data de admissão, departamento Tecnologia, cargo Desenvolvedor, gestor Carlos, salário (opcional).
- Confirmar.
- Mostrar o card movendo pra coluna "Contratado" e a notificação de sucesso.
- Ir em /colaboradores e mostrar Pedro Santos já listado como colaborador ativo.

**🎙️ Fala**
> "Quando o Pedro aceita a proposta, eu não arrasto pra Contratado direto — clico em Contratar. Abre o wizard que junta os dados do candidato com os dados de admissão: data de início, departamento, cargo, gestor direto. Confirmo. Olha o que aconteceu: o card foi pra Contratado **e** o sistema criou o registro de colaborador do Pedro automaticamente. Vou em Colaboradores aqui — o Pedro já está lá, ativo, vinculado ao Carlos como gestor. Sem cadastro duplicado."

**💡 Observações**
- Por isso o sistema **bloqueia** arrastar direto pra coluna de contratação — sem o wizard você não tem os dados completos pra criar o colaborador.

## 🎬 Bloco 5 — Relatórios do funil
**🖥️ Tela**
- Abrir /recrutamento/relatorios.
- Mostrar gráfico de tempo médio por etapa (time-to-hire).
- Mostrar gráfico de origem dos candidatos (LinkedIn / Indicação / Banco interno).
- Mostrar funil de conversão (quantos entraram, quantos chegaram em cada etapa).
- Aplicar filtro por período.

**🎙️ Fala**
> "E aqui é onde os dados viram decisão. Tempo médio do candidato em cada etapa: vejo em qual delas o processo trava. Origem: vejo qual canal está trazendo mais candidatos e quais convertem em contratação. Funil de conversão: vejo o estreitamento — entraram 50 na Triagem, 12 chegaram na Entrevista do Gestor, 2 foram contratados. Posso filtrar por período pra comparar trimestres. Esses três gráficos sustentam a conversa de 'o que vamos melhorar no recrutamento esse trimestre'."

## 🎬 Encerramento (~10s)
**🎙️ Fala**
> "Você fechou o ciclo todo de recrutamento — cadastro, kanban, contratação, relatório. Com isso, os tutoriais de admin estão completos. A partir daqui sua empresa está rodando. Bom trabalho."

## 📝 Notas de gravação
- Vídeo mais longo (5 blocos densos). Manter ritmo.
- A descoberta do bloco 4 — "contratar cria o colaborador automaticamente" — é o highlight. Não passar correndo.
- Borrar e-mails de candidatos. Usar `@candidato-demo.com`.
- Esse é o último vídeo da série admin_rh.
