1. Módulo de empresas, usuários e colaboradores

Esse é o alicerce.

A empresa se cadastra, cria sua organização e adiciona os colaboradores.

Features

Cadastro de empresa:

nome da empresa
segmento
tamanho do time
logo
configuração de cargos/departamentos

Cadastro de colaboradores:

nome
e-mail
cargo
departamento
gestor responsável
data de admissão
status: ativo, inativo, desligado
nível/cargo: júnior, pleno, sênior, líder, gerente etc.

Perfis de acesso:

Admin/RH: vê tudo
Gestor: vê liderados
Colaborador: vê apenas o próprio perfil, feedbacks, avaliações e PDI
Diretoria: vê dashboards consolidados

Tecnicamente, aqui você teria o mesmo padrão multi-tenant que você já usa em SaaS:

companies
users
employees
departments
roles
employee_managers

O ponto importante: usuário nem sempre é colaborador. Às vezes o RH cadastra colaboradores que ainda não têm login.

2. Ciclos de avaliação de desempenho

Esse é o coração do produto.

Avaliação de desempenho geralmente envolve questionários, avaliadores, avaliado, competências, resultados e devolutiva. A própria Qulture descreve avaliação como uma análise estruturada do desempenho individual em um período, com foco em mensurar desempenho e gerar insumos de desenvolvimento.

Features do MVP

O RH cria um ciclo de avaliação.

Exemplo:

Avaliação Semestral 2026.1
Período avaliado: Janeiro a Junho
Prazo de resposta: 15 dias
Público: todos os colaboradores ativos

Tipos de avaliação:

Autoavaliação
Avaliação do gestor
Avaliação de pares
Avaliação do liderado para o gestor, opcional para MVP

No MVP, eu começaria com:

autoavaliação
avaliação do gestor
avaliação de pares simples
O que o RH configura

Nome do ciclo:

“Avaliação Semestral”
“Ciclo de Performance Q2”
“Avaliação 90 dias”

Quem será avaliado:

todos
por departamento
por cargo
seleção manual de colaboradores

Quem avalia quem:

gestor direto avalia liderado
colaborador faz autoavaliação
pares escolhidos manualmente ou indicados pelo gestor

Formulário:

perguntas de nota
perguntas abertas
competências
resultados/metas
comentários finais

Exemplo de perguntas:

“Entrega suas atividades no prazo?”
“Demonstra colaboração com o time?”
“Comunica problemas com clareza?”
“Tem domínio técnico adequado ao cargo?”
“Quais foram os principais pontos fortes?”
“Quais pontos precisam ser desenvolvidos?”

Tipos de resposta:

escala 1 a 5
texto livre
múltipla escolha
sim/não
campo de evidências
Telas
Tela: Ciclos de avaliação

Lista todos os ciclos:

Em rascunho
Ativo
Finalizado
Arquivado

Cada ciclo mostra:

nome
período
quantidade de avaliados
progresso de respostas
prazo
status
Tela: Criar ciclo

Wizard em etapas:

Dados do ciclo
Público avaliado
Tipo de avaliação
Formulário
Revisão e publicação
Tela: Responder avaliação

Interface simples:

barra de progresso
nome do avaliado
blocos por competência
notas
comentários
botão salvar rascunho
botão enviar
Tela: Resultado individual

Mostra:

média geral
média por competência
comparativo autoavaliação vs gestor
comentários recebidos
pontos fortes
pontos de melhoria
sugestões de PDI

Essa tela é muito importante. É onde o SaaS começa a gerar valor real.

3. Feedbacks contínuos

Esse módulo deixa o produto mais vivo fora do ciclo de avaliação.

A Qulture também posiciona feedbacks como parte da gestão de desempenho, não apenas como algo pontual da avaliação.

Features

Qualquer usuário pode registrar um feedback para outro colaborador.

Tipos:

elogio
reconhecimento
ponto de melhoria
feedback privado
feedback visível para gestor/RH
feedback público no mural, opcional

Campos:

pessoa que recebeu
pessoa que enviou
tipo de feedback
competência relacionada
mensagem
visibilidade
data

Exemplo:

“O João ajudou o time de suporte a resolver um problema crítico no cliente X. Demonstrou colaboração e senso de urgência.”

Por que isso é bom?

Porque na hora da avaliação, o gestor não depende só da memória.

A avaliação fica mais justa porque o sistema pode mostrar:

feedbacks recebidos no ciclo
elogios
pontos de melhoria recorrentes
histórico de comportamento

A Qulture menciona justamente essa ideia de preencher avaliações com informações importantes na barra lateral, como elogios, feedbacks recebidos, avaliações passadas, PDIs e OKRs.

Tela boa para isso

Na tela de avaliação do gestor, você pode ter uma lateral:

Contexto do colaborador

feedbacks recebidos
metas do período
PDI em andamento
avaliações anteriores
histórico de 1:1

Isso é uma feature forte.

4. PDI — Plano de Desenvolvimento Individual

Depois da avaliação, o sistema precisa transformar diagnóstico em ação.

Sem isso, vira só “nota e comentário”.

Features

Criar PDI para colaborador:

objetivo de desenvolvimento
competência relacionada
ação prática
prazo
responsável
status
evidência/conclusão

Exemplo:

Competência: Comunicação
Objetivo: Melhorar clareza nas reuniões com clientes
Ações:

participar de 2 calls com o gestor
preparar roteiro antes das reuniões
fazer curso interno de comunicação
receber feedback quinzenal

Status:

não iniciado
em andamento
concluído
atrasado
cancelado
Geração com IA

Aqui entraria uma feature muito vendável:

Gerar sugestões de PDI com IA com base na avaliação.

Exemplo:

O sistema lê:

notas baixas
comentários do gestor
autoavaliação
feedbacks recebidos

E gera:

3 pontos de desenvolvimento
plano de ação
sugestão de prazo
sugestão de acompanhamento

A Qulture também fala em IA para refinar respostas, analisar resultados, criar feedbacks de devolutiva e levantar pontos de desenvolvimento.

Para MVP, eu faria IA só em 3 pontos:

resumo da avaliação
sugestão de PDI
rascunho de devolutiva do gestor

Não colocaria IA em tudo.

5. Dashboard de RH / People Analytics simples

Não precisa começar com BI absurdo.

Comece com indicadores básicos e úteis.

People Analytics, no contexto de RH, é usar dados de colaboradores para apoiar decisões de pessoas e negócio.

Métricas do MVP

Dashboard geral:

total de colaboradores ativos
avaliações pendentes
avaliações concluídas
média geral de desempenho
média por departamento
colaboradores com melhor avaliação
colaboradores com maior queda
colaboradores sem feedback recente
PDIs atrasados
taxa de conclusão do ciclo

Por departamento:

média de desempenho
quantidade de pessoas avaliadas
distribuição de notas
competências mais fortes
competências mais fracas

Por colaborador:

histórico de avaliações
evolução da nota
feedbacks recebidos
PDIs concluídos
metas vinculadas
Visualizações boas

Eu faria:

cards de KPI
gráfico de barras por departamento
gráfico radar por competência
tabela de colaboradores
heatmap simples de competências
matriz 9-box mais para fase 2

A matriz 9-box é legal, mas eu não colocaria no primeiro MVP se você quiser velocidade. A Qulture usa esse tipo de visão para tomada de decisão sobre performance/talentos, mas isso exige mais maturidade de dados.