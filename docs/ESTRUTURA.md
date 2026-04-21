16. Estrutura de rotas Next.js
/app
  /(auth)
    /login
    /signup
    /forgot-password

  /(onboarding)
    /criar-empresa
    /convite/[token]

  /(app)
    /dashboard

    /colaboradores
    /colaboradores/novo
    /colaboradores/[id]

    /avaliacoes
    /avaliacoes/nova
    /avaliacoes/[cycleId]
    /avaliacoes/[cycleId]/editar
    /avaliacoes/[cycleId]/responder/[assignmentId]
    /avaliacoes/[cycleId]/resultados
    /avaliacoes/[cycleId]/resultados/[employeeId]

    /feedbacks
    /feedbacks/novo

    /pdi
    /pdi/novo
    /pdi/[id]

    /configuracoes
    /configuracoes/empresa
    /configuracoes/usuarios
    /configuracoes/departamentos
    /configuracoes/cargos
    /configuracoes/competencias
17. Estrutura de banco de dados conceitual
17.1. Base
companies
users
company_members
invites
activity_logs
notifications
17.2. Organização
employees
departments
positions
competencies
17.3. Avaliações
review_cycles
review_cycle_participants
review_forms
review_questions
review_assignments
review_answers
review_results
17.4. Feedbacks
feedbacks
17.5. PDI
development_plans
development_plan_actions
development_plan_comments
17.6. IA futura
ai_generations
18. Ordem correta de desenvolvimento
Sprint 1 — Fundação do SaaS

Objetivo: deixar a aplicação segura e multiempresa.

Entregas:

autenticação;
criação de empresa;
convite de usuários;
papéis e permissões;
layout interno;
configurações básicas;
RLS/multi-tenant no banco.

Users should be able to criar conta, criar empresa, convidar usuários e acessar o app com permissões corretas.

Sprint 2 — Colaboradores, departamentos e cargos

Objetivo: criar a base organizacional.

Entregas:

CRUD de colaboradores;
departamentos;
cargos;
gestor direto;
perfil do colaborador;
filtros.

Users should be able to cadastrar colaboradores e organizar a estrutura da empresa.

Sprint 3 — Criação de ciclos de avaliação

Objetivo: permitir que o RH monte um ciclo.

Entregas:

criar ciclo;
salvar rascunho;
selecionar colaboradores;
criar formulário;
configurar autoavaliação e avaliação do gestor;
revisar ciclo.

Users should be able to criar um ciclo de avaliação pronto para publicação.

Sprint 4 — Publicação e respostas

Objetivo: transformar o ciclo em avaliações reais.

Entregas:

publicar ciclo;
gerar avaliações pendentes;
tela de resposta;
salvar rascunho;
enviar avaliação;
progresso do ciclo.

Users should be able to responder avaliações pendentes e RH should be able to acompanhar progresso.

Sprint 5 — Resultados

Objetivo: entregar valor analítico inicial.

Entregas:

cálculo de médias;
resultado individual;
média por competência;
comparação autoavaliação vs gestor;
comentários;
liberação/ocultação do resultado.

Users with permission should be able to visualizar resultados individuais de avaliação.

Sprint 6 — Feedbacks contínuos

Objetivo: criar histórico de feedback fora do ciclo formal.

Entregas:

enviar feedback;
listar recebidos;
listar enviados;
visibilidade;
vínculo com competência;
feedbacks no perfil do colaborador.

Users should be able to enviar e consultar feedbacks contínuos.

Sprint 7 — PDI

Objetivo: transformar avaliação em plano de ação.

Entregas:

criar PDI;
vincular PDI ao colaborador;
vincular PDI ao ciclo;
criar ações;
prazos;
responsáveis;
status;
comentários.

Users with permission should be able to criar e acompanhar planos de desenvolvimento individual.

Sprint 8 — Dashboard básico

Objetivo: consolidar dados do sistema em indicadores simples.

Entregas:

KPIs gerais;
avaliações pendentes;
taxa de conclusão;
média geral;
média por departamento;
PDIs atrasados;
colaboradores sem feedback recente.

Users with permission should be able to acompanhar indicadores básicos de gestão de pessoas.

Sprint 9 — Refinamentos e MVP 1.5

Objetivo: melhorar usabilidade e percepção de valor.

Possíveis entregas:

exportação CSV;
exportação PDF;
importação CSV de colaboradores;
IA para resumo de avaliação;
IA para sugestão de PDI;
IA para rascunho de devolutiva;
notificações por e-mail.
19. Fluxo principal do MVP
1. Admin cria conta
2. Admin cria empresa
3. Admin cadastra departamentos e cargos
4. Admin cadastra colaboradores
5. Admin define gestores diretos
6. Admin cria ciclo de avaliação
7. Admin cria formulário
8. Admin seleciona colaboradores avaliados
9. Admin publica ciclo
10. Sistema gera avaliações pendentes
11. Colaborador responde autoavaliação
12. Gestor responde avaliação do liderado
13. RH acompanha progresso
14. Sistema calcula resultados
15. RH/Gestor visualiza resultado individual
16. Gestor registra feedback
17. Gestor cria PDI
18. Colaborador acompanha ações do PDI
19. RH acompanha indicadores no dashboard
20. Regras de negócio essenciais
20.1. Empresa

Todo dado operacional deve pertencer a uma empresa.

company_id obrigatório em tabelas principais
20.2. Colaborador

Um colaborador pode existir sem usuário de login.

Exemplo: RH cadastra todos os colaboradores antes de convidar para acessar.

20.3. Gestor

Um colaborador pode ter um gestor direto.

O gestor deve conseguir visualizar apenas seus liderados.

20.4. Ciclo de avaliação

Um ciclo publicado não deve permitir edição livre de perguntas.

Permitido:

alterar prazo;
encerrar ciclo;
arquivar ciclo.

Não recomendado:

editar perguntas depois que já existem respostas.
20.5. Avaliação enviada

Depois de enviada, a avaliação não deve ser editada pelo usuário.

Somente RH pode reabrir, se essa feature entrar.

20.6. Resultado

Resultado individual só deve aparecer para colaborador quando RH ou gestor liberar.

20.7. Feedback

Feedback deve respeitar visibilidade.

20.8. PDI

PDI pode existir sem estar vinculado a um ciclo, mas no MVP o fluxo principal deve incentivar vínculo com avaliação.

21. Eventos importantes do sistema

Registrar em activity_logs:

empresa criada
usuário convidado
colaborador criado
colaborador atualizado
ciclo criado
ciclo publicado
avaliação enviada
resultado liberado
feedback enviado
PDI criado
ação de PDI concluída

24. Recomendações técnicas para Next.js
Stack recomendada
Next.js App Router
TypeScript
Tailwind CSS
shadcn/ui
Supabase Auth
Supabase Postgres
Supabase RLS
Zod
React Hook Form
TanStack Table
Recharts
Railway
Estrutura recomendada
/src
  /app
  /components
  /features
    /auth
    /company
    /employees
    /reviews
    /feedbacks
    /pdi
    /dashboard
    /settings
  /lib
    /supabase
    /permissions
    /validations
    /utils
  /server
    /actions
    /queries
Padrão de desenvolvimento

Separar cada domínio em:

schema
queries
actions
components
pages
permissions

Exemplo:

/features/reviews
  review.schema.ts
  review.queries.ts
  review.actions.ts
  review.permissions.ts
  components/
25. Prioridade final das features
Obrigatório para MVP 1.0
1. Auth, empresa e permissões
2. Colaboradores
3. Departamentos e cargos
4. Ciclos de avaliação
5. Formulários
6. Respostas
7. Resultados individuais
8. Feedbacks
9. PDI
10. Dashboard básico