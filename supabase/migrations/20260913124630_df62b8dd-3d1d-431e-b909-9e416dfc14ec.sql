ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS source text;

CREATE UNIQUE INDEX IF NOT EXISTS quiz_questions_dedupe_uidx
  ON public.quiz_questions (exam_type, subject_key, md5(question_text));

CREATE TABLE IF NOT EXISTS public.admission_requirements_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_slug text NOT NULL,
  school_name text,
  course_slug text NOT NULL,
  course_name text,
  requirements_path text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_slug, course_slug)
);

GRANT SELECT ON public.admission_requirements_cache TO anon;
GRANT SELECT ON public.admission_requirements_cache TO authenticated;
GRANT ALL ON public.admission_requirements_cache TO service_role;

ALTER TABLE public.admission_requirements_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admission requirements are public"
  ON public.admission_requirements_cache FOR SELECT USING (true);

CREATE POLICY "Admins manage admission requirements"
  ON public.admission_requirements_cache FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER set_admission_requirements_cache_updated_at
  BEFORE UPDATE ON public.admission_requirements_cache
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();