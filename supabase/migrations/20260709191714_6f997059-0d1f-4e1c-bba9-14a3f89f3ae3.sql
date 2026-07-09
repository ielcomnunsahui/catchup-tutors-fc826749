
CREATE TABLE public.summer_student_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  gender text NOT NULL CHECK (gender IN ('male','female')),
  age integer NOT NULL CHECK (age BETWEEN 5 AND 30),
  home_address text NOT NULL,
  parent_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  current_class text NOT NULL,
  department text,
  target_exams text[] NOT NULL DEFAULT '{}',
  commit_excellence boolean NOT NULL DEFAULT false,
  commit_character boolean NOT NULL DEFAULT false,
  commit_proximity boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'submitted',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.summer_student_registrations TO anon, authenticated;
GRANT ALL ON public.summer_student_registrations TO service_role;
ALTER TABLE public.summer_student_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can submit student registration" ON public.summer_student_registrations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admins can view student registrations" ON public.summer_student_registrations FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.summer_tutor_volunteers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  gender text,
  phone text NOT NULL,
  email text NOT NULL,
  qualification text NOT NULL,
  subjects text[] NOT NULL DEFAULT '{}',
  experience_years integer,
  availability text NOT NULL,
  motivation text,
  commit_integrity boolean NOT NULL DEFAULT false,
  commit_impact boolean NOT NULL DEFAULT false,
  commit_reliability boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'submitted',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.summer_tutor_volunteers TO anon, authenticated;
GRANT ALL ON public.summer_tutor_volunteers TO service_role;
ALTER TABLE public.summer_tutor_volunteers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can submit tutor volunteer" ON public.summer_tutor_volunteers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admins can view tutor volunteers" ON public.summer_tutor_volunteers FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
