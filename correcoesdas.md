# Auditoria FT-9 RBAC: Correções Pendentes

## Resumo
A implementação atual está parcialmente alinhada com `permissoes.md` e com a spec FT-9: `canDo` já trata `admin_rh`, bloqueia `director` em Configurações, a sidebar de hiring manager foi implementada, e as migrations `0005`/`0006` cobrem empresa e SELECT básico de recrutamento.

Mas encontrei divergências funcionais importantes, principalmente em `Gerenciar acesso`/convites e em RLS de SELECT. Os testes unitários passam, mas ainda não cobrem esses cenários.

## Achados Prioritários
- **P0: usuário com `colaboradores.edit` consegue conceder permissões indevidas em convite.**  
  Em [colaboradores/page.tsx](C:/Users/MARCIO.PETIGROSSO/Desktop/evoluteam/src/app/(app)/colaboradores/page.tsx:73), `isAdmin` significa “pode editar colaboradores”, mas [EmployeeSheet.tsx](C:/Users/MARCIO.PETIGROSSO/Desktop/evoluteam/src/features/employees/components/EmployeeSheet.tsx:115) trata isso como admin real e deixa roles/toggles amplos. O servidor grava `input.screenPermissions` no convite sem validar subset em [actions.ts](C:/Users/MARCIO.PETIGROSSO/Desktop/evoluteam/src/features/employees/actions.ts:185). Isso permite escalar um novo `user` com toggles que o convidante não possui.

- **P1: drawer “Gerenciar acesso” desabilita toggles de forma incompleta.**  
  [AccessForm.tsx](C:/Users/MARCIO.PETIGROSSO/Desktop/evoluteam/src/features/permissions/components/AccessForm.tsx:57) só percorre chaves presentes em `actorScreenPermissions`; como o JSON é compacto, permissões ausentes ficam habilitadas na UI. A action bloqueia depois via [canGrantScreenPermissions](C:/Users/MARCIO.PETIGROSSO/Desktop/evoluteam/src/features/permissions/permissions.ts:72), mas a interface fica desalinhada.

- **P1: `dashboard.view` não funciona na página `/dashboard`.**  
  [dashboard/page.tsx](C:/Users/MARCIO.PETIGROSSO/Desktop/evoluteam/src/app/(app)/dashboard/page.tsx:74) monta o actor sem `loadActorGate`, então `canAccessDashboard` não recebe `screenPermissions`. Resultado: usuário com toggle `dashboard.view` continua caindo na “Minha Área”.

- **P1: recrutamento permite acesso por URL para qualquer `user` com employeeId, não apenas hiring manager/toggle.**  
  [recruitment/permissions.ts](C:/Users/MARCIO.PETIGROSSO/Desktop/evoluteam/src/features/recruitment/permissions.ts:32), [vagas/page.tsx](C:/Users/MARCIO.PETIGROSSO/Desktop/evoluteam/src/app/(app)/recrutamento/vagas/page.tsx:35) e [candidatos/page.tsx](C:/Users/MARCIO.PETIGROSSO/Desktop/evoluteam/src/app/(app)/recrutamento/candidatos/page.tsx:34) tratam qualquer colaborador com `employeeId` como “assigned”. A sidebar já calcula `isHiringManager` de verdade em [layout.tsx](C:/Users/MARCIO.PETIGROSSO/Desktop/evoluteam/src/app/(app)/layout.tsx:34), mas as páginas ainda não usam esse fato.

- **P1: `recrutamento_relatorios.view` não garante visão de relatórios da empresa.**  
  [relatorios/page.tsx](C:/Users/MARCIO.PETIGROSSO/Desktop/evoluteam/src/app/(app)/recrutamento/relatorios/page.tsx:79) só trata como escopo global quem é `director` ou tem `recrutamento_candidatos.edit`; um usuário com apenas `recrutamento_relatorios.view` vira `gestor` e vê métricas filtradas às próprias vagas, ou zeros.

- **P1: RLS de SELECT ainda não acompanha todos os toggles `*.view`.**  
  PDI não tem branch `has_screen_permission('pdi','view')` nas policies de leitura em [20260601_0004_ft4_pdi_rls.sql](C:/Users/MARCIO.PETIGROSSO/Desktop/evoluteam/supabase/migrations/20260601_0004_ft4_pdi_rls.sql:13). Avaliações têm SELECTs amplos para ciclos/forms/questions, mas assignments/answers não aceitam `avaliacoes.view` em [20260503_0002_ft2_rls.sql](C:/Users/MARCIO.PETIGROSSO/Desktop/evoluteam/supabase/migrations/20260503_0002_ft2_rls.sql:46) e [20260503_0003_ft2_rls_fix_director.sql](C:/Users/MARCIO.PETIGROSSO/Desktop/evoluteam/supabase/migrations/20260503_0003_ft2_rls_fix_director.sql:6). Scorecards/tasks de recrutamento também não aceitam `recrutamento_candidatos.view` em [20260715_0001_ft7_onda3_scorecards_tasks.sql](C:/Users/MARCIO.PETIGROSSO/Desktop/evoluteam/supabase/migrations/20260715_0001_ft7_onda3_scorecards_tasks.sql:87).

- **P1: RLS de `employees_select` é mais permissiva que `permissoes.md`.**  
  [20260419_0003_rls_policies.sql](C:/Users/MARCIO.PETIGROSSO/Desktop/evoluteam/supabase/migrations/20260419_0003_rls_policies.sql:46) libera todos os colaboradores da empresa para qualquer usuário autenticado do tenant. A UI filtra, mas a garantia de isolamento não está no banco.

## Plano de Correção
- Separar claramente `actorIsAdmin` de `canManageEmployees` no fluxo de colaboradores. `EmployeeSheet` deve receber role real + `actorScreenPermissions`; usuários não-admin com `colaboradores.edit` só podem criar/convidar `user` e só conceder subset dos próprios toggles.
- Reutilizar `ALL_SCREEN_PERMISSION_KEYS` para montar `disabledPermissionKeys` no `AccessForm` e no `EmployeeSheet`. Chave ausente no JSON deve ser tratada como `false`.
- Validar no servidor, em `createEmployee`, que `screenPermissionsSnapshot` passa em `canGrantScreenPermissions` quando o ator não é `admin_rh`. Normalizar também a regra `edit => view` antes de gravar convite ou `user_screen_permissions`.
- Carregar `loadActorGate` em `/dashboard` e passar `screenPermissions` para `canAccessDashboard` e `canFilterByDepartment`.
- Refatorar permissões de recrutamento para receber uma flag concreta `isHiringManager`, calculada por query, em vez de usar apenas `!!employeeId`. Aplicar isso no layout e nas páginas de Vagas, Candidatos e Relatórios.
- Ajustar escopo de relatórios: `director`, `admin_rh` e usuário com `recrutamento_relatorios.view` devem ver empresa inteira; hiring manager sem toggle fica restrito às próprias vagas.
- Criar nova migration FT-9 para alinhar RLS SELECT:
  - `pdi.view` em `development_plans`, `development_plan_actions`, `development_plan_comments`;
  - `avaliacoes.view` em `review_assignments` e `review_answers`, e revisar SELECT amplo de ciclos/forms/questions;
  - `recrutamento_candidatos.view` em `candidate_scorecards` e `candidate_tasks`;
  - `colaboradores.view`/baseline hierárquico em `employees_select`, para reduzir leitura direta fora de escopo.
- Ao escrever novas policies, seguir a recomendação Supabase de performance: preferir helper calls em subselect, como `(select public.my_company_id())`, `(select public.my_employee_id())` e `(select public.has_screen_permission(...))`, especialmente em policies com scans.

## Testes e Aceite
- Adicionar testes unitários para:
  - `createEmployee` recusando toggles fora do subset do ator não-admin;
  - `AccessForm`/`EmployeeSheet` desabilitando chaves ausentes;
  - `dashboard.view` liberando dashboard agregado;
  - user comum sem vaga/toggle bloqueado em `/recrutamento/*`;
  - `recrutamento_relatorios.view` usando escopo global.
- Adicionar testes SQL/RLS ou fixtures documentadas para:
  - user comum não ler todos os `employees`;
  - user com `pdi.view` ler PDIs globais;
  - user com `avaliacoes.view` ler assignments/answers globais;
  - user com `recrutamento_candidatos.view` ler scorecards/tasks.
- Verificação atual:
  - `pnpm test:run`: passou, 20 arquivos e 273 testes.
  - `pnpm exec tsc --noEmit`: passou.
  - `pnpm lint`: falhou fora do núcleo RBAC por `.claude/skills/.../server.cjs` e por `RecruitmentStagesManager.tsx:44`.

## Assumptions
- `admin_rh` continua sendo o único papel com concessão irrestrita.
- Usuário com toggle `*.view` deve ter acesso global de leitura à tela correspondente, salvo exceções explícitas de privacidade, como feedback `privado`.
- Hiring manager sem toggle só vê recrutamento das próprias vagas e nunca acessa `recrutamento_etapas`.
- A RLS deve ser a fonte final de isolamento; filtros de UI/server não devem ser a única barreira contra vazamento.
