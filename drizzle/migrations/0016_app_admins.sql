-- App admins: only the service role can manage this list.
-- Authenticated clients cannot read or write it (admin checks happen server-side).
CREATE TABLE IF NOT EXISTS public.app_admins (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  note text
);

REVOKE ALL ON public.app_admins FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.app_admins TO service_role;
ALTER TABLE public.app_admins ENABLE ROW LEVEL SECURITY;
-- No policies for anon/authenticated → no direct client access.

-- Seed the primary admin (REVR). Safe to re-run.
INSERT INTO public.app_admins (user_id, note)
VALUES ('eb454a4f-4560-48b6-8bc0-34a2778fb4dd', 'Founder')
ON CONFLICT (user_id) DO NOTHING;
