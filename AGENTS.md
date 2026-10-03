# Project architecture rules

- Programme pricing and schedule limits come from `programme_plan_settings`; keep client fallbacks only for loading resilience so admin edits remain authoritative.
- Topical and yearly past-question subjects come from `programs` and `subjects`; persist `subject_id` as the relationship and keep `subject_key` only for public-route compatibility.