
-- Allow admins to update/delete summer registrations & tutor volunteers
CREATE POLICY "admins can update student registrations" ON public.summer_student_registrations
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins can delete student registrations" ON public.summer_student_registrations
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins can update tutor volunteers" ON public.summer_tutor_volunteers
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins can delete tutor volunteers" ON public.summer_tutor_volunteers
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
