# PROGRESS.md — Shared Agent Progress Ledger

**Single coordination point for every agent working on this repo.** Record
completed work here after each task, and ALWAYS update this file before
opening a PR. Other agents read this to know what is done, what is in flight,
and what needs the Architect's attention.

---

## Validation checklist (run before every PR)

- [ ] `npm run build` — must exit 0
- [ ] `npx tsc --noEmit` — must be clean
- [ ] `npm run lint` — no **NEW** errors vs. the base branch (pre-existing
      errors are tracked in `knowledge.md` and are not this file's concern)

---

## How to record progress

Append a new entry to the **Progress log** below, newest last. Include:

- Date, task id/title, executing agent/model
- Branch / PR reference
- Files changed (short list; full detail in the PR description)
- Validation results against the checklist above
- Flags for the Architect / owner (prices to confirm, plan limits, other
  agents' in-progress work, etc.)

---

## Open tasks / To-do (living list)

Checked = resolved. Items are added here whenever a task is identified; move
resolved ones to the Progress log. Owner-side items are 🔴 (blocked on the
owner/Architect — platform or external credentials), code-side are 🟡 (agent
can execute on request), housekeeping are 🟢. The full phased plan lives in
**`ENTERPRISE-ROADMAP.md`** (Phase 0 stabilization → 1 multi-location
foundation → 2 payments → 3 ops → 4 growth); this list tracks the open items.

### 🔴 Owner / Architect side

- [ ] **Verify CI fully green on `dev` (2026-08-15)** — #27/#28/#30/#32/#33 merged; core gate (typecheck/lint/vitest) green; e2e job fixed in PR #34 (pending merge + green run).
- [ ] **Enterprise roadmap owner decisions (D1–D10 in `ENTERPRISE-ROADMAP.md`)** — D2 secrets rotation, D3 WhatsApp credentials, D4 real number + banking verification, D5 Neon autosuspend, D6 property rollout plan, D7 payment provider, D8 photography, D9 analytics, D10 channel manager.
- [ ] **Untrack `.env` / `.env.local` from git + rotate any pushed secrets** — security: env files are tracked in repo history; platform blocks env-file ops from the sandbox; exact steps in SETUP-LOCAL.md §8 (dedicated PR: `git rm --cached .env .env.local`, keep local copies).
- [ ] **WhatsApp Business API credentials** — `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_RECIPIENT` + 5 Meta templates (OTP, booking alert, status update, review request, quote link). Until then notifications fail open and log only — **and in production the admin OTP is unreachable (logs only), making this the go-live blocker**.
- [ ] **Real WhatsApp number** — `lib/contact.ts` → `WHATSAPP_NUMBER`; every WhatsApp CTA renders `"#"` until supplied.
- [ ] **Disable Neon autosuspend** — workflow `disable-neon-autosuspend.yml` added 2026-08-15 (run it from Actions once on `main`, or disable in the Neon console: Settings → Compute → suspend after inactivity → Never). Biggest single perf win per `Identified_Issues.md` (cold start 2–5 s per idle visitor).
- [ ] **Verify banking details** shown to guests in the booking form (carries an unverified-owner flag) before go-live.
- [ ] **Real photography** — only Room 1 has photos; rooms 2–9 show placeholder art. Shot list in `UI-findings-and-recommendations.md`.
- [ ] **Vercel deploy check red on PRs** — "Deployment failed" with no vercel CLI in the sandbox to inspect; likely env/project config on the Vercel dashboard (owner-side).
- [ ] **Privacy program (POPIA/PAIA)** — privacy policy page, PAIA manual, retention schedule, breach runbook (Phase 3 of the roadmap).

### 🟡 Code-side (agent can execute on request)

- [x] **Phase 0 — Versioned Drizzle migrations** — `0000_baseline` + `0001_hot-path-indexes` + `0002_booking-requests-contact-phone-idx` committed (ADR 012, implemented); CI e2e + Neon preview run `db:migrate`; `npm run db:adopt` marks the baseline applied on push-created DBs. Owner: run `db:adopt && db:migrate` once on production.
- [x] **Phase 0 — Transactional booking inserts** — all three actions (leisure/corporate/events) wrap request → lines → meals → quote in `db.transaction`; WhatsApp notifications run post-commit; corporate availability is single-query (N+1 removed) (roadmap A3).
- [x] **Phase 0 — Hot-path DB indexes** — `booking_room_lines(room_id, check_in, check_out)`, `booking_requests(status, category)`, `booking_requests(contact_phone)`, `auth_otps(phone, consumed)`, `reviews(status)`, `staff_time_clocks(user_id, timestamp)`; `quotes(public_token)` covered by unique (roadmap A6, migrations 0001/0002).
- [x] **Phase 0 — POP upload polish** — real filename/size/mime persisted (server-verified via `/api/upload`); corporate + events forms now accept an optional deposit POP; shared `PopUpload` + `uploadProofOfPayment`/`sanitizePopMeta` helpers (roadmap U2).
- [x] **Phase 0 — Observability (Sentry)** — `@sentry/nextjs`, `instrumentation.ts` + client/server/edge configs, `app/global-error.tsx`, build plugin fails open (roadmap O1). Owner: add `SENTRY_DSN` (+ `SENTRY_AUTH_TOKEN` for source maps) to prod env. Remaining: external uptime monitor on `/api/ping`, structured logger.
- [x] **Phase 0 — Unit tests** — auth (tamper/expiry/roles), rate limiter (window edges + Upstash fail-open), quote line-builder (seasonal straddles, meals); 72 total (roadmap M2). Remaining: role-filter tests for `app/api/admin/requests`.
- [ ] **Phase 1 — Multi-location foundation** — `properties` table + `property_id` everywhere, property-scoped RBAC + `scopedDb()` guard, per-property `property_settings` (contact/banking/WhatsApp/prices), HQ consolidated view. See `ENTERPRISE-ROADMAP.md` §4–5 and ADR 013.
- [ ] **Phase 2 — Payments** — provider decision (PayFast primary), `lib/payments.ts` abstraction, deposits, hosted checkout, webhook state machine, receipts, admin payments view (roadmap §5 Phase 2, ADR 014).
- [ ] **Phase 3 — Ops & governance** — audit log, admin settings screens (pricing/seasonal/availability per property), queue pagination, privacy artifacts, analytics decision, Dependabot (roadmap §5 Phase 3).
- [ ] **Phase 4 — Growth** — PWA, i18n, channel-manager decision (NightsBridge/Little Hotelier), funnel analytics, SEO (roadmap §5 Phase 4).
- [ ] **Lelz partner WhatsApp stub** — `notifyLelzOfNewRequest` logs only; pending Lelz's number/template.
- [ ] **Android/iOS app** — decision pending (PWA first, Capacitor for Play Store/App Store later). Admin dashboard is already API-driven, so a client reuses the whole backend.

### 🟢 Housekeeping / low priority

- [ ] `docs/` planning & test docs (01–06) — filled only the ADR log (2026-08-15); product/system-design/planning docs still await BA input.
- [ ] `comp/buffy` branch — content merged into `dev`; deletable once the competition is judged.
- [ ] Upstash Redis keys — optional; the in-memory rate-limiter fallback works until then (Keys UI).
- [ ] Dependabot — enable for npm with grouped PRs (roadmap M5).

---

## Progress log

### 2026-08-11 — Task 1 (corporate room pricing drift) + Task 3 (DB keep-alive endpoint + Vercel cron) — DeepSeek Flash

**Status:** ✅ Delivered — PR [#18](https://github.com/OratileTshipo/gomodi-lodge-webApp-linux/pull/18) → `dev` from `fix/corporate-pricing-drift-keepalive`

**Files changed (7):**

- `lib/pricing.ts` — added `ROOM_BASE_RATE = 750` (single source of truth, beside `BREAKFAST_PRICE`/`DINNER_PRICE`); preserved dev's `LUNCH_PRICE`
- `app/corporate/CorporateQuoteForm.tsx` — `ROOM_TYPES` priced from `ROOM_BASE_RATE` (was `950`; on dev `ROOM_TYPES` lives here since PR #11)
- `lib/db/seed.ts` — Room 8 `baseRate` `"950.00"` → `"750.00"` (the exact drift, still present in dev's committed seed)
- `app/layout.tsx` — JSON-LD `priceRange` `"R950-R1200"` → `"R750"`
- `app/api/ping/route.ts` — **new** keep-alive GET: `SELECT 1` via shared `db`, `{ ok: true }` / 500 `{ ok: false }`, no auth, `force-dynamic`
- `vercel.json` — **new** — `/api/ping` cron `*/4 * * * *`
- `completedjob.md` — **new** — full work + findings report

**Validation results:**

- ✅ `npm run build` — exit 0; `/api/ping` present as a dynamic (ƒ) route
- ✅ `npx tsc --noEmit` — clean
- ✅ `npm run lint` — 14 problems (4 errors, 10 warnings) — **all pre-existing** (verified: zero in this PR's file footprint)

**Flags for the Architect / owner:**

- ⚠️ **Vercel plan limit:** `*/4 * * * *` cron exceeds the Hobby cap (once/day); full frequency needs Pro.
- ⚠️ **Pre-existing typecheck failure (not from this PR):** `app/book/page.tsx` passes a `seasonalPeriods` prop that `BookingForm` does not yet accept — part of a parallel in-progress seasonal refactor (`lib/db/seasonal.ts`, `lib/seasonal.ts`, etc. uncommitted). Owner should finish that wiring.
- ℹ️ Remaining `950` literals are intentional: `seed.ts`/`seasonal.ts` festive-window overrides (`ratePerNight: "950.00"`), `.agents/` color tokens + historical audit text, docs.
- ℹ️ No `pricingSettings` table exists anywhere — verified per Task 1 step 5; `lib/pricing.ts` remains the single source of truth.

---

### 2026-08-11 — Quick fixes & diagnostics (Tasks 2, 5, 6, 7) — DeepSeek Flash

**Status:** ✅ Tasks 2 & 5 delivered (PR → `dev` from `fix/admin-dashboard-delay-and-pool`); Tasks 6 & 7 measurement-only, report in PR + here.

**Files changed (2 + PROGRESS.md):**

- `app/admin/dashboard/AdminDashboard.tsx` — removed the artificial `setTimeout(() => setLoading(false), 500)` in the request-fetch `finally`; now calls `setLoading(false)` directly. Skeleton UI kept. (Task 2)
- `lib/db/index.ts` — pg `idleTimeoutMillis` `30_000` → `240_000` (4 min; not 0, not removed). (Task 5)
- `PROGRESS.md` — this entry.

**Validation results (clean worktree at PR state):**

- ✅ `npm run build` — exit 0
- ✅ `npx tsc --noEmit` — clean
- ✅ `npm run lint` — 14 problems (4 errors, 10 warnings), all pre-existing, zero in this PR's footprint

**Task 6 — `/corporate` LCP diagnosis (production, headless Chromium 151, 1440×900):**

- LCP element observed is a **nav text div** (~142×20, size 2,414) at ~516–604 ms — **not** the hero image. FCP ≈ 516 ms.
- Hero image (`/images/rooms/room1-view1.jpeg`, natural 960×720, rendered 1440×520) is served via **next/image** (`/_next/image?url=…&w=1920&q=75`): **preloaded** via head `<link rel="preload" as="image">` (fetch start ≈212 ms, complete ≈320 ms, ≈25 KB, ~107 ms).
- **`fetchpriority="high"` appears 0 times in the served HTML** — the `priority={index === 0}` prop in `components/HeroSlideshow.tsx` (present in v1.2.0 = live prod) only emitted the preload link, not the img attribute.
- Motion: hero headline/subcopy/CTA are `motion-ready`-gated (opacity 0 → 0.6 s fade, stagger delays) — delays text reveal but not image load; slideshow container has no motion class and is visible.
- **Root cause of the 6.6 s baseline LCP is NOT image transfer** (~25 KB, preloaded, sub-110 ms). It aligns with cold-start issues 1–3 in `Identified_Issues.md` (Neon autosuspend, iad1↔fra RTT, function cold start) plus motion-gated reveal on throttled clients. **Recommended fix (not applied):** ensure `fetchpriority="high"` renders on the hero img (verify Next 16 client-component `priority` behavior), keep the preload, `regions: ["fra1"]`, keep-alive already shipped in PR #18, and re-measure under a mobile-throttled profile.

**Task 7 — Post-deployment benchmark (vs `Identified_Issues.md` 2026-08-11 baseline):**

| Metric | Baseline | This run | Movement |
|---|---|---|---|
| Cold TTFB `/` | 2.36 s | 1.77 s first observed hit (cold inconclusive — functions stayed warm; true cold needs ~5 min idle) | ⬇ better |
| Warm TTFB (10 routes) | ~0.42 s | **61–157 ms** (e.g. `/` 157, `/corporate` 98, `/admin/dashboard` 98) | ⬇ ~3–6× faster (note: environment-proximity caveat) |
| `/admin/dashboard` LCP | 2.3 s (authenticated) | not measurable unauthenticated (redirects to `/admin`; login LCP 1.4 s, motion-gated text) | — needs creds or post-merge re-run |

- `/api/ping` is **404 in production** (not yet deployed — pending PR #18 merge), so it was excluded from the comparison set.
- Task 2's 500 ms removal will improve the authenticated dashboard LCP once merged.

**Flags:** browser tooling installed in sandbox only (`npx playwright install` + `install-deps`) — no repo changes beyond the 3 files above.

---

### 2026-08-11 — Improvement pass on Tasks 1–7 (security + performance) — DeepSeek Flash

**Status:** ✅ Delivered — PR → `dev` from `perf/lcp-priority-and-region` (follow-up to PRs #18/#19).

**Why:** self-review of the delivered tasks surfaced three concrete gaps worth implementing now, plus one security flag.

**Files changed (4):**

- `components/HeroSlideshow.tsx` — **Task 6 root cause fix**: Next 16.2's `priority` prop no longer emits `fetchpriority="high"` (verified in `next/dist/shared/lib/get-img-props.js` — zero `"high"` strings; `priority` only triggers the preload link + eager loading). Added explicit `fetchPriority={index === 0 ? "high" : undefined}` on the hero image so the LCP-capable image is actually high-priority in the DOM (fixes the corporate/home hero LCP finding; verified in the built chunk: `fetchPriority:0===r?"high":void 0`).
- `next.config.ts` — **Identified_Issues.md Issue 2 fix**: `regions: ["fra1"]` so Vercel Functions run in the same region as Neon (eu-central-1), cutting the ~90 ms cross-region RTT per DB round-trip. Typed via `as NextConfig` (the `regions` key lags Next 16's published `NextConfig` type; tsc verified clean).
- `app/book/actions.ts` + `app/corporate/actions.ts` — **killed the remaining pricing-drift class**: both re-declared `BREAKFAST_PRICE = "175.00"` / `DINNER_PRICE = "300.00"` instead of importing from `lib/pricing.ts`. Now import the shared constants and use `.toFixed(2)` for the decimal `unitPrice` snapshots — single source of truth for meal pricing end-to-end (leisure + corporate flows, UI + actions).

**Validation results (clean worktree at PR state):**

- ✅ `npm run build` — exit 0
- ✅ `npx tsc --noEmit` — clean
- ✅ `npm run lint` — 14 problems (4 errors, 10 warnings), all pre-existing, zero in this PR's footprint

**🔒 Security flag — action needed (not changed in this PR):**

- `.env`, `.env.example`, and `.env.local` are **tracked in git** (present in `origin/dev` and `origin/main` trees) despite `.gitignore` covering them. If any contain live `DATABASE_URL` / `SESSION_SECRET` values, they are exposed to anyone with repo access. Recommend: rotate any real secrets, `git rm --cached` those files in a dedicated PR (keep local copies), and never commit them again. The platform blocks direct env-file operations, so this needs the user/Architect to run.

---

### 2026-08-11 — UI findings & recommendations handoff doc (audit vs Protea Hotel Mahikeng) — Buffy

**Status:** ✅ Delivered (docs-only, no code changes).

**Files changed (2):**

- `UI-findings-and-recommendations.md` — **new** — the agent handoff doc: current-state audit, Protea benchmark, binding design mandates (relaxation + "every claim must be felt" for leisure AND business), full photography program (shot lists, grading, wiring into `rooms.images`), per-area recommendations with file references, the guest-review-system spec (capture flow, `reviews` schema sketch, moderation, display, POPIA), phased implementation roadmap, and guardrails (no fabricated reviews/photos/numbers).
- `knowledge.md` — added a "See also" pointer to the new doc for future agents.

**Validation:** docs-only — no build/typecheck/lint impact. Codebase facts verified against `app/`, `components/`, `lib/`, `PRODUCT.md`, `PROJECT_SPEC.md`.

**Flags:** Owner input required before go-live items — real WhatsApp number, owner name(s) + consent, breakfast/dinner specifics, prior guest feedback for the reviews section (real testimonials only), event-venue photos, local Mafikeng spots to feature.

### 2026-08-11 — Competition run: full UI roadmap on `comp/buffy` (whole-roadmap implementation) — Buffy

**Status:** ✅ Delivered on branch `comp/buffy` (created from `dev` at `3fa6cce` after committing the shared baseline: spec docs + in-flight seasonal work). Not yet merged — awaits branch-to-branch comparison vs the other models.

**What was built (all four phases of `UI-findings-and-recommendations.md`):**

- **Reviews system (Phase 2, the trust engine):**
  - Schema: `reviews` + `review_invites` tables (token per booking, status pending/approved/declined, feelings tags, photos, POPIA consent). Push via `npx drizzle-kit push` once DATABASE_URL is available (sandbox terminal has no DB access).
  - `lib/reviews.ts` engine: token invites, stay-has-ended check (incl. event dates), submit/validate (feelings + photo allowlists), approved-only public reads, stats, admin list + approve/decline.
  - `lib/review-options.ts` — client-safe feelings chips.
  - `lib/whatsapp.ts` + `lib/notifications.ts`: `sendReviewRequest` / `notifyGuestOfReviewRequest` (template `gomodi_review_request`, fails open).
  - Routes: `/api/review-reminders` (daily cron, added to `vercel.json`), `/api/admin/reviews` (staff-read), `/api/admin/reviews/[id]` (manager approve/decline), `/review?token=…` (public form: stars, feelings chips, headline+body, optional photo via `/api/upload`, POPIA consent + anonymous byline), `/admin/reviews` moderation queue (link added to dashboard header).
  - Homepage "What guests say" section — approved reviews only, warm empty state until real ones land, aggregate badge at ≥5 reviews. **No fabricated reviews** (guardrail).
- **Felt-experience + photo-ready pass (Phases 1 & 3):**
  - Homepage rewritten: felt copy across hero/journeys/about/amenities, `next/image` everywhere, new dining teaser, "Things to do in Mafikeng" (real, conservative facts), owner-story + host photo slot (no fabricated name).
  - `lib/contact.ts` — single WhatsApp surface (stays `"#"` until the owner supplies the number).
  - Rooms: `rooms.images` threaded from `/rooms` server page → `RoomsExplorer` (DB wins, seed fallback, placeholder last) + room photos in the booking wizard.
  - Corporate: felt business copy ("arrive the night before your big day"), real photo, procurement features kept. Events: felt copy pass.
  - `globals.css`: gentler reveals (shorter translate distances), softer hero gradient.
- **Finished the owner's in-flight seasonal pricing (pre-existing typecheck break):** `BookingForm` now accepts `seasonalPeriods` + `images`; accommodation totals resolve every night via `lib/seasonal.ts` (matches the quote engine), with a seasonal-rate note in the summary.

**Validation (clean worktree at branch state):**

- ✅ `npm run build` — exit 0; new routes present: `/review`, `/admin/reviews`, `/api/admin/reviews`, `/api/admin/reviews/[id]`, `/api/review-reminders`.
- ✅ `npx tsc --noEmit` — clean (was failing pre-branch: the seasonalPeriods prop break is now fixed).
- ✅ `npm run lint` — 11 problems (3 errors, 8 warnings), **all pre-existing** (RoomsExplorer 62:7, BranchModal 30:7, test_pages.js); zero new in this branch's footprint (two warnings I introduced were cleaned up).

**Flags:**
- ⚠️ `npx drizzle-kit push` needs `DATABASE_URL` — run it once in an environment with DB access (or the next deploy) so `reviews`/`review_invites` tables exist. Homepage degrades gracefully if they're missing.
- ⚠️ `vercel.json` now has two crons; Hobby plan allows one/day — full frequency needs Pro (already flagged for `/api/ping`).
- ℹ️ WhatsApp number still `"#"` (owner input needed); review template `gomodi_review_request` must be approved in Meta when WhatsApp goes live.

### 2026-08-12 — Branch consolidation: one source of truth on `dev` — Buffy

**Status:** ✅ Done — everything merged into `dev`; `dev` is now the single branch to work from.

**Why:** the repo had two divergent histories (`dev` vs `main`) plus five open PRs (#1, #13, #18, #19, #20) and the competition branch `comp/buffy` — nobody could tell which branch to work on.

**What was merged into `dev` (in order):**

1. `origin/main` — the full release line (PRs #2–#17: Lelz partnership, server-shell corporate/events, 3G perf pass, Neon workflow, docs). Conflicts resolved: `app/book/page.tsx` (kept seasonal wiring + cached `getRooms`), `lib/pricing.ts` (both `ROOM_BASE_RATE` + `LUNCH_PRICE`), `app/corporate/page.tsx` (kept server-shell architecture; pricing fix lands via PR #18).
2. `fix/corporate-pricing-drift-keepalive` (PR #18) — R950→R750 in `CorporateQuoteForm`, `/api/ping` keep-alive, `vercel.json` cron, seed Room 8 fix.
3. `fix/admin-dashboard-delay-and-pool` (PR #19) — removed artificial dashboard loading delay; pg pool idle timeout 4 min.
4. `perf/lcp-priority-and-region` (PR #20) — hero `fetchPriority`, Frankfurt `regions`, meal-pricing single source in actions.
5. `comp/buffy` — the whole-roadmap competition run: reviews system (`reviews`/`review_invites`, `/review`, `/admin/reviews`, reminder cron), felt-experience homepage + corporate copy, photo-ready sections, seasonal pricing finished in `BookingForm`.

**Branches dropped (now behind `dev` or empty):**

- PR #13 (`OratileTshipo-patch-1`) — commit was a no-op (identical tree); nothing to merge. Closed.
- PR #1 (`high-performance-motion-design-b72b3`) — orphaned history (no common ancestor with `dev`/`main`, cannot merge), stale since Aug 2. Closed.
- PRs #18/#19/#20 branches — content merged; branches deleted.

**Kept:** `main` (production release branch — release PRs `dev`→`main` as before), `comp/buffy` (competition comparison branch — content now in `dev`; may be deleted once judged).

**Verification on merged `dev`:** ✅ `npx tsc --noEmit` clean · ✅ `npm run build` exit 0 (all routes incl. `/review`, `/admin/reviews`, `/api/ping`) · ✅ lint 4 errors/9 warnings — all pre-existing (RoomsExplorer, BranchModal, HeroSlideshow, test_pages.js), none from this consolidation.

**Reminders:** `npx drizzle-kit push` still needed once for `reviews`/`review_invites` tables (homepage degrades gracefully meanwhile). `.env`/`.env.local` remain tracked in git (pre-existing on `main`) — recommend a dedicated PR to untrack them.

### 2026-08-12 — Code-quality pass (review findings executed) — Buffy

**Status:** ✅ Delivered — PR → `dev` from `chore/code-quality-pass`.

**Why:** full-repo quality audit (see `CODE-QUALITY-review.md` at repo root — the handoff doc with findings, fixes, and what remains). Verdict: well-built codebase; the issues were mostly maintainability/hygiene plus a few real bugs.

**Files changed (highlights):**

- `lib/rooms.ts` — **new** `bathLabel()` helper; fixed the `bathOrShower` case bug (seed stores `"Bath"`/`"Shower"`, 4 UIs compared lowercase → rooms 2 & 8 always showed "Shower"). Now used by homepage / rooms explorer / booking wizard.
- 3 React lint fixes: `RoomsExplorer.tsx` (setState-in-effect → derived), `BranchModal.tsx` (outer gate + keyed inner mount), `HeroSlideshow.tsx` (ref write moved into effect). `test_pages.js` → `scripts/test-pages.js` (eslint ignores `scripts/`). **All 4 pre-existing lint errors eliminated.**
- `lib/db/availability.ts` — corrected the stale "lock not built yet" comment (advisory locks exist in `app/api/admin/requests/[id]/route.ts`).
- `BookingForm.tsx` split (818 → ~180 lines) into `BookingCalendar`, `RoomStep`, `MealsStep`, `DetailsStep`, `PaymentStep`, `StaySummary`, `OtherRooms` + shared `booking-utils.ts` (see `app/book/`).
- `app/api/admin/requests/route.ts` — typed `EnrichedRequest` shapes (no more `Record<number, unknown>`).
- `lib/booking-common.ts` — **new** shared `validateContact`/`insertAddOnRows`/meal-normalization; the three booking actions no longer duplicate contact/add-on logic. `lib/validate.ts` gains `nightDates()`.
- Quick wins: single-query availability check (was N+1), SQL `AVG`/`COUNT` review stats, transactional `submitReview`, pricing sweep into `lib/pricing.ts` (events page/form/homepage).
- Repo hygiene: `.gitignore` rewritten (was mangled); `tsconfig.tsbuildinfo` untracked; scratch artifacts moved to `scratch/` (ignored).
- **Vitest** added — `npm test`, 42 tests in `lib/__tests__/` (quote-math cents, seasonal rates, validate primitives, bathLabel).

**Validation results:** ✅ `npm test` 42/42 · ✅ `npx tsc --noEmit` clean · ✅ `npm run build` exit 0 · ✅ lint — zero errors (was 4), remaining warnings pre-existing.

**Flags:** `.env`/`.env.local` still tracked in git — platform blocks env-file ops from the sandbox; owner must run `git rm --cached .env .env.local` in a dedicated PR (`.gitignore` already prevents re-adding). AdminDashboard + page.tsx extraction, `Result<T>` type, Upstash limiter, and CI lint/typecheck job remain as documented follow-ups in `CODE-QUALITY-review.md`.

### 2026-08-12 — Code-quality follow-ups (all remaining review items) — Buffy

**Status:** ✅ Delivered — PR → `dev` from `chore/follow-up-quality-pass`.

**Why:** the code-quality pass (PR #22) documented five remaining items in `CODE-QUALITY-review.md`. This pass executes every one of them: AdminDashboard split, homepage section extraction, `Result<T>` unification, Upstash Redis rate limiter (with in-memory fallback), and the CI gate.

**Files changed (highlights):**

- `app/admin/dashboard/` — `AdminDashboard.tsx` split 710 → 189 lines into `AdminHeader`, `ManagerStats`, `RequestCard`, `EmptyState`, `DashboardSkeleton` + pure `types.ts` / `format.ts`. Zero behavior change (verified against the original: header, partner-gated time clock, conflict banners, role-scoped approve/decline/contact all preserved).
- `app/page.tsx` — 838 → 55 lines; the 12 homepage sections moved to `components/home/` (Hero, WaysToStay, About, RoomsPreview, Reviews, Amenities, Dining, Events, Corporate, Explore, Payment, ContactCta). All anchor ids preserved (`#stay` `#rooms` `#reviews` `#dining` `#events` `#corporate` `#explore` `#payment` `#contact`).
- `lib/result.ts` — **new** shared `Result<T>` action contract; the four action-result unions (`LeisureBookingResult`, `CorporateQuoteResult`, `EventInquiryResult`, `SubmitReviewResult`) now alias it instead of re-declaring.
- `lib/rate-limit.ts` — **new**; Upstash Redis sliding-window limiter (global / multi-instance / edge-runtime) with the previous in-memory window as automatic fallback — both fail open on limiter errors. `middleware.ts` is now `async` and imports it (rate-limit logic removed from the middleware file).
- `.github/workflows/ci.yml` — **new** CI gate on every PR + push to dev/main: `npm ci` → `npx tsc --noEmit` → `npm run lint` → `npm test`.
- `package.json` — added `@upstash/ratelimit` + `@upstash/redis`. Optional keys: `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`; absent → automatic in-memory fallback (no config required).

**Validation results:** ✅ `npm test` 42/42 · ✅ `npx tsc --noEmit` clean · ✅ `npm run build` exit 0 (all routes) · ✅ lint — zero errors, 7 warnings all pre-existing (QuoteEditor, time-clock, BookingCalendar, corporate/events pages, quote-pdf).

**Flags:** All review follow-ups now closed. The single remaining owner-side item is the env untrack: `git rm --cached .env .env.local` + rotate any secrets ever pushed (the platform blocks env-file ops from the sandbox). Upstash keys can be added in the Freebuff Keys UI whenever the site needs a global limiter — until then the in-memory fallback applies.

### 2026-08-12 — Full E2E test suite (Playwright) — Buffy

**Status:** ✅ Delivered — PR → `dev`.

**Why:** the site had unit tests (vitest, 42) but zero browser-level coverage. This adds an end-to-end suite covering **every page, form, and interactive flow** — buttons, scrolls, clicks, data entry, loading times — so nothing ships untested.

**What was added:**

- **Playwright** (`@playwright/test` 1.62, chromium) — **82 tests in 11 spec files** under `e2e/`, each run on desktop **and** mobile viewports (perf on desktop only). Config: `playwright.config.ts` auto-starts `npm run dev` (or `npm run start` with `E2E_SERVER=prod`), reuses an existing server, `E2E_NO_WEBSERVER=1` for preview targets.
- **Coverage map** (see `E2E-TESTING.md`): site shell (brand/nav/footer, branch modal routing, 404), all 9 homepage sections + reviews strip, **full booking journey** (calendar dates → room → guest stepper → meals → details → EFT/cash payment switch + POP upload → consent gate → submit → success), rooms explorer (filters, sort, detail modal, bath/shower labels), events + corporate forms (catering radios, room lines, **live estimate math**, consent gates, submissions), review token gating + full form (stars/feelings/byline/consent), admin (unauth redirect, **OTP login**, dashboard, queue pages, logout), API surface (ping/auth/validation/404), **internal-link crawl** (5xx fails, 404 warns), **perf budgets** (LCP/FCP/DCL/Load/TTFB — strict vs prod, relaxed vs dev), and a11y smoke checks (h1 count, image alt, button names, labelled inputs, duplicate ids).
- **DB-aware resilience**: every spec probes `/api/ping` via a `dbReady` fixture — without a healthy backend, DB-dependent tests skip cleanly instead of failing the run.
- **CI**: new `e2e` job in `.github/workflows/ci.yml` — Postgres 16 service → `npm run db:push && npm run db:seed` → build → Playwright against the production server with strict budgets → report artifact on failure.
- **npm scripts**: `e2e`, `e2e:headed`, `e2e:perf`, `db:push`, `db:seed`.
- **A11y fix discovered by the suite**: consent checkboxes on book/events/corporate and the admin login phone/OTP inputs were **unlabelled** (input not wrapped, no `for`). Added `id` + `htmlFor` wiring (`bookingConsent`, `eventsConsent`, `quoteConsent`, `interestedInRooms`, `adminPhone`, `adminOtp`) — screen-reader + `getByLabel` support restored.

**Validation results:** ✅ `npm test` 42/42 · ✅ `npx tsc --noEmit` clean · ✅ `npm run build` exit 0 · ✅ lint zero errors (8 pre-existing warnings) · ✅ 82 Playwright tests compile (`--list`) · ✅ Chromium launches in the sandbox (browser smoke check) — full browser run happens in CI/local with a DB, per `E2E-TESTING.md` (the sandbox blocks starting a dev server).

**Flags:** run `npm run db:push && npm run db:seed` (dev DB only — seed truncates) before `npm run e2e`. Set `E2E_REVIEW_TOKEN` for the review-form spec. Perf budgets are strict under `E2E_SERVER=prod` only.

### 2026-08-15 — Enterprise-grade assessment & roadmap (docs) — Buffy

**Status:** ✅ Delivered — PR from `docs/enterprise-roadmap` (this is the branch's own PR; full detail in the PR description).

**Why:** owner asked for the project to be tackled as a professional web application built for long-term use — security, performance, scalability, maintainability, usability — scoped for a startup scaling to a multi-location guest house group across SA provinces/cities. This is the architecture/strategy deliverable (no runtime code changed).

**What was produced (read every `.md` first, then a line-level code audit, then industry research):**

- **`ENTERPRISE-ROADMAP.md`** — new, the living strategy reference:
  - Current-state audit vs professional standards: what is genuinely strong (CSP/CSRF/OTP hardening, advisory-lock approve, integer-cents money, Result<T>, single-source pricing, 42 unit + 82 e2e tests, fra1 region) and a 30-item gap register across Security, Scalability, Performance, Maintainability, Usability, Operations.
  - Industry standards mapping: OWASP ASVS/Top-10 table, Core Web Vitals budgets, POPIA/PAIA/PCI-DSS (SA), hospitality reference (PMS + channel-manager pattern à la Cloudbeds/Little Hotelier/NightsBridge — buy, don't build OTA sync), Next.js observability (Sentry + uptime monitor).
  - **Target architecture for multi-location**: single-DB shared-schema tenancy with `property_id` (ADR 013), property-scoped RBAC (`scopedDb()` guard), `property_settings` config-as-data, consolidated HQ view.
  - **Phased roadmap**: Phase 0 stabilization (merge #27/#28/#30, untrack secrets, WhatsApp creds, migrations, transactions, indexes, Sentry, POP upload) → Phase 1 multi-location foundation → Phase 2 payments (PayFast primary, hosted PCI-DSS checkout, webhooks) → Phase 3 ops/governance (audit log, admin settings, privacy artifacts) → Phase 4 growth (PWA, i18n, channel manager).
  - Risk/decision register D1–D10 (owner inputs) + a professional Definition of Done checklist.
- **`docs/03-design/adr-log.md`** — filled the empty placeholder with 14 ADRs: the 11 historical decisions reconstructed from docs/code (Prisma→Drizzle, in-house OTP, single-source pricing, force-dynamic+60s cache, approved-only locks + advisory locks, Result<T>, custom calendar/motion, fra1, fail-open, token-gated reviews, push-only schema) + 3 proposed (versioned migrations, property_id tenancy, hosted payments).
- **`knowledge.md`** — added the `ENTERPRISE-ROADMAP.md` pointer to the READ-FIRST list.
- **`PROGRESS.md`** — added the Open tasks ledger (owner 🔴 / code-side 🟡 / housekeeping 🟢) with the roadmap phases mapped in; this entry.

**Validation:** docs-only change — no build/typecheck/lint impact (no `.ts`/`.tsx` touched). Facts in the audit were verified against `app/`, `lib/`, `components/`, `.github/`, `e2e/`, and config files on `origin/dev` at `00fdce1` (incl. vercel.json now Hobby-safe with the single daily cron after PR #31).

**Flags for the owner:** all 10 decision items (D1–D10) in the roadmap's risk register are owner-side; Phase 0 code tasks (POP upload, migrations, transactions, indexes, Sentry, unit tests) are ready to execute on request. **Priority call for the owner: merge #27 → #28 → #30 first, and do the secrets rotation + WhatsApp credentials — those unblock production login and real notifications.**

### 2026-08-15 — PR merges (#27/#28/#30/#32/#33) + CI-e2e fix + Neon autosuspend workflow — Buffy

**Status:** ✅ Merges done; 🔄 CI-e2e fix in PR #34 (see below).

**Why:** owner asked to merge PRs #27/#28/#30, verify CI green, disable Neon autosuspend, and ensure the enterprise roadmap is in the repo as the single source of truth for all agents/models.

**What was done:**

- **Merged to `dev`:** #27 (CI gate fix — shipped via #28's stacked branch; GitHub auto-marked #27 merged when its commit landed), #28 (E2E stabilization), #30 (Neon preview branch sanitize — resolved its add/add vitest.config.ts conflict with dev), #32 (enterprise roadmap docs — resolved the PROGRESS.md conflict, keeping the roadmap-ledger superset), #33 (Neon autosuspend workflow). All PRs closed; dev head `57618ef`.
- **Roadmap is now on `dev`** — `ENTERPRISE-ROADMAP.md`, the filled `docs/03-design/adr-log.md`, and the PROGRESS.md ledger are merged, so every agent/model reading the repo gets the same single source of truth (knowledge.md READ-FIRST pointer included).
- **Neon autosuspend:** added `.github/workflows/disable-neon-autosuspend.yml` (workflow_dispatch → sets `suspend_timeout_seconds=0` on every compute endpoint via the `NEON_API_KEY` secret). ⚠️ The Freebuff token cannot dispatch workflows (needs `actions:write`; it's 403) and `gh workflow run` only resolves workflows on the default branch — so it becomes clickable from Actions → "Disable Neon autosuspend" once it reaches `main` (next dev→main release), or the owner can disable it in the Neon console directly (Settings → Compute → suspend after inactivity → Never).
- **CI-e2e fix (PR #34, `fix/ci-e2e-green`):** the first real CI run after #27/#28/#30 revealed two spec/app bugs the stabilization had shipped unvalidated (suite never ran locally — no DB in sandbox):
  1. `e2e/booking.spec.ts` room-step scope used `heading → xpath=..`, which lands on the step *header* div — the room buttons are in a sibling grid → locator matched nothing ("full booking journey" + "unavailable rooms" failed). Fixed with `data-testid="room-step"` on RoomStep + `getByTestId` in both tests.
  2. `app/admin/AdminLogin.tsx`: "Sign in to admin" h1 was `hidden lg:block`, so mobile rendered only the "Gomodi Admin" h1 → admin spec failed on mobile. Now a **single h1** ("Sign in to admin") on every viewport; mobile brand is a styled div.

**Validation:** `npx tsc --noEmit` clean · `npm run lint` 0 errors (7 pre-existing warnings) · `npm test` 42/42 · `npx playwright test --list` 82 specs compile. Full browser run is in CI on PR #34 (Postgres + production server) — watch that run for the true e2e verdict.

**Flags:** core CI gate (typecheck/lint/vitest) is green on `dev`; the e2e job on dev is red until #34 merges. Vercel deploy check remains red (owner-side env config). Next owner steps: secrets rotation + WhatsApp credentials (go-live blockers), approve a dev→main release so the Neon workflow becomes clickable, decide D6/D7 for Phases 1–2.

### 2026-08-15 — Phase 0 code: versioned migrations + transactional booking inserts + hot-path indexes — Buffy

**Branch:** `fix/phase0-migrations-tx-indexes` → PR (dev). Implements ADR 012 and roadmap A2/A3/A6.

- **Versioned migrations (A2/ADR 012):** un-ignored `drizzle/`; generated `0000_baseline` (full schema, matches live push-created state), `0001_hot-path-indexes` (5 indexes), `0002_booking-requests-contact-phone-idx`. CI e2e job + Neon preview workflow now run `db:migrate` (Neon falls back to `push` until the parent DB adopts). Added `npm run db:migrate` + `npm run db:adopt` (`scripts/adopt-migrations.ts` — marks the baseline applied on push-created DBs by replicating drizzle's `drizzle.__drizzle_migrations` hash tracking; verified against drizzle-orm's migrator source: sha256 of raw SQL, `created_at` = journal millis).
- **Transactional booking inserts (A3):** `lib/quotes.ts` `createDraftQuote` now accepts a `db.transaction(tx)` client (`Queryable`); all three actions (`app/book`, `app/corporate`, `app/events`) wrap request → room lines → meals → quote (+POP row for leisure, +partner timestamp for events) in one `db.transaction`; WhatsApp notifications moved post-commit (they fail open). Corporate `findAvailableRoomIds` rewritten from N+1 per-room overlap queries to a single booked-room query (same overlap semantics) — also fixes the theoretical race where availability + insert weren't atomic.
- **Hot-path indexes (A6):** `booking_room_lines(room_id, check_in, check_out)`, `booking_requests(status, category)`, `booking_requests(contact_phone)`, `auth_otps(phone, consumed)`, `reviews(status)`, `staff_time_clocks(user_id, timestamp)`; `quotes(public_token)` already unique.
- **Docs:** README, SETUP-LOCAL, E2E-TESTING, GIT_WORKFLOW_GUIDELINES, knowledge.md, playwright.config comment, ADR 012 status, roadmap A2/A3/A6 statuses, ledger.
- **Verified:** `npx tsc --noEmit` clean; `npm run lint` clean; `npm test` green. CI will validate the migration chain end-to-end on a fresh Postgres (e2e job: `db:migrate` → seed → Playwright).
- **Owner steps:** run `npm run db:adopt && npm run db:migrate` once on the production DB (then future schema changes are pure migrations).

### 2026-08-15 — Phase 0 remaining: Sentry observability + unit tests + POP polish — Buffy

**Branch:** `fix/phase0-observability-tests-pop` → PR (dev). Implements roadmap O1 / M2 / U2.

- **Sentry (O1):** `@sentry/nextjs@10` (Next 16-compatible); `instrumentation.ts`, `sentry.client/server/edge.config.ts`, `app/global-error.tsx`, `next.config.ts` wrapped with `withSentryConfig({ silent: true })` — **fails open** with no env vars (build verified locally). Prod needs `SENTRY_DSN` (+ `SENTRY_AUTH_TOKEN` for source-map upload on Vercel). Remaining O1: uptime monitor on `/api/ping`, structured logger.
- **Unit tests (M2, 42 → 72):** `lib/__tests__/auth.test.ts` (roundtrip, tamper payload/signature, expiry via fake timers, malformed, role guards), `rate-limit.test.ts` (sliding-window edges, per-key isolation, Upstash fail-open with mocked client), `quote.test.ts` (`buildDraftLines` — room lines, seasonal straddle segments, shortest-label, inactive periods, meal aggregation, clamping). Remaining M2: role-filter tests for `app/api/admin/requests`.
- **POP polish (U2):** shared `lib/pop-upload.ts` (`uploadProofOfPayment` client helper + `sanitizePopMeta` server sanitizer) and `components/PopUpload.tsx`; leisure now stores real fileName/fileSize/mimeType from the server-verified upload (schema already had the columns); corporate + events forms gain an optional **Deposit** section (upload persisted inside the existing transaction, URL gated by `isSafeProofOfPaymentUrl`).
- **Verified:** `tsc` clean, lint 0 errors (7 pre-existing warnings), vitest 72/72, `npm run build` green (validates the Sentry build plugin fails open). CI validates e2e (booking `#popFileInput` selector preserved; a11y label scan unaffected).

<!-- New entries go above this line, newest last. -->
