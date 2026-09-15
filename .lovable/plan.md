# SAT questions for the quiz bank

## What I checked

I tested the three sources you sent plus the options around them:

1. **zzggbb/sat_questions** (GitHub) — a personal pipeline that pulls the College Board question set and publishes it as static files. Only 1 star, no API, no licence. Useful as a reference for how the pipeline works, not as a live source.
2. **Kaggle "SAT history questions and answers"** — a small, static, history-only CSV. It needs a manual download and a Kaggle account, and it doesn't cover Maths or Reading/Writing. Not worth wiring in.
3. **satquestionbank.org** — a front-end over the official College Board SAT Suite Question Bank. The data behind it comes from College Board's own public endpoint.
4. **College Board SAT Suite Question Bank (recommended)** — I called it live and it works with no key and no login: a list call returns thousands of question IDs with domain, skill and difficulty, and a detail call returns the full question, answer choices, correct answer and the official worked explanation. This is the same bank published for educators at cb.org/ssqb.
5. **OpenSAT** (pinesat.duckdns.org/api/questions) — a free community JSON API, simpler format, also live. Good as a fallback/top-up source, but it's a hobby server with no uptime guarantee.

**Recommendation:** import from College Board as the primary source, with OpenSAT as an optional secondary. Both are free; neither needs a paid API key.

## What you'll get

- A new **SAT** section in the admin quiz bank where you choose section (Maths or Reading & Writing), domain/skill and difficulty, preview what's available, then import the questions you want into your existing quiz bank.
- Imported questions behave exactly like your current ones: published/unpublished, free or premium, and they appear in /quiz under exam type "SAT" with course, topic and difficulty filters.
- Each question keeps its official answer explanation, shown after a student submits.
- Re-importing never duplicates — questions already in the bank are skipped.

## Two things to decide (I've picked defaults)

- **Grid-in questions** (type your own numeric answer, no A–D choices) make up a chunk of SAT Maths. Your quiz engine is multiple-choice only. Default: skip them in this phase and import multiple-choice only, so nothing breaks. Adding grid-ins later means a small change to the quiz player.
- **Volume.** Default: import in admin-controlled batches (up to 200 at a time) rather than dumping thousands of rows at once.

## Technical notes

- New edge function `supabase/functions/sat-questions/index.ts`, modelled on the existing `myschool` function: admin-gated via the caller's JWT + `has_role`, with actions `list` (fetch IDs by filter), `preview` (hydrate a page of questions) and `import` (insert into `quiz_questions`).
  - List: `POST https://qbank-api.collegeboard.org/msreportingquestionbank-prod/questionbank/digital/get-questions` with `{asmtEventId, test, domain}`.
  - Detail: `POST .../questionbank/digital/get-question` with `{external_id}` — returns `stem`, `answerOptions`, `correct_answer`, `rationale`, `type`.
- Content comes back as HTML with embedded **MathML**, not LaTeX. `MathText` only handles LaTeX and strips tags, so add a small renderer that sanitises the HTML (allow-list of tags, strip scripts/attributes) and lets the browser render MathML natively; keep KaTeX for the existing LaTeX content. Plain-text `alttext` is used as the fallback.
- Storage: reuse `quiz_questions` with `exam_type = 'SAT'`, `subject_key = 'math' | 'reading-writing'`, `topic` = College Board skill description, `difficulty` mapped E/M/H, `source = 'collegeboard:<external_id>'`. The existing `source` column plus a dedupe check on it prevents repeat imports. No schema change needed for phase 1.
- Filter `type === 'mcq'`; log and skip `spr` (grid-in) rows, reporting the skipped count in the import summary.
- Admin UI: new `src/components/admin/sat-import-tab.tsx` following the myschool import tab's pattern (filters, preview table with checkboxes, access level + publish toggles, import summary), registered as a section in the admin shell.
- `/quiz` and the SAT subject labels pick up the new exam type automatically from the bank; add SAT to the Nigerian/international exam catalog labels so the filter reads nicely.
- Verification: run a real import of a small batch through the admin UI with Playwright, then confirm the questions render correctly (MathML + choices + explanation) in /quiz.
