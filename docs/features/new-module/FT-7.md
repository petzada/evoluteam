Eu faria um Funil de Recrutamento MVP, focado em:

cadastrar vagas, cadastrar candidatos, mover candidatos por etapas, registrar desistências/reprovações, coletar feedbacks e visualizar métricas do funil.

Isso conversa muito bem com seu SaaS atual porque depois você pode transformar um candidato contratado em colaborador.

Onde isso entra no seu produto?

Eu colocaria como a Feature 6 ou como um módulo chamado:

Recrutamento

Dentro do menu:

Dashboard
Colaboradores
Avaliações
Feedbacks
PDI
Recrutamento
Configurações

O fluxo seria:

Vaga → Candidatos → Etapas do funil → Avaliações/feedbacks → Contratação → vira colaborador

Soluções para se inspirar
1. Gupy

A Gupy é uma das principais referências no Brasil para recrutamento, seleção e gestão de talentos. Ela fala bastante sobre centralizar informações de vagas e candidatos, simplificar tarefas manuais, oferecer feedback após etapas, acompanhar resultados e dar visibilidade ao processo para RH e gestores.

Inspiração para você:

funil de candidatos por vaga;
status por etapa;
métricas de processo seletivo;
feedbacks por etapa;
visão operacional para RH.
2. Pandapé

O Pandapé se posiciona como ATS de recrutamento e seleção, com foco em gerenciar candidatos, centralizar processos, aplicar testes, divulgar vagas e otimizar a seleção.

Inspiração para você:

banco de candidatos;
gestão centralizada das etapas;
candidatos organizados por vaga;
automação leve;
visão para pequenas e médias empresas.
3. Greenhouse

O Greenhouse é uma referência global em ATS mais estruturado. Ele trabalha bastante com pipeline, scorecards de entrevista, experiência do candidato e relatórios de recrutamento. A documentação deles cita relatórios de scorecard para entender como avaliações mudam ao longo das etapas e como entrevistadores avaliam candidatos.

Inspiração para você:

scorecard de entrevista;
avaliações padronizadas;
feedback estruturado por avaliador;
métricas por etapa;
histórico do candidato.
4. Workable

O Workable trabalha fortemente com hiring funnel report, ou relatório de funil de contratação, com filtros por data de criação do candidato, status da vaga e outros critérios.

Inspiração para você:

relatório de funil;
taxa de conversão por etapa;
gargalos;
candidatos parados;
origem dos candidatos.

Escopo recomendado para MVP dessa feature

Eu faria assim:

Recrutamento MVP 1.0

Obrigatório:

1. Criar vagas
2. Cadastrar candidatos
3. Vincular candidatos a vagas
4. Kanban do funil
5. Mover candidato entre etapas
6. Registrar desistência/reprovação
7. Motivo de desistência/reprovação
8. Feedback interno por candidato
9. Scorecard simples
10. Métricas básicas do funil
11. Converter contratado em colaborador

Isso já entrega valor real.

Recrutamento MVP 1.5

Depois:

1. Página pública simples da vaga
2. Formulário público de candidatura
3. Upload de currículo
4. E-mails automáticos
5. Templates de mensagem
6. Tarefas e lembretes
7. Exportação CSV
8. IA para resumo do candidato

Modelo de funil que eu recomendo

Para seu cliente modelo, eu começaria com etapas editáveis, mas já entregaria um padrão.

Etapas padrão
Cadastrado
Triagem
Entrevista RH
Entrevista Gestor
Teste/Case
Proposta
Contratado
Status finais
Contratado
Reprovado
Desistente
Cancelado

Atenção: etapa e status final não são a mesma coisa.

Exemplo:

Etapa atual: Entrevista Gestor
Status: Em andamento

Ou:

Última etapa: Entrevista Gestor
Status: Desistente
Motivo: Aceitou outra proposta

Essa separação deixa as métricas muito melhores.

Banco de dados conceitual

Eu adicionaria essas tabelas:

job_openings
recruitment_stages
candidates
job_applications
candidate_stage_history
candidate_feedbacks
candidate_scorecards
candidate_tasks
candidate_rejection_reasons
candidate_withdrawal_reasons
Explicando simples
job_openings

A vaga.

Exemplo: “Analista de Suporte Júnior”.

candidates

A pessoa candidata.

Exemplo: “Maria Souza”.

job_applications

A candidatura daquela pessoa para aquela vaga.

Importante porque a mesma pessoa pode participar de mais de uma vaga ao longo do tempo.

recruitment_stages

As etapas do funil.

Exemplo: Triagem, Entrevista RH, Proposta.

candidate_stage_history

Histórico de movimentação.

Exemplo:

Maria entrou em Triagem dia 10/04
Maria foi para Entrevista RH dia 12/04
Maria desistiu dia 14/04
Motivo: aceitou outra proposta
candidate_feedbacks

Comentários internos do RH/gestor.

candidate_scorecards

Avaliação estruturada por etapa.

candidate_tasks

Próximas ações.