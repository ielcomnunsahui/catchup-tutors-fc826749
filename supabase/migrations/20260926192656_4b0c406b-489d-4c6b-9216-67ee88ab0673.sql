CREATE TABLE public.programme_enrolments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  ref_code text UNIQUE,
  programme text NOT NULL,
  monthly_fee integer NOT NULL,
  days_per_week integer NOT NULL,
  available_days text[] NOT NULL DEFAULT '{}',
  preferred_time text NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  gender text,
  age integer,
  location text,
  guardian_name text,
  guardian_phone text,
  current_level text,
  school text,
  subjects text[] NOT NULL DEFAULT '{}',
  target_exam_date text,
  target_score text,
  notes text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.programme_enrolments TO anon;
GRANT SELECT, INSERT, UPDATE ON public.programme_enrolments TO authenticated;
GRANT ALL ON public.programme_enrolments TO service_role;
ALTER TABLE public.programme_enrolments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can enrol" ON public.programme_enrolments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins view enrolments" ON public.programme_enrolments FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins update enrolments" ON public.programme_enrolments FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.prepare_programme_enrolment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  NEW.user_id := auth.uid();
  NEW.status := 'new';
  NEW.days_per_week := CASE WHEN NEW.programme = 'GRE' THEN 5 ELSE 4 END;
  NEW.monthly_fee := CASE NEW.programme
    WHEN 'SAT' THEN 400000 WHEN 'WAEC' THEN 200000 WHEN 'GCE' THEN 200000
    WHEN 'IGCSE' THEN 250000 WHEN 'JAMB' THEN 150000 WHEN 'GRE' THEN 300000
    WHEN 'TOEFL' THEN 200000 WHEN 'IELTS' THEN 200000 ELSE NULL END;
  IF NEW.monthly_fee IS NULL THEN RAISE EXCEPTION 'Unknown programme'; END IF;
  IF coalesce(array_length(NEW.available_days, 1), 0) <> NEW.days_per_week THEN
    RAISE EXCEPTION 'Please choose exactly % days', NEW.days_per_week;
  END IF;
  SELECT coalesce(max((regexp_replace(ref_code, '^CUT/ENR/', ''))::int), 0) + 1
    INTO n FROM public.programme_enrolments WHERE ref_code ~ '^CUT/ENR/[0-9]+$';
  NEW.ref_code := 'CUT/ENR/' || lpad(n::text, 4, '0');
  RETURN NEW;
END; $$;
CREATE TRIGGER programme_enrolments_prepare BEFORE INSERT ON public.programme_enrolments FOR EACH ROW EXECUTE FUNCTION public.prepare_programme_enrolment();
CREATE TRIGGER set_programme_enrolments_updated_at BEFORE UPDATE ON public.programme_enrolments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.get_enrolment_ref(_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ref_code FROM public.programme_enrolments WHERE id = _id AND created_at > now() - interval '10 minutes'
$$;