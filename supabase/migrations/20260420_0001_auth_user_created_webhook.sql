-- Webhook: dispara POST para o app quando um novo user nasce em auth.users.
-- O app branchia via app_metadata.source: 'invite' -> ignora; ausente -> envia boas-vindas.
-- Config de runtime (faz UMA vez por ambiente, via SQL Editor):
--   alter database postgres set app.webhook_secret = '<hex>';
--   alter database postgres set app.webhook_auth_user_created_url = 'https://<host>/api/webhooks/auth-user-created';
-- Enquanto URL/secret não configurados, o trigger é no-op (dev local).

create extension if not exists pg_net with schema extensions;

create or replace function public.notify_auth_user_created()
returns trigger language plpgsql security definer as $$
declare
  webhook_url text := nullif(current_setting('app.webhook_auth_user_created_url', true), '');
  webhook_secret text := nullif(current_setting('app.webhook_secret', true), '');
  payload jsonb;
  signature text;
begin
  if webhook_url is null or webhook_secret is null then
    return NEW;
  end if;

  payload := jsonb_build_object(
    'type', 'INSERT',
    'table', 'users',
    'schema', 'auth',
    'record', jsonb_build_object(
      'id', NEW.id,
      'email', NEW.email,
      'raw_app_meta_data', NEW.raw_app_meta_data,
      'created_at', NEW.created_at
    )
  );

  signature := encode(
    extensions.hmac(payload::text, webhook_secret, 'sha256'),
    'hex'
  );

  perform extensions.http_post(
    url := webhook_url,
    body := payload,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Webhook-Signature', signature
    )
  );
  return NEW;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.notify_auth_user_created();
