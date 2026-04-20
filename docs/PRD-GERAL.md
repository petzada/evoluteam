PRD — SaaS de Gestão de Pessoas, Avaliação de Desempenho, Feedbacks e PDI
1. Visão geral do produto

Este produto é uma aplicação web B2B para empresas gerenciarem colaboradores, avaliações de desempenho, feedbacks contínuos, planos de desenvolvimento individual e indicadores básicos de gestão de pessoas.

A proposta do MVP é substituir planilhas, formulários soltos e processos manuais de RH por um sistema simples, organizado e multiusuário.

2. Objetivo do MVP

O MVP deve permitir que uma empresa consiga:

cadastrar sua estrutura organizacional;
cadastrar colaboradores;
criar ciclos de avaliação de desempenho;
coletar respostas de autoavaliação e avaliação do gestor;
visualizar resultados individuais;
registrar feedbacks contínuos;
criar PDIs para desenvolvimento dos colaboradores;
acompanhar indicadores básicos no dashboard.

A promessa principal do MVP:

Empresas devem conseguir avaliar o desempenho dos colaboradores, registrar feedbacks e transformar os resultados em planos de desenvolvimento sem depender de planilhas.

3. Público-alvo
ICP principal

Empresas pequenas e médias com 20 a 300 colaboradores que já têm alguma preocupação com gestão de pessoas, mas ainda fazem avaliações de desempenho de forma manual.

Usuários principais
Admin/RH

Pessoa responsável por configurar a empresa, cadastrar colaboradores, criar ciclos de avaliação e acompanhar resultados.

Gestor

Pessoa responsável por avaliar liderados, enviar feedbacks e acompanhar PDIs.

Colaborador

Pessoa que responde autoavaliações, recebe feedbacks e acompanha seu próprio PDI.

Diretoria/Visualizador

Pessoa que visualiza dashboards e relatórios, sem necessariamente operar o sistema.

4. Escopo macro do MVP

O MVP será dividido em 5 features principais:

Gestão de colaboradores e estrutura da empresa
Ciclos de avaliação de desempenho
Feedbacks contínuos
PDI — Plano de Desenvolvimento Individual
Dashboard básico de gestão de pessoas

Além dessas cinco features, o produto precisa de uma base obrigatória:

autenticação;
multiempresa;
permissões;
onboarding;
configurações básicas.
5. Escopo fora do MVP

Não entra no MVP 1.0:

OKRs avançados;
metas individuais complexas;
pesquisa de clima;
matriz 9-box;
sucessão;
trilhas de aprendizagem;
organograma visual;
integração com folha de pagamento;
integração com Slack, Teams ou Google Calendar;
app mobile nativo;
workflows complexos de aprovação;
múltiplos templates avançados de avaliação;
avaliação 360 completa com anonimato avançado;
IA avançada em todos os módulos.

Algumas dessas features podem entrar no MVP 1.5 ou 2.0.

6. Princípios do produto
6.1. Simplicidade primeiro

O produto deve ser fácil para uma empresa que atualmente usa planilha.

6.2. Fluxo antes de dashboard

O dashboard só deve exibir dados reais depois que os fluxos principais existirem.

Ordem correta:

empresa → colaboradores → avaliação → respostas → resultados → feedbacks → PDI → dashboard
6.3. Permissão desde o início

Todas as features devem respeitar os papéis do usuário.

6.4. Multiempresa desde o início

Todos os dados devem pertencer a uma empresa.

6.5. MVP não é miniatura malfeita

O MVP deve ser enxuto, mas funcional. A empresa precisa conseguir rodar um ciclo completo de avaliação.

7. Papéis e permissões
7.1. Admin/RH

Users should be able to:

criar e configurar a empresa;
convidar usuários;
cadastrar colaboradores;
criar departamentos;
criar cargos;
criar ciclos de avaliação;
criar formulários;
acompanhar progresso das avaliações;
visualizar resultados da empresa;
visualizar todos os colaboradores;
criar e acompanhar PDIs;
visualizar dashboards gerais;
gerenciar permissões.
7.2. Gestor

Users should be able to:

visualizar seus liderados;
responder avaliações dos liderados;
enviar feedbacks;
visualizar feedbacks permitidos dos liderados;
criar PDIs para liderados;
acompanhar PDIs dos liderados;
visualizar resultados dos liderados quando liberado.
7.3. Colaborador

Users should be able to:

visualizar seu próprio perfil;
responder autoavaliações;
visualizar avaliações pendentes;
visualizar feedbacks recebidos;
enviar feedbacks, se permitido;
visualizar seu próprio PDI;
atualizar ações do próprio PDI, se permitido.
7.4. Diretoria/Visualizador

Users should be able to:

visualizar dashboard consolidado;
visualizar relatórios gerais;
filtrar indicadores por departamento, ciclo e gestor;
não editar dados operacionais, salvo permissão específica.
8. Estrutura recomendada de desenvolvimento
Fase 0 — Fundação obrigatória

Antes das cinco features principais, desenvolver a base da aplicação.

Objetivo

Criar a estrutura segura para autenticação, empresa, usuários e permissões.

User stories

Users should be able to criar uma conta.

Users should be able to fazer login.

Users should be able to recuperar senha.

Users should be able to criar uma empresa no primeiro acesso.

Users should be able to entrar em uma empresa existente por convite.

Users should be able to ter um papel dentro da empresa.

Users should be able to acessar apenas dados da própria empresa.

Admins should be able to convidar novos usuários para a empresa.

Admins should be able to definir o papel de cada usuário.

Users should be able to editar seus dados básicos de perfil.

Users should be able to sair da conta.

Critérios de aceite
Usuário autenticado entra no app.
Usuário sem empresa vai para onboarding.
Usuário com empresa vai para dashboard.
Cada registro importante possui company_id.
Usuário não acessa dados de outra empresa.
Admin consegue convidar membros.
Papéis básicos funcionando: Admin/RH, Gestor, Colaborador e Visualizador.
Entidades principais
companies
users
company_members
invites
activity_logs
Rotas principais
/login
/signup
/forgot-password
/onboarding/criar-empresa
/convite/[token]
/dashboard
/configuracoes/usuarios