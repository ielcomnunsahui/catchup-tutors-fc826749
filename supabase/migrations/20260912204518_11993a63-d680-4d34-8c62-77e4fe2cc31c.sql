ALTER TABLE public.tutor_applications ADD COLUMN IF NOT EXISTS ref_code text;

UPDATE public.tutor_applications a
SET ref_code = 'CUT/APP/' || lpad(s.rn::text, 4, '0')
FROM (SELECT id, row_number() OVER (ORDER BY created_at, id) AS rn FROM public.tutor_applications) s
WHERE s.id = a.id AND a.ref_code IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS tutor_applications_ref_code_uidx ON public.tutor_applications (ref_code);

CREATE OR REPLACE FUNCTION public.set_application_ref_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n integer;
BEGIN
  IF NEW.ref_code IS NULL THEN
    SELECT coalesce(max((regexp_replace(ref_code, '^CUT/APP/', ''))::int), 0) + 1
      INTO n FROM public.tutor_applications WHERE ref_code ~ '^CUT/APP/[0-9]+$';
    NEW.ref_code := 'CUT/APP/' || lpad(n::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tutor_applications_ref_code ON public.tutor_applications;
CREATE TRIGGER tutor_applications_ref_code BEFORE INSERT ON public.tutor_applications
FOR EACH ROW EXECUTE FUNCTION public.set_application_ref_code();