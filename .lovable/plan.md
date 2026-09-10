# Tutor journey: end-to-end review and fixes

A full pass over the tutor path — apply, get approved, sign in, work from a tutor dashboard, mark attendance.

## What works today

- The application form collects everything (background, subjects, curricula, philosophy, CV, passport photo with preview) and creates the applicant's account on submit.
- Admin reviews each application in one dialog, can approve / request changes / reject, and the applicant gets an email.
- Approving creates the tutor profile, grants tutor access, and the tutor then appears in the public tutor directory.
- Admin can suspend, reinstate or revoke a tutor.

## Gaps found

1. **No tutor home.** After approval a tutor lands on the student dashboard: it greets them as a learner, shows "saved resources", "avg. topic progress" and an "Unlock Premium" upsell, with tutor sections bolted underneath.
2. **A tutor cannot edit their own profile.** Photo, bio, subjects, qualifications and session prices can only be changed by an admin — even though the approval email tells the tutor to "complete your profile and set your pricing".
3. **A tutor cannot set availability.** The booking scheduler on the tutors page reads each tutor's weekly hours, but nothing anywhere writes them, so every tutor falls back to a generic 9am–8pm window.
4. **No application status for the applicant.** After submitting they only see a reference code. If admin asks for changes, there is no way to see the request or resubmit — and reopening the form errors with "you already have an application in progress".
5. **Attendance only ever shows one date per booking.** Bookings are weekly and recurring, but only the single first session date appears, so ongoing weeks can never be marked.
6. **Navigation is not tutor-aware.** Nothing in the top bar points an approved tutor to their workspace.
7. **Revoking a tutor** asks for confirmation with a plain browser popup instead of the styled confirmation used everywhere else in admin.

## What I'll build

### A. Tutor workspace (new page)
A dedicated tutor area at `/tutor`, with sign-in routing: approved tutors go there automatically, admins still go to admin, everyone else to the student dashboard.

Sections:
- Header with photo, name, reference code, rating and an Active / Suspended state.
- Snapshot cards: students, sessions this week, attendance still to mark, profile completeness.
- Upcoming sessions with student name, subject, time and join link.
- My students (as today, kept).
- Attendance to mark (see D).
- **My profile** — editable photo, headline bio, subjects, qualifications, years of experience and per-session pricing, saved by the tutor.
- **My availability** — a weekly grid where the tutor toggles the hours they teach; this is what students then see when booking.

### B. Application status for the applicant
A status panel on the application page for anyone signed in with an application: under review / changes requested (with the admin's message) / approved / not successful. When changes are requested, the form reopens pre-filled so they can resubmit, and the admin sees the update back in the pending queue.

### C. Navigation
When an approved tutor is signed in, the top bar shows a "Tutor workspace" entry alongside sign-out.

### D. Attendance for recurring sessions
Expand each confirmed booking into its weekly sessions from the start date up to today, so both tutor and student mark every week, not just the first. Keep the existing rule that each side can only change their own mark, keep the disagreement flag, and keep the admin view unchanged apart from now listing all weeks.

### E. Small fixes
- Replace the browser popup on "Revoke" with the styled confirmation dialog.
- Approval email wording matched to the new tutor workspace.

## Technical notes

- New route `src/pages/TutorDashboard.tsx` (`/tutor`), guarded by an approved `tutor_profiles` row for `auth.uid()`; `Auth.tsx` and `Dashboard.tsx` redirect approved tutors there.
- Tutor self-service needs RLS: an update policy on `tutor_profiles` for the owning `user_id` restricted to presentation columns (`is_approved` / `is_visible` / `rating` stay admin-only, enforced by a `BEFORE UPDATE` trigger), plus full CRUD policies on `tutor_availability` scoped to the owner's tutor profile. Photo uploads reuse the existing `tutor-uploads` bucket with a signed URL.
- Application status reads the caller's own `tutor_applications` row; resubmission extends `submit-tutor-application` to update an existing `changes_requested` row instead of rejecting it.
- Attendance session expansion is derived client-side from `preferred_start` + weekly cadence in `bio_details`, keyed on the existing `(booking_id, session_date)` unique index — no schema change.

## Out of scope

Tutor payouts, messaging between tutor and student, and tutor-initiated booking changes.
