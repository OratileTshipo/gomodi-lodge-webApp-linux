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

<!-- New entries go above this line, newest last. -->
