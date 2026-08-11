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
- Perf: `npm run perf` — response-time benchmark for all 11 routes (HTTP TTFB + headless Chromium FCP/LCP + per-component render times; optional `BASE_URL` env) — see `scripts/perf-bench.ts`

## Key code locations

- `app/page.tsx` — homepage (server, force-dynamic)
- `app/rooms/` — `RoomsExplorer.tsx` (filter/sort/detail modal), `loading.tsx`
- `app/book/` — `BookingForm.tsx` (4-step wizard, custom calendar) + `actions.ts`
- `app/corporate/` — multi-room quote form + `actions.ts`
- `app/events/` — event inquiry form + `actions.ts`
- `app/admin/` — `AdminLogin.tsx` (OTP) + `AdminDashboard.tsx` (approve/decline, RBAC, time clock)
- `app/api/` — auth (`request-otp`, `verify-otp`, `me`), `admin/requests`, `admin/time-clock`, `upload` (Vercel Blob)
- `lib/db/schema.ts` — all tables; `lib/db/availability.ts` — overlap check; `lib/db/seed.ts`
- `lib/rooms-cache.ts` — **60s-cached shared room-list query** (`unstable_cache`), used by home / rooms / book pages
- `lib/notifications.ts` — WhatsApp notifier (**stubbed**: console.log only)
- `lib/motion.tsx` — custom scroll-reveal/parallax hooks + `MotionObserver` (adds `motion-visible` to `.motion-ready` elements; mounted in layout). No animation library.
- `components/` — `Nav` (fixed header, ~73px), `Footer` (prominent "Iphe Lerato" motto), `BranchModal` ("how are you visiting?" chooser), `PhotoPlaceholder`, `HeroSlideshow` (photo hero on home/rooms/events/corporate), `FadeInObserver`
- Real photos live in `public/images/` (rooms, reception, events, logos) — used by `HeroSlideshow` and `next/image`

## Conventions

- **Page pattern**: server component fetches from DB → renders a client component → forms submit via Server Actions (`"use client"` pages + `"use server"` actions per feature folder). Actions validate, insert, and return `{ ok: true } | { ok: false; error }`.
- Home / rooms / book pages read the room list via `getRooms()` in `lib/rooms-cache.ts` — a 60s `unstable_cache` (user-approved Aug 10) so repeat visits skip the remote-Neon round-trip. Availability is always re-checked live on submit, so caching the list never blocks a real booking. Other public pages remain `force-dynamic`.
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
- **Dev server 404-for-every-route (Aug 10):** if a git operation rewrites `app/` while `next dev` is running, or the server starts over a stale `.next` from an older branch state (`.next/dev/build` artifacts predating the tree rewrite), every route can return the app's `not-found` page with a **404 even though `app-path-routes-manifest.json` lists all routes** and the real page content is present in the RSC payload (grep the body: you'll see both "Page not found" and the page's own h2). It's a route-table desync, not a code bug. Fix: kill the dev server (`pkill -f 'next dev'`), `rm -rf .next`, restart `npm run dev`. Current instance (started Aug 10) runs detached, logs at `/tmp/gomodi-dev.log`.
- **Git workflow change (Aug 10):** the repo now follows `GIT_WORKFLOW_GUIDELINES.md` (committed to the repo). `dev` is the active development branch (viewed via Vercel preview), and `main` only receives changes via **user-approved promotion from dev** — never direct commits/pushes. Local `main` was pushed to origin to ship the hero/OTP fixes, then `dev` was branched off that main. `feature/`/`fix/` branches are cut from `dev`, pushed, and merged via PR review. Branch protection on `main`/`dev` requires GitHub settings (Section 5 of the guidelines) — owner must enable "Require a pull request" + "Do not allow bypassing".
- **Branch note (Aug 10, superseded):** `main` is no longer the active branch — see the workflow change above. The `.agents/` suite (8 custom agents + skill packs) was originally authored for **Codebuff** and crashed Freebuff on load; all 8 agents were converted to Freebuff's format (`model: 'deepseek/deepseek-v4-flash'`, tools limited to Freebuff's set, spawnable agents use Freebuff names) and committed on main (`92aa331`) and on `good-commit` (`1eb1584`). Codebuff-only tools (`code_search`, `run_terminal_command`, `end_turn`) and store agents (`codebuff/*`) do NOT exist in Freebuff — spawn the `basher` / `code-searcher` / `file-picker` / `code-reviewer-deepseek-flash` / `researcher-web` agents instead. The type file `.agents/types/tools.ts` documents the supported tool set.
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

## Desktop AI coding apps (this machine)

Installed user-space (no sudo) as AppImages in `~/Applications/`, with launchers in `~/.local/share/applications/` (icons in `~/.local/share/icons/`):

- **Freebuff Desktop** — `~/Applications/Freebuff.AppImage` (153M, from `freebuff.com/api/desktop/download/linux`). **Must be launched with `--disable-gpu` on this machine** — without it the Electron GPU process crashes (`GPU process isn't usable. Goodbye.`) because the container has no GPU drivers. The `.desktop` entry already bakes the flag in; `libva`/`SIGILL` warnings in the logs are benign. AppImage runtime version `effcebc`; `libfuse.so.2` is present so FUSE mounts work.
- **ZCode 3.7.5 (Z.ai agentic IDE)** — `~/Applications/ZCode-3.7.5-linux-x64.AppImage` (180M, from `cdn-zcode.z.ai/zcode/electron/releases/3.7.5/linux-x64/...`). Runs fine without flags. Auto-updates itself (AppImage update may require re-downloading).

Terminal launches: `~/Applications/Freebuff.AppImage --disable-gpu` and `~/Applications/ZCode-3.7.5-linux-x64.AppImage`.

ZCode automation notes (verified Aug 10): the launcher opens the gomodi-lodge project directly via `--open-workspace <path>` (supported CLI flag; the app also accepts `--init-workspace`, `--workspace`). Config lives in `~/.zcode/v2/setting.json` (`recentProjects` = array of plain path strings) and `~/.zcode/v2/config.json` (provider slots, e.g. `builtin:bigmodel-coding-plan`, empty `apiKey`). The connect gate (Z.ai / BigModel / Use API key) appears on every launch until a model is connected — "Skip for now" only exists on the **Use API key** form. Usable headless via CDP: launch with `--remote-debugging-port=9222 --disable-gpu` and drive with `playwright-core` `connectOverCDP` (playwright-core is in the project's node_modules; Chromium build 1228 is cached). The app's workspace skills registry picks up the project's `.agents/skills/` automatically. Model connection is the only unfinished step (user chose to skip); "Connect" (bottom-left) → Z.ai OAuth, or Set/Manage models → paste an API key.

## Browser testing (this machine)

No system-level browsers (no sudo), but all three are installed user-space and on PATH via symlinks in `~/.nvm/versions/node/v20.20.2/bin`:

- `google-chrome` / `chromium` → Playwright Chromium 149 (`~/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome`) — works with the browser-use agent (CDP).
- `firefox` → Playwright Firefox 151 (`~/.cache/ms-playwright/firefox-1532/firefox/firefox`) — headless renders; **`--dump-dom` unsupported**, use `--screenshot` to verify rendering.
- `msedge` / `microsoft-edge` → Edge 151 extracted from `.deb` (`~/edge-pkg/opt/microsoft/msedge/msedge`) — CDP, works headless.
- Headless invocation: Chrome/Edge need `--headless --no-sandbox --disable-gpu`; this is a container without a display, so `--headless` (or `MOZ_HEADLESS=1` for Firefox) is required.
- The symlinks are tied to the current nvm Node version dir — re-create them if Node is upgraded. Raw binaries live in `~/.cache/ms-playwright/` and `~/edge-pkg/` (survive node changes).

## Changelog

### 2026-08-11 — Page response-time pass: parallel admin-requests queries + perf benchmark

- **Admin requests API: 8 sequential queries → 1 `Promise.all` (Aug 11):** `app/api/admin/requests/route.ts` was running 8 sequential Neon round-trips (room lines, approved bookings, add-ons, corporate details, events, POPs, quotes). Parallelized with `Promise.all` — warm response dropped **~1.5s → ~0.4s** (server log: `405ms`). Live on `main` via **PR #15** (`perf/faster-pages`, merge sha `2670e80`).
- **Dev preview HMR over `*.monkeycode-ai.live` (Aug 11):** `next.config.ts` gains `allowedDevOrigins: ["*.monkeycode-ai.live"]` so HMR websockets aren't blocked on the preview host (`3000-8eb61bc89f699507.monkeycode-ai.live`) — zero blocked-HMR warnings since restart.
- **`npm run perf` benchmark (Aug 11):** new `scripts/perf-bench.ts` (+ package.json script). Phase 1: HTTP cold/warm TTFB for all 11 routes. Phase 2: headless Chromium (playwright-core) FCP/LCP/load + per-component render times via an injected watcher on `document` (settle-polled up to 8s) + slowest-asset list. Auth handled by minting the HMAC admin cookie directly (avoids the dev OTP rate limiter). Optional `BASE_URL` arg.
- **Measured (warm, dev server):** `/` 0.2s TTFB / 1.8s LCP; `/rooms` 0.1s / 0.5s; `/book` 0.2s / 0.5s; `/corporate` 0.2s / 1.0s; `/events` 0.3s / 1.2s; `/admin` 0.1s / 0.5s; `/admin/dashboard` 0.1s / **3.1s LCP**; `/admin/quotes` 0.1s / 0.4s; `/quote/[token]` 0.5s / 1.4s; quote PDF download-start 0.5s.
- **Remaining hotspot — `/admin/dashboard` LCP ~3.1s (Aug 11):** two contributors — a hard-coded **500ms skeleton `setTimeout`** in `app/admin/dashboard/AdminDashboard.tsx` (~line 100) gating render, and **Neon cold start ~2.6s** whenever the pool has been idle >30s (`lib/db/index.ts` `idleTimeoutMillis: 30_000`). Suggested fixes (not yet applied): remove/shorten the skeleton delay and/or warm the pool. Dev-server first-visit Turbopack compile (1–5s) is dev-only and absent from production builds.
- **Git path note (Aug 11):** `main` was ahead of `dev` (dev had nothing main lacked), so a feature→dev→dev→main chain couldn't carry these changes. Branch `perf/faster-pages` was cut from `origin/main` (changed files were identical in both), pushed, and merged to `main` as **PR #15** at the owner's explicit request. Untracked `tsconfig.tsbuildinfo` build-artifact churn was left uncommitted.
- Validation: `npm run build` exit 0 (23 routes), `tsc --noEmit` clean. 4 pre-existing lint errors (react-hooks refs / setState-in-effect in `lib/motion.tsx`, `test_pages.js` require-import, unused `gold` in `lib/quote-pdf.tsx`, unused `isApi` in `middleware.ts`) + the `middleware.ts`→`proxy.ts` deprecation warning — all pre-existing, unrelated to this pass.
- **Agent + model:** this changelog entry and the 2026-08-11 changes were authored by the **opencode** coding agent (on behalf of the MonkeyCode-AI Smart Development Platform), running model **`monkeycode-ai/monkeycode-basic/deepseek-v4-flash`**.

### 2026-08-10 — Neon PR preview workflow live (auto DB branch per PR, drizzle push, auto-cleanup)

- **`.github/workflows/neon_workflow.yml` + `.agents/GIT_RULES.md` (Aug 10):** per `GIT_WORKFLOW_GUIDELINES.md`, every PR into `dev` **or `main`** now gets an isolated Neon DB copy: `neondatabase/create-branch-action@v6` creates `preview/pr-<PR#>-<head-branch>` (14-day expiry), the workflow runs `npx drizzle-kit push` against it, `neondatabase/schema-diff-action@v1` posts the schema diff on the PR, and `neondatabase/delete-branch-action@v3` auto-deletes the branch when the PR closes. Requires GitHub secret `NEON_API_KEY` + variable `NEON_PROJECT_ID` (`holy-sunset-56816517`) — both verified configured. Landed on `dev` (PR #4, `303760e`), **promoted to `main` as release `v1.1.0`** (PR #7, `89c694e`, prod deploy success).
- **Gotcha: action connection-string outputs are blanked by GitHub (Aug 10):** the first end-to-end test (PR #5) proved the DB branch is created, but `Run Migrations` always failed — GitHub Actions skips action outputs that look like secrets (`##[warning]Skip output 'db_url' since it may contain secret.`), so `steps.create_neon_branch.outputs.db_url_with_pooler` resolved to **empty**. Fix (PR #6, `73a5e9a`): the migrations step installs `neonctl` and fetches the pooled URL itself — `DATABASE_URL="$(neonctl connection-string "$NEON_BRANCH" --pooled --project-id "$NEON_PROJECT_ID")" npx drizzle-kit push`. Do NOT reintroduce reliance on the action's `db_url*` outputs.
- **Open/close race fail-open (PR #8, `06ad379`, dev only — NOT yet on main):** if a PR is opened and merged within ~30s (e.g. an automated release PR), the `closed`-event delete job can remove the preview branch before the `opened`-event create run reaches migrations (npm-install-delayed) — observed on PR #7 (`Branch preview/pr-7-dev not found`). The migrations step now fails open **only** when neonctl reports the branch missing (`grep 'not found'` → `::warning::Preview branch … already removed (PR closed before migrations ran); skipping.`, exit 0); any other neonctl error still fails the job. Rides to `main` on the next dev→main release.
- **Schema-diff action behavior:** logs `No changes detected in the schema diff` but posts no PR comment when there is no diff (only the Vercel bot comment shows) — expected, not a failure. The workflow's actions (`actions/checkout@v4`, `setup-node@v4`, `schema-diff-action@v1`) target Node 20 which GitHub now forces onto Node 24 with a deprecation annotation — harmless for now.

### 2026-08-10 — 3G mobile performance pass (AVIF/WebP, lazy hero slides, compressed images, DB timeouts)

- **Hero slides now lazy-mount (Aug 10):** `components/HeroSlideshow.tsx` previously rendered **every** slide as an `<Image>` up front — the home hero alone fetched 7 full JPEGs on load. Rewritten to mount only the active slide (priority) plus the one fading out during the 500ms crossfade; other slides fetch on demand when they rotate in. Measured under emulated 3G (200KB/s, 390px viewport): hero `<img>` count 7 → **1**, total page image requests 7 JPEGs (~800KB+) → **4 requests / 49.4KB**, TTFB 479ms, DOMContentLoaded 1182ms, zero page errors. Crossfade verified (2 mounted mid-fade → 1 after). WCAG pause/hover/reduced-motion gates unchanged.
- **AVIF/WebP enabled (Aug 10):** `next.config.ts` now sets `images.formats: ["image/avif", "image/webp"]` — `next/image` serves AVIF (50-70% smaller than JPEG) on every modern phone; verified `image/avif` responses in the browser.
- **Raw `<img>` → `next/image` on home (Aug 10):** all 5 raw `<img loading="lazy">` tags in `app/page.tsx` (three-ways cards, about, rooms preview, events teaser, corporate teaser) converted to `next/image` with `fill` + `sizes` — they now get AVIF/WebP + responsive sizing instead of full-size JPEGs.
- **All 18 source JPEGs compressed (Aug 10):** `scripts/compress-images.mjs` (sharp, quality 72, mozjpeg, metadata stripped, 1600px cap) — 1.59MB → 1.31MB total (−18%) on top of the AVIF gain. Re-runnable.
- **DB hang protection (Aug 10):** `lib/db/index.ts` pool gains `statement_timeout: 10_000` — a stuck remote-Neon query fails fast for the guest instead of spinning until the platform kills the request. (Pool already had `connectionTimeoutMillis`/`idleTimeoutMillis`/`max`/idle-error handler from the earlier pass; `db.transaction` is used in 2 places so the `pg` Pool stays — Neon's HTTP driver can't do transactions.)
- Validation: `tsc` exit 0, `npm run build` exit 0, rooms/book flows verified headless under 3G emulation with zero page errors.

### 2026-08-10 — Book-Now routing fix, compact rooms hero, 60s room-list caching, DB pool hardening

- **Book Now routing bug (Aug 10):** home/nav "Book Now" → BranchModal → "Request a Stay" routed to `/rooms` (the browsing listing), never the booking form — so clicking Book Now appeared to "do nothing". The modal's own description ("Dates, room, breakfast/dinner add-ons") is the booking form's; Corporate and Events options already went straight to their forms. Fix: `components/BranchModal.tsx` option path `/rooms` → `/book`. Browser-verified: modal → Request a Stay lands on `/book` with the form h1.
- **Rooms hero was pushing the grid off-screen (Aug 10):** the hero built in the previous change was 520px tall; at 1280×800 the breadcrumb + hero + duplicate intro paragraph pushed `#rooms-grid` to y=942 — entirely below the fold (cards only peeked in on scroll). Fix in `app/rooms/RoomsExplorer.tsx`: hero trimmed to `h-[38vh] min-h-[min(360px,calc(100svh_-_var(--header-h)))] max-h-[440px]` (same `hero-outer`/`hero-content` template, spacing, stagger and CTA — only height differs), the intro `<section>` that repeated the hero subtitle verbatim was removed, and the slideshow cut from 7 images to 4 (matches corporate/events weight). Browser-verified: hero now 360px, grid starts at y=624 → **176px of cards visible above the fold**.
- **Page-load delay diagnosed as code, not the user's machine (Aug 10):** every public page was `force-dynamic`, opening a fresh pooled connection to the **remote Neon DB (eu-central-1)** per request; the log caught a live `AggregateError: [6 errors]` on the first `/book` hit (2.59s). Same on Vercel because each cold serverless invocation pays that handshake. Fix (user-approved "60s caching"): new `lib/rooms-cache.ts` exposes `getRooms()` = `unstable_cache` around the rooms query, `revalidate: 60`; home (`previewRooms = (await getRooms()).slice(0, 3)`), rooms and book pages now use it. Page-level `export const revalidate` would NOT have worked on `/rooms` and `/book` (they read `searchParams` → dynamic per request), hence the shared `unstable_cache`. `lib/db/index.ts` pool hardened: `max: 10`, `connectionTimeoutMillis: 15_000`, `idleTimeoutMillis: 30_000`, `keepAlive: true`, plus an idle-client `error` handler so a transient Neon blip logs instead of crashing the process.
- Validation: `npx tsc --noEmit` exit 0, `npm run build` exit 0 (all routes), all pages 200 locally, zero console errors in the headless browser flow.

### 2026-08-10 — HeroSlideshow pause + reduced-motion gate (WCAG 2.2.2)

- **`components/HeroSlideshow.tsx`**: autoplay now pauses while the mouse hovers the slideshow and while keyboard focus is inside its controls (`onFocusCapture`/`onBlurCapture` with a `relatedTarget` containment check), and **never runs for `prefers-reduced-motion: reduce` users** (lazy `useState` init from `window.matchMedia`, plus a live `MediaQueryList` `change` listener so toggling the OS setting mid-session stops/starts autoplay). Manual prev/next/dots still work for everyone. Affects all four slideshow heroes (home, rooms, events, corporate). Note: a touch-device tap on the hero may leave autoplay paused until another tap — benign; `npx tsc --noEmit` passes.
- **Pause/play button (same file, same day):** a glassy pause/play toggle now sits bottom-right on the slideshow (matches the arrow buttons' `bg-white/20` style) — the WCAG 2.2.2 mechanism for touch-only users who have no hover. It uses `aria-pressed` + swapped `aria-label` ("Pause slideshow"/"Play slideshow"), decorative SVGs `aria-hidden`, and is **hidden entirely for reduced-motion users** (nothing to pause). Button state is a separate `paused` state wired into the same autoplay gate.

### 2026-08-10 — Rooms hero aligned to corporate/events template + dev OTP display restored

- **`app/rooms/RoomsExplorer.tsx`**: the rooms hero was a smaller bespoke build (`h-[45vh] min-h-[300px]`, no `hero-outer`/`hero-content` classes, `text-3xl md:text-4xl` h1, `mt-3` sub, no CTA, 5000ms interval). Rebuilt to the exact corporate/events template — `hero-outer relative h-[55vh] min-h-[min(520px,calc(100svh_-_var(--header-h)))] max-h-[560px] overflow-hidden parallax-container`, `hero-content` with `pb-12 md:pb-16`, h1 `text-3xl md:text-5xl leading-tight max-w-3xl`, sub `mt-4 max-w-xl`, `hero-cta mt-8` with two buttons (primary "Book a Stay" → `/book`, secondary "Browse Rooms" → new `#rooms-grid` anchor on the grid section), stagger `1/2/3`, `interval={5500}`. Text + images left untouched. Verified headless: computed sizes/spacing now byte-identical to corporate/events.
- **Dev OTP box stopped showing for locally-formatted numbers (Aug 10):** the registered-only OTP hardening made the `users.phone` lookup an exact string match against E.164 numbers (`+27820000001`…), so typing `0820000002` or `+27 82 000 0002` returned the generic "If this number is registered…" with **no `devOtp`** (and spaced input even 400'd). Fix: `lib/validate.ts` `normalizePhone()` now also converts `00…` → `+…` and bare SA local `0XX…` → `+27XX…` (strips spaces/dashes/parens/dots as before), and **both** `app/api/auth/request-otp/route.ts` and `app/api/auth/verify-otp/route.ts` now normalize via that shared helper before the users lookup / OTP record lookup (they previously had inline regex + `.trim()` only). All booking actions already used `normalizePhone`, so SA-local guest phones now also store as E.164. Verified live: `0820000003`, `+27 82 000 0003`, and `+27820000003` all return `devOtp`. Rate limiter keys on the normalized string, so alternate formats of the same number share one 3/10-min budget.
- **Known minor (pre-existing, dev-only):** on slow-to-hydrate pages (observed on `/rooms` first compile) React may log a hydration-mismatch warning for `motion-ready` elements — `MotionObserver` can add `motion-visible` during the concurrent-hydration idle gap despite its `requestIdleCallback`/load/1.5s deferrals. Cosmetic, invisible to users, production build unaffected; not introduced by this change (home page checks clean).
