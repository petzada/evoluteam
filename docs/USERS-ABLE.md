Visão geral do produto

O SaaS seria uma plataforma para empresas gerenciarem:

colaboradores
avaliações de desempenho
feedbacks contínuos
PDIs
dashboards de gestão de pessoas

A lógica principal seria:

Empresa cadastra colaboradores → cria ciclo de avaliação → pessoas respondem → gestor/RH analisa → gera feedback/devolutiva → cria PDI → acompanha evolução.

1. Fundação da aplicação

Antes de qualquer feature bonita, o sistema precisa ter uma base sólida.

Autenticação e organização

Users should be able to criar uma conta e fazer login.

Users should be able to criar uma empresa/organização após o primeiro acesso.

Users should be able to entrar em uma empresa existente por convite.

Users should be able to ter papéis diferentes dentro da empresa, como:

Admin/RH
Gestor
Colaborador
Diretoria/Visualizador

Users should be able to acessar apenas os dados da própria empresa.

Users should be able to editar seus próprios dados de perfil.

Users should be able to sair da conta com segurança.

Por que isso vem primeiro?

Porque todo o resto depende disso. Avaliação, feedback, PDI e dashboard precisam saber:

de qual empresa aquele dado pertence
quem é o usuário logado
qual papel ele tem
quais dados ele pode ver ou editar
2. Gestão de colaboradores

Essa é a primeira feature operacional do sistema.

Colaboradores

Users should be able to cadastrar colaboradores manualmente.

Users should be able to editar dados de um colaborador.

Users should be able to desativar ou reativar um colaborador.

Users should be able to listar todos os colaboradores da empresa.

Users should be able to filtrar colaboradores por departamento, cargo, status e gestor.

Users should be able to buscar colaboradores por nome ou e-mail.

Users should be able to visualizar o perfil completo de um colaborador.

Users should be able to definir quem é o gestor direto de cada colaborador.

Users should be able to atribuir um colaborador a um departamento.

Users should be able to atribuir um cargo ou função a um colaborador.

Users should be able to importar colaboradores via CSV.

Users should be able to convidar colaboradores para acessarem a plataforma por e-mail.

3. Departamentos e cargos

Isso ajuda a organizar o produto e também os filtros do dashboard.

Estrutura da empresa

Users should be able to criar departamentos.

Users should be able to editar departamentos.

Users should be able to arquivar departamentos que não são mais usados.

Users should be able to criar cargos/funções.

Users should be able to editar cargos/funções.

Users should be able to vincular colaboradores a departamentos e cargos.

Users should be able to visualizar a distribuição dos colaboradores por departamento.

4. Ciclos de avaliação de desempenho

Essa é a feature central do SaaS.

Criar ciclo

Users should be able to criar um ciclo de avaliação de desempenho.

Users should be able to definir nome, descrição e período do ciclo.

Users should be able to definir data de início e prazo final para respostas.

Users should be able to escolher quais colaboradores serão avaliados.

Users should be able to selecionar colaboradores por departamento, cargo ou manualmente.

Users should be able to definir quais tipos de avaliação farão parte do ciclo, como:

autoavaliação
avaliação do gestor
avaliação por pares

Users should be able to salvar um ciclo como rascunho antes de publicar.

Users should be able to publicar um ciclo de avaliação quando estiver pronto.

Users should be able to encerrar manualmente um ciclo de avaliação.

Users should be able to arquivar ciclos antigos.

5. Formulários de avaliação

Aqui mora uma parte importante da flexibilidade do produto.

Criar formulário

Users should be able to criar formulários personalizados para avaliação.

Users should be able to adicionar perguntas ao formulário.

Users should be able to editar perguntas antes de publicar o ciclo.

Users should be able to remover perguntas antes de publicar o ciclo.

Users should be able to ordenar perguntas do formulário.

Users should be able to criar perguntas por tipo de resposta, como:

nota de 1 a 5
texto livre
múltipla escolha
sim/não

Users should be able to marcar perguntas como obrigatórias ou opcionais.

Users should be able to agrupar perguntas por competências, como:

comunicação
liderança
colaboração
entrega
organização
domínio técnico
comportamento

Users should be able to reutilizar modelos de formulário em ciclos futuros.

Users should be able to usar um template padrão de avaliação criado pelo sistema.

6. Distribuição das avaliações

Essa parte é onde o sistema decide quem avalia quem.

Avaliadores

Users should be able to gerar avaliações automaticamente com base na estrutura da empresa.

Exemplo:

colaborador avalia a si mesmo
gestor avalia seus liderados
pares avaliam colegas selecionados

Users should be able to atribuir avaliadores manualmente.

Users should be able to remover avaliadores antes do envio.

Users should be able to visualizar quem precisa avaliar quem.

Users should be able to acompanhar avaliações pendentes, em andamento e concluídas.

Users should be able to reenviar lembretes para avaliadores pendentes.

Users should be able to bloquear respostas depois do encerramento do ciclo.

7. Responder avaliações

Essa é a experiência do colaborador, gestor ou par.

Respostas

Users should be able to ver avaliações pendentes no dashboard.

Users should be able to abrir uma avaliação pendente.

Users should be able to responder perguntas de nota, texto, múltipla escolha e sim/não.

Users should be able to salvar respostas como rascunho.

Users should be able to continuar uma avaliação de onde parou.

Users should be able to enviar a avaliação finalizada.

Users should be able to ver uma confirmação após enviar a avaliação.

Users should not be able to editar uma avaliação depois de enviada, a menos que o RH reabra.

Users should be able to visualizar o prazo final da avaliação.

Users should be able to receber aviso quando houver avaliação pendente.

8. Resultados da avaliação

Aqui começa o valor real do produto.

Resultado individual

Users with permission should be able to visualizar o resultado individual de um colaborador.

Users with permission should be able to ver média geral da avaliação.

Users with permission should be able to ver média por competência.

Users with permission should be able to comparar autoavaliação com avaliação do gestor.

Users with permission should be able to ver comentários recebidos na avaliação.

Users with permission should be able to identificar pontos fortes do colaborador.

Users with permission should be able to identificar pontos de melhoria do colaborador.

Users with permission should be able to exportar resultado individual em PDF.

Users with permission should be able to liberar ou ocultar resultado para o colaborador.

9. Feedbacks contínuos

Esse módulo dá uso ao sistema fora dos ciclos de avaliação.

Feedback

Users should be able to enviar feedback para outro colaborador.

Users should be able to escolher o tipo de feedback, como:

elogio
reconhecimento
ponto de melhoria
orientação
observação privada

Users should be able to vincular feedback a uma competência.

Users should be able to definir visibilidade do feedback.

Exemplo:

privado entre remetente e destinatário
visível para gestor
visível para RH
público para a empresa

Users should be able to ver feedbacks recebidos.

Users should be able to ver feedbacks enviados.

Gestores should be able to ver feedbacks dos seus liderados, respeitando as regras de visibilidade.

RH should be able to ver feedbacks relevantes da empresa, respeitando privacidade definida.

Users should be able to usar feedbacks como contexto durante uma avaliação.

10. PDI — Plano de Desenvolvimento Individual

Esse módulo transforma avaliação em ação.

PDI

Users should be able to criar um PDI para um colaborador.

Users should be able to vincular um PDI a um ciclo de avaliação.

Users should be able to definir objetivo de desenvolvimento.

Users should be able to vincular o PDI a uma competência.

Users should be able to adicionar ações práticas dentro do PDI.

Users should be able to definir prazo para cada ação.

Users should be able to definir responsável por cada ação.

Users should be able to atualizar status de uma ação do PDI.

Status possíveis:

não iniciado
em andamento
concluído
atrasado
cancelado

Users should be able to adicionar comentários de acompanhamento no PDI.

Users should be able to anexar evidências ou observações no PDI.

Users should be able to visualizar PDIs ativos, concluídos e atrasados.

Gestores should be able to acompanhar PDIs dos seus liderados.

Colaboradores should be able to acompanhar seus próprios PDIs.

RH should be able to ver todos os PDIs da empresa.

11. IA aplicada ao produto

Eu colocaria IA só onde ela gera valor direto.

Nada de IA genérica demais no começo.

IA para resumo de avaliação

Users with permission should be able to gerar um resumo inteligente da avaliação de um colaborador.

O resumo deve considerar:

notas
comentários
competências
autoavaliação
avaliação do gestor
feedbacks recentes

O sistema deveria gerar:

resumo geral
pontos fortes
pontos de melhoria
riscos percebidos
sugestão de conversa
IA para PDI

Users with permission should be able to gerar sugestões de PDI com IA.

A IA deveria sugerir:

objetivo de desenvolvimento
ações práticas
prazo recomendado
indicadores de acompanhamento
sugestão de conversa entre gestor e colaborador
IA para devolutiva

Gestores should be able to gerar um rascunho de devolutiva para conversar com o colaborador.

O rascunho deve vir em tom:

profissional
humano
claro
construtivo
sem linguagem agressiva

Essa seria uma das melhores features comerciais do produto.

12. Dashboard

O dashboard precisa ser útil para RH e gestores.

Dashboard geral

Users with permission should be able to ver total de colaboradores ativos.

Users with permission should be able to ver ciclos de avaliação ativos.

Users with permission should be able to ver quantidade de avaliações pendentes.

Users with permission should be able to ver taxa de conclusão do ciclo atual.

Users with permission should be able to ver média geral de desempenho da empresa.

Users with permission should be able to ver média de desempenho por departamento.

Users with permission should be able to ver competências com melhores notas.

Users with permission should be able to ver competências com piores notas.

Users with permission should be able to ver PDIs atrasados.

Users with permission should be able to ver colaboradores sem feedback recente.

Users with permission should be able to filtrar dashboard por ciclo, departamento, cargo e gestor.

13. Notificações

Notificação é importante para o produto não depender do usuário lembrar de tudo.

Notificações internas

Users should be able to receber notificação quando forem convidados para uma empresa.

Users should be able to receber notificação quando houver avaliação pendente.

Users should be able to receber notificação quando o prazo da avaliação estiver próximo.

Users should be able to receber notificação quando receberem feedback.

Users should be able to receber notificação quando um PDI for criado.

Users should be able to receber notificação quando uma ação do PDI estiver próxima do prazo.

Users should be able to marcar notificações como lidas.

14. Configurações da empresa
Configurações

Admins should be able to editar dados da empresa.

Admins should be able to configurar logo e informações básicas da empresa.

Admins should be able to gerenciar usuários e permissões.

Admins should be able to gerenciar departamentos.

Admins should be able to gerenciar cargos.

Admins should be able to configurar competências padrão da empresa.

Admins should be able to configurar modelos padrão de avaliação.

Admins should be able to configurar preferências de notificação.

15. Relatórios e exportações
Exportação

Users with permission should be able to exportar resultados de avaliação em PDF.

Users with permission should be able to exportar dados de ciclos em CSV.

Users with permission should be able to exportar lista de colaboradores em CSV.

Users with permission should be able to exportar relatório de PDI em CSV.

Users with permission should be able to gerar relatório individual de colaborador.

Users with permission should be able to gerar relatório geral do ciclo de avaliação.