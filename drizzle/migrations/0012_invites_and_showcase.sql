-- Showcase: projects visible on a public artist page
ALTER TABLE public.projects
ADD COLUMN showcase boolean NOT NULL DEFAULT false;

CREATE POLICY "projects showcase read" ON public.projects
FOR SELECT TO anon, authenticated
USING (showcase = true);

CREATE POLICY "versions showcase read" ON public.project_versions
FOR SELECT TO anon, authenticated
USING (EXISTS (
  SELECT 1 FROM public.projects p
  WHERE p.id = project_id AND p.showcase = true
));

-- Public profile fields for anonymous visitors
GRANT SELECT (id, username, display_name, avatar_url, bio, created_at) ON public.profiles TO anon;
CREATE POLICY "profiles public read" ON public.profiles
FOR SELECT TO anon
USING (true);

-- Media readable for showcase demos + avatars (signed URLs)
CREATE OR REPLACE FUNCTION public.is_showcase_media(_bucket text, _name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    _bucket = 'avatars'
    OR (
      _bucket = 'covers'
      AND EXISTS (SELECT 1 FROM public.projects p WHERE p.cover_url = _name AND p.showcase)
    )
    OR (
      _bucket = 'audio'
      AND EXISTS (
        SELECT 1
        FROM public.project_versions v
        JOIN public.projects p ON p.id = v.project_id
        WHERE v.audio_url = _name AND p.showcase
      )
    );
$$;

CREATE OR REPLACE FUNCTION public.can_read_media(_bucket text, _name text, _uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT _uid IS NOT NULL AND (
    split_part(_name, '/', 1) = _uid::text
    OR _bucket = 'avatars'
    OR (_bucket = 'covers' AND (
      EXISTS (SELECT 1 FROM projects p WHERE p.cover_url = _name AND (can_view_project(p.id, _uid) OR p.showcase))
      OR EXISTS (SELECT 1 FROM covers c WHERE c.image_url = _name AND can_view_project(c.project_id, _uid))))
    OR (_bucket = 'audio' AND (
      EXISTS (
        SELECT 1 FROM project_versions v
        JOIN projects p ON p.id = v.project_id
        WHERE v.audio_url = _name AND (can_view_project(p.id, _uid) OR p.showcase)
      )
      OR EXISTS (SELECT 1 FROM messages m WHERE m.audio_url = _name AND can_view_project(m.project_id, _uid))))
  );
$$;

DROP POLICY IF EXISTS "media read" ON storage.objects;
CREATE POLICY "media read" ON storage.objects
FOR SELECT TO authenticated, anon
USING (
  bucket_id IN ('avatars', 'covers', 'audio')
  AND (
    (auth.uid() IS NOT NULL AND public.can_read_media(bucket_id, name, auth.uid()))
    OR public.is_showcase_media(bucket_id, name)
  )
);

REVOKE ALL ON FUNCTION public.is_showcase_media(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_showcase_media(text, text) TO anon, authenticated;

-- Invite links (join as collaborator without being friends)
CREATE TABLE public.project_invites (
  project_id uuid PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(18), 'hex'),
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

GRANT SELECT, INSERT, UPDATE ON public.project_invites TO authenticated;
GRANT ALL ON public.project_invites TO service_role;
ALTER TABLE public.project_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invites owner manage" ON public.project_invites
FOR ALL TO authenticated
USING (public.is_project_owner(project_id, auth.uid()))
WITH CHECK (public.is_project_owner(project_id, auth.uid()) AND created_by = auth.uid());

CREATE OR REPLACE FUNCTION public.get_or_create_project_invite(_project_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  uid uuid := auth.uid();
  t text;
BEGIN
  IF uid IS NULL OR NOT public.is_project_owner(_project_id, uid) THEN
    RAISE EXCEPTION 'Non autorisé';
  END IF;
  SELECT token INTO t
  FROM public.project_invites
  WHERE project_id = _project_id AND revoked_at IS NULL;
  IF t IS NOT NULL THEN
    RETURN t;
  END IF;
  INSERT INTO public.project_invites(project_id, created_by)
  VALUES (_project_id, uid)
  ON CONFLICT (project_id) DO UPDATE
    SET token = encode(gen_random_bytes(18), 'hex'),
        revoked_at = NULL,
        created_by = uid,
        created_at = now()
  RETURNING token INTO t;
  RETURN t;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_project_invite(_project_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL OR NOT public.is_project_owner(_project_id, uid) THEN
    RAISE EXCEPTION 'Non autorisé';
  END IF;
  UPDATE public.project_invites
  SET revoked_at = now()
  WHERE project_id = _project_id AND revoked_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_project_invite(_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  uid uuid := auth.uid();
  pid uuid;
  owner uuid;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Connecte-toi pour rejoindre le projet';
  END IF;
  IF _token IS NULL OR length(trim(_token)) < 16 THEN
    RAISE EXCEPTION 'Lien d''invitation invalide';
  END IF;
  SELECT project_id, created_by INTO pid, owner
  FROM public.project_invites
  WHERE token = trim(_token) AND revoked_at IS NULL;
  IF pid IS NULL THEN
    RAISE EXCEPTION 'Lien d''invitation invalide ou révoqué';
  END IF;
  IF owner <> uid THEN
    INSERT INTO public.project_members(project_id, user_id)
    VALUES (pid, uid)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN pid;
END;
$$;

REVOKE ALL ON FUNCTION public.get_or_create_project_invite(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.revoke_project_invite(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.accept_project_invite(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_or_create_project_invite(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_project_invite(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_project_invite(text) TO authenticated;
