ALTER TABLE public.project_versions
ADD COLUMN stems_url text;

ALTER TABLE public.project_versions
ADD CONSTRAINT project_versions_stems_url_valid
CHECK (
  stems_url IS NULL
  OR (
    length(stems_url) <= 2000
    AND stems_url ~ '^https://[^[:space:]]+$'
  )
);

ALTER TABLE public.stem_requests
ADD COLUMN version_id uuid REFERENCES public.project_versions(id) ON DELETE CASCADE;

CREATE INDEX stem_requests_version_id_idx
ON public.stem_requests(version_id);