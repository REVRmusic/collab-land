-- Index to accelerate querying pending notifications for daily email digests
CREATE INDEX IF NOT EXISTS notifications_emailed_pending_idx
  ON public.notifications (user_id, created_at DESC)
  WHERE emailed = false;
