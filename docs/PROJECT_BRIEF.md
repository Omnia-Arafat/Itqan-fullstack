# Itqan Academy — Quran Circles Management Platform

**Brief v2 — corrected.** This supersedes the v1 draft. Section 6 lists every change
made to v1 and why, so nothing was silently altered.

---

## 1. Background & Problem

Itqan Academy runs a free Quran memorization program, currently coordinated by hand
over WhatsApp (one group for men, one for women). Daily circles ("halaqat") run on a
fixed schedule in three types: recitation correction (*tasheeh*), *tajweed*, and free
recitation review (*tasmee' hurr*). Sessions happen over external links (Google Meet,
Zoom, Telegram) shared manually. Some female teachers also run small independent
groups on their own schedules.

Manual coordination causes: no reliable attendance queue, no attendance history,
repetitive link-sharing, no record of who finished their turn, and no system-level
separation between male and female circles.

## 2. Objectives

| Goal | Measure |
|---|---|
| Simplify student registration | One-time public form |
| Auto-organize the attendance queue | Visible ordered queue per circle |
| Documented attendance | One record per student per circle per day |
| Track recitation status | One-click status per student |
| Centralize session links | One link per circle, no manual sharing |
| Periodic attendance reports | Ranking over any date range |
| Near-zero running cost | Vercel + Supabase free tier |

## 3. Roles

| Role | Permissions |
|---|---|
| **Admin** | All circles, all teachers, all students, full attendance reports |
| **Teacher** | Only their own circles: create, mark attendance, mark recitation, set link |
| **Student** | One-time registration, daily search-and-join; never logs in |

Admin and teacher are the same table (`teachers`) distinguished by `role`. Students
have no account at all — a circle's `registration_slug` is the only credential
needed to reach its page.

**Male/female separation is enforced at three levels:** a database trigger on
`attendance_records`, the `gender_category` filter inside `search_students()`, and
the app's own queries. Not by convention.

## 4. Core Principle — One-Time Registration, Permanent Identity

Each student gets **one** `students` row, created once. Afterwards they are found by
**name search**, never re-registration. Every attendance record points back to that
same `student_id`, which is what makes daily/weekly/monthly/yearly reporting possible.

## 5. MVP Features

### 5.1 Public registration — `/register`
Fields: name (required), father's name (required, disambiguates common names),
WhatsApp number (optional), gender category. Before insert, call
`find_similar_students()` and warn if an identical name + father's name already
exists for that gender — a warning, not a block, since real duplicates happen.

### 5.2 Circle creation — `/dashboard/new`
Fields: circle name, type, gender category, session link, **timezone**, **start time**,
**days of week**, and an auto-generated `registration_slug`. The teacher is taken from
the authenticated session — it is *not* a form field. The slug is a **permanent
per-circle link**, not a new link each day; the session date is derived from the
server clock in the circle's timezone.

### 5.3 Circle page — `/circle/[slug]` (public, no login)
Shows circle name and session link at the top (5.7). Autocomplete search by name via
`search_students(slug, query)` — minimum 2 characters, returns at most 10 results,
each showing the father's name, restricted to the circle's gender. Selecting a result
calls `join_circle()`, which inserts the attendance record and returns the queue
position. Joining twice in one day is idempotent. If the name isn't found, show a
clear link to `/register`.

### 5.4 Queue list
Ordered by join time; `queue_order` is assigned server-side under a per-circle-per-day
advisory lock so simultaneous joins can't collide. The teacher can reorder manually
via `reorder_queue()`. Per-student recitation status: `waiting` / `reciting` / `done`.

### 5.5 Attendance marking
`pending` → `present` / `absent`, one click, tied to `student_id` + `circle_id` +
`session_date`. Only the circle's own teacher (or an admin) can write it.

### 5.6 Recitation status
Same, via the `recitation_status` column. Updates propagate over Realtime.

### 5.7 Session link
Displayed at the top of both the public circle page and the teacher's view.

### 5.8 Attendance report — `/admin/reports`
Date range (daily/weekly/monthly/yearly/custom), filterable by gender, circle, and
teacher. **"Attended" means `attendance_status = 'present'` only.** Records the
teacher never marked stay `pending` and are reported in their own column, so
undercounting is visible rather than silent.

### 5.9 Dashboards
`/dashboard` — teacher's circles **that meet today**, computed from `days_of_week` in
the circle's timezone. `/admin` — all circles plus the report.

## 6. Language (i18n)

- Full Arabic + English UI. **Arabic is the default.**
- **`next-intl`.** (`next-i18next` is Pages Router only and does not work with the App
  Router — it was listed as an option in v1 and is not viable.)
- Every string goes through i18n; no hardcoded text.
- `dir="rtl"` for Arabic, `dir="ltr"` for English, switched automatically with locale.
- Language choice persisted in a cookie and read server-side, so the first paint is
  already in the right direction.
- User-entered data (names, circle names) is never translated.

## 7. Screens

| # | Route | Auth | Feature |
|---|---|---|---|
| 1 | `/register` | public | 5.1 |
| 2 | `/circle/[slug]` | public | 5.3, 5.4, 5.7 |
| 3 | `/login` | public | teachers/admins only |
| 4 | `/dashboard` | teacher | 5.9 |
| 5 | `/dashboard/new` | teacher | 5.2 |
| 6 | `/dashboard/circle/[id]` | teacher | 5.4, 5.5, 5.6 |
| 7 | `/admin` | admin | 5.9 |
| 8 | `/admin/reports` | admin | 5.8 |

`/dashboard` was missing from the v1 screen list even though feature 4.9 required it.

## 8. Tech Stack

- Next.js (App Router, TypeScript) on Vercel
- Supabase — Postgres, Auth, Realtime
- Tailwind CSS, mobile-first
- `next-intl`, Arabic default, automatic RTL/LTR

Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client. The MVP does not need it:
every public operation goes through a `SECURITY DEFINER` RPC.

## 9. Data Model

`supabase/migrations/20260804150000_init.sql` is the source of truth. Summary of the
corrections it makes to the v1 schema:

| # | v1 problem | Fix |
|---|---|---|
| 1 | RLS enabled with no policies on `teachers` / `circles` insert-update → teachers literally could not create circles or read their own row | Full policy set keyed on `auth.uid()` |
| 2 | No admin concept anywhere, yet `/admin` is an MVP screen | `teachers.role` + `is_admin()` |
| 3 | Nothing stopped a male student joining a female circle | `trg_attendance_gender_match` trigger + gender filter in `search_students()` |
| 4 | `public read students` exposed every name and phone number to anyone | No public SELECT; `search_students()` returns name + father's name only, min 2 chars, max 10 rows |
| 5 | `public update attendance` let anyone flip anyone's attendance | UPDATE restricted to the circle's teacher or an admin |
| 6 | Circles modelled as one-off (`scheduled_at`) but described as daily recurring | `timezone` + `start_time` + `days_of_week` |
| 7 | `session_date default current_date` resolves in UTC — breaks early-morning (Fajr) circles | `session_date` computed in the circle's timezone by `join_circle()`; no default |
| 8 | `queue_order` racy and non-unique | Assigned under an advisory lock; deferrable unique `(circle_id, session_date, queue_order)` |
| 9 | Reorder impossible against a plain unique constraint | Constraint is `deferrable initially deferred`; `reorder_queue()` permutes in one transaction |
| 10 | `to_tsvector('simple', name)` can't serve substring autocomplete and ignores Arabic orthography | `pg_trgm` GIN over a generated `search_key` built by `normalize_ar()` (folds hamza/alef-maqsura/ta-marbuta, strips tashkeel and tatweel) |
| 11 | Report never defined what counts as attendance | `present` only; `pending` surfaced separately |
| 12 | `teachers.auth_user_id` not unique — two teacher rows could map to one login | `unique` |
| 13 | `small_groups` present in an MVP schema although explicitly Phase 2 | Removed |
| 14 | Realtime publication never mentioned | `alter publication supabase_realtime add table attendance_records` |

## 10. Build Order

Each milestone stops for review before the next begins.

**Setup** — Next.js + Tailwind + `next-intl` (ar default, auto RTL) + Supabase client +
`.env.local`; run `20260804150000_init.sql`.

**Milestone A** — `/register` and `/circle/[slug]`, bilingual from the first commit.
*Note:* the circle page needs a circle to exist, but circle creation lands in
Milestone B — seed one manually:

```sql
insert into public.teachers (name, gender_category, role)
values ('معلمة تجريبية', 'female', 'admin')
returning id;

insert into public.circles (teacher_id, name, type, gender_category, session_link,
                           timezone, start_time, days_of_week, registration_slug)
values ('<teacher-id>', 'حلقة التصحيح', 'tasheeh', 'female',
        'https://meet.google.com/xxx-xxxx-xxx',
        'Asia/Riyadh', '17:00', '{0,1,2,3,4}', 'tasheeh-evening');
```

**Milestone B** — teacher auth, `/dashboard`, `/dashboard/new`,
`/dashboard/circle/[id]` with Realtime queue, attendance, recitation status.

**Milestone C** — `/admin` and `/admin/reports`.

## 11. Non-Negotiable Rules

- Gender separation holds at the database level, not just in queries.
- Never create a second `students` row for someone already registered.
- Every UI string goes through i18n; Arabic is the default; RTL/LTR is automatic.
- Mobile-first — check small screens before desktop.
- The queue and recitation status use Realtime subscriptions, not polling. Treat the
  event as a signal to refetch `circle_queue()`; the payload has no student names.
- `SUPABASE_SERVICE_ROLE_KEY` never reaches client code.

## 12. Acceptance Criteria

- [ ] Teacher creates a circle and gets a shareable link in under a minute
- [ ] New student registers once and receives a permanent identity
- [ ] Returning student finds themselves by name; father's name disambiguates
- [ ] Arabic search matches across hamza and tashkeel variants (أحمد / احمد / أَحْمَد)
- [ ] Not-found search shows the registration link clearly
- [ ] A student cannot join a circle of the other gender, even via a direct API call
- [ ] Two students joining simultaneously get distinct queue positions
- [ ] A circle at 05:00 Riyadh records the correct `session_date`
- [ ] Queue and recitation status update without refresh
- [ ] Attendance and recitation are one click each
- [ ] Session link visible on the same page
- [ ] Report is accurate across daily/weekly/monthly/yearly ranges and states how many records are unmarked
- [ ] An unauthenticated request cannot read the students table or any session link without a slug
- [ ] UI correct in Arabic (default) and English with proper RTL/LTR
- [ ] Works well on mobile

## 13. Known Risks & Accepted Tradeoffs

| Risk | Handling |
|---|---|
| Two students with the same name | Father's name shown in results; optional phone as a further tiebreaker |
| Self-duplicate registration | Warning on identical normalized name + father's name; not blocked |
| **A leaked circle slug** | Accepted for MVP: anyone with the slug can see the session link, the day's queue names, and search students of that circle's gender. Rotate the slug if a link leaks. |
| **Registration spam** | `students` is publicly insertable with no rate limit. Acceptable at current scale; add a Turnstile/hCaptcha check or an Edge Function if abused. |
| Peak-time load | Free tier is comfortable at current volume; Realtime free tier caps at 200 concurrent connections — revisit if many large circles run at the same hour |
| Habit of staying on WhatsApp | Pilot with 1–2 circles first, then expand. The "replace WhatsApp in month 1" goal in v1 contradicted this — the pilot wins; full migration is a month-3 target. |

## 14. Out of Scope (Phase 2+)

Independent small groups, multi-level permissions, WhatsApp/email reminders,
long-term memorization progress, Excel export, Meet/Zoom API integration, native app.
