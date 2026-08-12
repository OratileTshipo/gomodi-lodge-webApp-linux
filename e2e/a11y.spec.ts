import { expect } from "./fixtures";
import { test, skipWithoutDb, collectErrors, assertNoUnexpectedErrors } from "./fixtures";

/**
 * Accessibility smoke checks that don't need an axe dependency:
 * single h1, images with alt, named buttons, labelled inputs, unique ids.
 * Runs on the desktop project for every public route plus the admin login.
 */
const ROUTES = ["/", "/rooms", "/book", "/events", "/corporate", "/admin"];

for (const route of ROUTES) {
  test(`a11y basics: ${route}`, async ({ page, dbReady }) => {
    skipWithoutDb(dbReady);
    const errors = collectErrors(page);
    await page.goto(route);

    // Exactly one h1 (the admin login renders a mobile + desktop variant).
    const h1Count = await page.locator("h1").count();
    expect(h1Count, `expected one h1 on ${route}, found ${h1Count}`).toBeGreaterThanOrEqual(1);
    expect(h1Count, `more than one h1 on ${route}`).toBeLessThanOrEqual(2);

    // Every <img> must carry an alt attribute (empty alt for decorative is fine).
    const missingAlt = await page.locator("img").evaluateAll((imgs) =>
      imgs
        .filter((i) => !(i as HTMLImageElement).hasAttribute("alt"))
        .map((i) => (i as HTMLImageElement).src)
    );
    expect(missingAlt, `images missing alt on ${route}: ${missingAlt.join(", ")}`).toEqual([]);

    // Every visible <button> needs an accessible name.
    const unnamedButtons = await page.locator("button").evaluateAll((btns) =>
      btns
        .filter((b) => {
          const el = b as HTMLButtonElement;
          if (el.closest("[aria-hidden='true']")) return false;
          const name =
            el.getAttribute("aria-label") ||
            el.getAttribute("title") ||
            el.textContent?.trim() ||
            el.getAttribute("aria-labelledby");
          return !name;
        })
        .map((b) => (b as HTMLButtonElement).outerHTML.slice(0, 120))
    );
    expect(unnamedButtons, `buttons without accessible names on ${route}`).toEqual([]);

    // Every input/select/textarea needs a label or aria-label.
    const unlabelledInputs = await page
      .locator("input, select, textarea")
      .evaluateAll((els) =>
        els.filter((el) => {
          const e = el as HTMLElement & { id?: string };
          if (e.getAttribute("aria-label") || e.getAttribute("aria-labelledby")) return false;
          if (e.id && document.querySelector(`label[for="${e.id}"]`)) return false;
          return !e.closest("label");
        }).length
      );
    expect(unlabelledInputs, `inputs without labels on ${route}`).toBe(0);

    // No duplicated element ids (breaks label[for], anchors, and scripts).
    const duplicateIds = await page.evaluate(() => {
      const seen = new Set<string>();
      const dup: string[] = [];
      for (const el of document.querySelectorAll("[id]")) {
        if (seen.has(el.id)) dup.push(el.id);
        seen.add(el.id);
      }
      return dup;
    });
    expect(duplicateIds, `duplicate ids on ${route}: ${duplicateIds.join(", ")}`).toEqual([]);

    assertNoUnexpectedErrors(errors);
  });
}
