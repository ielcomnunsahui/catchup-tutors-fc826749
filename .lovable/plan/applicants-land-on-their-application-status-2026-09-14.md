# Applicants land on their application status

Right now anyone who applied to tutor but isn't approved yet signs in and lands on the student dashboard, with no sign their application exists. They have to find the apply page to see the status.

## What changes

1. **Sign-in routing** — after signing in, if the person has a tutor application that is still pending or needs changes, they go straight to their application status instead of the student dashboard.
2. **A status area inside the dashboard** — rather than trapping them on a separate page, add an "My application" item at the top of the student dashboard menu. It shows the same status card used today: reference code (CUT/APP/0001), current state (under review / approved / not successful / changes needed with the admin note), and the resubmit button when changes are requested.
3. **Banner everywhere else** — a slim strip at the top of the dashboard showing "Tutor application CUT/APP/0001 — under review" with a link to the status area, so they still keep full student access (resources, quiz, bookings) while waiting.
4. **Approved applicants** — unchanged: they are sent to the tutor workspace.
5. **Rejected applicants** — see the outcome once in the status area, no forced redirect; they continue as normal students.

## Why keep student access

Applicants are usually students too, and blocking the dashboard would remove access to resources they paid for or saved. Status-first landing plus a persistent banner gives the answer they want without taking anything away.

## Technical notes

- Extend `useStudentIdentity` in `src/hooks/use-student-data.ts` to also fetch the caller's latest `tutor_applications` row (`id, ref_code, status, admin_feedback`), returned as `application`.
- Extract the existing `ApplicationStatus` component out of `src/pages/TutorApply.tsx` into `src/components/tutor/application-status.tsx` and import it in both places — no duplicate markup.
- Add `application` to `StudentSectionId` and a new first group in `STUDENT_GROUPS` (`src/components/student/student-shell.tsx`), rendered only when an application exists (shell takes an optional filter of visible section ids).
- `Dashboard.tsx`: default `section` to `application` when one exists and the URL hash is empty; render the status panel in the panel map; add the banner above the shell.
- `Auth.tsx`: after the existing admin/approved-tutor checks, query the caller's application and navigate to `/dashboard#application` when it is `pending` or `changes_requested`.
- No database or policy changes; existing RLS already lets a user read their own application.
