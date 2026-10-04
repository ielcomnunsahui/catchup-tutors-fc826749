
# Migrate to Vite + React SPA

## Goal
Strip TanStack Start (SSR, file-based routing, server functions) and replace with a standard Vite + React 18 SPA using **react-router-dom v6**. Backend logic moves to **Supabase Edge Functions**. Deploy as static SPA on **Vercel**.

## What gets removed
- `@tanstack/react-start`, `@tanstack/react-router`, `@tanstack/react-router-devtools`, `@tanstack/react-router-with-query`, `@tanstack/router-plugin`, `@lovable.dev/vite-tanstack-config`, related SSR/server-fn packages.
- `src/router.tsx`, `src/start.ts`, `src/routeTree.gen.ts`.
- `src/routes/__root.tsx` (replaced by `App.tsx` with `<BrowserRouter>`).
- `src/routes/api/*` server routes.
- All `createServerFn` / `createFileRoute` / `useServerFn` calls.
- Auth middleware files (`auth-middleware.ts`, `auth-attacher.ts`) — no longer needed in a SPA; the browser Supabase client carries the session.
- `client.server.ts` — service-role access moves into edge functions.

## New structure
```
src/
  main.tsx              # ReactDOM.createRoot + BrowserRouter
  App.tsx               # <Routes> tree, providers (QueryClient, Toaster, Tooltip)
  pages/
    Index.tsx
    About.tsx
    Auth.tsx
    Contact.tsx
    Dashboard.tsx
    Admin.tsx
    Faq.tsx
    Pricing.tsx
    Privacy.tsx
    Programs.tsx
    ResetPassword.tsx
    Resources.tsx
    Sitemap.tsx          # (or move to /public/sitemap.xml static)
    Terms.tsx
    Testimonials.tsx
    Tutors.tsx
    NotFound.tsx
  components/
    site-shell.tsx       # keep, rewire Link → react-router Link
    content-page.tsx     # keep
    ProtectedRoute.tsx   # client-side auth gate wrapping <Outlet/>
    AdminRoute.tsx       # role check via supabase.rpc('has_role')
  integrations/supabase/client.ts   # unchanged (browser client)
  hooks/, lib/, assets/, styles.css
index.html               # standard Vite entry
vite.config.ts           # @vitejs/plugin-react + path alias only
vercel.json              # SPA rewrite: all routes → /index.html
```

## SEO approach
Install **react-helmet-async**. Each page wraps its head tags in `<Helmet>` (title, description, OG, Twitter, JSON-LD). This is client-rendered — accepted trade-off per your answer. Keep `public/robots.txt` and add a static `public/sitemap.xml`.

## Backend changes
- All current `createServerFn` handlers in `src/lib/*.functions.ts` are converted to **Supabase Edge Functions** under `supabase/functions/<name>/index.ts` (Deno runtime, CORS headers, JWT validation via `Authorization` header).
- Public reads → call browser supabase client directly (RLS already covers `TO anon` policies).
- Privileged writes (admin operations, role grants) → edge functions using `SUPABASE_SERVICE_ROLE_KEY`.
- Client calls them via `supabase.functions.invoke('fn-name', { body })`.

## Routing & guards
- Public routes: rendered directly in `<Routes>`.
- Authenticated routes: wrapped in `<ProtectedRoute>` that checks `supabase.auth.getSession()` and redirects to `/auth` if missing.
- Admin route: `<AdminRoute>` additionally calls `has_role` RPC.
- 404: catch-all `<Route path="*" element={<NotFound/>}/>`.

## Vercel config
`vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
Build command: `vite build`. Output: `dist/`.

## Migration steps (single agent pass)
1. Update `package.json`: remove TanStack/SSR deps, add `react-router-dom`, `react-helmet-async`.
2. Rewrite `vite.config.ts` to use `@vitejs/plugin-react` only.
3. Create `index.html` at repo root with Vite entry.
4. Create `src/main.tsx` (ReactDOM root + BrowserRouter + providers).
5. Create `src/App.tsx` with full `<Routes>` tree.
6. Convert each `src/routes/*.tsx` → `src/pages/*.tsx`:
   - Drop `createFileRoute`, `Route.useSearch`, `head()`.
   - Replace `<Link to=... params=...>` with react-router `<Link to="/path">`.
   - Replace `useNavigate` from tanstack with react-router's.
   - Replace `head()` meta with `<Helmet>`.
   - Replace `useServerFn(fn)` calls with `supabase.functions.invoke(...)` or direct supabase queries.
7. Migrate `src/lib/*.functions.ts` handlers into `supabase/functions/<name>/index.ts`.
8. Delete `src/routes/`, `src/router.tsx`, `src/start.ts`, `src/routeTree.gen.ts`, `src/integrations/supabase/auth-middleware.ts`, `auth-attacher.ts`, `client.server.ts`.
9. Add `vercel.json`.
10. Update `tsconfig` if needed.

## Risks / things you lose
- **SSR meta tags**: link previews on social media will be generic until JS runs (Facebook/LinkedIn scrapers don't execute JS — they'll see the default title). The dynamic per-program OG tags built earlier will degrade.
- **Loader-based data prefetch**: pages will show loading states more often. Mitigated by react-query.
- **Type-safe routes**: gone. String paths only.
- **First-paint SEO score**: will drop for new/uncrawled URLs.

## What stays the same
- All UI components, styles, Tailwind config, shadcn components.
- Supabase database schema, RLS policies, migrations, storage buckets.
- Auth flow (email/password + Google OAuth).
- All page copy, founder info, testimonials, premium CTAs.

## Approve to proceed
This is a ~30+ file rewrite. Once you approve, I'll execute it in one batch. Reply **approve** to start, or tell me what to change.
