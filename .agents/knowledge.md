# Project knowledge

Gomodi Guest Lodge — direct-booking website for a 9-room boutique guest house in Mafikeng, South Africa. Next.js 16.2 (App Router) + React 19 + TypeScript + Tailwind CSS v4 + Drizzle ORM + PostgreSQL. Three guest journeys (Leisure / Corporate / Events) feed one booking-request pipeline, with a staff admin area to review/approve.

## Commands

- Install: `npm install` (needs `DATABASE_URL` in `.env`)
- Dev: `npm run dev` → http://localhost:3000
- Build: `npm run build` — ⚠️ **currently fails on main** (see Gotchas)
- Lint: `npm run lint` — ~20 pre-existing errors
- DB schema: `npx drizzle-kit push`
- Seed (9 rooms + 6 test users): `npx tsx lib/db/seed.ts`
- Test: no automated test runner; manual scripts: `npx tsx scripts/test-booking.ts` and `npx tsx scripts/test-admin-queue.ts` (DB-free regression for the admin queue logic)

## Key code locations

- `app/page.tsx` — homepage (server, force-dynamic)
- `app/rooms/` — `RoomsExplorer.tsx` (filter/sort/detail modal), `loading.tsx`
- `app/book/` — `BookingForm.tsx` (4-step wizard, custom calendar) + `actions.ts`
- `app/corporate/` — multi-room quote form + `actions.ts`
- `app/events/` — event inquiry form + `actions.ts`
- `app/admin/` — `AdminLogin.tsx` (OTP) + `AdminDashboard.tsx` (approve/decline, RBAC, time clock)
- `app/api/` — auth (`request-otp`, `verify-otp`, `me`), `admin/requests`, `admin/time-clock`, `upload` (Vercel Blob)
- `lib/db/schema.ts` — all tables; `lib/db/availability.ts` — overlap check; `lib/db/seed.ts`
- `lib/notifications.ts` — WhatsApp notifier (**stubbed**: console.log only)
- `lib/motion.tsx` — custom scroll-reveal/parallax hooks + `MotionObserver` (adds `motion-visible` to `.motion-ready` elements; mounted in layout). No animation library.
- `components/` — `Nav` (fixed header, ~73px), `Footer` (prominent "Iphe Lerato" motto), `BranchModal` ("how are you visiting?" chooser), `PhotoPlaceholder` (colored div, no real photos), `FadeInObserver`

## Conventions

- **Page pattern**: server component fetches from DB → renders a client component → forms submit via Server Actions (`"use client"` pages + `"use server"` actions per feature folder). Actions validate, insert, and return `{ ok: true } | { ok: false; error }`.
- Public pages use `export const dynamic = "force-dynamic"` (live reads, no caching).
- Booking requests start `pending`; only **approved** bookings lock a room. Availability blocks overlap with approved bookings only; the admin dashboard flags conflicts (red = approved overlap, amber = pending overlap) and the approve endpoint re-checks server-side (409).
- Meal prices hardcoded: breakfast R175, dinner R300 pp/night (actions + forms).
- Brand palette (globals.css `@theme`): terracotta / walnut / cream / gold / ink. Reusable classes: `.pill-*`, `.btn-primary`, `.card-shadow`.
- **Motion system** (replicated across all public pages): `.page-transition` on `<main>`; hero zoom (`motion-zoom-out motion-ready`) + staggered `motion-fade-up motion-ready` hero text; cards `motion-scale-in motion-ready` with `data-stagger="1..8"`; split sections `motion-fade-left/right`. `MotionObserver` (in layout) reveals `.motion-ready` on scroll. Elements that mount **after** load (success screens, filtered grids) must use **`.motion-pop`** — a mount-safe CSS animation (no observer) — never bare `motion-scale-in`/`motion-ready` (they stay `opacity: 0`).
- **Header**: `Nav` is a **fixed** top bar (~73px). `app/layout.tsx` wraps page content in `pt-[73px]` so every hero starts below it. Rooms filter bar sticks at `top-[73px]` to match.
- Admin UI still uses a legacy **orange** palette; booking form was unified to brand colors (Aug 2026).

## Gotchas

- The 3 original build blockers (unclosed `globals.css` media block, `lib/motion.ts` → `.tsx` rename, missing `fileName` in POP insert) are **fixed on main** (commits `8690d0b`+).
- **Local build FIXED (Aug 6):** `npm run build` previously hung/crashed on this machine while prerendering `/_global-error` (`Cannot read properties of null (reading 'useContext')` — tracked upstream as vercel/next.js #84994). Root cause on this machine: `NODE_ENV="development"` was set in `.env`/`.env.local` (and exported by the tool runtime), which Next.js forbids. Fix: removed `NODE_ENV` lines from the env files and changed the npm script to `"build": "NODE_ENV=production next build"`. Build now passes locally (~30s). Vercel deploys unaffected.
- **Auth (hardened Aug 2026):** `request-otp` rate-limits (3/10 min per phone) and stores a SHA-256 OTP hash with 10-min expiry; `verify-otp` checks the hash constant-time with a 5-attempt lockout and mints an **HMAC-signed** session cookie (8h). Set `SESSION_SECRET` in production (dev falls back to a constant). **`/api/admin/*` now enforce server-side guards** (`requireManager` = owner/assistant for requests approve/decline; `requireStaff` = any logged-in user for time-clock); unauthenticated calls get 401. The dev OTP box still works (NODE_ENV != production returns `devOtp`).
- Booking form's POP file-drop only records a filename; it never calls `/api/upload`, so no proof of payment is actually stored yet.
- `tsconfig.tsbuildinfo` is committed to git — avoid committing incidental changes to it.
- Backup tag `backup/main-2026-08-05` (local + origin) marks the pre-fix state of main at commit `30ae2b9`. Restore: `git reset --hard backup/main-2026-08-05`.
- Branch `high-performance-motion-design-b72b3` is **behind** main (missing main's globals.css fix; package-lock.json deleted). Its feature work is already merged into main.

## Browser testing (this machine)

No system-level browsers (no sudo), but all three are installed user-space and on PATH via symlinks in `~/.nvm/versions/node/v20.20.2/bin`:

- `google-chrome` / `chromium` → Playwright Chromium 149 (`~/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome`) — works with the browser-use agent (CDP).
- `firefox` → Playwright Firefox 151 (`~/.cache/ms-playwright/firefox-1532/firefox/firefox`) — headless renders; **`--dump-dom` unsupported**, use `--screenshot` to verify rendering.
- `msedge` / `microsoft-edge` → Edge 151 extracted from `.deb` (`~/edge-pkg/opt/microsoft/msedge/msedge`) — CDP, works headless.
- Headless invocation: Chrome/Edge need `--headless --no-sandbox --disable-gpu`; this is a container without a display, so `--headless` (or `MOZ_HEADLESS=1` for Firefox) is required.
- The symlinks are tied to the current nvm Node version dir — re-create them if Node is upgraded. Raw binaries live in `~/.cache/ms-playwright/` and `~/edge-pkg/` (survive node changes).
