# Local setup guide (work machine / second machine)

Everything the Freebuff sandbox **blocks me from doing** from the terminal —
creating the database, running Drizzle pushes, seeding, and untracking the
secret files — you do once per machine. This guide walks through it from a
fresh clone.

> Work on `dev`. Release to production via PR `dev` → `main`.

## 0. Prerequisites

| Tool | Minimum | Why |
|---|---|---|
| Node.js | 20+ (22 recommended) | Next.js 16 + Vitest + Playwright |
| npm | 9+ | Comes with Node |
| PostgreSQL | 14–16 | The app's database |
| Git | any | Already have the repo? Skip cloning |

**Windows:** use **Git Bash** for the commands below (npm scripts like
`E2E_SERVER=prod` are POSIX syntax). PowerShell also works for most steps.

Check what you have:

```bash
node -v && npm -v && psql --version
```

## 1. Get the code and branch

```bash
git clone <repo-url> && cd gomodi-lodge-webApp-linux
git checkout dev          # single source of truth
git pull                  # make sure you're current
```

## 2. Install dependencies

```bash
npm ci                    # exact versions from package-lock.json
```

## 3. Start a PostgreSQL database

**Option A — local Postgres** (if you have it installed):

```bash
# as the postgres superuser
psql -U postgres -c "CREATE USER gomodi WITH PASSWORD 'gomodi' CREATEDB;"
psql -U postgres -c "CREATE DATABASE gomodi OWNER gomodi;"
```

**Option B — Docker** (one command, no install):

```bash
docker run -d --name gomodi-db -e POSTGRES_USER=gomodi \
  -e POSTGRES_PASSWORD=gomodi -e POSTGRES_DB=gomodi \
  -p 5432:5432 postgres:16-alpine
```

If you already run Postgres locally on 5432, either use your own
credentials in the connection string or change the Docker port
(e.g. `-p 5433:5432`) and adjust `DATABASE_URL` to match.

## 4. Create `.env.local` (secrets live here, never in git)

Create a file named `.env.local` in the project root with **at least**:

```bash
DATABASE_URL=postgres://gomodi:gomodi@localhost:5432/gomodi
SESSION_SECRET=<any long random string, e.g. 32+ chars>
```

Optional keys (the app degrades gracefully without them):

```bash
# Uploads (proof-of-payment, review photos) — get a token at Vercel Blob
BLOB_READ_WRITE_TOKEN=
# Global rate limiting — otherwise an in-memory limiter is used
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
# Error monitoring — the SDK fails open (no-op) without a DSN
SENTRY_DSN=
# Source-map upload on Vercel builds — skip locally
SENTRY_AUTH_TOKEN=
```

- `DATABASE_URL` is the only required key to run the site locally.
- `SESSION_SECRET` is required in production; in dev the app falls back to a
  constant so local logins work out of the box.
- Want the same data as the home machine? `pg_dump` / `pg_restore` your home
  DB, or just re-seed — the seed creates all rooms, staff users, and seasonal
  pricing.

## 5. Create the schema and seed the data

The schema ships as versioned migrations in `drizzle/` (ADR 012). On a
**fresh** database, migrations apply everything from scratch:

```bash
npm run db:migrate  # apply drizzle/*.sql in order (idempotent, tracked)
npm run db:seed     # seed rooms, staff users, seasonal pricing
```

> If this DB was previously created with `drizzle-kit push` (no migration
> history), run the one-time adoption first:
> `npm run db:adopt && npm run db:migrate` — adopt marks the baseline
> migration as applied without re-running it, then migrate applies only
> what's newer.

> ⚠️ `db:seed` **truncates** `booking_requests`, `rooms`, `users`, and
> `seasonal_pricing` before inserting — run it on dev/scratch databases only,
> never production. Re-running is always safe and resets to a known state.

Confirm it worked:

```bash
psql postgres://gomodi:gomodi@localhost:5432/gomodi -c "\dt"
```

You should see tables like `rooms`, `users`, `booking_requests`,
`seasonal_pricing`, `reviews`, `review_invites`, `auth_otps`.

## 6. Run the site

```bash
npm run dev
# open http://localhost:3000
```

Admin login (`/admin`): enter a seeded phone, e.g. `+27820000001`
(Owner). In **dev mode the OTP is shown on screen** in the "Development
Mode" box — use it to sign in. Test accounts:

```
Owner:   +27820000001
Manager: +27820000002
Staff:   +27820000003
Partner: +27780784139
```

## 7. Run the checks (all of them)

```bash
npx tsc --noEmit      # typecheck
npm run lint          # lint (0 errors expected)
npm test              # unit tests (42)
npm run e2e           # full Playwright suite — see E2E-TESTING.md
```

First e2e run needs the browser:

```bash
npx playwright install chromium
```

## 8. The things the sandbox blocked me from doing

The one repo-hygiene task that has to happen on your side (once, in a
dedicated PR) — the secret files were committed by an earlier commit and the
platform refuses env-file operations:

```bash
git checkout -b chore/untrack-secrets
git rm --cached .env .env.local
git commit -m "Stop tracking env files"
git push -u origin chore/untrack-secrets
# open a PR into dev and merge
```

**Then rotate any real secrets that were ever pushed** (Neon database
password, Blob token): generate new values, put them in `.env.local` /
your hosting env, and revoke the old ones. The `.gitignore` rules already
prevent them from being re-added.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `db:migrate` can't connect | `DATABASE_URL` wrong / Postgres not running — test with `psql $DATABASE_URL` |
| `db:migrate` fails with "relation already exists" | DB was push-created — run `npm run db:adopt` once, then `db:migrate` again |
| Port 3000 in use | `E2E_PORT` / change `dev` to `next dev -p 3001` |
| `/api/ping` returns 500 | DB down or tables missing — re-run `db:migrate` |
| Admin login shows no OTP | You're on a production build (`npm run start`) — dev OTP only exists in dev mode |
| `npm run e2e` fails to launch browser | `npx playwright install chromium` |
| "SESSION_SECRET must be set" | You're running a production build without it — set it in `.env.local` |
