CREATE TABLE public.programme_plan_settings (
  programme text PRIMARY KEY,
  name text NOT NULL,
  monthly_fee integer NOT NULL,
  days_per_week integer NOT NULL,
  min_lessons_per_day integer NOT NULL DEFAULT 1,
  max_lessons_per_day integer NOT NULL DEFAULT 3,
  note text,
  blurb text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT programme_plan_settings_fee_positive CHECK (monthly_fee > 0),
  CONSTRAINT programme_plan_settings_days_range CHECK (days_per_week BETWEEN 1 AND 7),
  CONSTRAINT programme_plan_settings_lesson_range CHECK (min_lessons_per_day >= 1 AND max_lessons_per_day >= min_lessons_per_day AND max_lessons_per_day <= 6)
);

GRANT SELECT ON public.programme_plan_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.programme_plan_settings TO authenticated;
GRANT ALL ON public.programme_plan_settings TO service_role;

ALTER TABLE public.programme_plan_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active programme settings"
ON public.programme_plan_settings FOR SELECT
TO anon, authenticated
USING (is_active OR public.is_admin());

CREATE POLICY "Admins can create programme settings"
ON public.programme_plan_settings FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update programme settings"
ON public.programme_plan_settings FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete programme settings"
ON public.programme_plan_settings FOR DELETE
TO authenticated
USING (public.is_admin());

CREATE TRIGGER set_programme_plan_settings_updated_at
BEFORE UPDATE ON public.programme_plan_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.programme_enrolments
ADD COLUMN daily_schedule jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.prepare_programme_enrolment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  n integer;
  cfg public.programme_plan_settings%ROWTYPE;
  day_name text;
  lesson_count integer;
  times_value jsonb;
BEGIN
  SELECT * INTO cfg
  FROM public.programme_plan_settings
  WHERE programme = NEW.programme AND is_active = true;

  IF NOT FOUND THEN RAISE EXCEPTION 'Unknown or unavailable programme'; END IF;

  NEW.user_id := auth.uid();
  NEW.status := 'new';
  NEW.payment_status := 'unpaid';
  NEW.payment_reference := NULL;
  NEW.amount_paid := NULL;
  NEW.paid_at := NULL;
  NEW.days_per_week := cfg.days_per_week;
  NEW.monthly_fee := cfg.monthly_fee;
  NEW.available_days := ARRAY(SELECT jsonb_object_keys(NEW.daily_schedule));

  IF coalesce(jsonb_object_length(NEW.daily_schedule), 0) <> cfg.days_per_week THEN
    RAISE EXCEPTION 'Please choose exactly % days', cfg.days_per_week;
  END IF;

  FOR day_name, times_value IN SELECT key, value FROM jsonb_each(NEW.daily_schedule)
  LOOP
    IF day_name NOT IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') THEN
      RAISE EXCEPTION 'Invalid study day: %', day_name;
    END IF;
    IF jsonb_typeof(times_value) <> 'array' THEN
      RAISE EXCEPTION 'Each study day must contain lesson times';
    END IF;
    lesson_count := jsonb_array_length(times_value);
    IF lesson_count < cfg.min_lessons_per_day OR lesson_count > cfg.max_lessons_per_day THEN
      RAISE EXCEPTION '% must have between % and % lessons', day_name, cfg.min_lessons_per_day, cfg.max_lessons_per_day;
    END IF;
    IF EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(times_value) AS lesson_time
      WHERE nullif(btrim(lesson_time), '') IS NULL
    ) THEN
      RAISE EXCEPTION 'Choose a time for every lesson on %', day_name;
    END IF;
  END LOOP;

  SELECT coalesce(max((regexp_replace(ref_code, '^CUT/ENR/', ''))::int), 0) + 1
    INTO n FROM public.programme_enrolments WHERE ref_code ~ '^CUT/ENR/[0-9]+$';
  NEW.ref_code := 'CUT/ENR/' || lpad(n::text, 4, '0');
  RETURN NEW;
END;
$function$;