GRANT INSERT ON public.summer_student_registrations TO anon, authenticated;
GRANT SELECT ON public.summer_student_registrations TO authenticated;
GRANT ALL ON public.summer_student_registrations TO service_role;

GRANT INSERT ON public.summer_tutor_volunteers TO anon, authenticated;
GRANT SELECT ON public.summer_tutor_volunteers TO authenticated;
GRANT ALL ON public.summer_tutor_volunteers TO service_role;