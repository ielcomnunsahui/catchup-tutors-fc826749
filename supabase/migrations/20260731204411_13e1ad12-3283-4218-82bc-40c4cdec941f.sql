ALTER TABLE public.past_papers
  ADD COLUMN IF NOT EXISTS file_name text,
  ADD COLUMN IF NOT EXISTS file_size_kb integer;

ALTER TABLE public.tutor_applications
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS occupation text,
  ADD COLUMN IF NOT EXISTS highest_qualification text,
  ADD COLUMN IF NOT EXISTS field_of_study text,
  ADD COLUMN IF NOT EXISTS experience_band text,
  ADD COLUMN IF NOT EXISTS curricula text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS teaching_philosophy text,
  ADD COLUMN IF NOT EXISTS video_experience text,
  ADD COLUMN IF NOT EXISTS sample_video_url text,
  ADD COLUMN IF NOT EXISTS has_equipment boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tools text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hours_per_week text,
  ADD COLUMN IF NOT EXISTS availability text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS intro_video_url text;

ALTER TABLE public.tutor_applications
  ALTER COLUMN topics SET DEFAULT '{}',
  ALTER COLUMN qualifications SET DEFAULT '',
  ALTER COLUMN pricing SET DEFAULT '{}'::jsonb,
  ALTER COLUMN biography SET DEFAULT '',
  ALTER COLUMN years_experience SET DEFAULT 0;

DROP POLICY IF EXISTS "tutor uploads own insert" ON storage.objects;
CREATE POLICY "tutor uploads own insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'tutor-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "tutor uploads own read" ON storage.objects;
CREATE POLICY "tutor uploads own read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'tutor-uploads' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()));

DROP POLICY IF EXISTS "tutor uploads own update" ON storage.objects;
CREATE POLICY "tutor uploads own update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'tutor-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

GRANT ALL ON public.payments TO service_role;
GRANT ALL ON public.premium_subscriptions TO service_role;
GRANT ALL ON public.settings TO service_role;
GRANT ALL ON public.tutor_applications TO service_role;

INSERT INTO public.settings (key, value, is_public)
VALUES ('paystack', '{"public_key": "", "enabled": false, "currency": "NGN"}'::jsonb, true)
ON CONFLICT (key) DO NOTHING;