# Branded reference codes for tutor applications

## What's happening now

The tutor application record has no reference field of its own, so the application page and the confirmation simply print the database row's internal ID — the long `acf6056d-c064-...` string. Approved tutors already get a proper branded code (`CUT/XX/001`), but applicants never do.

There are 89 applications already stored, dating from 15 Aug 2026.

## What I'll change

1. Give every tutor application its own branded reference: **`CUT/APP/0001`**, numbered in order of submission.
2. Backfill all 89 existing applications in order of their submission date, so the earliest becomes `CUT/APP/0001`. Nobody's reference changes afterwards, and no two can collide.
3. New applications get their code automatically the moment they are submitted.
4. Show that code everywhere the long ID appears today:
   - the "Application received" confirmation after submitting
   - the application status panel (under review / changes needed / approved / not successful)
   - the confirmation email to the applicant
   - the admin review list and review dialog, so support can match an applicant to the code they quote
5. When an application is approved, the tutor's existing `CUT/XX/001` code stays as their tutor ID — the application code remains on the application record as its audit trail.

## Technical notes

- Migration: add `ref_code text unique` to `public.tutor_applications`; a `BEFORE INSERT` trigger function (SECURITY DEFINER, `set search_path = public`) formats `'CUT/APP/' || lpad(n::text, 4, '0')` from a sequence-style max-count, matching the existing `set_tutor_ref_code` / `set_booking_ref_code` pattern.
- Backfill with a single `UPDATE ... FROM (select id, row_number() over (order by created_at) ...)` before the unique index is relied on.
- No new grants needed (column on an existing table); existing RLS already scopes reads to the owner and admins.
- `TutorApply.tsx`: select `ref_code` with the existing application row, pass it to `ApplicationStatus` instead of `existing.id`, and use the value returned by `submit-tutor-application` for the post-submit confirmation.
- `submit-tutor-application` returns `ref_code` in its response; `send-tutor-application` includes it in the email body.
- `admin/tutor-applications-tab.tsx`: add the code as a column and in the dialog header.

## Question left open

If you'd rather the prefix read `CT/T/0001` exactly as you wrote it, say so and I'll use that instead of `CUT/APP/0001` — the rest of the plan is unchanged.
