# JAMB, WAEC & NECO past questions via the myschool API

Bring Nigerian exam past questions (with answers and explanations) into the site, plus admission requirements on the programmes page.

## What it costs

Parse (the provider) sells credits:

- Free: 200 credits, no card.
- Hobby: $30/month, 1,000 credits.
- Developer: $100/month, 5,000 credits.

The past-questions call costs 1 credit and returns 5 questions. So the free 200 credits import roughly 1,000 questions — enough to launch. Importing once and saving the questions in your own database means students browsing and practising costs nothing afterwards; only fresh imports use credits. Start on the free tier; upgrade only if you want tens of thousands of questions.

A free Parse account and API key are needed before anything can be imported. I will request the key through the secure secret form once you have signed up at parse.bot.

## What gets built

### 1. Admin: import Nigerian past questions

A new panel in the admin quiz area:

- Choose exam (JAMB, WAEC, NECO), subject, optional year and topic, and how many questions to pull.
- Preview the fetched questions before saving, with a credit-cost estimate shown up front (1 credit per 5 questions).
- Save into the existing question bank, skipping duplicates, marked with their source.
- Each imported question keeps its options, correct answer and explanation, and can be edited or unpublished like any other question.

### 2. Students: Nigerian exams on /resources

A new "Nigerian examinations" section on the resources page:

- Cards for JAMB, WAEC and NECO showing how many questions are available per subject and year.
- Each card opens the existing practice page pre-filtered to that exam, subject, year or topic.
- Free/premium split works exactly as the current question bank does.

### 3. /programs: local exam pathways plus admission requirements

- JAMB, WAEC and NECO pathway cards alongside the Cambridge and IGCSE cards, listing subjects and linking to practice and tutors.
- An admission requirements lookup: pick a school, then a course, and see the UTME subject combination, O'Level requirements and Direct Entry requirements. Results are cached so repeat lookups are free.

## Technical notes

- New edge function `myschool` proxies Parse (`https://api.parse.bot/scraper/024e7b9b-.../<endpoint>`) with `X-API-Key: PARSE_API_KEY` from the secret store, so the key never reaches the browser. Endpoints used: `get_past_questions`, `list_schools_by_type`, `get_school_courses`, `get_course_requirements`. Zod-validated inputs; import actions restricted to admins via `has_role`.
- Imports write to the existing `quiz_questions` table (`exam_type`, `subject_key`, `year`, `topic`, `options`, `correct_index`, `explanation`, `access_level`, `is_published`). Migration adds a `source` text column plus a unique index on a hash of `(exam_type, subject_key, question_text)` for idempotent re-imports.
- New `admission_requirements_cache` table (school slug, course slug, payload jsonb, fetched_at) with public read and service-role write, so the programmes lookup answers from cache before spending credits.
- Frontend: a `NigerianExams` section component on `/resources`, local-exam pathway cards and an `AdmissionRequirements` component on `/programs`, and an import panel added to the admin quiz bank tab. React Query caching, skeleton loaders and error boundaries follow the existing admin/student patterns.
- Content is scraped from myschool.ng by a third party; imported questions stay reviewable and editable in admin before publishing.

## Sequence

1. You create a free Parse account; I request `PARSE_API_KEY` via the secure form.
2. Database migration (source column, cache table).
3. Edge function proxy.
4. Admin import panel; import a first batch per exam.
5. Resources section and programmes cards plus admission lookup.
