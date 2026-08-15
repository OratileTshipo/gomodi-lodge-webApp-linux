# ADR Log — Gomodi Guest Lodge

Architecture Decision Records. One entry per decision that shapes the codebase,
so future agents and team members can see *why* the code is the way it is
instead of re-deriving (or accidentally reversing) it.

**Format:** short problem statement → decision → rationale → status.
New entries go at the top. Decisions are recorded after the fact when they are
first documented — "date recorded" may differ from "date decided".

---

| # | Date recorded | Decision | Status |
|---|---|---|---|
| 001 | 2026-08-15 | Prisma → **Drizzle ORM** for the data layer | Accepted (orig. Aug 2026) |
| 002 | 2026-08-15 | **In-house OTP auth** (registered-only, hashed, HMAC-signed session) instead of a third-party auth provider | Accepted |
| 003 | 2026-08-15 | **Single source of truth for pricing** in `lib/pricing.ts` (no `pricing_settings` table) | Accepted |
| 004 | 2026-08-15 | Public pages **`force-dynamic`** + 60s cached room list | Accepted (user-approved) |
| 005 | 2026-08-15 | **Only approved bookings lock rooms**; approve re-checks under Postgres advisory locks | Accepted (non-negotiable) |
| 006 | 2026-08-15 | **Server Actions with `Result<T>` contract** for public form submissions | Accepted |
| 007 | 2026-08-15 | **Custom booking calendar + motion system** (no component/animation libraries) | Accepted |
| 008 | 2026-08-15 | Vercel functions pinned to **`fra1`** (colocated with Neon eu-central-1) | Accepted |
| 009 | 2026-08-15 | **Fail-open posture** for WhatsApp delivery and rate limiting | Accepted (documented tradeoff) |
| 010 | 2026-08-15 | **Token-gated guest reviews**; no fabricated reviews, ever | Accepted (binding guardrail) |
| 011 | 2026-08-15 | Schema applied via **`drizzle-kit push`** (no migration history) | Accepted — **superseded by 012** |
| 012 | 2026-08-15 | Move to **versioned Drizzle migrations** before any further schema work | Proposed (Phase 0) |
| 013 | 2026-08-15 | **Single-DB, shared-schema tenancy with `property_id`** for multi-location scaling | Proposed (Phase 1) |
| 014 | 2026-08-15 | **PCI DSS hosted payment gateway** via a thin provider abstraction (PayFast primary) | Proposed (Phase 2) |

---

## 001 — Prisma → Drizzle ORM

- **Problem:** Prisma's binary engine download was unreachable from the build sandbox.
- **Decision:** Use Drizzle ORM (TypeScript-native, no downloaded engine).
- **Rationale:** Serverless-friendly (no binary engine), type-safe schema, SQL-like query API; the sandbox could build it offline.
- **Status:** Accepted. Binding: all schema work lives in `lib/db/schema.ts`; query conventions follow Drizzle.

## 002 — In-house OTP auth (no third-party provider)

- **Problem:** Staff/admin access needed authentication without email infrastructure; the business is phone-first (WhatsApp).
- **Decision:** Phone-OTP with hardening: registered-numbers only, SHA-256 code hashes, 5-attempt lockout, 10-min expiry, per-phone + per-IP rate limits, HMAC-SHA256 signed httpOnly session cookie (8h).
- **Rationale:** No external auth dependency, no per-seat cost, fits WhatsApp-first staff culture; security posture audited against OWASP ASVS L1 (see ENTERPRISE-ROADMAP.md §3.2).
- **Status:** Accepted. Open: `__Host-` cookie prefix + rotation (Phase 3).

## 003 — Single source of truth for pricing

- **Problem:** The same price was hardcoded in multiple files and drifted (Room 8 R950 vs R750; corporate ranges vs flat rates).
- **Decision:** All room/meal pricing lives in `lib/pricing.ts` (`ROOM_BASE_RATE`, `BREAKFAST_PRICE`, `DINNER_PRICE`, `EVENT_CATERING`). A `pricing_settings` table was considered and rejected — the project is single-property today and constant files are auditable via PR.
- **Status:** Accepted. **Revisited in Phase 1**: with multiple properties, prices become per-property data (`property_settings`) with `lib/pricing.ts` as dev/default fallback.

## 004 — force-dynamic pages + 60s room cache

- **Problem:** Live DB reads on every request cost a remote-Neon round-trip; cold starts made first visits slow.
- **Decision:** Public pages stay `force-dynamic` (live reads, no stale pages), but the room list is cached 60s via `unstable_cache` (`lib/rooms-cache.ts`).
- **Rationale:** Availability must always be re-checked live at submit; the room list is near-static and shared by home/rooms/book.
- **Status:** Accepted. Revisited in ENTERPRISE-ROADMAP.md P2 (broaden caching deliberately, never the availability check).

## 005 — Only approved bookings lock a room

- **Problem:** Pending requests shouldn't block guests; but two approvals must never double-book.
- **Decision:** `isRoomAvailable` blocks only on **approved** bookings; pending overlaps are soft (amber) warnings in the admin queue; the approve endpoint re-checks every room line inside a transaction under Postgres advisory locks and returns 409 on conflict.
- **Rationale:** Guest-first availability with a hard server-side guarantee at the only mutation that creates revenue.
- **Status:** Accepted. **Never weakened.**

## 006 — Server Actions with Result<T>

- **Problem:** Three booking journeys duplicated validation and result shapes.
- **Decision:** Server Actions validate server-side and return `{ ok: true } | { ok: false; error }` (shared `Result<T>` in `lib/result.ts`); shared validation lives in `lib/validate.ts`, booking helpers in `lib/booking-common.ts`.
- **Status:** Accepted. Binding contract for all future form actions.

## 007 — Custom calendar + motion system (no libraries)

- **Problem:** Rich booking UX (date range, seasonal notes) and branded scroll-reveal motion.
- **Decision:** Build a custom `BookingCalendar` and a small IntersectionObserver-based motion system (`lib/motion.tsx`) instead of pulling in calendar/animation libraries.
- **Rationale:** Full brand control, no dependency weight, WCAG/reduced-motion control; the bundle stays lean.
- **Status:** Accepted. Rule: post-mount elements use `.motion-pop`, never bare `motion-ready`.

## 008 — Vercel functions in fra1

- **Problem:** Functions ran in `iad1` while Neon sits in `eu-central-1` → ~90ms RTT per DB round-trip.
- **Decision:** `regions: ["fra1"]` in `next.config.ts`.
- **Status:** Accepted. Revisit when the DB region or hosting changes.

## 009 — Fail-open posture

- **Problem:** External dependencies (WhatsApp, rate limiter) must never block guest bookings.
- **Decision:** WhatsApp sends log-and-continue when unconfigured or on failure; rate limiters fail open on limiter errors.
- **Rationale:** Uptime for the guest funnel > strict enforcement; abuse is mitigated at multiple layers.
- **Status:** Accepted, documented tradeoff. Enforced via `lib/whatsapp.ts` and `lib/rate-limit.ts`.

## 010 — Token-gated guest reviews

- **Problem:** The trust engine must never be fake or spam-postable.
- **Decision:** Reviews only via an unguessable per-booking invite token (`review_invites`); start `pending`; staff moderate; approved-only public display; explicit POPIA consent (no consent → "Guest").
- **Status:** Accepted, binding guardrail. No fabricated/seed reviews, ever.

## 011 — Schema via `drizzle-kit push`

- **Problem:** Early-stage speed: apply schema directly, no migration scaffolding.
- **Decision:** `npx drizzle-kit push` in dev and CI.
- **Rationale:** Fine while the schema is young and the Neon schema-diff comment is the safety check.
- **Status:** **Superseded by 012** — as the schema grows (property model, payments, audit), unversioned pushes become an unacceptable risk.

## 012 — Versioned Drizzle migrations (proposed)

- **Decision:** `drizzle-kit generate` → commit `drizzle/*.sql` → `migrate` in CI/deploy; `db:push` only for local scratch.
- **Rationale:** Peer-reviewed, reviewable, rollbackable schema changes — a professional release requirement (ENTERPRISE-ROADMAP.md A2).
- **Status:** Proposed — Phase 0 task. Required *before* the Phase 1 property migration.

## 013 — Single-DB, shared-schema tenancy with property_id (proposed)

- **Decision:** Multi-location scaling uses one Postgres database, shared schema, with a `property_id` column on every tenant table and a mandatory `scopedDb(propertyId)` guard on admin queries.
- **Rationale:** Right-sized for a small group; avoids DB-per-tenant ops cost; the guard discipline (403 on cross-property access + unit tests) is the isolation mechanism.
- **Status:** Proposed — Phase 1. Owner decisions required (D6 in ENTERPRISE-ROADMAP.md).

## 014 — PCI DSS hosted payment gateway (proposed)

- **Decision:** Accept card + instant EFT through a PCI-DSS-certified hosted gateway behind a thin `lib/payments.ts` abstraction. Recommended primary: PayFast (SA-first, no monthly fee, hosted checkout); alternatives: Peach Payments (enterprise), Stripe (international). Never store card data.
- **Status:** Proposed — Phase 2. Owner decision required (D7).
