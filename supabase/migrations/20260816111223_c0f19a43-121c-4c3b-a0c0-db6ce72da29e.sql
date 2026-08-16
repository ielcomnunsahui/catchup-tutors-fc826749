
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
GRANT SELECT ON public.quiz_questions TO anon;
GRANT SELECT ON public.tutor_profiles TO anon;
GRANT SELECT ON public.tutor_availability TO anon;
GRANT SELECT ON public.subjects TO anon;
GRANT SELECT ON public.programs TO anon;
GRANT SELECT ON public.topics TO anon;

ALTER TABLE public.tutor_profiles
  ADD COLUMN IF NOT EXISTS ref_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS exam_track text NOT NULL DEFAULT 'CT',
  ADD COLUMN IF NOT EXISTS highest_qualification text;

ALTER TABLE public.tutor_profiles ALTER COLUMN rating SET DEFAULT 4.0;
UPDATE public.tutor_profiles SET rating = 4.0 WHERE rating < 4.0;

CREATE OR REPLACE FUNCTION public.set_tutor_ref_code()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE n integer; track text;
BEGIN
  IF NEW.ref_code IS NULL THEN
    track := upper(coalesce(nullif(NEW.exam_track, ''), 'CT'));
    SELECT count(*) + 1 INTO n FROM public.tutor_profiles WHERE upper(coalesce(exam_track,'CT')) = track;
    NEW.ref_code := 'CUT/' || track || '/' || lpad(n::text, 3, '0');
  END IF;
  IF NEW.rating IS NULL OR NEW.rating < 4.0 THEN NEW.rating := 4.0; END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS tutor_profiles_ref_code ON public.tutor_profiles;
CREATE TRIGGER tutor_profiles_ref_code BEFORE INSERT ON public.tutor_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_tutor_ref_code();

UPDATE public.tutor_profiles t SET ref_code = 'CUT/' || upper(coalesce(nullif(t.exam_track,''),'CT')) || '/' || lpad(s.rn::text, 3, '0')
FROM (SELECT id, row_number() OVER (PARTITION BY upper(coalesce(exam_track,'CT')) ORDER BY created_at) rn FROM public.tutor_profiles) s
WHERE s.id = t.id AND t.ref_code IS NULL;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS ref_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS student_name text,
  ADD COLUMN IF NOT EXISTS student_email text,
  ADD COLUMN IF NOT EXISTS student_phone text,
  ADD COLUMN IF NOT EXISTS programme text,
  ADD COLUMN IF NOT EXISTS available_days text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS available_times text,
  ADD COLUMN IF NOT EXISTS bio_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bio_details jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.set_booking_ref_code()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE initials text; n integer; nm text;
BEGIN
  IF NEW.ref_code IS NULL THEN
    SELECT display_name INTO nm FROM public.tutor_profiles WHERE id = NEW.tutor_id;
    initials := upper(coalesce(
      substring(regexp_replace(coalesce(nm,'Tutor'), '[^a-zA-Z ]', '', 'g') from '^([a-zA-Z])') ||
      coalesce(substring(regexp_replace(coalesce(nm,'Tutor'), '[^a-zA-Z ]', '', 'g') from ' ([a-zA-Z])'), 'X'),
      'TX'));
    SELECT count(*) + 1 INTO n FROM public.bookings WHERE tutor_id = NEW.tutor_id;
    NEW.ref_code := 'CUT/' || initials || '/' || lpad(n::text, 4, '0');
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS bookings_ref_code ON public.bookings;
CREATE TRIGGER bookings_ref_code BEFORE INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.set_booking_ref_code();
