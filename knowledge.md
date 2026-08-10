# Project knowledge

Gomodi Guest Lodge — direct-booking website for a 9-room boutique guest house in Mafikeng, South Africa. Next.js 16.2 (App Router) + React 19 + TypeScript + Tailwind CSS v4 + Drizzle ORM + PostgreSQL. Three guest journeys (Leisure / Corporate / Events) feed one booking-request pipeline, with a staff admin area to review/approve.

## Commands

- Install: `npm install` (needs `DATABASE_URL` in `.env`)
- Dev: `npm run dev` → http://localhost:3000
- Build: `npm run build` — **passes locally** (~30s; script forces `NODE_ENV=production`)
- Lint: `npm run lint` — ~20 pre-existing errors
- DB schema: `npx drizzle-kit push`
- Seed (9 rooms + 6 test users): `npx tsx lib/db/seed.ts`
- Test: no automated test runner; manual scripts: `npx tsx scripts/test-booking.ts` (needs live DB), `npx tsx scripts/test-admin-queue.ts` (DB-free regression for the admin queue logic), `npx tsx scripts/test-quotes.ts` (DB-free quote math + line building), `npx tsx scripts/test-whatsapp-payload.ts` (stubbed-fetch payload shapes)

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
- `components/` — `Nav` (fixed header, ~73px), `Footer` (prominent "Iphe Lerato" motto), `BranchModal` ("how are you visiting?" chooser), `PhotoPlaceholder`, `HeroSlideshow` (photo hero on home/rooms/events/corporate), `FadeInObserver`
- Real photos live in `public/images/` (rooms, reception, events, logos) — used by `HeroSlideshow` and `next/image`

## Conventions

- **Page pattern**: server component fetches from DB → renders a client component → forms submit via Server Actions (`"use client"` pages + `"use server"` actions per feature folder). Actions validate, insert, and return `{ ok: true } | { ok: false; error }`.
- Public pages use `export const dynamic = "force-dynamic"` (live reads, no caching).
- Booking requests start `pending`; only **approved** bookings lock a room. Availability blocks overlap with approved bookings only; the admin dashboard flags conflicts (red = approved overlap, amber = pending overlap) and the approve endpoint re-checks server-side (409).
- Meal prices live in `lib/pricing.ts` (breakfast R175, dinner R300 pp/night) — forms and marketing copy read from there; don't hardcode new copies.
- Brand palette (globals.css `@theme`): terracotta / walnut / cream / gold / ink. Reusable classes: `.pill-*`, `.btn-primary`, `.card-shadow`.
- **Motion system** (replicated across all public pages): `.page-transition` on `<main>`; hero zoom (`motion-zoom-out motion-ready`) + staggered `motion-fade-up motion-ready` hero text; cards `motion-scale-in motion-ready` with `data-stagger="1..8"`; split sections `motion-fade-left/right`. `MotionObserver` (in layout) reveals `.motion-ready` on scroll. Elements that mount **after** load (success screens, filtered grids) must use **`.motion-pop`** — a mount-safe CSS animation (no observer) — never bare `motion-scale-in`/`motion-ready` (they stay `opacity: 0`).
- **Header**: `Nav` is a **fixed** top bar (~73px). `app/layout.tsx` wraps page content in `pt-[73px]` so every hero starts below it. Rooms filter bar sticks at `top-[73px]` to match.
- Admin UI uses the **brand palette**; only semantic status colors remain (green approve / red decline / amber pending-conflict).

## Gotchas

- The 3 original build blockers (unclosed `globals.css` media block, `lib/motion.ts` → `.tsx` rename, missing `fileName` in POP insert) are **fixed on main** (commits `8690d0b`+).
- **Local build FIXED (Aug 6):** `npm run build` previously hung/crashed on this machine while prerendering `/_global-error` (`Cannot read properties of null (reading 'useContext')` — tracked upstream as vercel/next.js #84994). Root cause on this machine: `NODE_ENV="development"` was set in `.env`/`.env.local` (and exported by the tool runtime), which Next.js forbids. Fix: removed `NODE_ENV` lines from the env files and changed the npm script to `"build": "NODE_ENV=production next build"`. Build now passes locally (~30s). Vercel deploys unaffected.
- **Auth (hardened Aug 2026):** `request-otp` rate-limits (3/10 min per phone) and stores a SHA-256 OTP hash with 10-min expiry; `verify-otp` checks the hash constant-time with a 5-attempt lockout and mints an **HMAC-signed** session cookie (8h). Set `SESSION_SECRET` in production (dev falls back to a constant). **`/api/admin/*` now enforce server-side guards** (`requireManager` = owner/assistant for requests approve/decline; `requireStaff` = any logged-in user for time-clock); unauthenticated calls get 401. The dev OTP box still works (NODE_ENV != production returns `devOtp`).
- Booking form's POP file-drop only records a filename; it never calls `/api/upload`, so no proof of payment is actually stored yet.
- `tsconfig.tsbuildinfo` is committed to git — avoid committing incidental changes to it.
- Backup tag `backup/main-2026-08-05` (local + origin) marks the pre-fix state of main at commit `30ae2b9`. Restore: `git reset --hard backup/main-2026-08-05`.
- Branch `high-performance-motion-design-b72b3` is **behind** main (missing main's globals.css fix; package-lock.json deleted). Its feature work is already merged into main.
- **Hero slideshow fix (Aug 10, `2a343d3`):** `HeroSlideshow` root div used `className="relative overflow-hidden ${className}"` while every caller passes `absolute inset-0` — the duplicate `relative`/`absolute` made the slideshow collapse to **height 0**, blanking the heroes on home/rooms/events/corporate. Fixed by dropping `relative` from the component root. Do NOT re-add `relative` or `position` classes that conflict with the caller's `absolute inset-0`.
- **Branch note (Aug 10):** `main` is the active branch. The `.agents/` suite (8 custom agents + skill packs) was originally authored for **Codebuff** and crashed Freebuff on load; all 8 agents were converted to Freebuff's format (`model: 'deepseek/deepseek-v4-flash'`, tools limited to Freebuff's set, spawnable agents use Freebuff names) and committed on main (`92aa331`) and on `good-commit` (`1eb1584`). Codebuff-only tools (`code_search`, `run_terminal_command`, `end_turn`) and store agents (`codebuff/*`) do NOT exist in Freebuff — spawn the `basher` / `code-searcher` / `file-picker` / `code-reviewer-deepseek-flash` / `researcher-web` agents instead. The type file `.agents/types/tools.ts` documents the supported tool set.
- **Middleware:** `main` has `middleware.ts` (CSP nonce, rate limiting, host validation) — Next 16 warns it should be renamed `proxy.ts`; harmless warning only. `.env`/`.env.local` are tracked on main (contains live DB + WhatsApp placeholders) — flagged as a security concern; user chose to leave for now.

## Quotations & invoices (auto-generated quotes)

Every booking request (leisure / corporate / event) auto-creates a **draft quote** at submission time — the owner no longer builds quotes manually.

- **Lifecycle**: request → `createDraftQuote()` (draft, in `lib/quotes.ts`) → owner edits fees in `/admin/quotes/[id]` → **Send** marks it `sent` → requester gets the public link `/quote/[token]` + PDF `/quote/[token]/pdf`.
- **Pricing seeds**: room nights at `rooms.baseRate` (threaded through `buildDraftLines`, never matched by name) + meal add-ons from `addOnSelections` (breakfast R175 / dinner R300 pp-night, aggregated as person-nights). Events get one placeholder line ("price to be confirmed") the owner prices.
- **Totals math**: shared pure module `lib/quote-math.ts` (integer cents, VAT clamped 0–100%) imported by both the server engine AND the client editor — one source of truth, covered by `scripts/test-quotes.ts`. Client inputs are sanitized server-side; negative totals are impossible.
- **Admin UI**: `/admin/quotes` (list + status filter) and `/admin/quotes/[id]` (line-item editor: add/remove rows, qty/unit/rate, VAT %, valid-until, notes, live totals, Save draft / Send). Dashboard cards show a quote badge + "Review & send quotation" link.
- **Delivery**: Send calls `sendQuoteLink()` (WhatsApp template `gomodi_quote_link`, params guest/quote#/link) — **fails open** while WhatsApp is unconfigured (logs the link, editor tells the owner to copy it manually). Public link is token-based (18 random bytes, unguessable, no enumeration); page + PDF are force-dynamic.
- **DB**: `quotes` (1:1 with `booking_requests`, unique quote number + public token, status draft/sent/accepted/declined, server-computed subtotal/vatAmount/total) and `quote_line_items` (cascade delete). Pushed via `npx drizzle-kit push`.
- Env var used by send route: `NEXT_PUBLIC_APP_URL` (falls back to `http://localhost:3000`; the admin editor rebuilds the link from `window.location.origin` regardless).

## OTP hardening (registered-only, not live)

`request-otp` now only generates/stores/sends codes for **numbers in the `users` table**; unregistered numbers get a generic "If this number is registered…" response with **no `devOtp`** (no account enumeration). Rate limit (3/10 min per phone) still applies. In dev, `devOtp` still shows for registered seed numbers (`+27820000001`–`06`) on the admin login page. WhatsApp delivery remains fail-open (log-only) until the business number is set up.

## WhatsApp notifications (Meta Cloud API)

Outbound WhatsApp is wired and **fails open**: until credentials are set, sends log visibly (`[WhatsApp notification not sent]`) and nothing breaks. Three message types:

- **OTP codes** — `lib/whatsapp.ts` `sendOtp()`, called from `app/api/auth/request-otp/route.ts`. Uses AUTHENTICATION template `gomodi_otp`. Until configured, codes are only visible in server logs (console.log in the route / Vercel function logs).
- **Booking alerts to the lodge** — `lib/notifications.ts` `notifyOwnerOfNewRequest()`, called from `app/book`, `app/corporate`, and `app/events` actions. UTILITY template `gomodi_booking_alert`, sent to `WHATSAPP_RECIPIENT`.
- **Guest status updates** — `lib/notifications.ts` `notifyGuestOfBookingDecision()`, called from `app/api/admin/requests/[id]/route.ts` on approve/decline. UTILITY template `gomodi_booking_status`.

Env vars (placeholders are in `.env` / `.env.local`; must be set in Vercel for production): `WHATSAPP_TOKEN` (permanent access token), `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_RECIPIENT` (E.164 lodge number for alerts). Optional: `WHATSAPP_OTP_TEMPLATE`, `WHATSAPP_ALERT_TEMPLATE`, `WHATSAPP_STATUS_TEMPLATE`, `WHATSAPP_LANGUAGE` (default `en`).

Setup requires a Meta Business account, a registered WhatsApp Business phone number (a line not in the consumer app), and approved templates matching the defaults above. Graph endpoint: `https://graph.facebook.com/v23.0/{phone_number_id}/messages`.

## Browser testing (this machine)

No system-level browsers (no sudo), but all three are installed user-space and on PATH via symlinks in `~/.nvm/versions/node/v20.20.2/bin`:

- `google-chrome` / `chromium` → Playwright Chromium 149 (`~/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome`) — works with the browser-use agent (CDP).
- `firefox` → Playwright Firefox 151 (`~/.cache/ms-playwright/firefox-1532/firefox/firefox`) — headless renders; **`--dump-dom` unsupported**, use `--screenshot` to verify rendering.
- `msedge` / `microsoft-edge` → Edge 151 extracted from `.deb` (`~/edge-pkg/opt/microsoft/msedge/msedge`) — CDP, works headless.
- Headless invocation: Chrome/Edge need `--headless --no-sandbox --disable-gpu`; this is a container without a display, so `--headless` (or `MOZ_HEADLESS=1` for Firefox) is required.
- The symlinks are tied to the current nvm Node version dir — re-create them if Node is upgraded. Raw binaries live in `~/.cache/ms-playwright/` and `~/edge-pkg/` (survive node changes).
