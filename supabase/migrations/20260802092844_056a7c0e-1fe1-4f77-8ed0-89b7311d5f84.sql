CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role) $$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT public.has_role(auth.uid(),'admin') $$;

CREATE POLICY "profiles admin read" ON public.profiles FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "roles admin read" ON public.user_roles FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "roles admin manage" ON public.user_roles FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
GRANT ALL ON public.tutor_profiles TO service_role;
GRANT ALL ON public.profiles TO service_role;