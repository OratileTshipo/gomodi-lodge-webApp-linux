import { expect } from "./fixtures";
import { test, skipWithoutDb, collectErrors, assertNoUnexpectedErrors } from "./fixtures";

/**
 * Loading-time budgets. Measured on the desktop project only (mobile is
 * excluded via testIgnore in playwright.config.ts).
 *
 * Budgets are strict against a production server (E2E_SERVER=prod, the CI
 * path) and relaxed against `next dev` so local runs don't flake on
 * on-demand compilation. Set E2E_PERF=1 to force strict budgets anywhere.
 */
const STRICT = process.env.E2E_SERVER === "prod" || process.env.E2E_PERF === "1";

const BUDGETS = STRICT
  ? { lcpMs: 4500, dclMs: 4000, loadMs: 10_000 }
  : { lcpMs: 12_000, dclMs: 10_000, loadMs: 25_000 };

const ROUTES = ["/", "/rooms", "/book", "/events", "/corporate"];

for (const route of ROUTES) {
  test(`loading budgets: ${route}`, async ({ page, dbReady }) => {
    skipWithoutDb(dbReady);
    const errors = collectErrors(page);

    // Watch LCP from the very first paint.
    await page.addInitScript(() => {
      const w = window as unknown as { __lcp: number };
      w.__lcp = 0;
      try {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const last = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
          w.__lcp = last ? last.startTime : 0;
        }).observe({ type: "largest-contentful-paint", buffered: true });
      } catch {
        /* older engines without LCP support */
      }
    });

    const started = Date.now();
    await page.goto(route, { waitUntil: "load" });

    // Give LCP a moment to land before sampling.
    try {
      await page.waitForFunction(() => (window as unknown as { __lcp: number }).__lcp > 0, undefined, {
        timeout: 8_000,
      });
    } catch {
      /* LCP never fired — will surface via the sampled value below */
    }

    const metrics = await page.evaluate(() => {
      const n = performance.getEntriesByType("navigation")[0] as
        | PerformanceNavigationTiming
        | undefined;
      const lcp = (window as unknown as { __lcp: number }).__lcp;
      const paint = performance.getEntriesByType("paint");
      const firstPaint =
        (paint.find((p) => p.name === "first-contentful-paint") as
          | PerformanceEntry
          | undefined)?.startTime ?? 0;
      return {
        lcp: Math.round(lcp),
        fcp: Math.round(firstPaint),
        dcl: n ? Math.round(n.domContentLoadedEventEnd) : 0,
        load: n ? Math.round(n.loadEventEnd) : 0,
        ttfb: n ? Math.round(n.responseStart) : 0,
      };
    });
    const wall = Date.now() - started;

    const label = `${route} (${STRICT ? "strict" : "dev"} budgets): ${JSON.stringify({ ...metrics, wall })}`;
    expect(metrics.lcp, `LCP ${label}`).toBeLessThan(BUDGETS.lcpMs);
    expect(metrics.dcl, `DOMContentLoaded ${label}`).toBeLessThan(BUDGETS.dclMs);
    expect(metrics.load, `Load ${label}`).toBeLessThan(BUDGETS.loadMs);
    expect(metrics.ttfb, `TTFB ${label}`).toBeLessThan(6_000);
    expect(wall, `Wall ${label}`).toBeLessThan(BUDGETS.loadMs + 8_000);

    assertNoUnexpectedErrors(errors);
  });
}

test("hero image on the homepage actually loads", async ({ page, dbReady }) => {
  skipWithoutDb(dbReady);
  await page.goto("/");
  const heroImg = page.locator("main img").first();
  await expect(heroImg).toBeVisible();
  await heroImg.evaluate((img) => {
    const el = img as HTMLImageElement;
    return el.complete && el.naturalWidth > 0;
  });
  expect(await heroImg.evaluate((img) => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
});
