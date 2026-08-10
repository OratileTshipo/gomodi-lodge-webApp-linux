# Gomodi Guest Lodge — Digital Transformation Project

## Phase 3 Addendum — Lelz Business Enterprise Partnership Integration

*Business Scope Correction, Data Model Changes, RBAC Extension & Events Page Content Specification*

| Document status: | Approved by Owner — ready for Freebuff implementation |
| --- | --- |
| SDLC phase: | Phase 3 — Implementation & Construction (addendum) |
| Depends on: | Phase 2 Architecture, Phase 2b Style Note, PROJECT_SPEC.md |
| Date: | 10 August 2026 |
| Version: | 1.0 |

---

## 1. Business Scope Correction (Owner-Confirmed)

Gomodi Guest Lodge has entered a formal partnership with **Lelz Business Enterprise** ("Lelz"), which materially narrows Gomodi's own scope and must be reflected throughout the codebase, not just the Events page.

| Function | Owned By | Detail |
| --- | --- | --- |
| Room bookings (Leisure, Corporate/Government) | **Gomodi Guest Lodge** | Unchanged — this remains Gomodi's core business |
| Meals tied to a room booking (breakfast, lunch, dinner) | **Gomodi Guest Lodge** | Guest is already staying at the lodge; Gomodi fulfils this as part of the stay |
| Events (weddings, birthdays, graduations, baby showers, functions) | **Lelz Business Enterprise** | Displayed on Gomodi's website; fully quoted, coordinated, and delivered by Lelz |
| Standalone / external catering (not tied to a room booking — e.g. a corporate lunch order) | **Lelz Business Enterprise** | Routed through the Events page's catering section |

**Contact for Lelz Business Enterprise:** 078 078 4139 · lelzenterprise1@gmail.com

**Events Manager:** the Owner's assistant, who manages the Lelz relationship on Gomodi's behalf and retains full visibility into everything Lelz receives.

This is a deliberate narrowing of Gomodi's product scope, not a cosmetic change — `PROJECT_SPEC.md` §6 ("Logic Rules") should be updated once this ships to state plainly that **any request tied to `category = "event"` belongs to Lelz**, and only booking-tied meal add-ons belong to Gomodi.

---

## 2. Event Package Catalogue (Verbatim — Owner-Approved Poster Content)

The following must be reproduced **exactly as worded and priced below** on the Events page — no paraphrasing, no rounding, no summarising. These are Lelz's own commercial packages.

### 2.1 Graduation Package

Cabana tent · Flooring · Personalised Welcome Board · Balloon Garland (400 Balloons) · Guest of honour chair · Tiffany Gold chairs & cushions · Glass Tables · Centrepiece · Baby accessories · Artificial flowers · Dinner plate · Side Plate · Napkin · 3pc cutlery set · Wine Glass · Champagne Glass

| Pax | Price |
| --- | --- |
| 10 | R2,200 |
| 15 | R3,500 |
| 20 | R4,400 |
| 25 | R5,500 (Platter Incl.) |
| 30 | R6,400 (Platter Incl.) |

### 2.2 Birthday Package

Cabana tent · Flooring · Personalised Welcome board · Balloon Garland (400 Balloons) · Guest of honour chair · Tiffany Gold chairs & cushions · Glass Tables · Centrepiece · Baby accessories · Artificial flowers · Dinner plate · Side Plate · Napkin · 3pc cutlery set · Wine Glass · Champagne Glass

| Pax | Price |
| --- | --- |
| 10 | R2,200 |
| 15 | R3,500 |
| 20 | R4,400 |
| 25 | R5,500 (Platter incl.) |
| 30 | R6,400 (Platter incl.) |

### 2.3 Baby Shower Package

Cabana tent · Flooring · Balloon Garland (300 Balloons) · Guest of honour chair · Tiffany Gold chairs & cushions · Glass Tables · Centrepiece · Baby accessories · Artificial flowers · Dinner plate · Side Plate · Napkin · 3pc cutlery set · Wine Glass · Champagne Glass

| Pax | Price |
| --- | --- |
| 10 | R2,000 |
| 15 | R3,000 |
| 20 | R4,000 |
| 25 | R4,800 |
| 30 | R5,500 |

### 2.4 Wedding — *Price on Request*

No published poster exists yet. Display: *"Wedding packages are tailored to your event — contact Lelz Business Enterprise directly for a personalised quote."* **Owner action item:** confirm with Lelz whether a fixed-tier wedding package will follow; update this section once received.

### 2.5 Anniversary / Family Gathering / Private Function / Other — *Standard Package*

Per Owner instruction, these four event types use the **Baby Shower Package pricing and inclusions** (Section 2.3) as their baseline, displayed under the heading "Standard Package," with the note:

> *"Additional items and custom décor are available on request — speak to Lelz Business Enterprise when you enquire."*

### 2.6 Catering-Only Packages (Retained, Unchanged)

Per Owner decision, the existing generic catering tiers remain on the Events page **in addition to** the packages above, for corporate/government clients who want catering without event décor:

| Package | Price |
| --- | --- |
| Tea & Snacks | R150 pp |
| Three-Course Meal | R250 pp |
| Full-Day Package | R350 pp |

All enquiries against this menu — including from corporate and government clients — are routed to Lelz, not Gomodi, since no room booking is involved.

---

## 3. Data Model Changes

### 3.1 `roleEnum` — add `"partner"`

```
export const roleEnum = pgEnum("role", ["owner", "assistant", "staff", "partner"]);
```

A `partner` user represents Lelz's login. Seed one row in `lib/db/seed.ts`:

```ts
{ name: "Lelz Business Enterprise", phone: "+27780784139", role: "partner" }
```

**Open item:** confirm this is the phone number Lelz will actually use to log in (it is currently only published as a WhatsApp/contact number) — if Lelz needs a different number for OTP login, provide it before this seed runs.

### 3.2 `addOnTypeEnum` — add `"lunch"`

```
export const addOnTypeEnum = pgEnum("addon_type", ["breakfast", "lunch", "dinner"]);
```

`lib/pricing.ts` should carry `LUNCH_PRICE` as a placeholder constant flagged `// TODO: confirm with Owner` until a real rate is provided — do **not** expose lunch as a selectable option in any guest-facing form until this price is confirmed.

### 3.3 `bookingRequests` — add `notifiedPartnerAt`

```
notifiedPartnerAt: timestamp("notified_partner_at"),
```

Set whenever a `category = "event"` request triggers the Lelz WhatsApp notification stub. Gives the Owner's assistant an auditable record of what Lelz has and hasn't been notified about, independent of Lelz's own logging.

### 3.4 No new table required for "standalone catering"

Standalone/external catering enquiries (Section 2.6) are still captured as ordinary `category = "event"` requests via the existing Events inquiry form — simply with `interestedInRooms = false` and an `eventType` such as `"catering-only"`. No schema addition needed; this keeps the model simple and avoids a parallel pipeline.

---

## 4. RBAC Extension

| Feature / Screen / Action | Owner | Assistant (Events Manager) | Staff | Partner (Lelz) |
| --- | --- | --- | --- | --- |
| View Leisure requests | Full | Full | Full | — |
| View Corporate requests | Full | Full | View-only (existing rule, unchanged) | — |
| View Event requests (incl. all catering tied to events) | Full | Full | **No access** | Full (own queue only) |
| View breakfast/lunch/dinner add-ons tied to a Leisure/Corporate booking | Full | Full | Full (existing behaviour, unchanged) | — |
| Approve/Decline room bookings | Full | Full | Leisure only (existing rule, unchanged) | — |
| Mark an Event request "Contacted" / update Lelz-side status | Full | Full | — | Full |
| Generate/manage event & catering pricing | Full | Full | — | View-only |

**Key rule to implement precisely, per your instruction:** a Staff-role user must never see any catering or event data *except* the breakfast/lunch/dinner add-ons that are attached to an actual Leisure or Corporate room booking. Everything under `category = "event"` — including its `eventDetails`, its `cateringPackage` selection, and its contact details — is invisible to Staff.

This is enforced in `app/api/admin/requests/route.ts`: the existing category filter for Staff (`leisure` only) is unchanged; add a new branch so that `role === "partner"` returns *only* `category = "event"` rows, with the guest's own room-booking history excluded.

`lib/auth.ts`: add a `requirePartner()` guard alongside the existing `requireManager()` / `requireStaff()` guards, following the same signed-session pattern already in place — no new authentication mechanism is introduced.

**Partner dashboard scope (recommended, please confirm):** Lelz's view is read/status-update only — she can see and mark requests "Contacted," but does **not** get Approve/Decline authority over the underlying `bookingRequests.status` field, since that field also drives Gomodi's own room-conflict logic for any request that also has `interestedInRooms = true`. Approve/Decline for those hybrid cases stays with Owner/Assistant. Please confirm this matches your intent before Freebuff builds it.

---

## 5. Notification Routing

`lib/notifications.ts` gains a second stub function, parallel to the existing one:

```ts
export async function notifyLelzOfNewRequest(details: {
  guestName: string;
  contactPhone: string;
  eventType: string;
  eventDate: string;
  expectedGuests: number;
}): Promise<void> {
  console.log("[WhatsApp notification — STUBBED, not yet sent]", {
    to: "078 078 4139",
    template: "new_event_request",
    ...details,
  });
  // TODO (go-live): real Meta Cloud API call once Lelz's WhatsApp
  // Business number and template are confirmed — same swap-in point
  // pattern as notifyOwnerOfNewRequest().
}
```

`app/events/actions.ts` calls **both** `notifyOwnerOfNewRequest()` (so the Owner's assistant retains visibility as Events Manager) **and** `notifyLelzOfNewRequest()` on every successful event submission, then sets `notifiedPartnerAt = new Date()` on the created row.

Meal add-ons tied to Leisure/Corporate bookings continue to notify only the Owner, exactly as today — no change to `app/book/actions.ts` or `app/corporate/actions.ts` notification calls.

---

## 6. Events Page Content Plan

1. Add **"Graduation"** to the event type dropdown in `app/events/page.tsx` — it is currently missing despite a published package existing for it.
2. Restructure the "Catering Packages" section into two clearly labelled groups:
   - **"Event Décor & Catering Packages"** — Graduation, Birthday, Baby Shower, Standard (Section 2.1–2.3, 2.5), and the Wedding "price on request" note (Section 2.4).
   - **"Catering-Only Packages"** — the existing Tea & Snacks / Three-Course / Full-Day tiers (Section 2.6), explicitly captioned for enquiries that don't require room bookings.
3. Add a short, factual line near the inquiry form: *"Events and catering at Gomodi Guest Lodge are proudly delivered in partnership with Lelz Business Enterprise."* — this is good practice for guest trust (they should know who they're actually dealing with) and costs nothing to implement.
4. Do **not** alter the Leisure booking wizard's or Corporate quote form's breakfast/dinner add-ons — those remain exactly as they are today, since they are Gomodi-fulfilled per Section 1.

---

## 7. Open Items for Owner Confirmation

| # | Item | Needed From You |
| --- | --- | --- |
| 1 | Wedding package pricing | Confirm with Lelz whether a fixed-tier package is coming |
| 2 | Lelz's login phone number | Confirm 078 078 4139 is correct for OTP login, or provide an alternative |
| 3 | Lunch add-on price | Still unconfirmed — cannot go live until you provide a rate |
| 4 | Lelz dashboard authority | Confirm read/status-update only (recommended), not Approve/Decline |
| 5 | "Catering-only" event type label | Confirm the wording `"catering-only"` (or your preferred label) for enquiries with no rooms and no event décor |

---

## 8. Freebuff Task Breakdown

- [ ] `lib/db/schema.ts` — extend `roleEnum` and `addOnTypeEnum`; add `notifiedPartnerAt` to `bookingRequests`
- [ ] `lib/db/seed.ts` — seed Lelz's `partner` user
- [ ] `lib/pricing.ts` — add `LUNCH_PRICE` placeholder, clearly flagged as unconfirmed
- [ ] `lib/auth.ts` — add `requirePartner()` guard
- [ ] `lib/notifications.ts` — add `notifyLelzOfNewRequest()` stub
- [ ] `app/events/actions.ts` — call both notifiers; set `notifiedPartnerAt`
- [ ] `app/api/admin/requests/route.ts` — add partner-role filter (event-only) and confirm staff-role filter excludes all event data
- [ ] `app/admin/dashboard/AdminDashboard.tsx` — add partner view (read/status-update, no Approve/Decline)
- [ ] `app/events/page.tsx` — add Graduation event type; rebuild package sections per Section 6 above, verbatim content per Section 2
- [ ] `PROJECT_SPEC.md` — update §6 Logic Rules to state the Gomodi/Lelz scope split once shipped

---

**Next step:** once you've confirmed the five open items in Section 7, this document is ready to hand to Freebuff as-is. I recommend pasting it at the repository root as `LELZ_PARTNERSHIP_SPEC.md`, alongside `PROJECT_SPEC.md` and `knowledge.md`.
