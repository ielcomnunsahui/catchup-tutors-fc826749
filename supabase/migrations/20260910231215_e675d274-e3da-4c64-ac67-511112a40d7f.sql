CREATE OR REPLACE FUNCTION public.guard_tutor_profile_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;
  NEW.is_approved := OLD.is_approved;
  NEW.is_visible := OLD.is_visible;
  NEW.rating := OLD.rating;
  NEW.review_count := OLD.review_count;
  NEW.ref_code := OLD.ref_code;
  NEW.user_id := OLD.user_id;
  NEW.application_id := OLD.application_id;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.guard_tutor_profile_self_update() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS guard_tutor_profile_self_update_trg ON public.tutor_profiles;
CREATE TRIGGER guard_tutor_profile_self_update_trg
BEFORE UPDATE ON public.tutor_profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_tutor_profile_self_update();