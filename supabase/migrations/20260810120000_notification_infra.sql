CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  home_id uuid NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  device_name text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS push_subscriptions_user_home_endpoint_key
  ON public.push_subscriptions (user_id, home_id, endpoint);

CREATE INDEX IF NOT EXISTS push_subscriptions_active_lookup_idx
  ON public.push_subscriptions (home_id, user_id)
  WHERE revoked_at IS NULL;

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_subscriptions select own" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions select own" ON public.push_subscriptions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "push_subscriptions insert own" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions insert own" ON public.push_subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "push_subscriptions update own" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions update own" ON public.push_subscriptions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "push_subscriptions delete own" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions delete own" ON public.push_subscriptions
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.notification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dedupe_key text NOT NULL UNIQUE,
  home_id uuid NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
  source_type text NOT NULL,
  source_id uuid NOT NULL,
  recipient_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.push_subscriptions(id) ON DELETE SET NULL,
  scheduled_for timestamptz NOT NULL,
  sent_at timestamptz,
  status text NOT NULL DEFAULT 'queued',
  error text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  attempt_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notification_deliveries_status_scheduled_idx
  ON public.notification_deliveries (status, scheduled_for);

CREATE INDEX IF NOT EXISTS notification_deliveries_home_status_idx
  ON public.notification_deliveries (home_id, status);

CREATE INDEX IF NOT EXISTS notification_deliveries_recipient_status_idx
  ON public.notification_deliveries (recipient_user_id, status);

ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_deliveries select own" ON public.notification_deliveries;
CREATE POLICY "notification_deliveries select own" ON public.notification_deliveries
  FOR SELECT TO authenticated
  USING (recipient_user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.list_due_event_reminders(_limit integer DEFAULT 200)
RETURNS TABLE (
  source_type text,
  source_id uuid,
  home_id uuid,
  recipient_user_id uuid,
  scheduled_for timestamptz,
  title text,
  body text,
  payload jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH due_events AS (
    SELECT
      e.id,
      e.home_id,
      e.title,
      e.start_at,
      e.reminder_minutes,
      e.assigned_to,
      e.created_by,
      e.visibility,
      e.category,
      (e.start_at - make_interval(mins => e.reminder_minutes)) AS scheduled_for
    FROM public.events e
    WHERE e.status = 'pending'
      AND e.reminder_minutes IS NOT NULL
      AND (e.start_at - make_interval(mins => e.reminder_minutes)) <= now()
    ORDER BY scheduled_for ASC, e.start_at ASC
    LIMIT _limit
  ),
  fanout AS (
    SELECT
      'event'::text AS source_type,
      de.id AS source_id,
      de.home_id,
      COALESCE(
        de.assigned_to,
        CASE
          WHEN de.visibility = 'shared' THEN hm.user_id
          ELSE de.created_by
        END
      ) AS recipient_user_id,
      de.scheduled_for,
      de.title,
      CASE
        WHEN de.reminder_minutes = 0 THEN 'O compromisso começa agora.'
        ELSE format('Lembrete do compromisso em %s minutos.', de.reminder_minutes)
      END AS body,
      jsonb_build_object(
        'event_id', de.id,
        'home_id', de.home_id,
        'title', de.title,
        'start_at', de.start_at,
        'reminder_minutes', de.reminder_minutes,
        'visibility', de.visibility,
        'category', de.category
      ) AS payload
    FROM due_events de
    LEFT JOIN public.home_members hm
      ON hm.home_id = de.home_id
     AND de.assigned_to IS NULL
     AND de.visibility = 'shared'
  )
  SELECT source_type, source_id, home_id, recipient_user_id, scheduled_for, title, body, payload
  FROM fanout
  WHERE recipient_user_id IS NOT NULL
  ORDER BY scheduled_for ASC, source_id ASC, recipient_user_id ASC;
$function$;