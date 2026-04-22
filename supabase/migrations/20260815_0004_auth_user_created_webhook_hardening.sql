-- Hardening do webhook de auth.users para evitar rollback no create/invite user
-- quando a chamada HTTP falhar.

create extension if not exists pg_net with schema extensions;

create or replace function public.notify_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  webhook_url text := nullif(current_setting('app.webhook_auth_user_created_url', true), '');
  webhook_secret text := nullif(current_setting('app.webhook_secret', true), '');
  payload jsonb;
  signature text;
  request_headers jsonb;
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

  -- Nao deixar falha de webhook abortar criacao de usuario no auth.users.
  begin
    signature := encode(
      extensions.hmac(payload::text, webhook_secret, 'sha256'),
      'hex'
    );

    request_headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Webhook-Signature', signature
    );

    if to_regprocedure('net.http_post(text,jsonb,jsonb,jsonb,integer)') is not null then
      perform net.http_post(
        url := webhook_url,
        body := payload,
        params := '{}'::jsonb,
        headers := request_headers,
        timeout_milliseconds := 5000
      );
    elsif to_regprocedure('extensions.http_post(text,jsonb,jsonb,jsonb,integer)') is not null then
      perform extensions.http_post(
        url := webhook_url,
        body := payload,
        params := '{}'::jsonb,
        headers := request_headers,
        timeout_milliseconds := 5000
      );
    elsif to_regprocedure('net.http_post(text,jsonb,jsonb)') is not null then
      perform net.http_post(
        url := webhook_url,
        body := payload,
        headers := request_headers
      );
    elsif to_regprocedure('extensions.http_post(text,jsonb,jsonb)') is not null then
      perform extensions.http_post(
        url := webhook_url,
        body := payload,
        headers := request_headers
      );
    else
      raise warning
        'notify_auth_user_created: no http_post function found; webhook skipped (user_id=%)',
        NEW.id;
    end if;
  exception
    when others then
      raise warning
        'notify_auth_user_created: webhook call failed and was ignored (user_id=%, sqlstate=%, error=%)',
        NEW.id, SQLSTATE, SQLERRM;
  end;

  return NEW;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.notify_auth_user_created();
