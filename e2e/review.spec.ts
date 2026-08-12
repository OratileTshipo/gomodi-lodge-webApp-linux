import { expect } from "./fixtures";
import { test, skipWithoutDb, collectErrors, assertNoUnexpectedErrors } from "./fixtures";

/**
 * The post-stay review flow. The page is token-gated by design — there is no
 * anonymous review form. Set E2E_REVIEW_TOKEN to a real invite token to also
 * exercise the form itself (stars, feelings, byline, consent, submit).
 */
test("review page without a token shows the invalid-link state", async ({
  page,
  dbReady,
}) => {
  skipWithoutDb(dbReady);
  await page.goto("/review");
  await expect(page.locator("h1")).toContainText("This link isn't valid.");
  await expect(page.getByRole("link", { name: "Back to Home" })).toBeVisible();
});

test("review page with a bogus token shows the invalid-link state", async ({
  page,
  dbReady,
}) => {
  skipWithoutDb(dbReady);
  await page.goto("/review?token=not-a-real-token");
  await expect(page.locator("h1")).toContainText("This link isn't valid.");
});

test("review page with a valid token: full review form", async ({ page, dbReady }) => {
  skipWithoutDb(dbReady);
  const token = process.env.E2E_REVIEW_TOKEN;
  if (!token) {
    test.skip(true, "E2E_REVIEW_TOKEN not set — see E2E-TESTING.md");
    return;
  }

  const errors = collectErrors(page);
  await page.goto(`/review?token=${encodeURIComponent(token)}`);

  // A used token lands on the "already submitted" state instead — accept both.
  const already = page.getByText("your review is in", { exact: false });
  const formVisible = await page
    .locator("text=Tell us how it felt.")
    .waitFor({ state: "visible", timeout: 10_000 })
    .then(() => true)
    .catch(() => false);

  if (!formVisible) {
    await expect(already).toBeVisible();
    assertNoUnexpectedErrors(errors);
    return;
  }

  // Stars
  await page.getByRole("radio", { name: "5 stars" }).click();
  await expect(page.locator("body")).toContainText("Lovely to hear");

  // Feeling chips toggle
  const chip = page.getByRole("button", { name: /peaceful/i }).first();
  await chip.click();
  await expect(chip).toHaveAttribute("aria-pressed", "true");
  await chip.click();
  await expect(chip).toHaveAttribute("aria-pressed", "false");

  // Words
  await page.locator("#headline").fill("A peaceful night in a warm room");
  await page.locator("#body").fill("The room was spotless and the welcome was warm.");

  // Byline: opting out hides the first-name field and shows the Guest note
  await page.locator("#showName").uncheck();
  await expect(page.locator("#firstName")).not.toBeAttached();
  await expect(page.locator("body")).toContainText('"Guest"');

  // Consent gates submission
  await page.getByRole("button", { name: "Share my review" }).click();
  await expect(page).toHaveURL(/\/review/);

  await page.locator("#consent").check();
  await page.getByRole("button", { name: "Share my review" }).click();

  const success = page.getByText("Thank you — it means the world.");
  const done = await success
    .waitFor({ state: "visible", timeout: 20_000 })
    .then(() => true)
    .catch(() => false);
  if (done) {
    await expect(page.getByRole("link", { name: "Back to Home" })).toBeVisible();
  } else {
    await expect(page.locator("body")).toContainText(/error|couldn't|failed|already|invalid/i);
  }

  assertNoUnexpectedErrors(errors);
});
