# Softer programme pricing and flexible daily lesson schedules

## What will change
- Restyle the Exam preparation programmes section to match the quieter visual weight of the rest of the Programs page: smaller headings and prices, lighter cards, restrained badges, and less prominent buttons.
- Keep each programme's required study days, while letting candidates choose how many lessons they want on each selected day and select a time for each lesson.
- Show a compact schedule summary before submission and in the enrolment confirmation.
- Expand Programme enrolments in Admin so administrators can view and update each candidate's days, lesson counts, and lesson times.
- Add programme controls in Admin for monthly price, required days per week, and minimum/maximum lessons per day. Public programme cards and enrolment forms will use these saved settings.

## Scheduling rules
- Candidates must select exactly the programme's required number of study days.
- Each selected day starts with one lesson and can be increased up to the programme's admin-configured daily maximum.
- Every lesson gets its own preferred time, allowing combinations such as two lessons on Monday at different times.
- The monthly programme fee remains fixed; selecting more lessons does not recalculate it.

## Technical details
- Add a public programme-plan table with admin-only editing and public reading.
- Add structured daily schedule data to programme enrolments and validate it when an enrolment is submitted.
- Replace hardcoded trigger pricing/day rules with the saved programme settings while retaining safe fee snapshots on enrolments.
- Update the enrolment page, programme cards, admin enrolment tools, shared programme data helpers, and generated database types.
- Verify the public programme and enrolment views on desktop/mobile, and run the project checks.
