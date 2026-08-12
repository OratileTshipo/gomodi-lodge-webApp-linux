# E2E Testing — Gomodi Guest Lodge

Playwright suite covering **every page, form, and interactive flow** on the site,
plus loading-time budgets and accessibility smoke checks. **82 tests across
11 spec files**, each run on desktop **and** mobile viewports (perf on desktop only).

## Quick start

The site is DB-backed, so the suite needs a Postgres to run fully:

```bash
# 1. Point DATABASE_URL at your local Postgres (your normal dev setup)
# 2. Create the schema + seed data (idempotent, safe to re-run)
npm run db:push
npm run db:seed

# 3. Run the suite (Playwright auto-starts `npm run dev`, reuses one already running)
npm run e2e

# Headed (watch it run), and perf-only:
npm run e2e:headed
npm run e2e:perf
```

First run: `npx playwright install chromium` (installed in CI automatically).

### Production-server mode (CI, strict budgets)

```bash
npm run build
E2E_SERVER=prod npx playwright test
```

### Against an already-running server (e.g. the Freebuff preview)

```bash
E2E_NO_WEBSERVER=1 E2E_BASE_URL=http://localhost:3000 npx playwright test
```

## What is covered

| Spec | Coverage |
|---|---|
| `site-shell` | Brand + nav + footer, branch modal routing, hero CTAs, 404 page |
| `home` | All 9 sections (`#stay`…`#contact`) exist/scroll, reviews strip, rooms preview |
| `booking` | **Full guest journey**: calendar dates → room → guest stepper → meals → details → payment (EFT/cash switch, POP upload) → consent gate → submit → success; breadcrumbs; unavailable-room grey-out |
| `rooms` | Room list + bath/shower labels, filter pills (All/Double/Flexible), sorting, detail modal open/close |
| `events` | Inquiry form: event type, guest count, date, catering radios, consent gate, submit; "See rooms" link |
| `corporate` | Quote form: room lines add/remove, **live estimate math** (R750 × nights), meal add-ons, consent gate, submit |
| `review` | Token gating (missing/bogus tokens → invalid-link state), full review form with `E2E_REVIEW_TOKEN` (stars, feelings chips, byline, consent, submit) |
| `admin` | Unauthenticated redirect, OTP login → dashboard, queue pages, logout, unregistered-number enumeration check |
| `api` | `/api/ping` health, auth 401s, request-otp validation, upload validation, unknown-route 404, review-reminders |
| `links` | Crawls every internal link from the 6 main routes — 5xx fails, 404s warn |
| `perf` | LCP / FCP / DOMContentLoaded / Load / TTFB budgets per page + hero image actually loads |
| `a11y` | One h1 per page, `alt` on every image, accessible names on buttons, labelled inputs, no duplicate ids |

## How it stays green without a database

Every spec pings `/api/ping` (a real DB round-trip) via the `dbReady` fixture.
Without a healthy backend, DB-dependent specs **skip themselves** instead of
failing — so the suite never breaks a DB-less preview, and runs fully in CI
(which spins up a Postgres service, pushes the schema, and seeds).

## Env knobs

| Env var | Effect |
|---|---|
| `E2E_BASE_URL` | Target server (default `http://localhost:3000`) |
| `E2E_PORT` | Port for the auto-started server |
| `E2E_SERVER=prod` | Auto-start `npm run start` (needs a prior build) + strict perf budgets |
| `E2E_PERF=1` | Force strict perf budgets in dev |
| `E2E_NO_WEBSERVER=1` | Don't start a server — use `E2E_BASE_URL` |
| `E2E_REVIEW_TOKEN` | A real review invite token to exercise the review form |

## Notes / gotchas

- **Admin OTP** is only shown on-screen in non-production servers
  (`NODE_ENV !== "production"`). Local dev mode and `npm run dev` show it; in
  prod the login test skips gracefully (WhatsApp-delivered OTP isn't
  machine-readable). The request-OTP rate limiter (3/phone/10 min) means heavy
  re-runs of the admin spec can skip — that's the limiter doing its job.
- **Perf budgets**: strict budgets (LCP < 4.5s) are enforced with
  `E2E_SERVER=prod`. In dev mode the budgets are deliberately relaxed because
  on-demand compilation isn't a fair measurement.
- **Seeding is destructive** (`TRUNCATE … CASCADE`) — run `db:seed` on a dev
  DB, never production.
- Booking/quote/inquiry submissions create real rows on every run (unique
  phone/email per run keep them identifiable as `e2e-*` test data).

## CI

`.github/workflows/ci.yml` runs the whole suite on every PR and push to
`dev`/`main`: Postgres service → `db:push` + `db:seed` → build → Playwright
(production server, strict budgets) → report artifact on failure.
