# UI Findings & Recommendations — Gomodi Guest Lodge

> **Status:** Living document — agents MUST read this before building any UI, photography, copy, or reviews feature.
> **Date:** 2026-08-11 · **Audience:** All agents working on the Gomodi Guest Lodge web app.
> **Source of truth:** This document supplements `docs/02-requirements/PRODUCT.md`, `PROJECT_SPEC.md`, `knowledge.md`, and `PROGRESS.md`. Where it conflicts with `PRODUCT.md` brand commitments, `PRODUCT.md` wins.

---

## 1. Purpose

This document records what a full audit of the current site (against its real competitor, Protea Hotel by Marriott Mahikeng) found, and what to build next. It exists so every future agent implements toward the same goal instead of inventing their own:

> **Make the site feel like a stay at Gomodi — relaxed, warm, and human — for both leisure and business guests. Everything the site claims must be *felt*, not just listed. Real photography and real guest reviews are coming; design the site to receive them.**

The three mandates from the owner that this document turns into concrete instructions:

1. **Professional photography is coming** — build every visual surface so real photos can drop in without redesigns. Nothing currently looks "final".
2. **The website must give a feeling of relaxation** — pacing, whitespace, motion, copy, and imagery should calm a visitor, not excite or stress them.
3. **Everything we say we offer must be felt** — for leisure *and* business travel. A feature list is not a promise kept; a sensory, honest description with a photograph is.
4. **Capture guest feelings and get positive reviews on the site** — a real review-capture system (post-stay follow-up → on-site display → admin moderation), built on the existing booking pipeline. Never fabricated.

---

## 2. Executive Summary — Are we doing a better job than Protea?

**Yes on product thinking and design craft. No on completeness and trust.** The Protea site wins today because it looks *real*; Gomodi wins on everything the owner actually controls.

| Dimension | Gomodi (current) | Protea Hotel Mahikeng | Verdict |
|---|---|---|---|
| Brand identity | Strong: terracotta/walnut/cream/gold, "Iphe Lerato", cohesive system | Generic Marriott template, no local character | ✅ Gomodi |
| Booking UX | 3 journeys (Leisure/Corporate/Events) → one pipeline; WhatsApp-first | Standard Marriott engine | ✅ Gomodi |
| Corporate/government flow | PO numbers, formal quotes, invoices, consolidated statements | Not offered | ✅ Gomodi |
| Owner voice / honesty | Plain, human, factual | Corporate marketing speak | ✅ Gomodi |
| Design system | Custom motion, WCAG AA, responsive | Cookie-cutter template | ✅ Gomodi |
| **Real photography** | **Only Room 1 (7 images) + reception (7) + events (3). Rooms 2–9 = colored placeholders** | 26 professional photos across exterior, rooms, dining, bar, pool, conference rooms | ❌❌ **Protea, by a mile** |
| Social proof | Zero testimonials, zero reviews | 597 Marriott reviews (4.2★), 95 TripAdvisor | ❌❌ Protea |
| Dining presentation | Prices only (R175/R300), no imagery | "The Mafika Restaurant" with 5 photos | ❌ Protea |
| Meeting/event spaces | One baby-shower photo | 3 conference-room photos | ❌ Protea |
| Local experiences | Nothing | Dedicated "Things To Do" page | ❌ Protea |

**Bottom line:** the design system and booking engine are genuinely better than Protea's. But a guest comparing the two will book the one with photos and reviews. Photography + reviews are the two non-negotiable gaps. This document is organized around closing them.

---

## 3. Binding Design Principles (the "feel" mandate)

These are the rules every future change must obey. They are not suggestions.

### 3.1 The site must feel relaxing

- **Whitespace is a feature.** Section padding should feel generous (`py-16 md:py-24` is the floor, not the ceiling). Never cram more cards into a row to "fill" the page.
- **Slower, gentler motion.** Fades over slides, soft hovers over bouncy ones, no aggressive parallax on text. The existing motion system (`motion-fade-up`, `motion-scale-in`, staggered reveals) is good — use it, but prefer longer, softer easing for hero and section entrances. Keep `prefers-reduced-motion` support everywhere (already in `lib/motion.tsx`).
- **Warm, calm color.** Cream is the canvas (`bg-cream-light`/`bg-cream`); terracotta and gold are warmth, used sparingly (accents, one strong CTA, the motto). Dark walnut sections are "evening" bookends (footer, one CTA band) — keep them rare so they stay special.
- **Photography is the mood-setter.** See §6 for lighting/grading direction. Warm morning light, soft shadows, no harsh flash, consistent warm grade.
- **Copy soothes.** Short sentences. Sensory words: *sleep, quiet, warm, morning, coffee, garden, welcome*. Never write a paragraph where a sentence will do.

### 3.2 Every claim must be felt (leisure AND business)

The site currently *lists* amenities and *describes* journeys. Lists are not felt. For every claim on the site, the implementation must pair the claim with **a sensory description + a photograph (when available)**. Worked examples:

| Current claim (felt: ❌) | How to make it felt (✅) | Where |
|---|---|---|
| "Smart TV" | Photo of the bed + TV at dusk; copy: *"Sleep in, stream something, switch off."* | Homepage amenities, room cards |
| "Free WiFi" | Leisure: *"Post your getaway photos without hunting for signal."* Business: *"Join your 8am standup from bed."* | Homepage amenities, corporate page |
| "A/C with fan/heater backup" | *"Sleep cool through a Mafikeng summer night — and a fan backup if the grid blinks."* | Rooms page, room modal |
| "Breakfast R175 pp" | Breakfast photo + *what's on the plate* ("eggs, toast, coffee, a view of the garden") | Homepage, booking wizard step 3 |
| "Secure parking" | Photo of the gate/parking; *"Your car is behind our gate."* | Homepage amenities |
| "Flexible check-in by arrangement" | *"Arrive when your flight lands, not by the clock — just tell us."* | Booking wizard, rooms |
| "Family-run, personally managed" | Owner story + photo (with consent). *"You'll deal with the people who own it."* | Homepage About section |
| "9 rooms, freshly renovated" | Each room gets its own photo set, name, and one-line personality | Rooms page + modals |
| "WhatsApp within minutes" | A screenshot-style visual or timeline strip; *"Message us and a person answers."* | Homepage CTA band |
| "Corporate: formal quotes, invoices" | Visual of a real quote/PDF (sample, anonymized); *"Your finance team gets what it needs."* | Corporate page |
| "Events up to 50 guests" | Tablescape + decorated-room photos; event-host testimonials later | Events page, homepage teaser |

**The leisure journey should feel like:** arriving, being welcomed, a slow morning, a good night's sleep.
**The business journey should feel like:** arriving the night before a big day, working without friction, sleeping well, breakfast before the meeting, secure parking for the rental, a quiet room to decompress.

### 3.3 Authenticity over fluff

Per `PRODUCT.md` (binding): voice is **plain, human, factual — no marketing filler**. "Feel" is achieved through honest, sensory descriptions of real things — never invented amenities, never "tailored experiences" fluff. If something isn't real yet (phone number, owner name, reviews), it must not be presented as real.

### 3.4 Photography-ready mindset

Every image surface must already be structured for a real photo: correct aspect ratios (`aspect-[4/3]` is the site convention), `object-cover`, `next/image` (never raw `<img>` for new work — the homepage still uses raw `<img>` in places; migrate them), descriptive alt text, and a fallback (keep `PhotoPlaceholder` as the interim fallback only). **No section should be designed around the placeholder.**

---

## 4. Findings — Current State Audit

### 4.1 What exists (verified in code, 2026-08-11)

- **Pages:** `/` (homepage), `/rooms` (+ room detail modal), `/book` (4-step leisure wizard, custom calendar), `/corporate` (multi-room quote form), `/events` (inquiry form), `/admin` (OTP login), `/admin/dashboard`, `/admin/quotes` (+ editor, PDF, public `/quote/[token]`), auth + API routes.
- **Real images on disk:** `public/images/reception/` (3), `public/images/reception/rooms-building-*` (4), `public/images/rooms/room1*` (7, incl. bathroom + bed/TV), `public/images/events/` (baby-shower, birthday-party, graduation).
- **Rooms 2–9:** no photos. `lib/db/schema.ts` already has `rooms.images` (jsonb, ordered array; **first entry = card thumbnail; empty array = placeholder**) — the wiring point exists and is unused for most rooms.
- **Homepage:** hero slideshow (7 reception/building shots), 3 journey cards, About, rooms preview (3 rooms — only Room 1 has a photo), amenities icon grid, events teaser, corporate teaser, payment methods, WhatsApp CTA band (links to `"#"` — placeholder).
- **Motion system:** `motion-ready` + `MotionObserver` (scroll reveals), `motion-pop` for post-mount elements, `HeroSlideshow` (crossfade + arrows + dots), `HeroParallax`. Rules in `knowledge.md` — post-load elements MUST use `.motion-pop`, never bare `motion-ready` (they stay `opacity: 0`).
- **Brand:** terracotta/walnut/cream/gold/ink tokens in `app/globals.css` `@theme`; Inter + Playfair (next/font). WCAG AA audited, 44px touch targets.
- **Backend:** Drizzle + Postgres, `force-dynamic` public pages, Server Actions with `{ ok: true } | { ok: false; error }` contract, booking pipeline (pending → approved locks rooms), auto-draft quotes, WhatsApp notifier **stubbed** (fails open; templates `gomodi_otp`, `gomodi_booking_alert`, `gomodi_booking_status`, `gomodi_quote_link`), `/api/upload` exists (Vercel Blob) but the booking form never calls it (records filename only).

### 4.2 Known gaps (severity-ordered)

1. **🔴 CRITICAL — Rooms 2–9 have no photos.** The single biggest credibility killer. Guests book hotels with their eyes.
2. **🔴 CRITICAL — Zero social proof.** No reviews, no testimonials, no guest photos, no ratings anywhere on the site.
3. **🟡 HIGH — No dining imagery or presentation.** Breakfast/dinner are price lines, not an experience.
4. **🟡 HIGH — No local "things to do" content.** Leisure guests deciding between lodges get no reason to choose Mafikeng/this location.
5. **🟡 HIGH — No owner/human presence.** "Family-run, personally managed" is stated, never shown (no story, no face, no signature).
6. **🟡 HIGH — Homepage amenities are a feature list**, not felt experiences (see §3.2 table).
7. **🟡 MEDIUM — WhatsApp CTA is a `"#"` link.** Must stay honest until the real number exists, but the section should be structured so the real link drops in.
8. **🟡 MEDIUM — Proof-of-payment upload is not wired** to `/api/upload` (booking form records filename only). Fix alongside review-photo upload (same Blob helper).
9. **🟢 LOW — Homepage uses raw `<img>` in several places** (journey cards, about, events, corporate). Migrate to `next/image` for performance + LCP discipline (work already done on hero: `fetchPriority="high"`, preload, `regions: ["fra1"]` — preserve it).
10. **🟢 LOW — No map/address visual.** JSON-LD has geo coordinates; a static map or a small "Getting here" section would help.

---

## 5. Findings — Benchmark: Protea Hotel by Marriott Mahikeng

Reference: `https://www.marriott.com/en-us/hotels/mbdpr-protea-hotel-mahikeng/overview/` (audited 2026-08-11).

**What Protea does that works (steal the pattern, not the corporate tone):**

- **Categorized photo galleries** — Guest Rooms / Suites / Dining / Recreation & Fitness / Events & Meetings, 26 photos, each with a caption. → We should mirror this: rooms → dining → events/meetings → reception & grounds.
- **Amenity depth with context** — safe, tea/coffee, work desk, aircon listed per room *and* shown in photos.
- **Experiences page** — pool (open 24h, towels provided), local attractions. → The "feel the stay" page.
- **Massive review presence** (597 reviews, 4.2★) — the trust engine we lack entirely.
- **Room-type clarity** — King / Double / Double-Double / Suite clearly differentiated. → Our 9 rooms should each read as a distinct, named room with its own photos, not "Room 1…9".

**What Protea gets wrong (don't copy):** the generic template, zero local identity, corporate copy, no direct-human contact. Our differentiation is exactly those things — double down.

---

## 6. The Photography Program

Professional photography is scheduled. This section is the spec for **what to shoot** and **how to wire it in**. If a photo doesn't exist yet, keep the placeholder — never a cropped/duplicated existing photo.

### 6.1 Shot lists (grouped by directory)

Follow the existing convention: `public/images/<category>/<kebab-name>.jpeg`.

**Rooms — per room (8–12 shots):** bed straight-on (made, natural light) · corner/perspective view · bathroom (shower, basin) · work nook/desk · TV/entertainment corner · window with light · tea/coffee tray detail · linen/texture close-up · evening/twilight mood shot. The first shot (card thumbnail) should be the warm, inviting bed view.

**Reception & grounds (add to existing 7):** entrance at golden hour · welcome/check-in moment (human touch) · garden path · lounge/seating corner if one exists · parking/gate (proves "secure parking").

**Dining (new `public/images/dining/`):** breakfast spread (the actual R175 breakfast) · coffee/morning table · a set table for dinner (R300) · the kitchen/host serving · detail shot of a plate.

**Events (extend existing 3):** tablescape (decorated, seated) · cocktail setup · catering buffet · the venue empty-and-ready vs. in-use.

**Corporate (new `public/images/corporate/`):** a quiet work corner in a room · laptop-on-desk context · meeting/function space · "morning before the meeting" (breakfast + briefcase).

**Experiences (new `public/images/experiences/`):** local Mafikeng spots (Mafikeng Game Reserve, Mafikeng Museum, Mmabatho Stadium, local landmarks) — needed for the "Things to do" section.

**People (new `public/images/hosts/`):** the owner/host (with consent) — the "family-run" claim needs a face. Staff where appropriate.

### 6.2 Mood & grading direction

- Natural light only; morning and golden-hour windows. Soft shadows, warm grade that matches the terracotta/cream palette.
- Style rooms "lived-in but tidy" — a half-open curtain, a folded throw, the tea tray ready — not sterile showroom shots.
- No harsh flash, no ultra-wide distortion, no people staring at the camera (candid, warm moments instead).
- Keep one consistent grade across all photos (warm, slightly desaturated highlights) so the gallery feels like one place.

### 6.3 Wiring it in (agent instructions)

- **Schema:** `rooms.images` (jsonb string[]) already exists — populate it per room; first entry is the thumbnail. Update `lib/db/seed.ts` + any rows via migration/script. Empty array = placeholder (keep `PhotoPlaceholder` as interim only).
- **Components:** `RoomsExplorer` already reads `ROOM_IMAGES` for Room 1 — generalize it to read from the `rooms.images` prop (the `/rooms` server page currently does not pass `images` through — fix that mapping).
- **Homepage** rooms preview + journey cards: use `next/image`, `aspect-[4/3]`, `object-cover`, descriptive alt text.
- **New surfaces:** dining, experiences, corporate, hosts sections (see §7) — build them now with photo slots sized `aspect-[4/3]` and `PhotoPlaceholder` fallbacks, so real photos drop in with a file swap.
- **Alt text:** descriptive and specific (`"Room 2 — bed with warm morning light"`), never `"room image"`.
- **Uploads:** user-generated photos (review photos, proof of payment) go through `/api/upload` (Vercel Blob). Marketing photos live in `public/images/`. Don't mix the two paths.

---

## 7. Recommendations by Area

### 7.1 Homepage (`app/page.tsx`)

1. **Hero:** keep the slideshow; slow the interval (already 5.5s) and consider a very gentle Ken-Burns zoom on the active slide for calm. Preserve `fetchPriority="high"` + preload on slide 0.
2. **Three journey cards:** replace the ✓ icon lists with one felt line each + photo. Leisure: *"Sleep in. Breakfast is ready when you are."* Corporate: *"Arrive the night before your big day."* Events: *"The garden fills with people you love."*
3. **About section:** add the owner/host story + photo slot (consent required). One short paragraph in first person. This is the "personally managed" proof.
4. **Amenities grid:** convert the icon labels to felt micro-copy (§3.2 table). Keep icons; add the sensory line under each.
5. **New: "What guests say" section** — see §8.3 for the review display. Place between Rooms preview and Amenities (near the decision point).
6. **New: dining teaser** — one breakfast photo + "Breakfast R175 · Dinner R300 pp" + a link to a dining section/page (§7.6). Use `BREAKFAST_PRICE`/`DINNER_PRICE` from `lib/pricing.ts`, never literals.
7. **New: "Things to do in Mafikeng" teaser** (§7.7) — 3 photo cards with one-liners.
8. **WhatsApp CTA band:** keep the honest framing ("message us, a person answers"). Keep `href="#"` until the real number exists (owner input — §11). Structure it so the link swap is a one-line change.
9. **Migrate raw `<img>` → `next/image`** everywhere on this page.

### 7.2 Rooms (`app/rooms/page.tsx`, `app/rooms/RoomsExplorer.tsx`)

1. Pass `images` through from the DB (server page → `RoomsExplorer`). Populate all 9 rooms (§6.3).
2. **Give each room a personality line** in the card (`description` already exists — the card shows a 2-line clamp; make sure it reads felt, not spec-sheet).
3. Room modal already has a solid two-pane gallery — extend the thumbnail strip to all rooms once photos exist.
4. Add a **"What to expect" line** per room type (bath vs shower, flexible twin/double already surfaced — keep).
5. Business-leisure balance: one photo per room set should show the work nook; the copy should mention "a desk that works for a laptop" for business guests without making leisure guests feel sold to.

### 7.3 Booking flow — leisure (`app/book/BookingForm.tsx`, `actions.ts`)

1. **Step 1 (dates):** add a felt line — *"Pick your nights — check-in is by arrangement, so don't stress the arrival time."*
2. **Step 2 (rooms):** show the room photo (from `rooms.images`) instead of name-only rows. This is where a guest commits — photos decide.
3. **Step 3 (meals):** show breakfast/dinner as felt choices with a photo slot and one line each (from `lib/pricing.ts`). *"Breakfast R175 — eggs, toast, coffee, and the garden view."*
4. **Step 4 (details):** keep it short. Add a warmth touch on submit success ("We'll confirm on WhatsApp within minutes").
5. **Fix POP upload:** wire the file-drop to `/api/upload` (Vercel Blob) so proof of payment is actually stored — required for the post-stay review flow later.
6. Do NOT slow the wizard down. Felt ≠ long. Keep it 4 steps.

### 7.4 Corporate (`app/corporate/page.tsx`, `actions.ts`)

1. Rewrite copy to the business *experience*: quiet rooms after a long day, desk that works, WiFi that holds a video call, breakfast before the site visit, secure parking for the rental, flexible check-in for late flights.
2. Add visual proof: a sample quote/PDF mockup (anonymized) and the corporate photo set (§6.1).
3. Keep the procurement features (PO, VAT, invoices) — they're the differentiator. Present them as "your finance team gets what it needs" (felt for the traveller) rather than a features list.
4. Add a "one person answers" line — corporate guests value a named human contact.

### 7.5 Events (`app/events/page.tsx`, `actions.ts`)

1. Add event-space photos (tablescape, decorated venue, catering) — currently one baby-shower photo carries the whole page.
2. Felt copy: *"The garden fills with people you love — we handle the chairs, the food, and the clean-up."*
3. Keep the catering price ranges (R150–R350 pp) from `PRODUCT.md`; add a catering photo slot.
4. Later: event-host testimonials (review category `event`, §8).

### 7.6 Dining (new)

1. **New homepage section or small page** with the breakfast/dinner experience: 2–3 photos, what's actually served, times, price from `lib/pricing.ts`.
2. Business angle: "breakfast before the meeting". Leisure angle: "a slow morning, coffee, no rush".
3. This section must exist even before photos — build the layout now with placeholder slots.

### 7.7 Local experiences — "Things to do in Mafikeng" (new)

1. Small section/page with 3–6 real local spots (Mafikeng Game Reserve, Mafikeng Museum, Mmabatho Stadium, the Mmabatho CBD, nearby nature). One line each + photo slot.
2. Each entry gets a leisure line and a business line (e.g. "a game drive after the workshop").
3. Facts must be real — verify before publishing; no invented landmarks.
4. This mirrors Protea's "Experiences" page and is the differentiator for leisure decision-making.

### 7.8 Contact / WhatsApp (`components/Footer.tsx`, homepage band, `components/Nav.tsx`)

1. Keep the honest placeholder until the owner supplies the real number (§11). Never invent a number.
2. Structure every WhatsApp surface as a one-line swap (a shared constant or `lib/` helper for the wa.me link) so the real number drops in everywhere at once.
3. Footer already lists address/email correctly — keep. Consider a small "Getting here" map/address visual (static map image or styled address card, no external JS map needed).

### 7.9 Trust & social proof (new — see §8)

---

## 8. The Guest Review System (capture feelings → positive reviews on site)

Goal: **catch guests while the feeling is fresh, ask them about how the stay felt, and display approved reviews on the site.** This is the #1 trust gap vs Protea and the owner's explicit ask.

### 8.1 Capture flow (post-stay follow-up)

Follow the existing pattern in `lib/notifications.ts` / `lib/whatsapp.ts` (fails open when WhatsApp is unconfigured; templates named `gomodi_*`).

1. When a booking is **approved** (`app/api/admin/requests/[id]/route.ts`), record the planned checkout date.
2. On/after checkout (a cron or a lazy check on load — the project already has `/api/ping` + `vercel.json` cron precedent), send the guest a personal review link: **`/review?token=<random>`** — reuse the quote `publicToken` pattern (`lib/quotes.ts`: 18 random bytes, unguessable, no enumeration).
3. New WhatsApp template: `gomodi_review_request` (params: guest name, stay dates, link). Add a `notifyGuestOfReviewRequest()` in `lib/notifications.ts`.
4. If WhatsApp is unconfigured, fail open (log) — the link should ALSO be shown on the booking confirmation/success screen and in the quote PDF footer so the flow works end-to-end without WhatsApp.
5. **Timing matters:** within 24–48h after checkout, while the stay is fresh. The message should be warm, not a survey: *"Hi {name} — how was your stay? It would mean the world if you'd leave us a few words: {link}"*.

### 8.2 Review data model (add to `lib/db/schema.ts`, follow existing conventions)

```ts
export const reviewStatusEnum = pgEnum("review_status", ["pending", "approved", "declined"]);

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  bookingRequestId: integer("booking_request_id").references(() => bookingRequests.id, { onDelete: "set null" }),
  guestName: varchar("guest_name", { length: 150 }),          // null/blank = "Guest, Mafikeng" (POPIA-friendly anonymous)
  category: bookingCategoryEnum("category"),                  // leisure | corporate | event
  rating: integer("rating").notNull(),                        // 1–5
  headline: varchar("headline", { length: 120 }).notNull(),
  body: text("body").notNull(),
  feelings: jsonb("feelings").$type<string[]>(),              // optional felt-words tags: "slept well", "felt at home", "quiet", "great breakfast"
  photos: jsonb("photos").$type<string[]>().notNull().default(sql`'[]'::jsonb`), // Vercel Blob URLs from /api/upload
  status: reviewStatusEnum("status").notNull().default("pending"),
  consentToPublish: boolean("consent_to_publish").notNull().default(true),  // POPIA
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
  approvedById: integer("approved_by_id").references(() => users.id),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
});
```

- **Every review must trace to a real stay**: either `bookingRequestId` or the unguessable token from the follow-up link. No anonymous public form that lets anyone post.
- **POPIA:** the form must capture consent explicitly ("May we publish this review with your first name?"), with an anonymous option. No consent → display as "Guest".
- **Photos:** reuse `/api/upload` (Vercel Blob) — same helper the POP upload needs (§7.3.5). Validate type/size like the existing route.

### 8.3 Public display

1. **Homepage "What guests say"** section (between Rooms preview and Amenities): 3-card grid matching the site's `card-shadow card-lift` convention — rating stars, headline, body (2–3 line clamp), name/category pill (`pill-leisure`/`pill-corporate`/`pill-event`), optional photo thumbnail. Only **approved** reviews; newest first.
2. **Rooms page:** a slim "guests say" strip or per-room quote once volume allows.
3. **Events/corporate pages:** category-filtered testimonials ("what corporate guests say").
4. **Aggregate rating:** only after real volume (suggest ≥5 approved reviews) — then a small "4.8 · 12 reviews" badge. Do NOT add `aggregateRating` to the JSON-LD in `app/layout.tsx` until real, verifiable numbers exist (schema.org requires it to be truthful).

### 8.4 Admin moderation

1. Add a reviews queue to the admin dashboard (`app/admin/dashboard/AdminDashboard.tsx`) with the existing approve/decline pattern (walnut approve / terracotta decline, brand-consistent — no raw green/red).
2. Server-side guards: approve/decline requires `requireManager()`; read requires `requireStaff()` (mirror `app/api/admin/requests/[id]/route.ts`).
3. Moderation screen shows the linked stay (dates, room, category) so staff can verify the review is real before publishing.
4. Never show `pending` reviews publicly. Declined reviews are deleted/held, not shown.

### 8.5 Guardrails (non-negotiable)

- **No fabricated reviews.** No seed data for reviews. Every review traces to a real booking or token.
- **No fake star ratings.** Aggregate only from real approved reviews.
- **Moderation can decline** anything — staff owns the published voice.
- Reviews are a *capture*, not a campaign: the follow-up asks honestly and accepts critical feedback too (the owner can respond to critical reviews privately via WhatsApp — that's a feature: "we replied" builds trust).

---

## 9. Implementation Priorities

Suggested order for agents. Update `PROGRESS.md` after each task.

### Phase 1 — Photography-ready + "feel" pass (do first; unblocks everything)

- [ ] Populate `rooms.images` wiring: `/rooms` page → `RoomsExplorer` (generalize `ROOM_IMAGES`), seed all 9 rooms (empty arrays fine until photos land).
- [ ] Experiential copy rewrite per §3.2 (homepage, rooms, corporate, events) — keep voice plain/honest.
- [ ] Whitespace + motion softening pass (gentler reveals, slower hero, relaxed padding).
- [ ] Migrate homepage raw `<img>` → `next/image` (preserve LCP work).
- [ ] Build dining + experiences + hosts sections with photo slots + `PhotoPlaceholder` fallbacks.
- [ ] Fix POP upload wiring (`/api/upload`).

### Phase 2 — Review system (trust engine)

- [ ] Schema: `reviews` table (§8.2) + `npx drizzle-kit push`.
- [ ] Follow-up capture: token generation + `gomodi_review_request` template + `notifyGuestOfReviewRequest()` + link on success screen.
- [ ] Public `/review?token=…` form (feeling-oriented questions, consent checkbox, optional photo).
- [ ] Admin moderation queue (approve/decline, brand colors, RBAC).
- [ ] Homepage "What guests say" display (approved only).

### Phase 3 — Depth & trust

- [ ] "Things to do in Mafikeng" (verified facts only).
- [ ] Owner story + photo (consent).
- [ ] Dining page/section polish once photos land.
- [ ] Corporate visual proof (sample quote/PDF mockup).
- [ ] Aggregate rating badge + JSON-LD `aggregateRating` (only after ≥5 real reviews).
- [ ] Real WhatsApp number swap (§11) across all surfaces via one shared constant.

### Phase 4 — Verify & polish

- [ ] `npm run build` + `npx tsc --noEmit` clean; lint no-new-errors.
- [ ] WCAG AA re-audit + 44px touch targets + `prefers-reduced-motion`.
- [ ] Mobile photo galleries (modal thumbnail strips) with real images.
- [ ] Performance re-check: LCP with real hero photos (keep preload + `fetchPriority="high"` + `regions: ["fra1"]`).

---

## 10. Guardrails — What NOT To Do

1. **Never fabricate:** photos, reviews, ratings, phone numbers, WhatsApp links, owner names, local landmarks, or "as seen in" badges. All absences are documented in `PRODUCT.md` — keep them honest.
2. **Don't change the voice:** plain, human, factual. "Relaxed" does not mean flowery marketing copy.
3. **Don't leave the brand palette:** terracotta/walnut/cream/gold/ink only on public pages; admin uses brand-consistent approve/decline (no raw green/red).
4. **Don't break the motion system:** `motion-ready` needs the observer; post-mount elements use `.motion-pop`; keep `prefers-reduced-motion`.
5. **Don't hardcode prices:** read `BREAKFAST_PRICE`/`DINNER_PRICE`/`ROOM_BASE_RATE` from `lib/pricing.ts`.
6. **Don't weaken the booking pipeline:** only approved bookings lock rooms; approve re-checks server-side (409); never change the `{ ok } | { ok: false; error }` action contract.
7. **Don't touch `.env` files or `vite.config.ts`** (not applicable here — this is Next.js; the rule is about platform-managed config).
8. **WhatsApp only through `lib/notifications.ts` / `lib/whatsapp.ts`** — single swap-in point, fails open.
9. **Keep public pages `force-dynamic`**; live DB reads.
10. **Don't ship placeholders as final.** A `PhotoPlaceholder` is an interim state, never a completed section.

---

## 11. Open Questions (owner input needed — do not invent)

1. **Real phone / WhatsApp number** (E.164) — required before any `wa.me` link or "Chat on WhatsApp" is live. Until then keep `"#"`.
2. **Owner name(s)** for the About/story section and JSON-LD — and consent to feature them.
3. **Breakfast/dinner specifics** for felt copy: buffet vs plated, times, what's typical on the plate.
4. **Prior guest feedback** — any existing WhatsApp messages/notes that can seed the review section (with guest permission). These are real testimonials, not fabrications.
5. **Event venue photos** — availability of tablescape/decorated shots.
6. **Local spots** to feature in "Things to do" (owner knows Mafikeng best; we'll verify facts before publishing).
7. **Review consent wording** — POPIA-friendly copy approved by the owner before the review form goes live.

---

*End of document. Agents: after implementing any of this, append to `PROGRESS.md` with files changed and validation results (`npm run build`, `npx tsc --noEmit`, lint no-new-errors).*
