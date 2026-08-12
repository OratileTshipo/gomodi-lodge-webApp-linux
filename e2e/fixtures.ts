import { test as base, expect, Page } from "@playwright/test";

/**
 * Shared fixtures for the E2E suite.
 *
 * `dbReady` probes /api/ping (a real DB round-trip) once per test and exposes
 * the result so DB-dependent specs can skip themselves cleanly in environments
 * without a database (e.g. a DB-less CI run or a static preview).
 */
export type E2EFixtures = {
  dbReady: boolean;
};

export const test = base.extend<E2EFixtures>({
  // Note: the resolver param is named `resolve` (not `use`) so the react-hooks
  // eslint rule doesn't mistake Playwright's fixture resolver for a React hook.
  dbReady: async ({ request }, resolve) => {
    let ok = false;
    try {
      const res = await request.get("/api/ping");
      ok = res.ok() && ((await res.json()) as { ok?: boolean }).ok === true;
    } catch {
      ok = false;
    }
    await resolve(ok);
  },
});

export { expect };

/** Skip the current test when the DB-backed backend is not reachable. */
export function skipWithoutDb(dbReady: boolean) {
  test.skip(!dbReady, "Skipping — backend/DB unavailable (see E2E-TESTING.md)");
}

/**
 * Collect console errors and uncaught page errors for a page. Attach before
 * navigation; call `assertNoUnexpectedErrors` after the page has settled.
 */
export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`);
  });
  return errors;
}

/**
 * Noise patterns that should not fail a test. Everything else is a real
 * regression: an uncaught exception or a red console message.
 */
const NOISE = [
  /favicon/i,
  /net::ERR_ABORTED/,
  /Failed to load resource/,
  /ResizeObserver loop/i,
  /Download the React DevTools/i,
  /\[next\]/,
];

export function assertNoUnexpectedErrors(errors: string[]) {
  const real = errors.filter((e) => !NOISE.some((re) => re.test(e)));
  expect(real, `Unexpected console/page errors:\n${real.join("\n")}`).toEqual([]);
}

/**
 * Future "YYYY-MM-DD" dates relative to today, used to pick calendar days that
 * are guaranteed to fall in the next calendar month (avoids hitting disabled
 * past dates and keeps both dates on the same visible month grid).
 */
export function nextMonthDates(daysFromToday: number[]): {
  checkIn: Date;
  checkOut: Date;
  label: (d: Date) => string;
} {
  const now = new Date();
  const [ci, co] = daysFromToday;
  const checkIn = new Date(now.getFullYear(), now.getMonth() + 1, ci);
  const checkOut = new Date(now.getFullYear(), now.getMonth() + 1, co);
  return {
    checkIn,
    checkOut,
    label: (d: Date) =>
      d.toLocaleDateString("en-ZA", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
  };
}

/** Unique-ish contact values so repeated CI runs don't collide. */
export function uniqueContact() {
  const stamp = Date.now().toString().slice(-8);
  return {
    fullName: `E2E Tester ${stamp}`,
    phone: `+2782${stamp}`,
    email: `e2e-${stamp}@example.com`,
  };
}

/** Local-calendar "YYYY-MM-DD" for a Date (matches the app's date inputs). */
export function toIso(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
