-- FT-4 — PDI: pg_cron notificação de ação próxima do prazo
-- Spec: docs/dev/05-ft-4-pdi.md §6
--
-- Requer a extensão pg_cron. No Supabase, habilite em:
-- Database > Extensions > pg_cron (schema "extensions").

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.notify_pdi_action_due() RETURNS void
LANGUAGE sql AS $$
  INSERT INTO notifications (company_id, user_id, type, title, body, link_url, entity_type, entity_id, created_at)
  SELECT
    p.company_id,
    e.user_id,
    'pdi_action_due',
    'Ação do PDI próxima do prazo',
    'A ação "' || a.title || '" vence em 7 dias.',
    '/pdi/' || a.plan_id::text,
    'development_plan',
    a.plan_id,
    now()
  FROM development_plan_actions a
  JOIN development_plans p ON p.id = a.plan_id
  JOIN employees e ON e.id = a.responsible_employee_id
  WHERE a.due_date = CURRENT_DATE + 7
    AND a.status NOT IN ('concluida', 'cancelada')
    AND p.deleted_at IS NULL
    AND p.status NOT IN ('concluido', 'cancelado')
    AND e.user_id IS NOT NULL
    AND e.status != 'terminated'
    AND e.company_id = p.company_id;
$$;

-- Agendamento idempotente do job diário 09h BRT (12h UTC).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'pdi-action-due-notifications') THEN
      PERFORM cron.unschedule('pdi-action-due-notifications');
    END IF;
    PERFORM cron.schedule(
      'pdi-action-due-notifications',
      '0 12 * * *',
      $cron$ SELECT public.notify_pdi_action_due(); $cron$
    );
  ELSE
    RAISE NOTICE 'pg_cron não está instalado; job pdi-action-due-notifications não agendado. Habilite a extensão e reexecute esta migration.';
  END IF;
END $$;
