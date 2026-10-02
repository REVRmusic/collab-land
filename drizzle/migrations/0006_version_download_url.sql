ALTER TABLE public.project_versions ADD COLUMN IF NOT EXISTS download_url text;
UPDATE public.project_versions v SET download_url = p.download_url
FROM public.projects p
WHERE v.project_id = p.id AND p.download_url IS NOT NULL
  AND v.version_number = (SELECT max(version_number) FROM public.project_versions WHERE project_id = p.id);
COMMENT ON COLUMN public.projects.download_url IS 'DEPRECATED: replaced by project_versions.download_url';