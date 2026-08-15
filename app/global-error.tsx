"use client";

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

/**
 * Next.js global error boundary — the last line of defense for uncaught
 * render errors. Reports to Sentry (no-op without SENTRY_DSN) and shows the
 * standard error page. Must render its own <html>/<body>.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <NextError statusCode={500} title="Something went wrong" />
      </body>
    </html>
  );
}
