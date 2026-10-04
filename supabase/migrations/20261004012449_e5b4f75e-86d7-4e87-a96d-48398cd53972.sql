ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS domain text;
CREATE INDEX IF NOT EXISTS quiz_questions_exam_domain_idx ON public.quiz_questions (exam_type, subject_key, domain);