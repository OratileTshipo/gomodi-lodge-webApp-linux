import { expect } from "./fixtures";
import { test, skipWithoutDb } from "./fixtures";

/**
 * Link crawl: every internal link reachable from the main routes must resolve
 * without a server error. 404s are reported as warnings (some routes are
 * legitimately token-gated); 5xx responses fail the run.
 */
test("every internal link on the main routes resolves without 5xx", async ({
  page,
  request,
  dbReady,
}) => {
  skipWithoutDb(dbReady);

  const roots = ["/", "/rooms", "/book", "/events", "/corporate", "/admin"];
  const seen = new Set<string>();
  const warnings: string[] = [];

  for (const route of roots) {
    await page.goto(route);
    const hrefs = await page.locator("a[href]").evaluateAll((as) =>
      as.map((a) => (a as HTMLAnchorElement).getAttribute("href") || "")
    );

    for (const href of hrefs) {
      if (!href || href.startsWith("#") || href.startsWith("//")) continue;
      if (/^(mailto:|tel:|whatsapp:|http)/.test(href)) continue;
      if (href.startsWith("/api")) continue;

      const clean = href.split(/[?#]/)[0];
      if (!clean || seen.has(clean)) continue;
      seen.add(clean);

      const res = await request.get(clean, { maxRedirects: 5 });
      if (res.status() >= 500) {
        expect(res.status(), `Internal link ${clean} (from ${route}) returned ${res.status()}`).toBeLessThan(500);
      } else if (res.status() === 404) {
        warnings.push(`${clean} (from ${route})`);
      }
    }
  }

  expect(seen.size).toBeGreaterThan(0);
  if (warnings.length > 0) {
    console.warn(`Links returning 404 (possible dead links):\n${warnings.join("\n")}`);
  }
});
