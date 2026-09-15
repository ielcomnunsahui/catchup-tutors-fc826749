CREATE TABLE public.tutor_application_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id uuid NOT NULL REFERENCES public.tutor_applications(id) ON DELETE CASCADE,
  tag text NOT NULL,
  color text NOT NULL DEFAULT 'slate',
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (application_id, tag)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tutor_application_tags TO authenticated;
GRANT ALL ON public.tutor_application_tags TO service_role;

ALTER TABLE public.tutor_application_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view application tags" ON public.tutor_application_tags
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can add application tags" ON public.tutor_application_tags
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update application tags" ON public.tutor_application_tags
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can remove application tags" ON public.tutor_application_tags
  FOR DELETE TO authenticated USING (public.is_admin());

CREATE INDEX tutor_application_tags_application_id_idx ON public.tutor_application_tags(application_id);
CREATE INDEX tutor_application_tags_tag_idx ON public.tutor_application_tags(tag);

CREATE TRIGGER set_tutor_application_tags_updated_at
  BEFORE UPDATE ON public.tutor_application_tags
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();