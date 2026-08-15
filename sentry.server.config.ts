import * as Sentry from "@sentry/nextjs";

/**
 * Server-side Sentry (Node runtime). Fails open without SENTRY_DSN.
 * Captures unhandled errors in route handlers, server actions, and
 * during prerendering/build (logged, never fatal).
 */
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});
