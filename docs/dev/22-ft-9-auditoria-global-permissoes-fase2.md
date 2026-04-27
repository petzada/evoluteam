# FT-9 - Auditoria Global de Permissões (Fase 2)

Data: 2026-04-27

## Escopo auditado
- Camada de helpers/perfil de ator: `canDo` + permissões por módulo.
- Camada de UI/guards: páginas principais de Dashboard, Colaboradores, Avaliações, Feedbacks, PDI, Recrutamento e Configurações.
- Camada de server actions: fluxos de escrita/edição por módulo.
- Camada de dados (RLS): policies do baseline + migration incremental aplicada nesta entrega.

## Regra esperada x regra atual x correção aplicada

| Severidade | Módulo | Regra esperada | Regra atual encontrada | Correção aplicada |
|---|---|---|---|---|
| crítica | PDI (server action) | Comentário em PDI só dentro do escopo de visibilidade do ator. | `addComment` usava client admin e não validava escopo de comentário antes do insert. | Validação de escopo adicionada em `addComment` com `canCommentOnPdi` + ancestrais reais (`get_employee_ancestors`). |
| alta | Feedbacks (RLS) | Diretor deve ler `visivel_para_rh` no banco, sem depender de toggle em JSON. | Policy `feedbacks_select` aceitava `admin_rh` ou `has_screen_permission('feedbacks','view')`; diretor podia falhar no branch de RLS. | Branch de leitura `visivel_para_rh` passou a incluir `my_role() IN ('admin_rh','director')` em migration nova e no baseline. |
| alta | Feedbacks (UI) | Perfis com leitura global devem ter visão empresarial de feedbacks, independente de liderados. | Página dependia do tab "Minha equipe" e de ter descendentes. | Novo recorte/tab "Empresa" e query de escopo empresarial para quem tem `feedbacks.view`. |
| alta | PDI (fluxo de criação) | Auto-PDI não deve exigir gestor direto. | Criação de PDI bloqueava alvo sem `manager_id`. | Remoção da exigência de `manager_id` no `createPdi` e alinhamento dos CTAs de criação nas entradas principais. |

## Resultado da varredura por módulo
- Dashboard: sem divergência crítica/alta após conferência de guards + helper `canAccessDashboard`.
- Colaboradores: sem divergência crítica/alta encontrada nos guards e ações.
- Avaliações: sem divergência crítica/alta encontrada nos guards e ações.
- Feedbacks: divergências corrigidas (UI + RLS).
- PDI: divergências corrigidas (criação sem gestor + comentário em escopo).
- Recrutamento: sem divergência crítica/alta de permissão no fluxo principal após revisão de guards e helpers.
- Configurações: sem divergência crítica/alta nos guards por tela.

## Backlog (médias)
- Nenhuma divergência média adicional foi aberta nesta rodada.

## Validação executada
- `pnpm exec tsc --noEmit` ✅
- `pnpm vitest run src/features/pdi/permissions.test.ts src/features/feedbacks/permissions.test.ts src/features/recruitment/permissions.test.ts src/features/permissions/permissions.test.ts` ✅
- `pnpm vitest run src/features/permissions/permissions.test.ts src/features/dashboard/permissions.test.ts src/features/employees/permissions.test.ts src/features/reviews/permissions.test.ts src/features/recruitment/permissions.test.ts` ✅
