Preciso garantir que os papeis/permissoes/roles do meu sistema funcionem.

Hoje, tenho 3 papeis assumidos de usuario na minha aplicação, sendo eles:

- User
- Admin
- Director

Cada um deve ter funções básicas que são permanentes do seu papel no sistema e o user em específico tem algumas funções que podem ser habilitadas dentro do seu perfil de gerenciamento de acesso, deixando assim uma lacuna onde um "colaborador" pode visualizar/editar algumas páginas em específico, pois pode ser por exemplo um funcionário com mais permissões dentro do RH da empresa.

Esse controle de funções deve ser exercido dessa maneira:

1. Roles tem permissões já definidas diretamente no código
2. Role user (colaborador) pode ter algumas permissoes a mais concedidas pelo Admin, mediante toggle no perfil (controle de acesso)

Vou listar as roles básicas e suas permissões e como cada uma das permissões dadas pelo admin deve se comportar, ficando assim:

- Permissões básicas de USER
User - deverá conseguir VISUALIZAR:
/dashboard (Renomeado como Início para user);
/colaboradores/[seu id] somente, quando clica em /colaboradores redirect para [seu id] automaticamente;
/avaliacoes (avaliações a qual ele foi inserido, não poderá criar avaliações);
/feedbacks (recebidos e enviados pertinentes a si mesmo);
/pdi (pdis criados para si e por si mesmo - permite criar seu próprio pdi);
Itens de RECRUTAMENTO e CONFIGURACOES não ficam disponíveis para User.
Único item de /configuracoes que deve ficar disponível é o /configuracoes/perfil próprio;

- Permissões básicas de USER "gestor"
User - deverá conseguir VISUALIZAR E EDITAR, se couber:
/dashboard (Caso user seja gestor de algum outro user, poderá visualizar dashboard com dados da sua árvore de colaboradores);
/colaboradores/ visualizar ele mesmo e os dados de users que são seus subordinados;
/avaliacoes (avaliações a qual ele foi inserido e avaliações a qual seus subordinados estão inseridos);
/feedbacks (recebidos e enviados pertinentes a si mesmo e a qual seus subordinados marcaram como "visível para gestor);
/pdi (pdis criados para si mesmo e por si mesmo e a qual seus subordinados fazem parte);
Itens de RECRUTAMENTO (relatórios, candidatos, vagas) a qual ele está marcado como responsável pela vaga aberta (definido pelo admin na hora de criação da vaga); Item ETAPAS não fica disponível, somente para admin;
Itens de CONFIGURAÇÕES não ficam disponíveis para "gestor".

Lembrando que um USER gestor é definido quando ele tem algum outro colaborador (user) que está com o gestor direto marcado como a pessoa, ou seja, ele é gestor de alguém, e a partir daí toda a arvore abaixo do gestor fica disponível para visualizar os dados.

- Permissões básicas de DIRECTOR
Director - deverá conseguir VISUALIZAR tudo, com exceção dos feedbacks unico e exclusivamente marcados como "somente pessoas envolvidas";
Não conseguirá editar nada, a não ser comentar em avaliações, feedbacks e pdis que lhe cabem o comentário de acordo com as funções de cada feature;
Dashboard e relatórios ficam disponíveis para visualização da empresa inteira, sem árvore de gestão.

- Permissões básicas de ADMIN
Administrador deve conseguir visualizar tudo e editar tudo, com exceção APENAS de feedbacks marcados como "somente pessoas envolvidas";
Não deve ter limitações no sistema, se houver hoje, deve ser listado para correção, mas é o usuário máximo do sistema.

- Permissões de um User com toggles de visualizacao/edicao ativados
Haverá casos em que um usuário será colaborador do RH e mexerá com RECRUTAMENTO, por exemplo, então ele será marcado com os toggles de recrutamento permitidos para edição e visualização, assim, ele conseguirá criar cagas, criar candidatos, verificar relatórios de recrutamento, por exemplo, hoje isso deverá ser definido único e exclusivamente através dos toggles de gerenciamento de acesso, assim ele continua sendo um User (colaborador) porém com permissões a mais, e essas permissões a mais devem refletir na sidebar para acesso e as páginas também devem ficar disponíveis para acesso/botões de criação/edição onde cabível.

Essas são as informações básicas e necessárias para garantir que cada papel de usuário dentro do sistema não invada permissões de outro usuário ou tenha algum vazamento de informação desnecessário. Faça uma revisão geral do sistema em busca de garantir que isso seja cumprido fielmente. Caso haja alguma inconsistencia, sinalize o modelo de correção necessário. Se houver algo que ficou com dúvida quanto as permissões, vamos utilizar a skill brainstorming do começo ao fim para garantir que tudo esteja devidamente alinhado. Se precisar mapear papel por papel e permissão por permissão, que façamos, mas devemos garantir consistencia nesse módulo de permissões de visualização/edição.