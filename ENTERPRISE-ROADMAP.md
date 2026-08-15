# ENTERPRISE-ROADMAP.md — Professional Web Application Assessment & Roadmap

> **Status:** Living document — the architecture/strategy reference for Gomodi Guest Lodge.
> **Audience:** Owner (Oray), the BA/Architect, and every coding agent working on this repo.
> **Date:** 2026-08-15 · **Basis:** Full read of every `.md` file + a line-level audit of `app/`, `lib/`, `components/`, `e2e/`, `.github/`, and config files, plus industry research (multi-property hospitality platforms, South African payment gateways, POPIA, multi-tenant database patterns, Next.js production observability).
> **Where it conflicts with `PRODUCT.md` (binding brand/product rules) or `PROJECT_SPEC.md` (binding engineering rules), those win. This document layers a *standards and growth* lens on top.**

---

## 0. Executive summary

Gomodi's website is in **genuinely good shape for an early-stage product** — above average versus typical agency-built or AI-generated Next.js apps on security posture, code hygiene, and test coverage. The gaps that matter are not "rewrite it" gaps; they are **foundation gaps that must be closed before the business scales from 1 property to N properties**.

The single most important architectural fact: **the current data model is implicitly single-property.** Rooms, bookings, users, pricing, quotes, and reviews carry no `property` dimension. The business goal — a multi-location guest house group across SA provinces and cities — cannot be reached by bolting pages on; it requires a deliberate tenant/property model, done **now while the data volume is small**, because retrofitting tenant columns onto live production data is the most expensive migration this project will ever face.

The roadmap is phased so the business is never blocked:

| Phase | Theme | Duration (est.) | Exit criteria |
|---|---|---|---|
| **0 — Go-live stabilization** | Secrets, credentials, migration discipline, observability | 2–3 weeks | Production login + WhatsApp actually work; deploys green; errors visible |
| **1 — Multi-location foundation** | `properties` model, property-scoped RBAC + config | 3–5 weeks | Any table/query can express "this belongs to property X" |
| **2 — Payments & revenue** | PCI DSS hosted checkout, deposits, receipts | 3–4 weeks | Guests can pay online; payment state drives booking state |
| **3 — Operational excellence** | Audit log, admin settings, pagination, analytics, privacy | ongoing (4–6 weeks of work) | Staff self-serve pricing/rooms; compliance artifacts exist |
| **4 — Growth & guest experience** | PWA, i18n, channel/PMS integration, data-driven optimization | continuous | Direct-booking funnel measured and improving |

Everything below is the reasoning, the evidence from the code, the standards we hold ourselves to, and the concrete task list.

---

## 1. Business context & growth hypothesis (the lens for every decision)

- **Today:** one 9-room boutique guest house in Mafikeng (Mmabatho), North West, SA. Three guest journeys (leisure / corporate / events) → one approval pipeline → WhatsApp-delivered confirmations.
- **Tomorrow (stated):** a multi-location guest house group in multiple provinces and cities. Each site may have its own rates, rooms, staff, contact numbers, bank account, and (possibly) its own brand identity.
- **Implications for software (what "scale" actually means here):**
  1. **Tenancy:** bookings/rooms/staff/quotes/reviews must be scoped to a property. A manager in Joburg must never approve a booking in Mafikeng they cannot see.
  2. **Config-as-data:** rates, seasonal windows, availability, meal prices, banking details, WhatsApp recipients, contact numbers, and even the property's name/address must be data (per property), not code.
  3. **Cross-property views:** the owner wants a consolidated dashboard (all sites, all pipelines) while each site's staff sees only their own.
  4. **Ops at N sites:** notification routing (WhatsApp per property), audit trails, and reporting must survive N properties without code changes per site.
- **The scale ceiling today:** the codebase *works* for one site. It would require significant surgery for two. That is exactly why Phase 1 (the property model) is scheduled *before* payments and growth features — every phase after it gets built tenant-aware from day one.

---

## 2. Current-state audit (verified against code, 2026-08-15)

### 2.1 Stack & architecture

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 16.2.12 (App Router) + React 19.2.4, TS strict | `force-dynamic` public pages; server actions for forms; route handlers for admin/auth/upload |
| Data | PostgreSQL (Neon, eu-central-1) + Drizzle ORM 0.45.2 | Schema in `lib/db/schema.ts`; **versioned migrations in `drizzle/` (ADR 012, implemented)** |
| Styling | Tailwind CSS v4, brand tokens in `app/globals.css` | Terracotta/walnut/cream/gold/ink; WCAG AA audited |
| Auth | In-house OTP (SHA-256 hashes, 5-attempt lockout) + HMAC-SHA256 signed session cookie (8h, httpOnly, SameSite=Lax) | Registered-numbers only; no account enumeration |
| Notifications | Meta WhatsApp Cloud API via `lib/whatsapp.ts` / `lib/notifications.ts` | **Stubbed — logs only until credentials exist** |
| Storage | Vercel Blob (`/api/upload`, magic-byte validation, ≤5MB) | POP upload **not wired from the booking form** |
| Rate limiting | Upstash Redis (optional) with in-memory fallback, in middleware | Both fail open |
| Testing | Vitest (42 unit) + Playwright (82 e2e, desktop+mobile) | CI gates on tsc/lint/vitest; e2e job spins Postgres |
| CI/CD | GitHub Actions (`ci.yml`, `neon_workflow.yml`), Vercel | Branch-protected `main`/`dev`, PR-based workflow |
| Observability | None (console logs only) | No Sentry/OTel, no uptime alerts |

### 2.2 What is genuinely strong (industry-competitive)

These are not to be torn down — they are the foundation to build on:

- **Security posture is serious.** CSP with per-request nonces, CSRF origin checks in middleware, layered rate limiting (IP + per-phone), constant-time OTP comparison, HMAC-signed sessions with a production-only secret requirement, magic-byte file validation, safe POP-URL allowlisting (`*.public.blob.vercel-storage.com`), server-side validation everywhere via `lib/validate.ts`, integer-cents money math (`lib/quote-math.ts`), Postgres advisory locks + transactional re-check on approve (prevents double-booking), role-scoped server-side data filters (staff → leisure only; partner → events only). Zero `@ts-ignore`.
- **Code hygiene is above average.** Strict TS, shared `Result<T>` contract, single source of truth for pricing (`lib/pricing.ts`) and validation, extracted booking helpers (`lib/booking-common.ts`), typed `EnrichedRequest` shapes, small focused components after the refactor passes.
- **Test culture exists.** 42 unit tests on the money/date/validate invariants; an 82-test Playwright suite covering every page/flow plus perf budgets and a11y smoke checks; CI gates.
- **Performance work is real.** `regions: ["fra1"]` (function↔DB colocation), AVIF/WebP, hero `fetchPriority` + preload, lazy slideshow mounting, 60s room-list cache, hardened pg pool (timeouts, keep-alive), parallel admin-queue queries.
- **Governance is documented and followed.** PROGRESS.md ledger, GIT_WORKFLOW_GUIDELINES, branch protection, PR-based flow, release tagging, ADR-style changelogs in knowledge.md.

### 2.3 Gap register (by professional discipline)

**G = Gap, severity, and the fix direction. Evidence is code-verified.**

#### 2.3.1 Security & compliance

| # | Gap | Severity | Evidence / fix direction |
|---|---|---|---|
| S1 | **`.env` / `.env.local` are tracked in git** (and in history), and secrets may have been pushed | 🔴 Critical | Documented in PROGRESS.md/CODE-QUALITY-review.md; platform blocks sandbox env ops. **Owner must** `git rm --cached .env .env.local` in a dedicated PR and rotate any real `DATABASE_URL`/`SESSION_SECRET`/Blob tokens ever pushed. Do this *before* scaling; it is a data-breach risk today. |
| S2 | **WhatsApp not configured → OTP cannot be delivered in production.** In prod the OTP only exists in server logs, so admin login is effectively non-functional until Meta credentials are set | 🔴 Go-live blocker | Owner: Meta Business account, WhatsApp Business number, permanent token, 5 approved templates. See `lib/whatsapp.ts` header + knowledge.md. |
| S3 | **POPIA artifacts missing.** Consent is captured on forms (good), but there is no privacy policy page, no PAIA manual, no documented data-retention/deletion procedure, no cookie/consent documentation, no information officer named | 🟡 High | Professional SA business requirement (POPIA conditions 1–8, PAIA manual for a business with turnover). Legal-lite artifact set: Privacy Policy, PAIA manual, retention schedule, breach-response runbook. |
| S4 | **No audit trail for admin actions.** Approve/decline records `approvedById` but there is no immutable audit log (who did what, when, with what payload), no decline-reason capture | 🟡 High | Add an `audit_logs` table + middleware-free write helper; log every admin mutation (approve/decline/contact/quote-send/settings-change). Needed for both governance and dispute resolution. |
| S5 | **Session cookie lacks `__Host-` prefix and rotation; no revocation** | 🟢 Low-Med | `__Host-session` prefix (requires `Secure` + no `Domain`), periodic re-issue, optional `sessions` table for revocation when staff count grows. Fine today; cheap to adopt in Phase 3. |
| S6 | **Upload endpoint is unauthenticated** (any visitor can POST 5MB blobs up to the 30/10-min IP limit) | 🟢 Low | Acceptable for guest POP/review photos, but add optional auth + per-request byte budgets and monitor Blob storage cost in Phase 3. |

#### 2.3.2 Scalability & architecture

| # | Gap | Severity | Evidence / fix direction |
|---|---|---|---|
| A1 | **No property/location dimension anywhere** — the scale blocker | 🔴 Critical (for the stated goal) | `lib/db/schema.ts` has no `properties` table; `rooms`, `booking_requests`, `users`, `seasonal_pricing`, `quotes`, `reviews` have no `property_id`. Phase 1 addresses this. |
| A2 | ~~No migration history — schema applied via `drizzle-kit push`~~ | ✅ Done | `0000_baseline` + `0001_hot-path-indexes` + `0002` committed; CI e2e + Neon preview run `migrate`; `npm run db:adopt` for push-created DBs. (ADR 012 — implemented 2026-08-15) |
| A3 | ~~Booking insert is not transactional~~ | ✅ Done | All three actions (leisure/corporate/events) now wrap request → lines → meals → quote in `db.transaction`; notifications run post-commit. Corporate availability is single-query (N+1 removed). (2026-08-15) |
| A4 | **Availability check vs. insert is not atomic** (two concurrent submissions can both pass `isRoomAvailable`) | 🟡 Medium | Pending overlap is only a soft conflict today (admin flags amber) and the approve path is the hard gate (advisory locks — good). Strengthen with a serializable transaction or a partial unique index on (room_id, date-range overlap) when volume grows. Document the decision as an ADR. |
| A5 | **Admin queue loads unbounded data** — all pending requests + ALL approved bookings on every dashboard load; no pagination | 🟡 High (as volume grows) | Add LIMIT/OFFSET (or keyset) pagination + filter by status/category/property; the approved-bookings scan needs the index from P2. |
| A6 | ~~Missing database indexes on hot query paths~~ | ✅ Done | `booking_room_lines(room_id, check_in, check_out)`, `booking_requests(status, category)`, `booking_requests(contact_phone)`, `auth_otps(phone, consumed)`, `reviews(status)`, `staff_time_clocks(user_id, timestamp)`. `quotes(public_token)` already covered by unique. (0001/0002, 2026-08-15) |
| A7 | **Rate limiter fails open and defaults to in-memory (per-instance)** | 🟢 Low-Med | Correct posture for uptime, but multi-instance enforcement requires Upstash keys. Add keys in Phase 3 when traffic justifies it. |
| A8 | **No feature flags / config separation** — per-property config (banking details, contact, WhatsApp recipient) is hardcoded | 🟡 Medium | Phase 1 introduces a `properties` table + `property_settings`; feature flags (e.g. lunch add-on) become env/DB-driven rather than code edits. |

#### 2.3.3 Performance

| # | Gap | Severity | Evidence / fix direction |
|---|---|---|---|
| P1 | **Neon autosuspend cold starts (2–5s)** hit every idle visitor | 🟡 High (measured) | `Identified_Issues.md`: disable autosuspend on the Neon compute (owner, Neon console) — the single biggest perf win; the 4-min ping cron was removed in PR #31 (Hobby plan), so a DB-side keep-alive or paid plan decision is needed. |
| P2 | **Most public pages are `force-dynamic`** with live DB reads; only the room list is cached (60s) | 🟡 Medium | Broaden caching deliberately (quotes/reviews/homepage sections that don't depend on `searchParams`), always preserving the live availability check on submit. |
| P3 | **Perf budgets exist but are dev-relaxed; prod budgets ran red in CI** | 🟡 Medium | Get the e2e/perf suite green on prod mode (PR #28 pending), then enforce budgets in CI as a gate. |
| P4 | **No image CDN/remote optimizer config** for Vercel Blob URLs | 🟢 Low | `next/image` + Blob already; consider `images.remotePatterns` for blob URLs when review/POP photos render publicly. |

#### 2.3.4 Maintainability & engineering practice

| # | Gap | Severity | Evidence / fix direction |
|---|---|---|---|
| M1 | **ADR log, system design, project plan, sprint log are empty placeholders** | 🟡 Medium | `docs/03-design/adr-log.md` etc. — fill with the decisions already made (Prisma→Drizzle, force-dynamic→cached rooms, in-house OTP auth, single-source pricing, advisory-lock approve). ADRs are how a growing team keeps "why" decisions alive. |
| M2 | ~~Unit test coverage is narrow~~ | ✅ Mostly | 72 unit tests now cover auth (tamper/expiry/roles), the rate limiter (window edges + Upstash fail-open), and the quote line-builder (seasonal straddles, meal aggregation). Remaining: role filters in `app/api/admin/requests` (2026-08-15). |
| M3 | **E2E suite has never been fully green in CI** (long-journey timeouts, flaky assertions) | 🟡 High | Root causes fixed in PR #28 (sr-only toggles, selector collisions, regex bug, mobile nav). Merge #27 → #28 → watch CI; then stabilize remaining flakes and keep the suite green as a merge gate. |
| M4 | **`middleware.ts` triggers Next 16's rename warning (`proxy.ts`)** | 🟢 Low | Next 16 deprecation; plan the rename in Phase 3 to keep the upgrade path clean. |
| M5 | **No dependency update discipline** — `package.json` on fixed minors; no Renovate/Dependabot, no lockfile policy | 🟢 Low-Med | Enable Dependabot (npm) with grouped PRs + CI gate; pin exact versions in `package-lock.json` (already the case via `npm ci`). |
| M6 | **No coverage/quality tooling beyond lint+tsc** | 🟢 Low | Add `vitest --coverage` gate (>80% on `lib/` money/date/auth), and a TODO/FIXME sweep discipline in code review. |

#### 2.3.5 Usability & guest experience

| # | Gap | Severity | Evidence / fix direction |
|---|---|---|---|
| U1 | **WhatsApp CTAs render `#`** (no real number) and **banking details are unverified** | 🟡 High (go-live) | `lib/contact.ts` is the single swap point (good). Owner must supply the E.164 number; banking details carry a `TODO(owner-verification-required)` flag (see scratch spec). |
| U2 | ~~POP upload is cosmetic~~ | ✅ Done | Leisure stores the real blob URL + filename/size/mime (server-verified); corporate + events forms now accept an optional deposit POP; shared `PopUpload` component + `uploadProofOfPayment` helper (2026-08-15). |
| U3 | **No privacy policy / terms pages** linked from footer | 🟡 Medium | S2/legal artifacts; guests increasingly expect them; also required for the review feature to stay POPIA-clean. |
| U4 | **Rooms 2–9 have no photography; zero reviews on site** | 🔴 Business-critical (owner-side) | Already the top finding in `UI-findings-and-recommendations.md`. Photography + real reviews out-convert any feature on this list. Not a code task — an owner task the site is now built to receive. |
| U5 | **No mobile app/PWA** | 🟢 Low-Med (discussed) | Decision pending; PWA (manifest + service worker) is a days-sized win for "admin on a phone"; Capacitor later for Play/App Store. |

#### 2.3.6 Operations & reliability

| # | Gap | Severity | Evidence / fix direction |
|---|---|---|---|
| O1 | ~~No observability~~ | ✅ Mostly | Sentry wired (`@sentry/nextjs`, instrumentation + client/server/edge configs, `app/global-error.tsx`, build plugin fails open) — add `SENTRY_DSN` in prod (and `SENTRY_AUTH_TOKEN` for source maps on deploy). Remaining: external uptime monitor on `/api/ping` (UptimeRobot free) + structured logger (2026-08-15). |
| O2 | **No documented backup/DR/restore drill** for Neon | 🟡 Medium | Neon has PITR; document retention + a quarterly restore drill; record RPO/RTO in the ops runbook. |
| O3 | **Deploy checks red on PRs** (Vercel "Deployment failed"; Neon preview 422) | 🟡 High | Owner-side: Vercel project env/config; Neon preview branch-name collision (PR #30 sanitizes). Verify after #27/#28/#30 merge. |
| O4 | **Cron budget on Hobby plan** — one daily cron (review reminders) now fits; growth needs Pro | 🟢 Low | Document plan ceiling; revisit with Phase 3 (reminders, digests, reports). |

---

## 3. Industry standards mapping (the roadmap's reference frame)

### 3.1 The web application development lifecycle (what "professional" means here)

```
Plan → Design (ADRs) → Build (small PRs) → Test (unit/e2e/CI) → Release (tagged PRs)
     → Operate (monitoring/alerting) → Observe (metrics/errors) → Learn → repeat
```

Every phase in §4 maps onto this loop. Two disciplines this repo has but must keep: **ADRs for decisions** (started; see M1) and **Definition of Done with validation** (PROGRESS.md checklist — keep it, add perf + coverage).

### 3.2 Security — OWASP ASVS / OWASP Top 10 mapping

The app already covers a surprising share of ASVS L1. Gaps to close (mapped to the register):

| OWASP area | Current state | Gap ref |
|---|---|---|
| A01 Access control | Role-scoped filters, guards | A1 (property scoping), S4 (audit) |
| A02 Cryptographic failures | HMAC sessions, SHA-256 OTP hashes | S5 (`__Host-` cookie, rotation) |
| A03 Injection | Drizzle parameterization, strict validation | — (solid) |
| A04 Insecure design | Advisory locks, single-source pricing | A3/A4 (transactions) |
| A05 Security misconfiguration | CSP nonces, hardening headers, robots for admin | S1 (env in git) |
| A06 Vulnerable components | Dependabot absent | M5 |
| A07 Identification/auth failures | Registered-only OTP, lockouts | S2 (WhatsApp delivery) |
| A08 Data integrity | Server-recomputed totals | — (solid) |
| A09 Logging/monitoring | Console only | O1, S4 |
| A10 SSRF | `isSafeProofOfPaymentUrl` allowlist | — (solid) |

### 3.3 Performance — Core Web Vitals budgets (measured baseline)

From `Identified_Issues.md` + PROGRESS.md benchmarks (warm prod): TTFB 61–157ms, LCP ≤0.9s warm on most pages, **cold-start LCP 5.2s** (Neon autosuspend) and `/corporate` LCP up to 6.6s historically (now improved with `fetchPriority`). Budgets to hold:

| Metric | Budget (prod, mobile-throttled) |
|---|---|
| LCP | ≤ 2.5s (goal; cold-start mitigation via P1) |
| FCP | ≤ 1.8s |
| TTFB (warm) | ≤ 400ms |
| CLS | ≤ 0.1 |
| INP | ≤ 200ms |

The `e2e/perf.spec.ts` suite enforces these under `E2E_SERVER=prod` — get it green and keep it green.

### 3.4 Compliance (South African context)

- **POPIA (in force):** consent captured on forms ✓; needs privacy policy, PAIA manual, retention schedule, breach runbook (S3). Reviews feature already stores explicit consent (good).
- **PCI DSS:** the moment Gomodi accepts cards, **never store card data and use a PCI-DSS-certified hosted gateway** (§5.3). SA market options: **PayFast** (pragmatic: 3.5%+R2 cards, 2% instant EFT, no monthly fee, PCI DSS L1, SA-first onboarding), **Peach Payments** (enterprise, hospitality-proven), **Stripe** (global; SA local-merchant availability still limited/rolling out — great once international volume matters). Recommended architecture: a thin provider abstraction so switching is config, not code.
- **SARS/VAT:** quote/PDF engine already renders VAT (15%) and corporate fields (PO, VAT number) — the foundation for tax invoices; formalize invoicing in Phase 2/3 (invoice numbers, statements).
- **PAIA:** any SA business is expected to have a PAIA manual; a page + a contact is the artifact.

### 3.5 Hospitality industry reference (how others built this)

- **What comparable SA/global players do:** multi-property groups run a **single platform with per-property inventory and rate logic** (PMS + channel manager + direct booking engine), consolidated at HQ and scoped at the property. Systems like Cloudbeds, Mews, Semper, Little Hotelier and SA's own NightsBridge show the pattern: one availability engine, per-property rate plans, central dashboard + property-scoped staff.
- **What this means for Gomodi's roadmap:** the *website* is the direct-booking channel; the *data model* must look like a light-weight PMS. Phases 1–2 build that: `properties` (inventory root), per-property rates/seasonal (already a table — add `property_id`), booking pipeline (already exists — add scoping), and later a **channel-manager decision** (NightsBridge/Little Hotelier) if OTAs (Booking.com, etc.) are added — at which point the internal availability engine becomes the source of truth and the channel manager syncs it. Do not build OTA sync in-house; buy the channel manager, integrate once.
- **Direct-booking economics:** every percentage point of direct share is commission saved (typically 12–18% OTA commission) — which is exactly why the website investment (payments, reviews, photos) pays for itself.

### 3.6 Observability standard

- **Errors + performance:** Sentry for Next.js (App Router aware, source maps, RSC/action capture) — free tier is enough at this scale.
- **Uptime:** external HTTP monitor on `/api/ping` (UptimeRobot free tier) → email/WhatsApp alert.
- **Logging:** keep `console.log` but add a tiny structured logger (JSON lines) so Vercel log search works; redact PII (phones/emails) in logs (POPIA).

---

## 4. Target architecture (multi-location)

### 4.1 Data model — the property dimension (Phase 1)

```text
properties (id, slug, name, address, city, province, isActive)
rooms          + property_id  (FK, not null)          — inventory root
booking_requests + property_id (FK, not null)         — every pipeline row scoped
users          + property_id (nullable = HQ/cross-site) + a user_properties join
                  for multi-site staff
seasonal_pricing + property_id (FK)                   — per-property windows
quotes         (inherits via booking_requests; also store property_id for fast filter)
reviews        (inherits via booking_requests)
property_settings (property_id, key, value)           — banking, WhatsApp recipient,
                  contact numbers, emails, branding overrides, feature flags
```

**Tenancy strategy (ADR):** single database, shared schema, **`property_id` column on every tenant table + a mandatory guard**. This is the right-sized choice for a small group (the alternatives — DB-per-tenant, schema-per-tenant — buy isolation the business doesn't need and cost operations overhead). The guard discipline is the whole game: every query in the admin layer must be filtered by the caller's property scope, and the API contract must return 403 on cross-property access. Enforce with a shared `scopedDb(propertyId)` helper + unit tests on every admin route.

### 4.2 RBAC matrix (target)

| Role | Today | Target |
|---|---|---|
| Owner (HQ) | Everything, 1 site | Everything, all properties, consolidated dashboard |
| Assistant | Everything | Same, property-scoped by assignment |
| Manager (new, per site) | — | Approve/decline **own property only** |
| Staff | Leisure queue + time clock | Own-property leisure queue + time clock |
| Partner (Lelz) | Event queue | Unchanged (events scope) — events are per-property too |

### 4.3 Application layers

- **Server components** read public data (rooms, reviews) — tenant-aware via the URL/property slug when sites get their own subdomains (`mafikeng.gomodiguestlodge.co.za`, `johannesburg.…`), or via a single site with a property picker.
- **Server actions** validate + insert — now wrapped in transactions (A3), tenant-scoped (A1).
- **Route handlers** (admin/auth/upload) — keep; add audit writes (S4) and property scoping.
- **Background jobs** (Vercel cron): review reminders today; later — payments reconciliation, nightly digests, rate-sync to channel manager.
- **Webhooks** (Phase 2): payment provider webhooks update booking/payment state — this is the event backbone.

### 4.4 External services map (with the recommended provider and what it needs)

| Capability | Recommendation | When | Keys needed |
|---|---|---|---|
| Error/perf monitoring | **Sentry** (`@sentry/nextjs`) | Phase 0 | `SENTRY_DSN`, `SENTRY_AUTH_TOKEN` (org) |
| Uptime alerts | **UptimeRobot** (free) on `/api/ping` | Phase 0 | account only |
| Payments (cards + instant EFT) | **PayFast** primary (SA-first, PCI DSS L1, hosted); Peach as enterprise alt; Stripe later for international | Phase 2 | `PF_MERCHANT_ID`, `PF_PASS_PHRASE`, webhook key |
| Channel manager / PMS sync | **NightsBridge** or **Little Hotelier** (decision with owner) | Phase 4 | account + API creds |
| Transactional email fallback | **Resend** (when WhatsApp can't reach a guest) | Phase 2 | `RESEND_API_KEY` |
| Global rate limiting | Upstash Redis (already supported) | Phase 3 | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| File storage | Vercel Blob (already integrated) | today | `BLOB_READ_WRITE_TOKEN` |

---

## 5. The Roadmap

Each phase lists **tasks (code-side unless marked 🔴 owner)** and an **exit criteria**. Every task ends with the repo's Definition of Done: build ✓, tsc ✓, lint no-new-errors, unit tests ✓, PR with PROGRESS.md update.

### Phase 0 — Go-live stabilization & hardening *(2–3 weeks)*

The site cannot be considered "live" until these hold. Priorities:

1. 🔴 **Merge PRs #27, #28, #30** and verify CI fully green (typecheck/lint/vitest/e2e against Postgres).
2. 🔴 **Untrack `.env` / `.env.local`** in a dedicated PR (`git rm --cached`), **rotate any secrets ever pushed** (Neon password, SESSION_SECRET, Blob token). (S1 — SETUP-LOCAL.md §8 has the exact steps.)
3. 🔴 **WhatsApp Business credentials** (`WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_RECIPIENT` + templates) — makes OTP + booking alerts + review invites actually deliver. (S2 — the go-live blocker.)
4. 🔴 **Real WhatsApp number** in `lib/contact.ts` (U1) and **verify banking details** (U1/owner flag).
5. **Wire the POP upload** end-to-end (U2): **done** — leisure + corporate + events upload via `/api/upload`, real metadata stored, non-blocking failure path. Needs `BLOB_READ_WRITE_TOKEN` in prod.
6. **Migration discipline** (A2): **done** — versioned migrations are canonical (`drizzle-kit generate` → commit `drizzle/*.sql` → CI/deploy runs `migrate`; `db:push` is local scratch only). Any schema change ships as a migration.
7. **Observability** (O1): **Sentry done** (fails open; needs `SENTRY_DSN` + `SENTRY_AUTH_TOKEN` in prod). Remaining: external uptime monitor on `/api/ping` (UptimeRobot free) and a structured-logger helper.
8. **DB hardening** (P1/P2/P6): owner disables Neon autosuspend (workflow merged, needs release #35 + one click); hot-path indexes (A6) and transactional booking writes (A3) **done**.
9. **Unit tests** for `lib/auth.ts`, rate limiter, quote engine seasonal splits (M2): **done** (72 total); remaining — role-filter tests for `app/api/admin/requests`.
10. 🔴 **Vercel project env/config** — get the PR deploy check green (O3).

**Exit criteria:** CI green end-to-end; production OTP/WhatsApp deliver; no secrets in git; migrations versioned; errors visible in Sentry; POP upload stores real files.

### Phase 1 — Multi-location foundation *(3–5 weeks)*

This is the **scale enabler** — do it before payments and growth features so everything built after is tenant-aware. Owner must confirm the property rollout plan (site names, subdomains vs picker, who manages which site).

1. **`properties` table + `property_id` on** `rooms`, `booking_requests`, `seasonal_pricing`, `users` (nullable for HQ) + `property_settings` (A1).
2. **Property-scoped RBAC**: `user_properties` join; a `scopedDb(propertyId)` guard helper; every admin route returns 403 on cross-property access; unit tests on each route's scope filter.
3. **Consolidated HQ dashboard**: multi-property filter on the admin dashboard + per-property queue views (A1).
4. **Config-as-data migration**: move contact numbers, banking details, WhatsApp recipient, meal prices (via `property_settings`) off hardcoded constants; keep `lib/pricing.ts` as the dev/default fallback (U1, A8).
5. **Property-branded surfaces** (if subdomains): per-property slug routing for rooms/book/contact; Nav/Footer read from property config.
6. **ADRs**: record the tenancy decision (single-DB shared-schema + property_id), the transaction decision, and the config-as-data decision (M1).
7. 🔴 **Owner decisions**: property rollout order, subdomain vs picker UX, cross-site staff assignments.

**Exit criteria:** any table/query can express property scope; a Joburg manager cannot see or act on Mafikeng data; HQ sees everything; all admin routes unit-tested for scope.

### Phase 2 — Payments & revenue *(3–4 weeks)*

1. **Payment provider decision** (§5.3) — recommended PayFast (hosted checkout, PCI DSS L1, card + instant EFT in ZAR). Build a thin `lib/payments.ts` abstraction so the provider is a config swap.
2. **Deposit model**: configurable deposit % per property (from `property_settings`); booking state machine gains `deposit_due → deposit_paid`.
3. **Checkout flow**: from the admin-approved booking (or the guest success screen) → hosted checkout → **webhook** updates `payments` table + booking status; idempotency keys; receipt email/WhatsApp.
4. **Payment records + reconciliation**: `payments` table (amount, provider ref, status, timestamps), a payments view in admin, nightly reconciliation job (cron).
5. **Tax invoices** for corporate (invoice numbers, statements) — reusing the quote/PDF engine.
6. **Transactional email fallback** (Resend) for guests WhatsApp can't reach (e.g. international numbers).

**Exit criteria:** a guest can pay a deposit online end-to-end; webhook-driven state is correct under replay/duplicate conditions; admin sees payment status per booking; receipts delivered.

### Phase 3 — Operational excellence & governance *(4–6 weeks, continuous)*

1. **Audit log** (`audit_logs` table + writer; every admin mutation recorded; viewable in admin) (S4).
2. **Admin settings screens**: pricing + seasonal windows + room availability toggles (per property) — the `pricingSettings`/availability concept from the scratch spec, built tenant-aware (A8).
3. **Pagination + filters** on the admin queue and quotes lists (A5); A6 indexes are in place (0001/0002).
4. **Privacy program** (S3): Privacy Policy page, PAIA manual, retention schedule, breach runbook, named Information Officer; link from footer; cookie-consent note (the site sets no tracking cookies today — keep it that way unless analytics is added).
5. **Analytics decision**: privacy-respecting option (Plausible/Umami) vs GA4; wire event tracking on the booking funnel (phase-4 optimization needs data).
6. **Feature flags**: light config-driven flags (e.g. lunch add-on) so unconfirmed products never ship by code edit (A8, Lelz open items).
7. **Ops runbook**: backup/restore drill (Neon PITR), dependency policy (Dependabot on), `middleware.ts` → `proxy.ts` rename, Vercel plan review (crons, regions, functions budget).
8. **Coverage gate** (>80% on `lib/` money/date/auth) in CI (M6).

**Exit criteria:** every admin action traceable; staff self-serve pricing/rooms without code; privacy artifacts live; ops runbook exists and one restore drill has been executed.

### Phase 4 — Growth & guest experience *(continuous)*

1. **PWA** (manifest + service worker + install icons + Web Push path) — the fastest "app on a phone" win for admin and guests (U5; decision pending).
2. **i18n** (next-intl) for SA languages — scope with owner (is Setswana-first marketing a differentiator?).
3. **Reviews trust engine** — already built (`reviews`, `/review`, moderation); push the tables to production, and **real photography** (🔴 owner — the #1 conversion lever per UI-findings).
4. **Channel manager decision** (NightsBridge/Little Hotelier) when OTAs are added; the internal availability engine becomes the source of truth (never build OTA sync in-house).
5. **Funnel analytics → optimization loop**: measure direct-booking conversion, run A/B on the wizard, reduce steps, WhatsApp-engage abandonment.
6. **SEO**: sitemap, robots, OG images, structured data per room, per-property pages when subdomains exist.
7. **Mobile app decision** — revisit PWA → Capacitor when the PWA data says the admin team needs deeper native features (FCM push, biometrics).

---

## 6. Risk & decision register (owner input required — nothing here should be guessed)

| # | Decision / input | Blocks | Notes |
|---|---|---|---|
| D1 | Merge PRs #27, #28, #30 and verify CI | Phase 0 | Both carry code fixes; #30 fixes Neon preview 422 |
| D2 | Run `git rm --cached .env .env.local` + rotate secrets | Phase 0 (security) | Steps in SETUP-LOCAL.md §8 |
| D3 | WhatsApp Business setup (token, number, 5 templates) | Phase 0 (login & notifications) | List in PROGRESS.md owner ledger |
| D4 | Real WhatsApp number + verified banking details | Go-live | U1; banking carries the unverified flag |
| D5 | Disable Neon autosuspend | Perf | Biggest single perf win (P1) |
| D6 | Property rollout plan (names, subdomains vs picker, site managers) | Phase 1 | Shapes the tenancy UI |
| D7 | Payment provider (recommended PayFast; Peach/Stripe alternatives) | Phase 2 | PCI DSS hosted only — never store card data |
| D8 | Photography + review seeding source (real guests) | Trust/conversion | UI-findings guardrails: never fabricate |
| D9 | Analytics choice (privacy-first vs GA4) | Phase 3 | Keep zero third-party cookies until decided |
| D10 | OTA/channel-manager entry (NightsBridge/Little Hotelier) | Phase 4 | Buy, don't build |

---

## 7. Definition of Done for professional releases (add to PROGRESS.md checklist)

- [ ] `npm run build` exit 0 and `npx tsc --noEmit` clean
- [ ] `npm run lint` — zero **new** errors
- [x] `npm test` — unit suites green (72 tests incl. auth/rate-limit/quote per M2)
- [ ] E2E suite green on the CI Postgres job (perf budgets under `E2E_SERVER=prod`)
- [x] Migrations: any `schema.ts` change ships as a **versioned migration** (no bare `db:push`)
- [ ] Every admin mutation writes an audit row (Phase 3+)
- [ ] PROGRESS.md updated with files changed + validation results
- [ ] ADR recorded when a decision affects architecture (tenancy, payments, caching, auth)
- [ ] No new secrets in git; env changes documented in SETUP-LOCAL.md

---

*End of document. Agents: after implementing any phase, update `PROGRESS.md` (ledger + progress log) and mark checklist items. Owner-side (🔴) items go to the owner ledger.*
