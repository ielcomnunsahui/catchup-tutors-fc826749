# Admin programmes and subjects reliability

## Goal
Make the admin Programmes and Subjects sections safe and easy to recover from: clear validation, readable service errors, visible load failures, and dependable retry behaviour without blanking the admin console.

## Changes
- Add a shared admin error formatter that converts duplicate names/slugs, linked-record deletion failures, permission/session problems, network failures, and unknown service errors into plain guidance.
- Upgrade the shared table loader to retain its failure state and display an inline retry panel instead of silently showing an empty list.
- Improve Programme and Subject forms with specific field validation messages, disabled creation when required parent data is unavailable, save progress, and success messages naming the item and action.
- Make publish and delete flows preserve the current list on failure, avoid unnecessary reloads, and explain why linked programmes or subjects cannot be deleted.
- Improve the error boundary with section-specific recovery, navigation back to the admin dashboard, an optional technical-detail disclosure, and reset behaviour when its section changes.
- Verify the Programmes and Subjects flows in the signed-in preview, including validation, navigation, and visible failure/retry states where safely reproducible.

## Technical details
- Keep the existing Supabase tables and permissions unchanged.
- Keep changes scoped to shared admin presentation/error handling and the Programmes/Subjects panels.
- Preserve existing design tokens and admin navigation patterns.
