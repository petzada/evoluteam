Feature 4 — PDI — Plano de Desenvolvimento Individual
12.1. Objetivo

Transformar avaliação e feedback em ações práticas de desenvolvimento.

O PDI é onde o produto deixa de ser apenas uma ferramenta de nota e vira uma ferramenta de evolução profissional.

12.2. Escopo do MVP

Entra no MVP:

criar PDI;
vincular PDI a colaborador;
vincular PDI a ciclo de avaliação;
vincular PDI a competência;
criar ações dentro do PDI;
definir prazo;
definir responsável;
atualizar status;
adicionar comentários;
acompanhar PDIs ativos e atrasados.

Não entra no MVP 1.0:

biblioteca de cursos;
trilhas automáticas;
integração com LMS;
aprovação formal do PDI;
assinatura eletrônica;
anexos complexos;
check-ins recorrentes automáticos.
12.3. Status do PDI
nao_iniciado
em_andamento
concluido
atrasado
cancelado
12.4. Status das ações
pendente
em_andamento
concluida
atrasada
cancelada
12.5. User stories

Users with permission should be able to criar um PDI para um colaborador.

Users with permission should be able to vincular um PDI a um ciclo de avaliação.

Users with permission should be able to vincular um PDI a uma competência.

Users with permission should be able to definir objetivo do PDI.

Users with permission should be able to definir descrição do PDI.

Users with permission should be able to adicionar ações ao PDI.

Users with permission should be able to definir prazo para cada ação.

Users with permission should be able to definir responsável por cada ação.

Users with permission should be able to alterar status de uma ação.

Users with permission should be able to adicionar comentários de acompanhamento.

Users with permission should be able to visualizar PDIs ativos.

Users with permission should be able to visualizar PDIs concluídos.

Users with permission should be able to visualizar PDIs atrasados.

Gestores should be able to acompanhar PDIs dos seus liderados.

Colaboradores should be able to acompanhar seus próprios PDIs.

RH should be able to acompanhar todos os PDIs da empresa.

12.6. Critérios de aceite
Gestor ou RH consegue criar PDI.
PDI pode ser vinculado a uma avaliação.
PDI pode ter uma ou mais ações.
Cada ação possui prazo e responsável.
Status das ações pode ser atualizado.
Sistema identifica ações atrasadas.
Colaborador visualiza seu próprio PDI.
Gestor visualiza PDIs dos liderados.
RH visualiza todos os PDIs.
12.7. Entidades principais
development_plans
development_plan_actions
development_plan_comments
12.8. Rotas principais
/pdi
/pdi/novo
/pdi/[id]
/colaboradores/[id]/pdi