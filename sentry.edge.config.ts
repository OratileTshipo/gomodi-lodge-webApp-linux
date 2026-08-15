import * as Sentry from "@sentry/nextjs";

/**
 * Sentry for the Edge runtime (middleware). Fails open without SENTRY_DSN.
 * Middleware runs on every request, so keep this config minimal — the
 * middleware itself deliberately does NOT capture per-request spans.
 */
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});
