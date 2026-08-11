# Identified Issues

Live production diagnosis of `https://gomodi-lodge-web-app-linux.vercel.app` (2026-08-11).
Focus: why pages load slowly on the Vercel production link even though the local preview was fast.

## Symptom

- Opening the Vercel production link loads pages slowly, especially on first visit after a quiet period.
- The local dev preview felt fast at the same point in time.
- Server-side TTFB for most pages is actually fine warm (~0.42s); the slowness is cold-start latency and a few specific page LCPs.

## Measured evidence (production)

| Page | Pass | TTFB | FCP | LCP | Notes |
|------|------|------|-----|-----|-------|
| `/` | cold (first hit after idle) | 2.36s | 5.2s | — | DB/function cold start |
| `/` | warm | 0.44s | 0.89s | 0.89s | |
| `/rooms` | warm | ~0.42s | 0.64s | 0.64s | |
| `/book` | warm | ~0.42s | 0.55s | 0.55s | |
| `/corporate` | warm | ~0.42s | 0.61s | **6.6s** | LCP = hero `<img>` `/images/rooms/...`, loads late |
| `/events` | warm | ~0.42s | 0.56s | 0.56s | |
| `/admin/dashboard` | warm | ~0.42s | — | 2.3s | client data-fetch + 500ms skeleton |

## Issue 1 — Neon autosuspend cold start (main culprit)

- Neon free-tier compute suspends after ~5 minutes idle; the first DB query after that pays a 2–5s spin-up.
- The local preview hid this: the dev-server pg pool kept a persistent warm connection to Neon.
- In production every visitor after a quiet period pays the cold start: first hit measured 2.36s TTFB / 5.2s FCP, then 0.44s on the next request.
- **Fix:** disable autosuspend on the Neon compute endpoint (Neon dashboard), or add a keep-alive ping (e.g. Vercel Cron hitting a `/api/ping` DB route every 5 min).

## Issue 2 — Cross-region latency: Vercel function (US East) ↔ Neon (eu-central-1, Frankfurt)

- `x-vercel-id` response header shows the function runs in `iad1` (N. Virginia).
- The Neon pooler URL is `...c-4.eu-central-1.aws.neon.tech` (Frankfurt).
- ~90ms per DB round-trip; multi-query pages (admin dashboard, admin request queue) stack this.
- Local preview used one persistent TLS connection, hiding the per-request handshake + RTT.
- **Fix:** run Vercel functions in the DB region — add `regions: ["fra1"]` to `next.config.ts`.

## Issue 3 — Serverless function cold starts

- Each new Vercel Function instance re-establishes the pg connection; no warm pool is shared across requests.
- Adds 1–2s on top of the DB cold start for the first request to an idle function.
- **Fix:** reduce cold-start frequency (Issue 1 keep-alive also helps), consider connection reuse via Neon pooler (already in use).

## Issue 4 — No caching on dynamic pages

- All public pages are `force-dynamic`; only the room list is cached (60s `unstable_cache`).
- Every page load re-renders and hits the remote DB.
- **Fix:** broaden caching with `unstable_cache`/ISR where pages do not depend on `searchParams`.

## Issue 5 — `/corporate` LCP 6.6s (hero image)

- Largest Contentful Paint on `/corporate` is the hero `<img>` (`/images/rooms/...`, `object-cover`), observed at ~6.6s even warm.
- Likely not priority-loaded or served in a heavy format.
- **Fix:** investigate hero image loading (ensure `priority` on the first slide, confirm AVIF/WebP in production).

## Priority order

1. Disable Neon autosuspend (biggest single win) — do in Neon console.
2. Add `regions: ["fra1"]` to `next.config.ts`.
3. Optional Vercel Cron keep-alive.
4. Broaden caching.
5. Fix `/corporate` hero image LCP.
