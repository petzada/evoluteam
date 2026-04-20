# Migrations Supabase — Evoluteam

Arquivos SQL aplicados via **Supabase Dashboard → SQL Editor** na ordem numerada.
Nomes seguem o padrão `YYYYMMDD_NNNN_descricao.sql`.

## Fase 0
- `20260419_0001_init_fase_0.sql` — 9 tabelas operacionais (companies, profiles, departments, positions, competencies, employees, invites, notifications, activity_logs)
- `20260419_0002_rls_helpers.sql` — funções `public.my_company_id()` e `public.my_role()`
- `20260419_0003_rls_policies.sql` — políticas RLS para todas as tabelas

## Convenção
- Migrations são a fonte de verdade do schema. Aplicar **na ordem numerada**.
- Nunca editar uma migration já aplicada — criar nova com timestamp posterior.
- Para reset local de DB Supabase, usar Supabase CLI ou re-rodar manualmente em ordem.

## Próximas fases
- FT-1: `20260508_*` (deptos/cargos CRUD)
- FT-2: `20260510_*` (ciclos de avaliação)
- FT-3: `20260517_*` (feedbacks)
- FT-4: `20260601_*` (PDI + pg_cron)
