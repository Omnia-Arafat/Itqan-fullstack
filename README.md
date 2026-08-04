# Itqan Academy — Quran Circles Management Platform

Registration, a live recitation queue, and attendance tracking for Itqan
Academy's Quran circles. Arabic-first with automatic RTL, English as a second
locale.

`docs/PROJECT_BRIEF.md` is the specification. `docs/BRAND.md` covers the visual
identity. `supabase/migrations/20260804150000_init.sql` is the source of truth
for the data model.

## Stack

- Next.js 16 (App Router, TypeScript) — `src/proxy.ts` replaces the old
  `middleware.ts` convention
- Supabase — Postgres, Auth, Realtime
- Tailwind CSS v4, mobile-first
- `next-intl` — Arabic default at `/`, English under `/en`

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a Supabase project, then copy `.env.example` to `.env.local` and fill
   in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from
   Settings → API Keys. The app boots without them — data-backed pages render a
   setup notice instead of crashing.

   The secret key (`sb_secret_…`, formerly `SUPABASE_SERVICE_ROLE_KEY`) is
   deliberately unused. Every public operation goes through a
   `SECURITY DEFINER` RPC, so it must never reach client code.

   The **database password** is a third, separate credential. The app never uses
   it; only the CLI does, for `link` and `db push`. It is shown once at project
   creation — if you no longer have it, reset it under
   Settings → Database → Database password. Resetting is safe here because
   nothing connects to Postgres directly.

3. Apply the schema, either through the CLI:

   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```

   or by pasting `supabase/migrations/20260804150000_init.sql` into the Supabase
   SQL editor.

   Migration filenames must keep the `<timestamp>_name.sql` form. The CLI
   *silently skips* files that don't match — `db push` reports success while
   applying nothing.

4. Create the first admin by following `supabase/seed/first-admin.sql`. This step
   cannot be done from the app: inserting a teacher row requires an existing
   admin, so the first one is linked by hand.

5. Start the dev server:

   ```bash
   npm run dev
   ```

## Routes

| Route | Access | Purpose |
|---|---|---|
| `/` | public | Landing page |
| `/register` | public | One-time student registration |
| `/circle/[slug]` | public, no login | Session link, name search, join today's queue |
| `/login` | public | Teacher and admin sign in |
| `/dashboard` | teacher | Circles meeting today, plus the teacher's other circles |
| `/dashboard/new` | teacher | Create a recurring circle |
| `/dashboard/circle/[id]` | teacher | Live queue, attendance, recitation status, reordering |

`/admin` and `/admin/reports` are Milestone C and not implemented yet.

## Architecture notes

- **Students never authenticate.** A circle's `registration_slug` is the only
  credential, and every student-facing operation goes through a
  `SECURITY DEFINER` RPC. The students table has no public `SELECT` policy.
- **The publishable key** (`sb_publishable_…`) is the current replacement for the
  legacy anon JWT. It is public by design; RLS and the `SECURITY DEFINER` RPCs
  are what constrain it.
- **Authorization lives next to the data**, in `src/lib/auth/dal.ts` and in RLS.
  `src/proxy.ts` performs a cookie-presence check only, as an optimisation — it
  is not a security boundary, and it never queries the database because Proxy
  also runs on prefetches.
- **Male/female separation is enforced at three levels**: a trigger on
  `attendance_records`, a filter inside `search_students()`, and the app's own
  queries.
- **The queue is Realtime, not polled.** An event on `attendance_records` is only
  a signal to refetch `circle_queue()`; the payload carries no student names.
- **Session dates resolve in each circle's own timezone**, so a 05:00 Riyadh
  circle is recorded on the correct day.
- **Server actions re-check authorization.** They are public endpoints, so a
  page-level check is never treated as sufficient.
- **Auth checks are not placed in layouts.** A layout does not re-render on
  navigation and does not stop nested segments from rendering, so the checks sit
  in pages and actions instead.

## Commands

```bash
npm run dev            # dev server
npm run build          # production build
npm run lint           # eslint
npx tsc --noEmit       # type check
npm run brand:assets   # regenerate icons and lockups from docs/BRAND.md tokens
```

### Windows note

Build from the directory's exact on-disk casing (`Itqan-fullstack`). Node keys
modules by path string, so a case-mismatched working directory loads two copies
of Next.js's internal async storage and every prerender fails with
`Invariant: Expected workStore to be initialized`.
