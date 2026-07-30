CREATE TABLE public.past_papers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_key text NOT NULL,
  year integer NOT NULL,
  session text NOT NULL,
  paper_number text NOT NULL,
  doc_type text NOT NULL,
  title text,
  file_url text NOT NULL,
  access_level public.access_level NOT NULL DEFAULT 'free',
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subject_key, year, session, paper_number, doc_type)
);

GRANT SELECT ON public.past_papers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.past_papers TO authenticated;
GRANT ALL ON public.past_papers TO service_role;

ALTER TABLE public.past_papers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published past papers"
ON public.past_papers FOR SELECT
USING (is_published OR public.is_admin());

CREATE POLICY "Admins can insert past papers"
ON public.past_papers FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update past papers"
ON public.past_papers FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete past papers"
ON public.past_papers FOR DELETE TO authenticated
USING (public.is_admin());

CREATE TRIGGER past_papers_set_updated_at
BEFORE UPDATE ON public.past_papers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX past_papers_lookup_idx ON public.past_papers (subject_key, year, session);