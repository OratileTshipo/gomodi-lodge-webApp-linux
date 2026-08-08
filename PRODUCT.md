# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary:** Leisure guests booking direct from the website (weekend/weeknight stays) and corporate/government clients arranging multi-room accommodation (contractor deployments, government rotations, team stays). Both were confirmed as the site's primary focus.

**Secondary:** Event hosts (weddings, baby showers, birthday parties and private functions up to 50 guests) — an equal-weight booking path but not the primary driver.

## Product Purpose

Gomodi Guest Lodge is a 9-room boutique guest house in Mafikeng (Mmabatho), South Africa. The website exists so guests book **directly** instead of through a platform: three booking journeys (Leisure / Corporate / Events) feed one booking-request pipeline, and staff approve or decline requests in a private admin area. Success means confirmed stays without a middleman — WhatsApp-speed responses for leisure guests and formal, procurement-ready documentation for corporate clients.

## Positioning

A family-run, personally managed lodge that books guests directly — no platform in between. Three booking paths (leisure, corporate, events) feed one request pipeline: leisure guests get a WhatsApp answer within minutes, corporate clients get formal, procurement-ready documents. The site speaks plainly and factually — prices, amenities, and a straight answer, with no marketing filler.

## Operating Context

- Guests book via 4-step wizard (dates/room/meals/details) or multi-room quote form; requests are reviewed in a staff admin dashboard.
- South African context: prices in ZAR; POPIA consent captured on every form; EFT / bank transfer and cash-on-arrival payment; proof-of-payment upload is currently filename-only (not stored).
- Corporate flow: formal quotations, invoices and consolidated statements; PO number and VAT number captured upfront; ~24h quote turnaround by email.
- Events: venue up to 50 guests, catering packages (R150–R350 pp), on-site accommodation for guests.
- Confirmations are delivered by WhatsApp (notifier currently stubbed — console.log only).

## Capabilities and Constraints

- 9 rooms, each sleeping up to 2 guests (18 total); one flexible twin/double room.
- Availability: only **approved** bookings lock a room; pending requests flag conflicts (red = approved overlap, amber = pending) and the approve action re-checks server-side.
- Meal pricing is hardcoded: breakfast R175 pp/day and dinner R300 pp/day in the booking wizard (corporate page quotes R150–200 / R250–350 ranges).
- Admin auth is dev-grade: OTP returned in response, any 6 digits accepted, unsigned session cookie (8h), and API routes have no server-side session checks.
- No real photography exists yet — all imagery is colored placeholder divs (`PhotoPlaceholder`).
- Undecided: actual phone/WhatsApp number, owner name(s) to feature, and whether real photos are ready to be added.

## Brand Commitments

- Name: **Gomodi Guest Lodge** (alternate name "Gomodi").
- Motto: **"Iphe Lerato"** — prominently displayed in the footer.
- Brand palette (binding): terracotta / walnut / cream / gold / ink, defined in the global theme.
- Voice: plain, human, and factual — family-run and personally managed; encourages direct booking over platforms. Marketing-fluff phrasing ("tailored experiences", "we'll take it from there" style copy) is explicitly rejected; a site-wide copy rewrite to plain owner-voiced language landed Aug 2026.
- Emails: `enquiries@gomodiguestlodge.co.za`, `corporate@gomodiguestlodge.co.za`.

## Evidence on Hand

- Full site copy across home, rooms, corporate, events, and booking pages (real, client-authored).
- Room seed data: 9 rooms with names, configs, and rates (R950–R1200 range).
- Admin test numbers seeded for owner/manager/staff roles.
- Emails above are the only confirmed contact points; phone and WhatsApp links are placeholders (`#`) and must not be presented as real.

**Absences:** no real photos or video; no published phone/WhatsApp number; no published owner name; no testimonials or case studies. Future work must not fabricate any of these.

## Product Principles

1. **Direct by default** — every flow exists to convert a visitor into a direct booking request, not a platform redirect.
2. **Speed with a human finish** — leisure confirmations via WhatsApp "within minutes"; corporate quotes within 24 hours; nothing feels automated.
3. **One pipeline, three journeys** — leisure, corporate, and events share a single approval/conflict engine so staff see everything in one queue.
4. **Formal where it matters** — procurement-grade documentation for corporate/government without making leisure booking heavier than it needs to be.
5. **Honest flexibility** — family-run, owner-managed; check-in by arrangement and bespoke terms are real product facts, not marketing.

## Accessibility & Inclusion

WCAG AA contrast enforced across public pages (≥4.5:1 text, ≥3:1 non-text — audited with a contrast script and verified in-browser, Aug 2026), minimum 44px touch targets, semantic HTML, and keyboard navigation. No formal third-party audit standard was required.
