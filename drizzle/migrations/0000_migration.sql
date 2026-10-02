
-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  username text NOT NULL UNIQUE,
  display_name text,
  avatar_url text,
  bio text,
  email text,
  email_digest boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles insert own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE base text; candidate text; n int := 0;
BEGIN
  base := lower(regexp_replace(coalesce(NEW.raw_user_meta_data->>'username', split_part(NEW.email,'@',1), 'producer'), '[^a-zA-Z0-9_]', '', 'g'));
  IF length(base) < 3 THEN base := 'producer'; END IF;
  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = candidate) LOOP
    n := n + 1; candidate := base || n::text;
  END LOOP;
  INSERT INTO public.profiles (id, username, display_name, avatar_url, email)
  VALUES (NEW.id, candidate, coalesce(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', candidate), NEW.raw_user_meta_data->>'avatar_url', NEW.email);
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- FRIENDSHIPS
CREATE TABLE public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (requester_id, addressee_id),
  CHECK (requester_id <> addressee_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.friendships TO authenticated;
GRANT ALL ON public.friendships TO service_role;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "friendships read own" ON public.friendships FOR SELECT TO authenticated USING (auth.uid() IN (requester_id, addressee_id));
CREATE POLICY "friendships request" ON public.friendships FOR INSERT TO authenticated WITH CHECK (auth.uid() = requester_id AND status = 'pending');
CREATE POLICY "friendships accept" ON public.friendships FOR UPDATE TO authenticated USING (auth.uid() = addressee_id) WITH CHECK (auth.uid() = addressee_id);
CREATE POLICY "friendships delete" ON public.friendships FOR DELETE TO authenticated USING (auth.uid() IN (requester_id, addressee_id));

CREATE OR REPLACE FUNCTION public.are_friends(a uuid, b uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.friendships WHERE status='accepted'
    AND ((requester_id=a AND addressee_id=b) OR (requester_id=b AND addressee_id=a)));
$$;

-- PROJECTS
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  genre text,
  bpm int,
  musical_key text,
  cover_url text,
  download_url text,
  visibility text NOT NULL DEFAULT 'friends' CHECK (visibility IN ('friends','selected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;

CREATE TABLE public.project_members (
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.project_members TO authenticated;
GRANT ALL ON public.project_members TO service_role;

CREATE OR REPLACE FUNCTION public.can_view_project(_pid uuid, _uid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects p WHERE p.id = _pid AND (
      p.owner_id = _uid
      OR EXISTS (SELECT 1 FROM public.project_members m WHERE m.project_id = p.id AND m.user_id = _uid)
      OR (p.visibility = 'friends' AND public.are_friends(p.owner_id, _uid))
    ));
$$;
CREATE OR REPLACE FUNCTION public.is_project_owner(_pid uuid, _uid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.projects WHERE id=_pid AND owner_id=_uid);
$$;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects view" ON public.projects FOR SELECT TO authenticated USING (public.can_view_project(id, auth.uid()));
CREATE POLICY "projects insert" ON public.projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "projects update" ON public.projects FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "projects delete" ON public.projects FOR DELETE TO authenticated USING (auth.uid() = owner_id);

ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members view" ON public.project_members FOR SELECT TO authenticated USING (public.can_view_project(project_id, auth.uid()));
CREATE POLICY "members insert" ON public.project_members FOR INSERT TO authenticated WITH CHECK (public.is_project_owner(project_id, auth.uid()) AND public.are_friends(auth.uid(), user_id));
CREATE POLICY "members delete" ON public.project_members FOR DELETE TO authenticated USING (public.is_project_owner(project_id, auth.uid()));

-- VERSIONS
CREATE TABLE public.project_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  version_number int NOT NULL DEFAULT 1,
  title text,
  notes text,
  audio_url text NOT NULL,
  peaks jsonb,
  duration real,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.project_versions TO authenticated;
GRANT ALL ON public.project_versions TO service_role;
ALTER TABLE public.project_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "versions view" ON public.project_versions FOR SELECT TO authenticated USING (public.can_view_project(project_id, auth.uid()));
CREATE POLICY "versions insert" ON public.project_versions FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id AND public.can_view_project(project_id, auth.uid()));
CREATE POLICY "versions delete" ON public.project_versions FOR DELETE TO authenticated USING (auth.uid() = author_id);

CREATE OR REPLACE FUNCTION public.set_version_number() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  SELECT coalesce(max(version_number),0)+1 INTO NEW.version_number FROM public.project_versions WHERE project_id = NEW.project_id;
  UPDATE public.projects SET updated_at = now() WHERE id = NEW.project_id;
  RETURN NEW;
END $$;
CREATE TRIGGER versions_number BEFORE INSERT ON public.project_versions FOR EACH ROW EXECUTE FUNCTION public.set_version_number();

-- COVERS
CREATE TABLE public.covers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.covers TO authenticated;
GRANT ALL ON public.covers TO service_role;
ALTER TABLE public.covers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "covers view" ON public.covers FOR SELECT TO authenticated USING (public.can_view_project(project_id, auth.uid()));
CREATE POLICY "covers insert" ON public.covers FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id AND public.can_view_project(project_id, auth.uid()));
CREATE POLICY "covers delete" ON public.covers FOR DELETE TO authenticated USING (auth.uid() = author_id OR public.is_project_owner(project_id, auth.uid()));

-- MESSAGES
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'text' CHECK (kind IN ('text','voice','version')),
  body text,
  audio_url text,
  peaks jsonb,
  duration real,
  reply_to_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  version_id uuid REFERENCES public.project_versions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages view" ON public.messages FOR SELECT TO authenticated USING (public.can_view_project(project_id, auth.uid()));
CREATE POLICY "messages insert" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id AND public.can_view_project(project_id, auth.uid()));
CREATE POLICY "messages delete" ON public.messages FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- STEM REQUESTS
CREATE TABLE public.stem_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, requester_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stem_requests TO authenticated;
GRANT ALL ON public.stem_requests TO service_role;
ALTER TABLE public.stem_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stems view" ON public.stem_requests FOR SELECT TO authenticated USING (auth.uid() = requester_id OR public.is_project_owner(project_id, auth.uid()));
CREATE POLICY "stems insert" ON public.stem_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = requester_id AND status='pending' AND public.can_view_project(project_id, auth.uid()));
CREATE POLICY "stems update" ON public.stem_requests FOR UPDATE TO authenticated USING (public.is_project_owner(project_id, auth.uid()));
CREATE POLICY "stems delete" ON public.stem_requests FOR DELETE TO authenticated USING (auth.uid() = requester_id);

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  read boolean NOT NULL DEFAULT false,
  emailed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON public.notifications(user_id, created_at DESC);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif view" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notif update" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notif delete" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- participants of a project (owner, members, contributors)
CREATE OR REPLACE FUNCTION public.project_participants(_pid uuid) RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT owner_id FROM public.projects WHERE id=_pid
  UNION SELECT user_id FROM public.project_members WHERE project_id=_pid
  UNION SELECT author_id FROM public.project_versions WHERE project_id=_pid
  UNION SELECT author_id FROM public.messages WHERE project_id=_pid
  UNION SELECT author_id FROM public.covers WHERE project_id=_pid;
$$;

CREATE OR REPLACE FUNCTION public.notify_new_project() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.visibility = 'friends' THEN
    INSERT INTO public.notifications(user_id, actor_id, type, project_id, data)
    SELECT CASE WHEN f.requester_id = NEW.owner_id THEN f.addressee_id ELSE f.requester_id END,
      NEW.owner_id, 'new_project', NEW.id, jsonb_build_object('title', NEW.title)
    FROM public.friendships f WHERE f.status='accepted' AND NEW.owner_id IN (f.requester_id, f.addressee_id);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER projects_notify AFTER INSERT ON public.projects FOR EACH ROW EXECUTE FUNCTION public.notify_new_project();

CREATE OR REPLACE FUNCTION public.notify_new_member() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p record;
BEGIN
  SELECT * INTO p FROM public.projects WHERE id = NEW.project_id;
  INSERT INTO public.notifications(user_id, actor_id, type, project_id, data)
  VALUES (NEW.user_id, p.owner_id, 'new_project', p.id, jsonb_build_object('title', p.title));
  RETURN NEW;
END $$;
CREATE TRIGGER members_notify AFTER INSERT ON public.project_members FOR EACH ROW EXECUTE FUNCTION public.notify_new_member();

CREATE OR REPLACE FUNCTION public.notify_new_version() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t text;
BEGIN
  SELECT title INTO t FROM public.projects WHERE id = NEW.project_id;
  INSERT INTO public.notifications(user_id, actor_id, type, project_id, data)
  SELECT u, NEW.author_id, 'new_version', NEW.project_id, jsonb_build_object('title', t, 'version', NEW.version_number)
  FROM public.project_participants(NEW.project_id) u WHERE u <> NEW.author_id;
  RETURN NEW;
END $$;
CREATE TRIGGER versions_notify AFTER INSERT ON public.project_versions FOR EACH ROW EXECUTE FUNCTION public.notify_new_version();

CREATE OR REPLACE FUNCTION public.notify_new_message() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t text;
BEGIN
  IF NEW.kind = 'version' THEN RETURN NEW; END IF;
  SELECT title INTO t FROM public.projects WHERE id = NEW.project_id;
  INSERT INTO public.notifications(user_id, actor_id, type, project_id, data)
  SELECT u, NEW.author_id, 'new_message', NEW.project_id, jsonb_build_object('title', t, 'kind', NEW.kind)
  FROM public.project_participants(NEW.project_id) u WHERE u <> NEW.author_id;
  RETURN NEW;
END $$;
CREATE TRIGGER messages_notify AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();

CREATE OR REPLACE FUNCTION public.notify_new_cover() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t text;
BEGIN
  SELECT title INTO t FROM public.projects WHERE id = NEW.project_id;
  INSERT INTO public.notifications(user_id, actor_id, type, project_id, data)
  SELECT u, NEW.author_id, 'new_cover', NEW.project_id, jsonb_build_object('title', t)
  FROM public.project_participants(NEW.project_id) u WHERE u <> NEW.author_id;
  RETURN NEW;
END $$;
CREATE TRIGGER covers_notify AFTER INSERT ON public.covers FOR EACH ROW EXECUTE FUNCTION public.notify_new_cover();

CREATE OR REPLACE FUNCTION public.notify_friendship() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications(user_id, actor_id, type) VALUES (NEW.addressee_id, NEW.requester_id, 'friend_request');
  ELSIF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO public.notifications(user_id, actor_id, type) VALUES (NEW.requester_id, NEW.addressee_id, 'friend_accepted');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER friendships_notify AFTER INSERT OR UPDATE ON public.friendships FOR EACH ROW EXECUTE FUNCTION public.notify_friendship();

CREATE OR REPLACE FUNCTION public.notify_stems() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p record;
BEGIN
  SELECT * INTO p FROM public.projects WHERE id = NEW.project_id;
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications(user_id, actor_id, type, project_id, data)
    VALUES (p.owner_id, NEW.requester_id, 'stem_request', p.id, jsonb_build_object('title', p.title));
  ELSIF NEW.status <> OLD.status THEN
    INSERT INTO public.notifications(user_id, actor_id, type, project_id, data)
    VALUES (NEW.requester_id, p.owner_id, 'stem_' || NEW.status, p.id, jsonb_build_object('title', p.title));
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER stems_notify AFTER INSERT OR UPDATE ON public.stem_requests FOR EACH ROW EXECUTE FUNCTION public.notify_stems();

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- STORAGE POLICIES (buckets created separately)
CREATE POLICY "media read" ON storage.objects FOR SELECT USING (bucket_id IN ('avatars','covers','audio'));
CREATE POLICY "media upload own folder" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('avatars','covers','audio') AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "media update own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('avatars','covers','audio') AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "media delete own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('avatars','covers','audio') AND (storage.foldername(name))[1] = auth.uid()::text);
