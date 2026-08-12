# Completed Job — Pricing Drift Fix (Task 1) + DB Keep-Alive (Task 3)

**Repository:** gomodi-lodge-webApp-linux
**Delivered to branch:** `dev` (rebased on top of `origin/dev`, pushed)
**Date:** 2026-08-11

---

## Scope

This delivery covers two items from `FREEBUFF_TASK_pricing_and_region.md`:

- **Task 1 — Fix corporate room pricing drift** (DeepSeek Flash)
- **Task 3 — Add DB keep-alive endpoint and Vercel Cron** (DeepSeek Flash)

Task 4 (MiniMax M2.5) and the other outstanding gaps in
`FREEBUFF_TASK_pricing_and_gaps_fix.md` are **not** part of this delivery.

---

## Task 1 — Corporate room pricing drift

### What was done

1. **`lib/pricing.ts`** — added the shared room-rate constant
   `export const ROOM_BASE_RATE = 750;` next to the existing
   `BREAKFAST_PRICE` / `DINNER_PRICE` exports (same style), and updated the
   file's doc comment since it is now the single source of truth for room +
   meal pricing. On `dev` this file already carried `LUNCH_PRICE` from a
   parallel task — that was preserved untouched.
2. **`app/corporate/CorporateQuoteForm.tsx`** — the corporate form's
   `ROOM_TYPES` array now prices both room types from `ROOM_BASE_RATE`
   instead of the drifted `price: 950` literals. (Note: on `dev`, the
   corporate page was refactored in PR #11 to lazy-load this form component,
   so `ROOM_TYPES` lives here rather than in `app/corporate/page.tsx`.)
3. **`app/layout.tsx`** — the JSON-LD `priceRange` field was the only other
   clearly room-rate `950` in the repo (it advertised the stale `"R950-R1200"`
   range); changed to `"R750"` to match the confirmed flat rate.
4. **`lib/db/seed.ts`** — dev's committed seed still had Room 8's
   `baseRate: "950.00"` — the exact drift this task exists to kill (a local
   fix existed only in an uncommitted working tree). Corrected to `"750.00"`
   with an explanatory comment. The seasonal `ratePerNight: "950.00"`
   entries are untouched (intentional festive-window overrides).

### Findings from the full-repo `950` sweep

| Location | Match | Verdict |
|---|---|---|
| `app/corporate/CorporateQuoteForm.tsx` | `price: 950` ×2 (ROOM_TYPES) | **Fixed** — this was the drift |
| `app/layout.tsx` | `priceRange: "R950-R1200"` (JSON-LD) | **Fixed** — clearly a room rate |
| `lib/db/seed.ts` | Room 8 `baseRate: "950.00"` | **Fixed** → `"750.00"` — the confirmed flat rate (this exact drift was still present in dev's committed seed) |
| `lib/db/seed.ts` | `ratePerNight: "950.00"` ×2 | **Left alone** — seasonal festive-window overrides (separate confirmed pricing domain; base rate stays R750 outside those windows) |
| `lib/seasonal.ts` | comment mentioning "R950" festive season | **Left alone** — documents the seasonal domain |
| `.agents/content-pricing-auditor.ts` | historical audit narrative | **Left alone** — agent prompt/history, not a live rate |
| `.agents/skills/**`, docs | `gray-950` color tokens, PNG magic bytes, requirements docs | **Left alone** — unrelated to room rates |

### Step-5 check: `pricingSettings`

`lib/db/schema.ts` was read in full and the whole repo was grepped for
`pricingSettings` / `pricing_settings` — **no such table exists**. Per the
task spec's step 5 ("if one exists, stop and report back"), there is no
competing source of truth, so the work proceeded with `lib/pricing.ts` as
the shared constant home.

---

## Task 3 — DB keep-alive endpoint + Vercel Cron

### What was done

1. **`app/api/ping/route.ts`** (new) — GET handler that reuses the existing
   `db` client from `lib/db/index.ts` (no second connection), runs
   `SELECT 1`, returns `{ ok: true }` on success and HTTP 500 with
   `{ ok: false }` on failure. No auth, no mutation. Declared
   `export const dynamic = "force-dynamic"` so the route can never be
   statically cached — a cached ping would defeat the keep-alive purpose
   (this matches the convention already used by other API routes in the app).
2. **`vercel.json`** (new, project root) —
   `{ "crons": [{ "path": "/api/ping", "schedule": "*/4 * * * *" }] }`

### Notes / flags

- **Vercel plan limits:** `*/4 * * * *` runs every 4 minutes, which Vercel's
  **Hobby plan does not allow** (Hobby crons are capped at once per day). On
  Hobby the endpoint will only fire daily; the Pro plan permits the full
  frequency. No code change needed — just plan awareness.
- The cron only takes effect after the next deployment that includes
  `vercel.json`.
- `DATABASE_URL` must be set in the production environment for the ping to
  succeed (it is already required by the rest of the app).

---

## Verification

- `bun tsc -b --noEmit` — all files in this delivery typecheck cleanly.

### ⚠️ Pre-existing type error — NOT from this work

`app/book/page.tsx` fails typecheck with:

```
Property 'seasonalPeriods' does not exist on type '{ rooms: Room[]; ... }'
```

This file carried **uncommitted in-progress changes before this task began**
(a parallel seasonal-pricing refactor: modified `app/book/page.tsx`,
`lib/db/schema.ts`, `lib/db/seed.ts`, `lib/quotes.ts`, `next-env.d.ts` and
untracked `lib/db/seasonal.ts`, `lib/seasonal.ts`, `scripts/_db-check.ts`).
The refactor passes a `seasonalPeriods` prop that `BookingForm.tsx` does not
yet accept. Per instructions these pre-existing changes were **preserved
untouched and were NOT staged/committed** in this delivery. The refactor's
owner needs to finish it (add the `seasonalPeriods` prop to `BookingForm` or
revert the page change) to restore a green typecheck.

---

## Files changed in this delivery

| File | Change |
|---|---|
| `lib/pricing.ts` | Added `ROOM_BASE_RATE = 750`; updated doc comment; preserved dev's `LUNCH_PRICE` |
| `app/corporate/CorporateQuoteForm.tsx` | `ROOM_TYPES` now priced from `ROOM_BASE_RATE` (was 950) |
| `app/layout.tsx` | JSON-LD `priceRange` → `"R750"` |
| `app/api/ping/route.ts` | New keep-alive GET endpoint (`SELECT 1`) |
| `vercel.json` | New — `/api/ping` cron every 4 minutes |
| `completedjob.md` | This document |

### Branch integration note

This work was originally committed on top of the local `main` tip
(`f284ffe`). Before pushing, `origin/dev` was fetched: it had moved ahead
with several merged PRs (including #10 Lelz partnership and #11
server-shell corporate form refactor). The delivery commit was **rebased
onto `origin/dev`** and the conflicts resolved — the corporate `ROOM_TYPES`
drift fix was relocated to `app/corporate/CorporateQuoteForm.tsx` (where the
refactor moved it), and dev's `LUNCH_PRICE` addition to `lib/pricing.ts` was
preserved. The push updated `dev` (head of PR #12) with a single new commit.

## Next steps for the Architect

- Confirm the festive-season `950.00` / `850.00` override rates in
  `lib/db/seed.ts` are still intended (they are out of scope here, but the
  sweep surfaced them as the only remaining `950` literals).
- Decide the Vercel plan question for the 4-minute cron frequency.
- Have the seasonal-pricing refactor owner complete `app/book/page.tsx` so
  the repo typechecks green.
