# Project knowledge

Gomodi Guest Lodge — direct-booking website for a 9-room boutique guest house in Mafikeng, South Africa. Next.js 16.2 (App Router) + React 19 + TypeScript + Tailwind CSS v4 + Drizzle ORM + PostgreSQL. Three guest journeys (Leisure / Corporate / Events) feed one booking-request pipeline, with a staff admin area to review/approve.

## Commands

- Install: `npm install` (needs `DATABASE_URL` in `.env`)
- Dev: `npm run dev` → http://localhost:3000
- Build: `npm run build` — ⚠️ **currently fails on main** (see Gotchas)
- Lint: `npm run lint` — ~20 pre-existing errors
- DB schema: `npx drizzle-kit push`
- Seed (9 rooms + 6 test users): `npx tsx lib/db/seed.ts`
- Test: no automated tests; manual script `npx tsx scripts/test-booking.ts`

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
- `lib/motion.ts` — custom scroll-reveal/parallax hooks (no animation library)
- `components/` — `Nav`, `Footer`, `BranchModal` ("how are you visiting?" chooser), `PhotoPlaceholder` (colored div, no real photos), `FadeInObserver`

## Conventions

- **Page pattern**: server component fetches from DB → renders a client component → forms submit via Server Actions (`"use client"` pages + `"use server"` actions per feature folder). Actions validate, insert, and return `{ ok: true } | { ok: false; error }`.
- Public pages use `export const dynamic = "force-dynamic"` (live reads, no caching).
- Booking requests start `pending`; only **approved** bookings lock a room. Availability blocks overlap with approved bookings only; the admin dashboard flags conflicts (red = approved overlap, amber = pending overlap) and the approve endpoint re-checks server-side (409).
- Meal prices hardcoded: breakfast R175, dinner R300 pp/night (actions + forms).
- Brand palette (globals.css `@theme`): terracotta / walnut / cream / gold / ink. Reusable classes: `.pill-*`, `.btn-primary`, `.card-shadow`, `.motion-ready` + `motion-visible` for scroll reveal.
- Booking form + admin UI use a legacy **orange** palette — inconsistent with the marketing pages; don't treat it as the design source of truth.

## Gotchas

- **Build blockers on main (all 3 verified, must fix before any deploy):**
  1. `app/globals.css` ends inside `@media (max-width: 768px)` with the `.motion-ready, .motion-fade-*` rule block **never closed** — missing `}` `}`. PostCSS parse error.
  2. `lib/motion.ts` contains JSX (`PageTransition` returns `<div>`) but has a `.ts` extension → must be renamed to `.tsx`.
  3. `app/book/actions.ts` — `proofOfPayments` insert omits the required `fileName` column → TypeScript error.
- This machine (Node v20.20.2) also fails `next build` on **any** Next 16.2.12 app while prerendering `/_global-error` (`Cannot read properties of null (reading 'useContext')`) — framework/environment issue (vercel/next.js #84994). Not necessarily reproduced on Vercel. Custom `app/global-error.tsx` + `app/not-found.tsx` mitigate locally.
- Auth is dev-grade: `request-otp` returns the OTP in the response; `verify-otp` accepts any 6 digits; session cookie is unsigned JSON (8h, httpOnly).
- **Admin API routes have no server-side session checks** — only the dashboard UI calls `/api/auth/me`. Don't rely on the API being private.
- Booking form's POP file-drop only records a filename; it never calls `/api/upload`, so no proof of payment is actually stored yet.
- `tsconfig.tsbuildinfo` is committed to git — avoid committing incidental changes to it.
- Backup tag `backup/main-2026-08-05` (local + origin) marks the pre-fix state of main at commit `30ae2b9`. Restore: `git reset --hard backup/main-2026-08-05`.
- Branch `high-performance-motion-design-b72b3` is **behind** main (missing main's globals.css fix; package-lock.json deleted). Its feature work is already merged into main.
