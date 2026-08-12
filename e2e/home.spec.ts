import { expect } from "./fixtures";
import { test, skipWithoutDb, collectErrors, assertNoUnexpectedErrors } from "./fixtures";

/**
 * Homepage structure: every named section must exist and be reachable by
 * scrolling, and the reviews strip must render (with real or empty content).
 */
const HOME_SECTION_IDS = [
  "stay",
  "rooms",
  "reviews",
  "dining",
  "events",
  "corporate",
  "explore",
  "payment",
  "contact",
];

test("all homepage sections exist and are reachable by scroll", async ({ page, dbReady }) => {
  skipWithoutDb(dbReady);
  const errors = collectErrors(page);
  await page.goto("/");

  for (const id of HOME_SECTION_IDS) {
    const section = page.locator(`[id="${id}"]`).first();
    await expect(section).toBeAttached();
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeVisible();
  }

  // Known anchor ids must not be duplicated
  for (const id of HOME_SECTION_IDS) {
    expect(await page.locator(`[id="${id}"]`).count()).toBe(1);
  }

  assertNoUnexpectedErrors(errors);
});

test("reviews strip renders on the homepage", async ({ page, dbReady }) => {
  skipWithoutDb(dbReady);
  await page.goto("/");
  const section = page.locator('[id="reviews"]');
  await section.scrollIntoViewIfNeeded();
  // Either real guest reviews or the honest empty state — never a crash.
  await expect(section).toContainText(/what guests say|review|stay/i);
});

test("rooms preview section lists rooms from the backend", async ({ page, dbReady }) => {
  skipWithoutDb(dbReady);
  await page.goto("/");
  const section = page.locator('[id="rooms"]');
  await section.scrollIntoViewIfNeeded();
  // Room cards render real seeded room names (Room 1, Room 2, …).
  await expect(section.locator("text=/Room \\d+/").first()).toBeVisible();
});
