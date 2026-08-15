import { expect } from "./fixtures";
import { test, skipWithoutDb, collectErrors, assertNoUnexpectedErrors } from "./fixtures";
import type { Page } from "@playwright/test";

/**
 * Site shell: branding, primary navigation, the hero CTA's branch modal, the
 * footer, and 404 handling. These are the page furniture that must never
 * break on any deployment.
 */

/**
 * On mobile the primary nav lives behind the hamburger ("Menu") button; on
 * desktop that button is hidden. Open the menu when present so the same
 * assertions work on both viewports.
 */
async function openMobileMenu(page: Page) {
  const menu = page.getByRole("button", { name: "Menu" });
  if (await menu.isVisible()) {
    await menu.click();
    // Wait for the slide/fade transition to finish so links are interactive.
    await expect(page.getByRole("button", { name: "Menu" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
  }
}

test("404 page renders a helpful message for unknown routes", async ({ request, page }) => {
  const res = await request.get("/definitely-not-a-real-page");
  expect(res.status()).toBe(404);

  const errors = collectErrors(page);
  await page.goto("/definitely-not-a-real-page");
  await expect(page.locator("body")).toContainText(/404|not found|not be found/i);
  assertNoUnexpectedErrors(errors);
});

test("brand, primary nav and footer render", async ({ page, dbReady }) => {
  skipWithoutDb(dbReady);
  const errors = collectErrors(page);
  await page.goto("/");

  // Brand
  await expect(page.locator("header, nav").first()).toContainText("Gomodi Guest Lodge");

  // Primary nav links (mobile: opens the hamburger menu first)
  await openMobileMenu(page);
  for (const label of ["Rooms", "Events", "Corporate"]) {
    const link = page
      .locator("nav a", { hasText: label })
      .filter({ visible: true })
      .first();
    await expect(link).toBeVisible();
  }

  // Footer brand + navigation
  await page.locator("footer").scrollIntoViewIfNeeded();
  await expect(page.locator("footer")).toContainText("Gomodi Guest Lodge");
  for (const href of ["/rooms", "/book", "/events", "/corporate"]) {
    await expect(page.locator(`footer a[href="${href}"]`).first()).toBeVisible();
  }

  assertNoUnexpectedErrors(errors);
});

test("nav links navigate to their pages", async ({ page, dbReady }) => {
  skipWithoutDb(dbReady);
  await page.goto("/");

  const routes: Array<[label: string, path: string]> = [
    ["Rooms", "/rooms"],
    ["Events", "/events"],
    ["Corporate", "/corporate"],
  ];
  for (const [, path] of routes) {
    // Mobile keeps the primary links behind the hamburger — open it per route.
    await openMobileMenu(page);
    await page
      .locator(`nav a[href="${path}"]`)
      .filter({ visible: true })
      .first()
      .click();
    await expect(page).toHaveURL(new RegExp(`${path.replace("/", "\\/")}`));
    await expect(page.locator("body")).not.toContainText("Internal Server Error");
    await page.goto("/");
  }
});

test("hero 'Book Now' opens the branch modal and routes to the right form", async ({
  page,
  dbReady,
}) => {
  skipWithoutDb(dbReady);
  await page.goto("/");

  // Hero CTA
  await page.getByRole("button", { name: "Book Now" }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("How are you visiting?");

  // Three entry paths offered
  await expect(dialog.getByRole("button", { name: /Request a Stay/ })).toBeVisible();
  await expect(dialog.getByRole("button", { name: /Request a Quote/ })).toBeVisible();
  await expect(dialog.getByRole("button", { name: /Inquire About Your Event/ })).toBeVisible();

  // Leisure → booking wizard
  await dialog.getByRole("button", { name: /Request a Stay/ }).click();
  await expect(page).toHaveURL(/\/book$/);
  await expect(page.locator("h1")).toContainText(/Book your stay/i);

  // Modal also works from an in-page CTA, and closes via the close button
  await page.goto("/");
  await page.getByRole("button", { name: "Book Now" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Close" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("homepage hero and primary CTA targets are present", async ({ page, dbReady }) => {
  skipWithoutDb(dbReady);
  await page.goto("/");
  await expect(page.locator("h1").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Book Now" }).first()).toBeVisible();
  // Only the visible rooms link counts (mobile nav link is hidden behind the menu).
  await expect(
    page.locator(`a[href="/rooms"]`).filter({ visible: true }).first()
  ).toBeVisible();
});
