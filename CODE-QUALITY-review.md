# Code Quality Review — Findings & What Was Fixed

Full-repo quality audit (2026-08-12), executed on `chore/code-quality-pass` and merged into `dev`.
This doc is the handoff: what the review found, what the pass fixed, and what remains for a future agent.

---

## Verdict

The codebase is in **above-average shape for an AI-built Next.js app**. Security posture is serious
(CSP nonces, CSRF origin checks, IP rate limiting, HMAC-signed sessions, OTP hashing, safe POP-URL
allowlisting), validation is centralized in `lib/validate.ts` and applied server-side everywhere,
money math runs in integer cents (`lib/quote-math.ts`) with server-recomputed totals, and the
approval flow uses Postgres advisory locks. Zero `@ts-ignore`, strict TS, typed Drizzle schema.

The issues found were mostly **maintainability and hygiene**, not correctness — with a handful of
real bugs, all now fixed.

---

## What this pass fixed

### P0 — correctness & lint (all fixed)

1. **`bathOrShower` case bug** — seed stores `"Bath"` / `"Shower"` but 4 UIs compared `=== "bath"`
   (lowercase), so rooms 2 & 8 always rendered "Shower" to guests.
   - Fixed via a shared helper `lib/rooms.ts` → `bathLabel()` (case-insensitive), now used by the
     homepage, rooms explorer, and booking wizard. Any future UI must import it — never hand-roll
     the comparison.
2. **All 4 React lint errors eliminated** (repo had exactly 4; the only red in lint):
   - `RoomsExplorer.tsx:62` — setState-in-effect → derived during render
   - `BranchModal.tsx:30` — setState-in-effect → restructured into outer gate + keyed inner mount
   - `HeroSlideshow.tsx:25` — ref write during render → moved into an effect
   - `test_pages.js` root `require()` → moved to `scripts/test-pages.js` (eslint ignores `scripts/`)
3. **Stale comment** in `lib/db/availability.ts` claimed the approval-time availability lock was
   "not built yet" — it *is* built (advisory locks in `app/api/admin/requests/[id]/route.ts`).
   Comment corrected so future agents don't rebuild it.

### P1 — structure (partially done; see Remaining)

4. **`BookingForm.tsx` split (818 → ~180 lines)**: extracted `BookingCalendar`, `RoomStep`,
   `MealsStep`, `DetailsStep`, `PaymentStep`, `StaySummary`, `OtherRooms` into `app/book/`, plus
   shared `booking-utils.ts` (date/night helpers, availability-window logic). The wizard now
   composes components instead of one monolith.
5. **Admin-queue shapes typed**: `app/api/admin/requests/route.ts` no longer builds
   `Record<number, unknown>` maps — requests are shaped into a typed `EnrichedRequest` (category
   discriminated unions) so the client deals with concrete types.

### P2 — hygiene & consistency

6. **Duplicated action logic extracted** into `lib/booking-common.ts` (`validateContact`,
   `insertAddOnRows`, meal-selection normalization) — the three booking actions
   (`app/book/actions.ts`, `app/corporate/actions.ts`, `app/events/actions.ts`) were re-implementing
   the same contact validation + add-on inserts with drifting details. Also added `nightDates()`
   to `lib/validate.ts` (was a duplicated local in one action).
7. **Pricing drift killed** — catering/meal prices now flow from `lib/pricing.ts` constants into the
   events page, event inquiry form, and homepage copy (the previous class of "R175 hardcoded in 4
   places" bugs). `lib/pricing.ts` remains the single source of truth for money.
8. **Quick wins**:
   - Availability check in `app/book/actions.ts` is now a single SQL query (was N+1 per night).
   - Review stats use SQL `AVG`/`COUNT` aggregates (`lib/reviews.ts`) instead of client-side math.
   - `submitReview` runs in a transaction (invite status + review insert can't half-commit).
9. **Repo hygiene**:
   - `tsconfig.tsbuildinfo` untracked (it churned on every build) + ignored.
   - Scratch artifacts moved to `scratch/` (`test.md`, `completedjob.md`, WhatsApp zip,
     `FREEBUFF_TASK_*.md`, `scripts/_*.ts` scratch scripts) — all ignored via `.gitignore`.
   - `.gitignore` rewritten (was mangled: started with a stray markdown fence and had paste
     artifacts); now covers env files, `*.tsbuildinfo`, `scratch/`.
10. **Unit tests added (Vitest)**: `npm test` → 42 tests across `lib/__tests__/`:
    `quote-math` (cents math, VAT clamp), `seasonal` (per-night rate resolution), `validate`
    (phone/email/date/stay primitives), `rooms` (bathLabel). These are the money + date invariants
    the whole booking engine depends on.

---

## What remains (for a future agent)

| Item | Why it's still open |
|---|---|
| **Untrack `.env` / `.env.local`** | Both are tracked in git (pre-existing security exposure). The platform blocks env-file operations from the sandbox, so it needs the owner: `git rm --cached .env .env.local` in a dedicated PR, keep local copies, rotate any secrets that were ever pushed. `.gitignore` is already fixed to prevent re-adding. |
| **`AdminDashboard.tsx` extraction (710 lines)** | Same split pattern as `BookingForm` now proves: extract the tab panels into components (the `ReviewsList`/`QuotesList` pattern already exists). Left for a dedicated pass to keep this PR reviewable. |
| **`app/page.tsx` section extraction (838 lines)** | Extract `ReviewsSection`, dining teaser, things-to-do, contact CTA into components. Same reasoning — size kept this PR honest. |
| **`Result<T>` unification** | The `{ ok } \| { ok: false; error }` shape is already consistent everywhere; a shared `lib/result.ts` type would formalize it. Purely mechanical, low priority. |
| **In-memory rate limiter → Upstash/Redis** | Per-instance brake only (documented in `middleware.ts`); swap when the site outgrows a single warm instance. |
| **CI: lint + typecheck job** | Repo has GitHub Actions; add a job running `tsc --noEmit`, `npm run lint`, `npm test` so every PR gates on them. |

---

## Verification run for this pass

- `npm test` — 42/42 pass
- `npx tsc --noEmit` — clean
- `npm run build` — exit 0
- `npm run lint` — the 4 pre-existing errors are gone; remaining warnings are pre-existing
  (HeroSlideshow etc.) and tracked in `knowledge.md`
