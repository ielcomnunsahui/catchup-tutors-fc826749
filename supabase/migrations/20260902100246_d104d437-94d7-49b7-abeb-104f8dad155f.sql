ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS session_date date NOT NULL DEFAULT current_date,
  ADD COLUMN IF NOT EXISTS student_marked boolean,
  ADD COLUMN IF NOT EXISTS tutor_marked boolean,
  ADD COLUMN IF NOT EXISTS student_marked_at timestamptz,
  ADD COLUMN IF NOT EXISTS tutor_marked_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS attendance_booking_session_uidx
  ON public.attendance (booking_id, session_date);

GRANT SELECT, INSERT, UPDATE ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;

DROP POLICY IF EXISTS "attendance student insert" ON public.attendance;
CREATE POLICY "attendance student insert" ON public.attendance
  FOR INSERT TO authenticated
  WITH CHECK (
    student_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND b.student_id = auth.uid())
  );

DROP POLICY IF EXISTS "attendance student update" ON public.attendance;
CREATE POLICY "attendance student update" ON public.attendance
  FOR UPDATE TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE OR REPLACE FUNCTION public.guard_attendance_marks()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE is_tutor boolean; is_student boolean; admin boolean;
BEGIN
  admin := public.is_admin();
  is_tutor := EXISTS (SELECT 1 FROM public.tutor_profiles t WHERE t.id = NEW.tutor_id AND t.user_id = auth.uid());
  is_student := (NEW.student_id = auth.uid());

  IF NOT admin THEN
    IF NOT is_tutor THEN
      NEW.tutor_marked := CASE WHEN TG_OP = 'UPDATE' THEN OLD.tutor_marked ELSE NULL END;
      NEW.tutor_marked_at := CASE WHEN TG_OP = 'UPDATE' THEN OLD.tutor_marked_at ELSE NULL END;
    END IF;
    IF NOT is_student THEN
      NEW.student_marked := CASE WHEN TG_OP = 'UPDATE' THEN OLD.student_marked ELSE NULL END;
      NEW.student_marked_at := CASE WHEN TG_OP = 'UPDATE' THEN OLD.student_marked_at ELSE NULL END;
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.student_marked IS DISTINCT FROM OLD.student_marked THEN NEW.student_marked_at := now(); END IF;
    IF NEW.tutor_marked IS DISTINCT FROM OLD.tutor_marked THEN NEW.tutor_marked_at := now(); END IF;
  ELSE
    IF NEW.student_marked IS NOT NULL THEN NEW.student_marked_at := now(); END IF;
    IF NEW.tutor_marked IS NOT NULL THEN NEW.tutor_marked_at := now(); END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_attendance_marks_trg ON public.attendance;
CREATE TRIGGER guard_attendance_marks_trg
  BEFORE INSERT OR UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.guard_attendance_marks();