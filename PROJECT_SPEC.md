# PROJECT_SPEC.md

> Generated from a full analysis of the working codebase (Aug 2026). Updated after comprehensive UI/UX polish pass (Aug 9, 2026).

## 1. Overview & Stack

- **Project Name:** `gomodi-lodge` — **Gomodi Guest Lodge**, a direct-booking website for a 9-room boutique guest house in Mafikeng (Mmabatho), South Africa. Three guest journeys (Leisure / Corporate / Events) feed one booking-request pipeline, reviewed in a private staff admin area.
- **Framework & Version:** Next.js **16.2.12** (App Router) + React **19.2.4** (`next` 16.2.12, `react`/`react-dom` 19.2.4). Public pages are Server Components with `export const dynamic = "force-dynamic"`; forms submit via Server Actions.
- **Language:** TypeScript 5 (strict mode, `@/*` path alias → project root).
- **Styling Solution:** Tailwind CSS **v4** (`@tailwindcss/postcss`, `@theme inline` tokens in `app/globals.css`). **No animation library** — a custom scroll-reveal/parallax motion system lives in `lib/motion.tsx` (IntersectionObserver-based `MotionObserver`, mounted in the root layout). Fonts via `next/font/google`: **Inter** (sans) + **Playfair Display** (display, incl. italic for the "Iphe Lerato" motto).
- **Database / Backend Services:** PostgreSQL via **Drizzle ORM 0.45.2** (`drizzle-orm/node-postgres` + `pg` 8.22, schema in `lib/db/schema.ts`). Migrations via `drizzle-kit` (`drizzle.config.ts`, output dir `./drizzle`). Seed script `lib/db/seed.ts` (9 rooms + 6 test users).
- **Third-Party APIs & Integrations:**
  - **Vercel Blob** (`@vercel/blob` 2.6.1) — `/api/upload` stores proof-of-payment files (JPEG/PNG/PDF, ≤5MB, private access). ⚠️ Booking form currently records a filename only and never calls this endpoint.
  - **WhatsApp Business Cloud API (Meta)** — `lib/notifications.ts` is a **stub** (`console.log` only); needs real Meta Business credentials before go-live.
  - **Auth** is fully in-house (OTP + signed session cookies — see §3), no third-party auth provider.

## 2. Directory & File Structure Map

```
gomodi-lodge/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout: fonts, JSON-LD, BranchModalProvider,
│   │                             #   fixed Nav, pt-[var(--header-h)] offset, Footer,
│   │                             #   BranchModal, HeaderSpacer, MotionObserver
│   ├── globals.css               # Tailwind v4 theme tokens + full design system + motion CSS
│   ├── page.tsx                  # Homepage (server, force-dynamic)
│   ├── not-found.tsx / global-error.tsx / icon.svg
│   ├── rooms/                    # RoomsExplorer.tsx (filter/sort/detail modal), page.tsx, loading.tsx
│   ├── book/                     # BookingForm.tsx (4-step wizard + custom calendar),
│   │                             #   page.tsx, loading.tsx, actions.ts (Server Actions)
│   ├── corporate/                # Multi-room quote form, page.tsx, loading.tsx, actions.ts
│   ├── events/                   # Event inquiry form, page.tsx, loading.tsx, actions.ts
│   ├── admin/                    # AdminLogin.tsx (OTP), dashboard/AdminDashboard.tsx
│   │                             #   (approve/decline, RBAC, time clock), pages
│   └── api/                      # Route Handlers (backend)
│       ├── auth/request-otp/     # POST: rate-limited (3/10 min) OTP mint, SHA-256 hash
│       ├── auth/verify-otp/      # POST: constant-time verify, 5-attempt lockout, session cookie
│       ├── auth/me/              # GET: current session user (401 if none)
│       ├── auth/logout/          # POST: clears httpOnly session cookie
│       ├── admin/requests/       # GET: enriched pending queue (staff-auth)
│       ├── admin/requests/[id]/  # POST: approve/decline (manager-auth, 409 conflict check)
│       ├── admin/time-clock/     # GET/POST: staff clock in/out (staff-auth)
│       └── upload/               # POST: Vercel Blob proof-of-payment upload
├── components/                   # Shared UI
│   ├── Nav.tsx                   # Fixed header (~73px), backdrop-blur, mobile slide menu, active states
│   ├── Footer.tsx                # "Iphe Lerato" motto, gradient top border, SVG contact icons
│   ├── BranchModal.tsx / BranchModalContext.tsx  # "How are you visiting?" chooser (staggered entrance)
│   ├── HeroParallax.tsx          # Reusable parallax scroll effect for hero images
│   ├── HeaderSpacer.tsx          # Syncs --header-h CSS var with real header height
│   ├── BookNowHeroButtonClient.tsx / PhotoPlaceholder.tsx  # Rich gradient placeholders
├── lib/
│   ├── db/index.ts               # pg Pool + drizzle instance (reads DATABASE_URL)
│   ├── db/schema.ts              # All tables: users, rooms, booking_requests,
│   │                             #   booking_room_lines, add_on_selections,
│   │                             #   corporate_details, event_details,
│   │                             #   staff_time_clocks, auth_otps, proof_of_payments
│   ├── db/availability.ts        # isRoomAvailable() — overlap vs APPROVED bookings only
│   ├── db/seed.ts                # 9 rooms + 6 test users (owner/assistant/staff)
│   ├── auth.ts                   # HMAC-signed session cookie, getCurrentUser,
│   │                             #   requireManager / requireStaff guards
│   ├── notifications.ts          # WhatsApp notifier (STUB — console.log only)
│   ├── pricing.ts                # Single source of truth: BREAKFAST_PRICE 175, DINNER_PRICE 300
│   └── motion.tsx                # useScrollReveal, useParallax, MotionObserver,
│                                 #   useKineticText, useSmoothScroll, useMicroInteraction
├── scripts/                      # Dev-only tooling (eslint-ignored)
│   ├── test-booking.ts / test-admin-queue.ts   # DB-free regression scripts
│   └── _browser-check.ts / _demo-flows.ts / _db-cleanup.ts / e2e-full-validation.ts
├── drizzle.config.ts             # drizzle-kit config (schema → ./drizzle, postgres)
├── next.config.ts / tsconfig.json / postcss.config.mjs / eslint.config.mjs
├── package.json                  # "build": "NODE_ENV=production next build"
└── docs/                         # Requirements, design ADRs, plans (PRODUCT.md is authoritative)
```

## 3. Core Architecture & Data Flow

- **State Management:** Minimal and local. React `useState` inside client components for form wizards, filters, and modals; one global context — `BranchModalProvider` (`BranchModalContext.tsx`) — powers the "Book Now" chooser. No Redux/Zustand/React Query; server components own data reads.
- **Data Fetching Pattern:** Mixed Server Components + Server Actions + Route Handlers.
  - Public pages: server components read Postgres directly (Drizzle) with `force-dynamic` (live reads, no caching).
  - Form submissions (`book`, `corporate`, `events`): `"use client"` pages call `"use server"` actions (`actions.ts`) that validate, insert via Drizzle, and return `{ ok: true } | { ok: false; error }`. Availability is re-checked inside the action (`isRoomAvailable` / inline overlap queries).
  - Admin/auth/upload: Next.js Route Handlers (`app/api/*`) called via `fetch` from client components; responses are JSON.
- **Authentication / Authorization Flow:** Phone-OTP with in-house hardening.
  1. `POST /api/auth/request-otp` — validates phone, rate-limits (3 requests / 10 min per phone, in-memory map), stores a **SHA-256 hash** of a 6-digit code with 10-min expiry, invalidates prior codes. In dev the plaintext is returned as `devOtp` for the on-screen test box.
  2. `POST /api/auth/verify-otp` — constant-time hash comparison, 5-attempt lockout, then mints an **HMAC-SHA256-signed** `session` cookie (base64url payload + signature, 8h TTL, httpOnly, sameSite=lax, secure in prod).
  3. `lib/auth.ts` guards: `requireManager()` (owner/assistant — booking approve/decline) and `requireStaff()` (any logged-in user — queue read, time clock). Unauthenticated → 401. RBAC also enforced client-side in the dashboard (staff cannot approve corporate/event requests).
- **Booking Pipeline & Conflict Model:**
  - Three journeys (`category` enum: leisure / corporate / event) insert into `booking_requests` (status starts `pending`) plus category-specific child tables (room lines, add-ons, corporate/event details).
  - Only **approved** bookings lock a room. `isRoomAvailable` and the admin queue flag overlaps: red banner = overlaps an approved booking (hard conflict), amber = overlaps another pending request (soft warning).
  - Approve re-checks **every** room line server-side against approved bookings and returns 409 on conflict (corporate requests can span several rooms; events have no room lines and skip the check).
- **External API Integrations:** Vercel Blob `put()` in `/api/upload` (validates type/size, returns `{ url, fileName, fileSize, mimeType }`); WhatsApp notifications are stubbed (`notifyOwnerOfNewRequest` console-logs the payload; swap-in point is contained to `lib/notifications.ts`).

## 4. UI/UX Design System Rules

- **Color Palette & Theme Tokens** (defined once in `app/globals.css` `@theme inline`, used as Tailwind utilities e.g. `bg-cream-light text-ink`):
  - **terracotta** `#c65d3c` (light `#e8a893`, dark `#8f3e25`, tint `#f5e3db`) — primary accent; `.btn-primary` uses terracotta-dark `#8f3e25` on cream-light for ≥4.5:1 contrast.
  - **walnut** `#4a2e22` (light `#7a5240`, dark `#2e1b14`, tint `#e8ddd6`) — dark surfaces/headers.
  - **cream** `#f5ebdd` (light `#faf6f0`, dark `#e8dcc6`) — page background `#faf6f0`.
  - **gold** `#d4a574` (light `#e8c9a5`, dark `#8f6a3e`, tint `#f5e8d8`) — premium accents/CTA.
  - **ink** `#2a1e18`, **stone** `#6b5b50` — text; `--color-skeleton` fills for loading states.
  - Admin dashboard uses brand-consistent palette (walnut approve, terracotta decline, gold-tint warnings).
- **Typography & Layout Principles:**
  - Fonts: Inter (`--font-sans`) for body/UI, Playfair Display (`--font-display`, `font-display` utility) for headlines; the "Iphe Lerato" motto is Playfair italic gold.
  - Container: `max-w-6xl mx-auto px-4 md:px-6` site-wide; forms often `max-w-4xl`; cards `rounded-2xl border border-walnut/10 card-shadow`.
  - **Fixed header discipline:** `Nav` is `fixed top-0 z-40` (~73px); root layout offsets content with `pt-[var(--header-h)]` (synced live by `HeaderSpacer`); sticky bars (rooms filter) stick at `top-[73px]` / `var(--header-h)`.
  - Responsive grid convention: `grid-cols-1 md:grid-cols-2` / `md:grid-cols-3` / `md:grid-cols-4`; hero sections use `.hero-gradient` overlays on `PhotoPlaceholder` with `HeroParallax` scroll effect.
  - Accessibility (audited, WCAG AA): ≥4.5:1 text contrast, 44px touch targets (nav links `py-3`, footer links `min-h-11`), visible `:focus-visible` terracotta ring, `prefers-reduced-motion` support, semantic HTML.
- **UI Component Conventions:** Reusable classes in `globals.css` — `.pill-*` (leisure/corporate/event/neutral/active category tags), `.btn-primary` / `.btn-outline` / `.btn-gold` (with `.btn-press` press feedback), `.card-shadow` (with hover lift), `.form-input` (focus ring + `.error` state), `.addon-card` / `.catering-card` (selectable cards), `.faq-item` (accordion), `.branch-card` / `.segment-card` / `.event-type-card` (hover lift), `.file-drop` (drag state), `.summary-row` (quote totals). Motion utilities: `.motion-ready`/`.motion-fade-up`/`-left`/`-right`/`.motion-scale-in`/`.motion-zoom-out`/`.motion-blur-reveal` with `data-stagger="1..8"` (observed by `MotionObserver`), `.motion-pop` for elements mounted **after** load, `.page-transition`, `.interactive-element`, `.image-zoom`, `.ripple`, `.kinetic-word`.

## 5. Environment Variables & Setup Constraints

Required env var keys (values omitted):

| Key | Required | Used by |
|---|---|---|
| `DATABASE_URL` | ✅ always | `lib/db/index.ts`, `drizzle.config.ts` (Postgres connection string) |
| `SESSION_SECRET` | ✅ **production** | `lib/auth.ts` — HMAC signing key for session cookies. Hard-fails in production if missing; dev falls back to a constant. |
| `BLOB_READ_WRITE_TOKEN` | ✅ for uploads | `app/api/upload/route.ts` (via `@vercel/blob`) — set in the Vercel dashboard |
| `NODE_ENV` | managed | Next.js; do **not** set in `.env`/`.env.local` (breaks `next build`) |

Setup & runtime constraints:
- **Install:** `npm install` → **Dev:** `npm run dev` → **Build:** `npm run build` (script forces `NODE_ENV=production next build` — required because a stray `NODE_ENV=development` in env files crashed local builds). **DB:** `npx drizzle-kit push` then `npx tsx lib/db/seed.ts`.
- **No automated test runner** — manual regression scripts: `npx tsx scripts/test-booking.ts` and `npx tsx scripts/test-admin-queue.ts` (DB-free, exercise `enrichRequests`).
- Public pages are `force-dynamic` (live DB reads); the app requires a reachable Postgres at request time.
- Deploys target Vercel (Next.js framework defaults); DB migrations/seeds must be run against the production database post-deploy.
- Known stubs awaiting credentials: WhatsApp Business API (notifier), real proof-of-payment upload (booking form records filename only), real photography (all imagery is `PhotoPlaceholder` divs).

## 6. Coding & Refactoring Guidelines for AI Models

- **Logic Rules:**
  - Preserve the Drizzle schema (`lib/db/schema.ts`), enum values (`leisure|corporate|event`, `pending|approved|declined|cancelled`, `breakfast|lunch|dinner`, `owner|assistant|staff|partner`, `clock_in|clock_out`), and existing API payload shapes — the admin dashboard and regression scripts depend on them.
  - Server Actions must keep the `{ ok: true } | { ok: false; error }` result contract and validate before inserting.
  - Availability rule is non-negotiable: only **approved** bookings block a room; approve re-checks every room line and returns 409 on overlap. Never weaken this.
  - Meal prices live in `lib/pricing.ts` (`BREAKFAST_PRICE = 175`, `DINNER_PRICE = 300`) — keep forms and marketing copy reading from there; do not hardcode new copies.
  - Notifications must go through `lib/notifications.ts` (single swap-in point for the real WhatsApp API).
  - Auth guards: booking writes require `requireManager()`, queue reads/time-clock require `requireStaff()`; derive users from the signed session, never from request bodies. The Lelz partner role uses `requirePartner()` (event-only scope) and the admin queue is role-scoped server-side (staff → leisure only, partner → events only).
  - **Gomodi/Lelz scope split (Lelz Business Enterprise partnership):** any request tied to `category = "event"` — including all standalone/external catering enquiries — belongs to **Lelz Business Enterprise** (quoted, coordinated, and delivered by Lelz; the Owner's assistant retains full visibility as Events Manager). Only booking-tied meal add-ons (breakfast/lunch/dinner on a Leisure/Corporate room booking) belong to Gomodi. Staff-role users must never see any event/catering data.
- **UI Rules:**
  - Use the brand tokens (terracotta/walnut/cream/gold/ink) and existing utility classes (`.btn-*`, `.pill-*`, `.card-shadow`, `.form-input`, etc.); do not introduce off-palette colors on public pages.
  - Follow the motion system strictly: scroll-reveal classes need `motion-ready` + observer support; elements mounted after load (success screens, filtered grids) must use **`.motion-pop`**, never bare `motion-ready`/`motion-scale-in` (they stay `opacity: 0`).
  - Respect the fixed-header offset (`--header-h`) and keep sticky bars aligned to it. Maintain WCAG AA contrast, 44px touch targets, and `prefers-reduced-motion`.
  - Apply `UI UX Pro Max` design standards for layout, spacing, and visual hierarchy (the skill pack is locked in `skills-lock.json`: design-system, ui-styling, banner-design, etc.).
  - Admin pages use the same brand tokens as public pages — no raw green/red/orange for approve/decline/conflict.
  - Calendar components use active-state indicators, quick-date shortcuts, range visualization, and clear buttons.
  - Modals use staggered entrance animations (backdrop fade + content slide-up).
  - Voice: plain, human, factual — no marketing filler (per PRODUCT.md brand commitments).
- **Commit Rules:** Any AI making code modifications must update **`PROGRESS.md`** with the modified files and completed tasks.

## 7. UI/UX Polish Changelog (Aug 9, 2026)

Comprehensive UI/UX polish pass applied across all pages. Commit `49423aa`.

**Components rewritten:**
- `AdminLogin.tsx` — Split-screen branded layout (desktop: walnut brand panel + cream form; mobile: centered logo). Replaced emoji dev-OTP with SVG icon. Shadow-glow buttons.
- `AdminDashboard.tsx` — Sticky branded header with logo, nav, time clock. Refined stat cards (`text-[10px] uppercase tracking-wider` labels). Walnut approve / terracotta decline buttons. Brand-consistent conflict banners (gold-tint soft, terracotta-tint hard). Empty state with checkmark icon.
- `PhotoPlaceholder.tsx` — Rich multi-stop gradients (145° angle) + subtle radial dot pattern + vignette. Caption uses backdrop-blur + shadow.
- `Footer.tsx` — Gradient top accent line. SVG contact icons (WhatsApp, email, location). Auto-incrementing copyright year.
- `Nav.tsx` — Backdrop-blur header. Logo hover shadow glow. Mobile menu with slide animation + active state highlighting.
- `BranchModal.tsx` — Staggered entrance animation (backdrop + modal + options cascade at 60ms). Colored icon containers per journey.

**New component:**
- `HeroParallax.tsx` — Reusable parallax scroll effect for hero images. Uses IntersectionObserver + rAF. Respects `prefers-reduced-motion`. Applied to homepage, rooms, corporate, and events heroes.

**Calendar UX overhaul (BookingForm.tsx):**
- Active check-in/check-out indicator boxes (clickable, border highlight, dot indicator).
- Quick-date shortcuts: "Tonight", "This weekend", "Next week".
- Enhanced date cells: `hover:scale-105 active:scale-95`, shadow glow on selected, smart range border-radius.
- Today dot indicator below number.
- Clear dates button.
- Month transition animation (slide left/right).

**globals.css additions:**
- `.card-lift` — refined hover (translateY(-6px) + larger shadow).
- `.section-divider` — gradient separator utility.
- Smoother `card-shadow` transitions.
- Mobile card-lift reduced to -3px.

**Remaining uncommitted (pre-existing, not part of polish):**
- `.agents/knowledge.md` deletion, `tsconfig.tsbuildinfo` modification, `bun.lock`, docs placeholders.
