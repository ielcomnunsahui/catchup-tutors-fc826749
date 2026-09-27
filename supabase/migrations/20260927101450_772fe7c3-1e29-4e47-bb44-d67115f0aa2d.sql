ALTER TABLE public.programme_enrolments
  ADD COLUMN payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN payment_reference text UNIQUE,
  ADD COLUMN amount_paid integer,
  ADD COLUMN paid_at timestamptz;

CREATE OR REPLACE FUNCTION public.prepare_programme_enrolment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  NEW.user_id := auth.uid();
  NEW.status := 'new';
  NEW.payment_status := 'unpaid';
  NEW.payment_reference := NULL;
  NEW.amount_paid := NULL;
  NEW.paid_at := NULL;
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
REVOKE EXECUTE ON FUNCTION public.prepare_programme_enrolment() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.guard_enrolment_payment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    NEW.payment_status := OLD.payment_status;
    NEW.payment_reference := OLD.payment_reference;
    NEW.amount_paid := OLD.amount_paid;
    NEW.paid_at := OLD.paid_at;
    NEW.monthly_fee := OLD.monthly_fee;
  END IF;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.guard_enrolment_payment() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER programme_enrolments_guard_payment BEFORE UPDATE ON public.programme_enrolments FOR EACH ROW EXECUTE FUNCTION public.guard_enrolment_payment();