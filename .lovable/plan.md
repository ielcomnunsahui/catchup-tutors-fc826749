# Align past questions with admin programmes and subjects

## Goal
Make the Topical and Yearly Past Questions areas use the same programme and subject records managed under Admin → Programmes and Admin → Subjects.

## Changes
- Load published and unpublished programmes and subjects from the database for both admin past-question tools.
- Add programme-first filtering, then show only subjects belonging to that programme.
- Store stable subject relationships on topical questions and yearly past papers, while retaining existing subject keys for compatibility.
- Backfill existing records where their legacy subject key matches an admin subject slug.
- Show clear empty and loading states when a programme has no subjects.
- Keep existing public resources working while changing their labels and grouping to the shared catalogue.

## Technical details
- Add nullable `subject_id` foreign keys to `topic_questions` and `past_papers` referencing `subjects(id)` with indexes.
- Update admin reads and writes to select and persist `subject_id`; retain `subject_key` as a compatibility snapshot.
- Centralize catalogue loading and label generation in the past-paper library.
- Verify type safety, database migration, and both admin flows.
