CREATE OR REPLACE FUNCTION public.notify_new_version() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t text;
BEGIN
  IF NEW.version_number = 1 THEN RETURN NEW; END IF;
  SELECT title INTO t FROM public.projects WHERE id = NEW.project_id;
  INSERT INTO public.notifications(user_id, actor_id, type, project_id, data)
  SELECT u, NEW.author_id, 'new_version', NEW.project_id, jsonb_build_object('title', t, 'version', NEW.version_number)
  FROM public.project_participants(NEW.project_id) u WHERE u <> NEW.author_id;
  RETURN NEW;
END $$;