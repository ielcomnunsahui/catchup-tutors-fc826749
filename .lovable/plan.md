# Close tutor applications on 13 September 2026

## Outcome
Tutor applications will close automatically at **12:00 midnight after 13 September 2026 (Africa/Lagos time)**. Visitors can still open the application page to see the closing notice, while existing applicants can continue viewing their application status.

## Changes
- Remove both “Apply as Tutor” prompts currently shown on the homepage: the button in the main banner and the separate “Join the team” section.
- Replace the application form on `/tutors/apply` with a clear closed state stating: **“Tutor applications closed on 13 September 2026.”**
- Keep existing applicants’ status, reference number, feedback, and approved-account access available after closure.
- Enforce the same deadline in the submission service so direct or stale form submissions cannot create or resubmit applications after midnight.
- Use the `Africa/Lagos` timezone for the cutoff, avoiding device-time differences for visitors abroad.
- Leave the “Apply as a tutor” links on the public tutor listing in place; after the deadline they will lead to the closed notice rather than a form.

## Technical details
- Define the cutoff as `2026-09-14T00:00:00+01:00` (the instant immediately after 13 September ends in Lagos).
- Check the cutoff before showing a new/resubmission form and before processing uploads or creating an account.
- Return a clear closed response from the submission service if an outdated browser attempts submission.
- Verify the homepage, closed application page, existing-application status view, and submission rejection on mobile and desktop.
