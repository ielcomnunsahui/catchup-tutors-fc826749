# Fixed monthly programme prices with "Enrol Now"

## What visitors will see
A new "Exam preparation programmes" section with eight price cards, each showing the monthly fee, days per week and an **Enrol Now** button:

| Programme | Monthly fee | Days/week | Note |
|---|---|---|---|
| SAT | ₦400,000 | 4 | English & Mathematics |
| WAEC | ₦200,000 | 4 | |
| GCE | ₦200,000 | 4 | |
| IGCSE | ₦250,000 | 4 | |
| JAMB | ₦150,000 | 4 | |
| GRE | ₦300,000 | 5 | |
| TOEFL | ₦200,000 | 4 | |
| IELTS | ₦200,000 | 4 | |

Placed on the Pricing page (top section) and linked from the Programmes page.

## Enrolment form (opens at /enrol/<programme>)
- Programme summary at the top (name, fee, days per week), programme can be changed.
- Personal details: full name, email, phone, gender, date of birth / age, state/city, parent or guardian name and phone (optional for adults).
- Academic details: current class or level, school, subjects of interest (SAT fixed to English & Mathematics), target exam date, target score/grade, notes.
- Schedule: pick available days (must pick exactly the programme's days — 4, or 5 for GRE) and a preferred class time (Morning, Afternoon, Evening, or a specific time slot).
- Submit shows a confirmation with a reference like CUT/ENR/0001 and emails the candidate and the team.

## Admin
A new "Programme enrolments" section in the admin console: search, filter by programme and status (new, contacted, enrolled, cancelled), view full details, update status, export CSV. Only admins can see enrolments.

## Payment
Out of scope for this step — the form collects the enrolment; the team follows up. Paystack online payment can be added afterwards using the existing setup.

## Technical details
- Programme list and prices in a shared `src/lib/programme-plans.ts`.
- New table `programme_enrolments` (programme, fee snapshot, days text[], preferred_time, personal/academic fields, status, ref_code, user_id nullable). Grants + RLS: anon/authenticated can INSERT only; admins SELECT/UPDATE via `is_admin()`. Ref-code trigger like tutor applications. Server-side check that days count matches the programme.
- Signed-in users get their user_id attached (from auth, not the form).
- Confirmation email via a small edge function using the existing Resend key.
- New route in App.tsx; new admin tab registered in admin-shell and Admin.tsx.
