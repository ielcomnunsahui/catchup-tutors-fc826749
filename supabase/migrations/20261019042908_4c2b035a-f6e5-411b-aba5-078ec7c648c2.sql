CREATE TABLE public.applicant_email_sends (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id uuid NOT NULL REFERENCES public.tutor_applications(id) ON DELETE CASCADE,
  subject text NOT NULL,
  request_id uuid NOT NULL,
  sent_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX applicant_email_sends_application_id_idx ON public.applicant_email_sends (application_id);
GRANT SELECT ON public.applicant_email_sends TO authenticated;
GRANT ALL ON public.applicant_email_sends TO service_role;
ALTER TABLE public.applicant_email_sends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view applicant email sends" ON public.applicant_email_sends FOR SELECT TO authenticated USING (public.is_admin());