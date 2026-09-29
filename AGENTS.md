# Project architecture rules

- Programme pricing and schedule limits come from `programme_plan_settings`; keep client fallbacks only for loading resilience so admin edits remain authoritative.