# Freebuff Task Spec: Pricing Drift Fix + Outstanding Gaps

**Issued by:** Claude (Architecture/Strategy lead)
**For:** Freebuff / Qwen3.5 (implementation)
**Priority:** HIGH — guest-facing pricing accuracy issue, live in production code
**Do NOT skip the "Read First" section below.**

---

## Read First: Why This Matters

This codebase has a recurring bug pattern: **the same piece of pricing data is hardcoded in more than one place, and the copies have drifted out of sync.** This has already happened once (Room 8 showing R950 while every other room shows R750, the confirmed flat rate). It is about to cause a second, related problem with meal add-on prices.

**The fix in this task is NOT "change the number in the file that's wrong."** The correct fix is to introduce a **single source of truth** for all pricing, so this class of bug becomes structurally impossible to reintroduce. Read every section fully before writing any code.

---

## Confirmed Business Rules (source of truth — do not deviate)

- All 9 rooms share **one flat rate: R750.00/night**. There is no per-room pricing variation.
- Breakfast add-on: **R175.00** per person per night.
- Dinner add-on: **R300.00** per person per night.
- A **lunch add-on** is a new requirement, not yet implemented anywhere. Price TBD by owner — use a placeholder of **R150.00** and flag it clearly as "PLACEHOLDER — confirm with owner before go-live" in code comments and in your final report.
- Corporate quote page currently shows a **price range** (e.g. "R150–R200" for breakfast) — this is incorrect. All guest segments (leisure, corporate, events-with-rooms) must show the **same flat, confirmed prices**. No ranges.

---

## Part 1: Introduce `pricingSettings` as Single Source of Truth

### 1.1 Schema change (`lib/db/schema.ts`)

Add a new table:

```typescript
export const pricingSettings = pgTable("pricing_settings", {
  key: varchar("key", { length: 60 }).primaryKey(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  label: varchar("label", { length: 120 }).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

Seed it with exactly these rows (add to `lib/db/seed.ts`):

| key | value | label |
|---|---|---|
| `room_flat_rate` | 750.00 | Standard Room Rate (per night) |
| `breakfast_price` | 175.00 | Breakfast Add-on (per person/night) |
| `dinner_price` | 300.00 | Dinner Add-on (per person/night) |
| `lunch_price` | 150.00 | Lunch Add-on (per person/night) — PLACEHOLDER |

### 1.2 Remove per-room pricing drift

- In `lib/db/seed.ts`: **Room 8's `baseRate` must be corrected from `"950.00"` to `"750.00"`.** This is the confirmed, immediate fix.
- Longer-term: the `rooms.baseRate` column may remain in the schema for now (do not do a risky migration mid-task), but **all application code must read the flat rate from `pricingSettings`, not from `rooms.baseRate`,** going forward. Do not delete the column without explicit sign-off — just stop relying on it as the source of truth.

### 1.3 Create a shared pricing accessor

Create `lib/db/pricing.ts`:

```typescript
import { db } from "./index";
import { pricingSettings } from "./schema";

export type PricingMap = {
  roomFlatRate: string;
  breakfastPrice: string;
  dinnerPrice: string;
  lunchPrice: string;
};

export async function getPricing(): Promise<PricingMap> {
  const rows = await db.select().from(pricingSettings);
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    roomFlatRate: map.room_flat_rate ?? "750.00",
    breakfastPrice: map.breakfast_price ?? "175.00",
    dinnerPrice: map.dinner_price ?? "300.00",
    lunchPrice: map.lunch_price ?? "150.00",
  };
}
```

### 1.4 Replace every hardcoded price with a call to `getPricing()`

You must update **every one** of these locations. Do not miss any — a partial fix reintroduces the exact bug we're solving:

| File | What to change |
|---|---|
| `app/book/actions.ts` | Replace `const BREAKFAST_PRICE = "175.00"` and `const DINNER_PRICE = "300.00"` with a call to `getPricing()` inside `submitLeisureBooking`. Add lunch handling if a lunch flag is passed in (see Part 3). |
| `app/corporate/actions.ts` | Same — replace the two hardcoded constants with `getPricing()`. |
| `app/corporate/page.tsx` | `ROOM_TYPES` currently hardcodes `price: 950` for both room types. Replace with a value fetched from `pricingSettings` (fetch server-side and pass as a prop, or use a server action). Also replace the "R150–R200" / "R250–R350" range text in the meal add-on labels with the exact confirmed prices. |
| `app/book/BookingForm.tsx` | `BREAKFAST_PRICE = 175` and `DINNER_PRICE = 300` constants at the top of the file — these must come from props passed down from the server component (`app/book/page.tsx`), which fetches from `getPricing()`. |
| `app/rooms/RoomsExplorer.tsx` / `app/rooms/page.tsx` | Currently reads `room.baseRate` per room. Since all rooms are one flat rate, replace per-room rate display with the single flat rate from `getPricing()`, fetched in `app/rooms/page.tsx` and passed down. |
| `app/page.tsx` (homepage) | The "Rooms Preview" section shows `room.baseRate` per card — same fix, use the flat rate. |
| `app/layout.tsx` | The JSON-LD `priceRange` field currently says `"R950-R1200"`. Replace with a single accurate value, e.g. `"R750"` (research correct schema.org format for a flat rate — likely just the number as a string, not a range). |
| `app/events/page.tsx` | Catering package prices (R150/R250/R350 for tea/three-course/full-day) are a **separate, confirmed pricing set** — these are NOT room/meal add-on prices and should NOT be touched by this task. Leave them as-is unless the owner says otherwise. |

### 1.5 Do not touch

- `bookingRoomLines`, `addOnSelections` — these tables store the price *at time of booking* (a snapshot), which is correct practice and should remain unchanged. Only the *source* the app reads from when creating new records changes.
- Any already-submitted historical booking data (test/demo bookings) — do not attempt to retroactively "fix" old records.

---

## Part 2: Admin Settings Screen (New Feature)

Build a new page at `app/admin/settings/page.tsx` (Owner/Assistant role only — reuse the RBAC pattern already in `AdminDashboard.tsx`).

**Requirements:**
- Read all rows from `pricingSettings` and display them in a simple form (label + editable number input per row).
- On save, update the corresponding rows via a server action (`app/admin/settings/actions.ts`). Validate that all values are positive numbers before writing.
- Add a second section on the same page: **per-room availability toggle.**
  - Add two columns to the `rooms` table: `isAvailable boolean default true`, `unavailableNote text` (nullable).
  - Display all 9 rooms with a toggle switch and an optional text field for a note (e.g. "Under maintenance until 15 Aug").
  - When a room is marked unavailable, it must be **excluded from availability checks** in `lib/db/availability.ts` and from the room selection UI in `app/book/BookingForm.tsx` and `app/rooms/RoomsExplorer.tsx` (show it, but visually marked unavailable, similar to the existing "Booked" overlay pattern already in `BookingForm.tsx`).
- Access control: Staff role must be blocked from this page entirely (redirect to `/admin/dashboard`), consistent with existing RBAC in `AdminDashboard.tsx`.

---

## Part 3: Lunch Add-on Scoping

Add lunch as a third meal option, following the exact pattern already used for breakfast/dinner:

- `lib/db/schema.ts`: extend `addOnTypeEnum` to include `"lunch"`.
- `app/book/BookingForm.tsx`: add a lunch checkbox card identical in style to breakfast/dinner, priced from `getPricing().lunchPrice`.
- `app/book/actions.ts`: accept a `lunch: boolean` field in `LeisureBookingInput`, and generate `addOnSelections` rows for it exactly as breakfast/dinner currently do.
- `app/corporate/page.tsx` and `app/corporate/actions.ts`: same addition, following the existing breakfast/dinner pattern in `CorporateQuoteInput`.
- **Flag prominently in your PR/report:** the R150 lunch price is a placeholder pending owner confirmation — do not treat it as final.

---

## Part 4: Fix Proof-of-Payment Upload (Currently Cosmetic Only)

**Problem:** In `app/book/BookingForm.tsx`, the file input only stores `file.name` in local state (`popFileName`). It never calls the existing, fully-built `/api/upload` route. Guests believe they've submitted proof of payment; nothing is stored.

**Fix:**
1. On file selection, immediately upload via `fetch("/api/upload", { method: "POST", body: formData })` (the route already exists and works — see `app/api/upload/route.ts`).
2. Store the returned `url`, `fileName`, `fileSize`, `mimeType` in component state.
3. On form submit, pass `proofOfPaymentUrl` through to `submitLeisureBooking` — note that `LeisureBookingInput` in `app/book/actions.ts` **already accepts `proofOfPaymentUrl`** and already inserts into `proofOfPayments` if present. This wiring already exists on the backend — the gap is purely in the frontend not calling the upload endpoint.
4. Show a clear loading/success/error state during upload (don't let the guest submit the booking while an upload is still in progress or has failed silently).
5. Handle the case where upload fails — do not block booking submission entirely (payment can still be arranged manually), but do show the guest an honest message that their file didn't upload and they should send proof separately via WhatsApp.

---

## Part 5: Banking Details — Do Not Modify, Flag Only

`app/book/BookingForm.tsx` currently displays hardcoded banking details (FNB, account ending 2011, branch 250655) directly to guests.

**Your task here is NOT to change these values.** Per project governance, live banking details require the owner's personal verification before being trusted as real. 

**Action required:** Add a clear code comment directly above this block stating:
```
// TODO(owner-verification-required): These banking details have NOT been
// confirmed as accurate by the property owner. Do not modify without
// explicit owner sign-off. See knowledge.md governance notes.
```
Report this flag explicitly in your summary — do not silently leave it unmentioned.

---

## Acceptance Criteria (all must pass before this task is considered done)

1. `npx tsx lib/db/seed.ts` runs cleanly and seeds `pricingSettings` with the 4 rows specified above, and Room 8's rate is R750.00.
2. Searching the codebase for the literal strings `"175.00"`, `"300.00"`, `950`, `"950.00"` in pricing-related contexts returns **zero remaining hardcoded matches** outside of `lib/db/seed.ts` (which is the seed data itself) and the events catering prices (explicitly out of scope, see 1.4 table).
3. A booking made via the leisure flow, corporate flow, and (once lunch is added) any flow using lunch, all reflect the exact same numbers sourced from `pricingSettings` — verified by manually changing a value in `pricingSettings` via the new admin settings screen and confirming it propagates to all three flows without a code change or redeploy.
4. The admin settings screen is reachable only by Owner/Assistant roles; a Staff-role login is redirected away from it.
5. Marking a room unavailable via the new toggle removes it from bookable room lists on `/rooms` and `/book`, and it does not appear in `getUnavailableRoomIds` conflicts (it should simply never be offered, distinct from being "booked").
6. Uploading a file in the leisure booking form's proof-of-payment step results in a real row appearing in the `proofOfPayments` table after submission — verify by checking the database directly, not just the UI.
7. Your final report to the project (delivered back through the usual Qwen3.5/Freebuff status-report channel) explicitly lists:
   - The lunch price as an unconfirmed placeholder
   - The banking details flag as unconfirmed/unverified
   - Any file you touched that is not listed in this spec (so Claude can review for consistency)

---

## Out of Scope for This Task (do not touch)

- WhatsApp/Meta Cloud API integration (still stubbed, separate task)
- Auth hardening (OTP/session security — separate task)
- Events page catering package prices (R150/R250/R350 — confirmed, separate pricing domain)
- Any database migration that drops or renames existing columns
- Redesigning the visual style of any page (use existing Tailwind classes/patterns already present in the file you're editing)

---

## Questions for the Owner (do not guess — surface these back to Claude/Oray)

- Confirm the R150.00 lunch add-on price, or provide the correct figure.
- Confirm the FNB banking details shown in the booking form are accurate and safe to keep displaying to guests.
