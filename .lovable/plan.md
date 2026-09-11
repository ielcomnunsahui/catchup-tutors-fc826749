# Update the Free Summer Lessons 2026 · Ilorin banner

## Goal
Replace the image used for the "Aug – Sep 2026 Free Summer Lessons 2026 · Ilorin" past-event card on `/events` with the newly attached banner.

## Changes
1. Upload the attached `summer2026-banner.jpg` as a Lovable Asset and create its pointer file under `src/assets/events/`.
2. Update `src/pages/Events.tsx` so that `s26.banner` points to the new asset URL instead of `/summer2026-banner.jpeg`.
3. Remove the now-unused `public/summer2026-banner.jpeg` file to keep the repo clean.
4. Verify the `/events` preview shows the new banner in the "Already done" section.

## Out of scope
- No text or layout changes to the Events page.
- No changes to other summer 2026 photos or sections.
