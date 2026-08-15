# Gomodi Guest Lodge — Website

Direct-booking website for a 9-room boutique guest house in Mafikeng
(Mmabatho), South Africa. Three guest journeys — **Leisure**, **Corporate**,
and **Events** — feed one booking-request pipeline that's reviewed in a
private staff admin area, with auto-generated quotes and a guest review
system.

Built with **Next.js 16** (App Router) + **React 19** + **TypeScript** +
**Tailwind CSS v4** + **Drizzle ORM** + **PostgreSQL** (Neon). Deployed on
**Vercel**. Tested with **Vitest** (unit) + **Playwright** (E2E).

> **Work on `dev`** — it's the single source of truth. Production releases are
> PRs `dev` → `main`. See `SETUP-LOCAL.md` for full machine onboarding,
> `PROGRESS.md` for the shared agent progress ledger, and
> `E2E-TESTING.md` for the browser test suite.

## Pages

| Route | What it is |
| --- | --- |
| `/` | Homepage — 12 felt-experience sections incl. "What guests say" (approved reviews) |
| `/rooms` | All 9 rooms with filter / sort / detail modal (photos from the DB) |
| `/book` | Leisure booking wizard — calendar, room picker, meals, details, payment (EFT/cash + POP upload), consent |
| `/corporate` | Corporate multi-room quote request form |
| `/events` | Event / catering enquiry form (owned by **Lelz Business Enterprise**) |
| `/quote/[token]` | Public quote / invoice link (token-based, no login) |
| `/quote/[token]/pdf` | Printable PDF of the quote |
| `/review?token=…` | Guest review form — token-gated per booking, feelings chips, optional photo, POPIA consent |
| `/admin` | Staff login (phone OTP) |
| `/admin/dashboard` | Request queue, approve/decline, RBAC, staff time clock |
| `/admin/quotes` | Quote list + status filter |
| `/admin/quotes/[id]` | Quote line-item editor (totals, VAT, notes, Save draft / Send) |
| `/admin/reviews` | Review moderation queue (approve / decline) |

API routes: `/api/auth/*` (OTP login, session), `/api/admin/*` (requests,
quotes, reviews, time clock), `/api/upload` (Vercel Blob),
`/api/ping` (DB keep-alive, cron), `/api/review-reminders` (daily cron).

## How it works

- **One pipeline, three journeys** — leisure / corporate / event requests
  insert into `booking_requests` (status starts `pending`) plus
  category-specific details. The admin queue shows them all with role-scoped
  visibility.
- **Only approved bookings lock a room.** Availability blocks overlap with
  approved bookings only; the approve endpoint re-checks every room line
  server-side and returns a 409 on conflict.
- **Quotes are auto-generated** — every request gets a draft quote at
  submission time. The owner edits fees in `/admin/quotes/[id]`, then
  **Send** marks it `sent` and gives the guest a public token link + PDF.
  WhatsApp delivery fails open (logs the link) until credentials are set.
- **Guest reviews** — when an approved stay ends, the daily cron creates an
  unguessable invite (`review_invites.token`) and notifies the guest
  (WhatsApp, fails open). Reviews land `pending`, staff moderate in
  `/admin/reviews`, and approved ones render on the homepage. **No
  fabricated reviews** — every review traces to a booking; no consent → shown
  as "Guest".
- **Seasonal pricing** — a `seasonal_pricing` table + `lib/seasonal.ts`
  resolve per-night rates (e.g. festive windows), shared by the booking
  wizard and the quote engine. Base room rate lives in `lib/pricing.ts`
  (`ROOM_BASE_RATE = 750`, meals `BREAKFAST_PRICE`/`DINNER_PRICE`).
- **Auth is fully in-house** — phone OTP (rate-limited, SHA-256 hashed,
  constant-time verify, HMAC-signed session cookie). RBAC roles:
  `owner` / `assistant` / `staff` / `partner`.
- **Rate limiting** — `lib/rate-limit.ts`: Upstash Redis when
  `UPSTASH_REDIS_REST_URL` / `_TOKEN` are set, in-memory fallback otherwise;
  both fail open.
- **Lelz Business Enterprise partnership** — all events and standalone
  catering enquiries belong to Lelz (quoted/coordinated/delivered by them).
  Lelz has a `partner` role scoped to events; the Owner's assistant is the
  Events Manager with full visibility; `staff` users never see event data.
- **Design system** — terracotta / walnut / cream / gold / ink tokens in
  `globals.css`, custom scroll-reveal + parallax motion system (no animation
  library), WCAG AA contrast, fixed-header offset discipline.

## Commands

```bash
npm install            # install (needs DATABASE_URL in .env / .env.local)
npm run dev            # dev server → http://localhost:3000
npm run build          # production build (forces NODE_ENV=production)
npm run lint           # eslint (expect 0 errors)
npm test               # vitest unit tests (42 tests, lib/__tests__/)
npm run perf           # route benchmark (TTFB + headless FCP/LCP) — scripts/perf-bench.ts
npm run e2e            # Playwright suite (82 tests, e2e/) — needs chromium + seeded DB
npm run db:push        # sync DB schema (same as npx drizzle-kit push)
npm run db:seed        # seed rooms, staff users, seasonal pricing (⚠️ truncates — see below)
```

Manual regression scripts: `npx tsx scripts/test-booking.ts` (needs live DB),
`test-admin-queue.ts`, `test-quotes.ts`, `test-whatsapp-payload.ts` (DB-free).

## Database setup (Drizzle + Postgres)

The app reads `DATABASE_URL` from `.env` / `.env.local` (see
`drizzle.config.ts`). All database work is done with Drizzle Kit — no
migration files to maintain:

```bash
# 1. Create the tables / sync the schema to the DB.
#    Safe to run any time — it diffs and only applies what's missing.
#    Prints "No changes detected" when the DB already matches lib/db/schema.ts.
#    Use `--force` to skip the confirmation prompt.
npx drizzle-kit push

# 2. Seed the database (9 rooms, 7 test users incl. the Lelz partner, seasonal pricing windows).
npx tsx lib/db/seed.ts
```

Notes:

- Run `npx drizzle-kit push` after **any** commit that changes
  `lib/db/schema.ts` — e.g. the reviews/seasonal tables need one push after
  pulling work that added them.
- ⚠️ `seed.ts` **truncates and re-inserts** `rooms`, `users`,
  `booking_requests`, and `seasonal_pricing` (cascading to booking lines,
  add-ons, quotes). Any real bookings/quotes in the DB will be **deleted**.
  Run it only on a fresh database or when you're OK losing the current data.
- The Neon CI workflow (`.github/workflows/neon_workflow.yml`) runs the push
  automatically on a per-PR database branch — local runs are only needed for
  your own dev database.
- Full machine setup (Postgres, env files, checks) is in `SETUP-LOCAL.md`.

## Environment variables

| Key | Required | Used by |
| --- | --- | --- |
| `DATABASE_URL` | ✅ always | `lib/db/index.ts`, `drizzle.config.ts` |
| `SESSION_SECRET` | ✅ production | `lib/auth.ts` — HMAC key for session cookies (dev falls back to a constant) |
| `BLOB_READ_WRITE_TOKEN` | for uploads | `/api/upload` (Vercel Blob — review photos, POP) |
| `NEXT_PUBLIC_APP_URL` | for quote links | quote send route (falls back to `localhost:3000`) |
| `WHATSAPP_TOKEN` | for WhatsApp | `lib/whatsapp.ts` — Meta Cloud API permanent token |
| `WHATSAPP_PHONE_NUMBER_ID` | for WhatsApp | Meta Cloud API |
| `WHATSAPP_RECIPIENT` | for WhatsApp | E.164 lodge number for booking alerts |
| `WHATSAPP_*_TEMPLATE`, `WHATSAPP_LANGUAGE` | optional | template overrides (defaults built in) |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | optional | rate limiter — absent → in-memory fallback |

Do **not** set `NODE_ENV` in `.env` / `.env.local` — it breaks `next build`.
Secret values live in `.env.local`, never in git (see Known gaps).

## Deployment

- **Hosting:** Vercel (functions pinned to `regions: ["fra1"]`, near the
  Neon DB). Add the env vars above to the project settings, then run
  `npx drizzle-kit push` + seed against the production database.
- **Crons** (`vercel.json`): `/api/ping` keep-alive every 4 min +
  `/api/review-reminders` daily. ⚠️ Vercel Hobby allows one cron/day — full
  frequency needs Pro.
- **CI:** `.github/workflows/ci.yml` gates every PR / push on `npm ci` →
  `tsc --noEmit` → `lint` → `vitest`, plus an `e2e` job that runs the
  Playwright suite against a Postgres service.
- **Neon PR previews:** `.github/workflows/neon_workflow.yml` creates an
  isolated DB branch per PR, runs the drizzle push, posts a schema diff, and
  auto-deletes the branch on close. Requires GitHub secrets `NEON_API_KEY` +
  `NEON_PROJECT_ID`.
- **Git workflow:** `dev` is the single source of truth; `main` receives
  changes only via release PRs `dev` → `main` (user-approved promotion).
  Feature/fix branches are cut from `dev` and merged via PR review.

## Known gaps (pre go-live)

- **WhatsApp notifications are stubbed** — `lib/notifications.ts` /
  `lib/whatsapp.ts` log to the console instead of sending until real Meta
  Business credentials + approved templates (`gomodi_otp`, `gomodi_booking_alert`,
  `gomodi_booking_status`, `gomodi_quote_link`, `gomodi_review_request`) are
  configured. Nothing breaks; messages just appear in server logs.
- **Live WhatsApp number is a placeholder** (`"#"` in `lib/contact.ts`) —
  needs the owner's real number.
- **`.env` / `.env.local` are still tracked in git** — a security flag.
  Fix (owner-side): `git rm --cached .env .env.local` in a dedicated PR and
  rotate any secrets that were ever pushed.
- **Real photography pending** — `rooms.images` is threaded from the DB with
  a seed fallback; some imagery still uses styled placeholder gradients
  (`PhotoPlaceholder`). The full photography program is specced in
  `UI-findings-and-recommendations.md`.
