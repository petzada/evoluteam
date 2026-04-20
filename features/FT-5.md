Feature 5 — Dashboard básico de gestão de pessoas
13.1. Objetivo

Permitir que RH, gestores e diretoria acompanhem indicadores básicos de colaboradores, avaliações, feedbacks e PDIs.

13.2. Escopo do MVP

Entra no MVP:

total de colaboradores ativos;
ciclos ativos;
avaliações pendentes;
avaliações concluídas;
taxa de conclusão do ciclo;
média geral de desempenho;
média por departamento;
PDIs ativos;
PDIs atrasados;
colaboradores sem avaliação concluída;
colaboradores sem feedback recente.

Não entra no MVP 1.0:

people analytics avançado;
previsões;
risco de turnover;
matriz 9-box;
comparação histórica avançada;
segmentações complexas;
dashboards customizáveis.
13.3. User stories

Users with permission should be able to visualizar total de colaboradores ativos.

Users with permission should be able to visualizar ciclos de avaliação ativos.

Users with permission should be able to visualizar avaliações pendentes.

Users with permission should be able to visualizar avaliações concluídas.

Users with permission should be able to visualizar taxa de conclusão do ciclo atual.

Users with permission should be able to visualizar média geral de desempenho.

Users with permission should be able to visualizar média de desempenho por departamento.

Users with permission should be able to visualizar competências com melhor desempenho.

Users with permission should be able to visualizar competências com pior desempenho.

Users with permission should be able to visualizar PDIs ativos.

Users with permission should be able to visualizar PDIs atrasados.

Users with permission should be able to visualizar colaboradores sem feedback recente.

Users with permission should be able to filtrar dashboard por ciclo.

Users with permission should be able to filtrar dashboard por departamento.

Gestores should be able to visualizar indicadores apenas dos seus liderados.

RH should be able to visualizar indicadores da empresa inteira.

13.4. Critérios de aceite
Dashboard carrega dados reais.
Admin/RH vê indicadores da empresa inteira.
Gestor vê apenas dados dos liderados.
Colaborador não acessa dashboard geral.
Indicadores respeitam filtros.
Dados de avaliação são calculados corretamente.
PDIs atrasados aparecem no painel.
13.5. Entidades consultadas
employees
review_cycles
review_assignments
review_results
feedbacks
development_plans
development_plan_actions
13.6. Rotas principais
/dashboard
/dashboard/avaliacoes
/dashboard/pdi
/dashboard/desempenho