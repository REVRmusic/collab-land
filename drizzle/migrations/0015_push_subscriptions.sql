-- Push notification subscriptions (Web Push / PWA)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT push_subscriptions_endpoint_unique UNIQUE (endpoint)
);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx ON public.push_subscriptions(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push subs own" ON public.push_subscriptions;
CREATE POLICY "push subs own" ON public.push_subscriptions
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Track which in-app notifications were already pushed to devices
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS push_sent_at timestamptz;

CREATE INDEX IF NOT EXISTS notifications_push_pending_idx
  ON public.notifications (created_at)
  WHERE push_sent_at IS NULL;

-- Optional near-realtime dispatch via pg_net (no-op if extension / settings missing)
CREATE OR REPLACE FUNCTION public.dispatch_notification_push()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'net'
AS $$
DECLARE
  dispatch_url text := current_setting('app.settings.push_dispatch_url', true);
  dispatch_secret text := current_setting('app.settings.push_dispatch_secret', true);
BEGIN
  IF dispatch_url IS NULL OR length(trim(dispatch_url)) = 0 THEN
    dispatch_url := 'https://collab-land.lovable.app/api/push/dispatch';
  END IF;
  IF dispatch_secret IS NULL OR length(trim(dispatch_secret)) = 0 THEN
    RETURN NEW;
  END IF;
  BEGIN
    PERFORM net.http_post(
      url := dispatch_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || dispatch_secret
      ),
      body := jsonb_build_object('notification_id', NEW.id)
    );
  EXCEPTION WHEN OTHERS THEN
    NULL; -- never block the notification insert
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notifications_push_dispatch ON public.notifications;
CREATE TRIGGER notifications_push_dispatch
AFTER INSERT ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.dispatch_notification_push();
