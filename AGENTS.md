# Project architecture rules

- Programme pricing and schedule limits come from `programme_plan_settings`; keep client fallbacks only for loading resilience so admin edits remain authoritative.
- Topical and yearly past-question subjects come from `programs` and `subjects`; persist `subject_id` as the relationship and keep `subject_key` only for public-route compatibility.
- Applicant exports fetch every page under existing RLS; email recipients are resolved server-side from application IDs after an admin role check to prevent arbitrary-recipient abuse.
- Resend connector credentials use the shared gateway sender, never the direct provider endpoint; batch applicant updates use one private recipient per email and stable per-batch idempotency keys to make retries safe.