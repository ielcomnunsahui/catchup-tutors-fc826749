ALTER TABLE public.topic_questions
  ADD COLUMN subject_id uuid NULL REFERENCES public.subjects(id) ON DELETE SET NULL;

CREATE INDEX topic_questions_subject_id_idx
  ON public.topic_questions(subject_id);

ALTER TABLE public.past_papers
  ADD COLUMN subject_id uuid NULL REFERENCES public.subjects(id) ON DELETE SET NULL;

CREATE INDEX past_papers_subject_id_idx
  ON public.past_papers(subject_id);