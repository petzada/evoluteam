-- Remove o webhook Postgres -> /api/webhooks/auth-user-created.
-- Motivacao: cadeia fragil (trigger + pg_net + rota publica + HMAC + configs DB)
-- quebrava a cada ajuste de proxy/rotas. Novo fluxo: admin e criado no painel
-- Supabase sem envio de email; ao logar, o gate em src/app/(app)/layout.tsx
-- redireciona para /onboarding/criar-empresa, que provisiona companies +
-- profiles(admin_rh) + employees.
--
-- Pos-deploy manual: remover SUPABASE_WEBHOOK_SECRET das env vars do Railway.
--
-- Nao ha necessidade de rodar `alter database postgres reset app.webhook_*` no
-- SQL Editor do Supabase. No Supabase hospedado, o role `postgres` do SQL
-- Editor nao tem permissao para ALTER DATABASE (erro 42501). Como a funcao
-- notify_auth_user_created() nao existe mais, esses parametros viram orfaos
-- que nenhum codigo le — inofensivos, podem ficar.

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.notify_auth_user_created();
