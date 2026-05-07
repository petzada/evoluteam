---
slug: admin-gerenciar-colaboradores
persona: admin_rh
duration_estimate: "4–5 min"
related_screens:
  - /colaboradores
  - /colaboradores/novo
---

# Gerenciar colaboradores

## 🎯 Objetivo
Ao final, o admin sabe cadastrar um colaborador novo, vincular gestor/departamento/cargo, disparar o convite por e-mail e gerenciar o ciclo de vida (desativar, reativar, desligar).

## 📋 Pré-requisitos para gravar
- Setup inicial concluído (departamentos, cargos, competências cadastrados).
- Carlos Oliveira já cadastrado como Gerente de Tecnologia (vai ser usado como gestor da Maria).
- 1 colaborador antigo para demonstrar edição/desativação.
- Logada como Márcia.

## 🎬 Abertura (~15s)
**🎙️ Fala**
> "Olá! Vamos cadastrar colaboradores no evoluteam. Eu vou te mostrar o cadastro do zero, como atribuir o gestor direto — que é o ponto mais importante — como mandar o convite de acesso, e o que fazer quando alguém sai da empresa. Vamos lá."

## 🎬 Bloco 1 — A tela de colaboradores
**🖥️ Tela**
- Abrir /colaboradores.
- Mostrar a listagem com filtros (departamento, status, gestor) e a busca.
- Apontar o botão "Novo colaborador" no topo.

**🎙️ Fala**
> "Essa é a tela de colaboradores. Aqui ficam todas as pessoas da empresa, ativas e inativas, com filtros pra você achar rápido por departamento, por gestor ou por status. Pra começar a cadastrar, clico em Novo colaborador."

## 🎬 Bloco 2 — Cadastrando a Maria
**🖥️ Tela**
- Clicar em "Novo colaborador". Abre uma sheet do lado direito.
- Preencher: Nome "Maria Silva", e-mail "maria.silva@acme-demo.com", data de admissão.
- Selecionar departamento Tecnologia, cargo Desenvolvedora, unidade Matriz São Paulo.

**🎙️ Fala**
> "Preencho o básico: nome, e-mail corporativo, data de admissão. Depois vinculo o departamento, o cargo e a unidade. Esses três campos é que vão fazer a Maria aparecer nos filtros dos relatórios — então capricha. O e-mail aqui vai ser também o login dela quando você mandar o convite — guarda isso."

## 🎬 Bloco 3 — Atribuindo o gestor direto (o ponto crítico)
**🖥️ Tela**
- Clicar no select "Gestor direto".
- Buscar "Carlos" e selecionar Carlos Oliveira.
- Mostrar que outros colaboradores aparecem no select.

**🎙️ Fala**
> "Agora o ponto que mais gera dúvida: o gestor direto. Indico aqui que a Maria é liderada do Carlos. Esse vínculo é o que vai destravar quase tudo depois — o Carlos vai poder avaliar a Maria nos ciclos, vai ver o PDI dela na aba Time, vai receber os feedbacks que ela compartilhar com o gestor. Sem esse vínculo, o sistema não sabe quem responde por quem."

**💡 Observações**
- O sistema bloqueia automaticamente vínculos circulares: você não consegue marcar como gestor de alguém uma pessoa que já é liderada de quem você está cadastrando.
- Se o cargo da pessoa for "Gerente" mas você não atribuir liderados pra ela, ela não vira gestor no sistema — gestor é relacional, não é cargo.

## 🎬 Bloco 4 — Disparar o convite por e-mail
**🖥️ Tela**
- Após salvar, mostrar o card da Maria na listagem com badge "convite pendente" ou similar.
- Clicar no menu de ações dela e em "Reenviar convite" (ou onde estiver).
- Mostrar mensagem de confirmação.

**🎙️ Fala**
> "Cadastrei a Maria. Agora preciso liberar acesso pra ela — clico em Convidar. O sistema dispara um e-mail pra ela com um link de criação de senha. O link vale por 7 dias. Se ela não acessar nesse prazo, eu volto aqui e reenvio o convite. Enquanto ela não criar a senha, o cadastro existe na base mas ela não consegue logar."

## 🎬 Bloco 5 — Editar e gerenciar o ciclo de vida
**🖥️ Tela**
- Voltar pra listagem.
- Clicar no colaborador antigo pra abrir o perfil.
- Mostrar edição rápida.
- Clicar em "Desativar" → mostrar opção de transferir subordinados pra outro gestor.
- Cancelar a desativação só pra demonstrar a tela.
- Mostrar "Reativar" e "Desligar" como opções diferentes.

**🎙️ Fala**
> "Pra editar, é só abrir o perfil. Quando uma pessoa sai da empresa, você tem dois caminhos: Desativar suspende o acesso temporariamente, e Desligar marca o desligamento de fato com data. Se a pessoa que está saindo for gestora de outras pessoas, o sistema te força a transferir os liderados antes — pra ninguém ficar órfão sem gestor. E se a pessoa voltar, você Reativa e ela volta com o histórico todo intacto."

## 🎬 Encerramento (~10s)
**🎙️ Fala**
> "Pronto. Com colaboradores cadastrados e gestores vinculados, você já consegue criar o primeiro ciclo de avaliação. Tem um tutorial de criar ciclo a seguir."

## 📝 Notas de gravação
- Borrar e-mails reais. Usar `@acme-demo.com`.
- Não tem importação por CSV no sistema atual — não prometer no vídeo.
- Tutorial seguinte sugerido: `admin-criar-ciclo-avaliacao`.
