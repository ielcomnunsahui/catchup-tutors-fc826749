# Managed Public Catalogue and SAT Bank

## Goal
Make `/resources` and `/programs` display the same published programmes and subjects managed in Admin, and organize SAT practice around the official digital SAT structure.

## Changes
- Replace the hardcoded programme and subject choices on `/resources` with published records from `programs` and `subjects`.
- Preserve existing public links by accepting legacy subject keys while using each subject's database ID to load yearly and topical content.
- Show clear loading, unavailable, empty-programme, and no-content states instead of silently falling back to unrelated sample papers.
- Update `/programs` counts and catalogue sections from the same managed records, while keeping exam-preparation pricing and the broader tutoring exam list intact.
- Link programme/subject cards directly to their matching filtered resource view where relevant.
- Reorganize SAT quiz filters and the admin importer as Digital SAT → section → domain → skill/topic → difficulty, with accurate availability counts.
- Keep College Board as the structured question source. Treat XtremePapers as a reference archive only unless its access/licensing permits direct use; do not scrape or import copyrighted files without a supported API or permission.
- Add a concise SAT practice entry on the public Resources and Programs pages that opens the SAT-filtered quiz bank.

## Technical details
- Use the existing shared `fetchManagedQuestionCatalogue()` query and React Query caching for public catalogue data.
- Extend managed subject display metadata without changing the database relationship: `subject_id` remains authoritative and `subject_key` remains compatibility data.
- Correct yearly/topical loaders to pass both the compatibility key and database subject ID, and index returned papers consistently.
- Derive SAT domain/topic choices from available published questions, preserving current math rendering and premium access rules.
- Verify desktop and mobile public flows plus build health; authenticated admin SAT importing will be source-checked where an admin browser session is unavailable.
