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

<!-- New entries go above this line, newest last. -->
