import * as Sentry from "@sentry/nextjs";

/**
 * Browser-side Sentry. Fails open: with no SENTRY_DSN the init is a no-op and
 * the app runs exactly as before — the DSN only takes effect in production.
 *
 * Sample rates: the site is low-traffic, so full transaction tracing is
 * nearly free and makes every page load debuggable. If traffic grows past
 * Sentry's free transaction allowance, lower tracesSampleRate (0.1 still
 * gives statistically sound sampling) or switch to error-only capture.
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});
