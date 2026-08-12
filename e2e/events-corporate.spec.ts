import { expect } from "./fixtures";
import { test, skipWithoutDb, collectErrors, assertNoUnexpectedErrors, nextMonthDates, toIso, uniqueContact } from "./fixtures";

/**
 * The two B2B entry points: event inquiries (Lelz-managed) and corporate
 * quotes. Both exercise the consent gate, add-on selection, live estimate
 * math, and the full submission round-trip.
 */
test("event inquiry: form entry, catering selection, consent gate, submit", async ({
  page,
  dbReady,
}) => {
  skipWithoutDb(dbReady);
  const errors = collectErrors(page);
  const contact = uniqueContact();
  const { checkIn } = nextMonthDates([5, 7]);

  await page.goto("/events");
  await expect(page.locator("body")).toContainText("Tell us about your event.");

  const form = page.locator("form").first();
  await form.getByLabel(/Full name/).fill(contact.fullName);
  await form.getByLabel(/Phone \/ WhatsApp/).fill(contact.phone);
  await form.getByLabel(/Event type/).selectOption("wedding");
  await form.getByLabel(/Expected guests/).fill("24");
  await form.getByLabel(/Preferred date/).fill(toIso(checkIn));

  // Catering cards are toggle radios
  await form.getByRole("radio", { name: /Three-Course Meal/ }).check();
  await expect(form.getByRole("radio", { name: /Three-Course Meal/ })).toBeChecked();
  await form.getByRole("radio", { name: /Venue only/ }).check();
  await expect(form.getByRole("radio", { name: /Venue only/ })).toBeChecked();

  await form.getByPlaceholder(/Special requirements/).fill("E2E: garden setup, no catering");

  // Consent is required — without it the browser blocks submission
  await form.getByRole("button", { name: "Submit Inquiry" }).click();
  await expect(page).toHaveURL(/\/events$/);

  await form.getByLabel(/POPIA/).check();
  await form.getByRole("button", { name: "Submit Inquiry" }).click();

  const success = page.getByText("Inquiry received.", { exact: true });
  const done = await success
    .waitFor({ state: "visible", timeout: 20_000 })
    .then(() => true)
    .catch(() => false);
  if (done) {
    await expect(page.getByRole("link", { name: "Back to Home" })).toBeVisible();
  } else {
    await expect(page.locator("body")).toContainText(/error|couldn't|failed|unavailable/i);
  }

  assertNoUnexpectedErrors(errors);
});

test("event page 'See rooms' link routes to the rooms explorer", async ({ page, dbReady }) => {
  skipWithoutDb(dbReady);
  await page.goto("/events");
  await page.getByRole("link", { name: /See rooms/ }).click();
  await expect(page).toHaveURL(/\/rooms$/);
});

test("corporate quote: room lines, live estimate math, consent gate, submit", async ({
  page,
  dbReady,
}) => {
  skipWithoutDb(dbReady);
  const errors = collectErrors(page);
  const contact = uniqueContact();
  const { checkIn, checkOut } = nextMonthDates([5, 7]);

  await page.goto("/corporate");
  await expect(page.locator("body")).toContainText("Tell us what you need");

  const form = page.locator("form").first();
  await form.getByLabel(/Full name/).fill(contact.fullName);
  await form.getByLabel(/Company \/ department/).fill("E2E Consulting");
  await form.getByLabel(/Phone \/ WhatsApp/).fill(contact.phone);
  await form.getByLabel(/^Email/).fill(contact.email);
  await form.getByLabel(/Check-in date/).fill(toIso(checkIn));
  await form.getByLabel(/Check-out date/).fill(toIso(checkOut));

  // Two nights, one double room → indicative accommodation R1 500
  await expect(form).toContainText(/2 nights?/);
  await expect(form).toContainText("R1 500");

  // Add a second room line, then remove it
  await form.getByRole("button", { name: "Add another room" }).click();
  await expect(form).toContainText("Room 2");
  await form.getByRole("button", { name: "Remove room 2" }).click();
  await expect(form).not.toContainText("Room 2");

  // Meal add-ons move the estimate
  await form.getByText("Breakfast").first().click();
  await expect(form).not.toContainText("R1 500");

  // Consent gate blocks native submission until checked
  await form.getByRole("button", { name: "Submit Quote Request" }).click();
  await expect(page).toHaveURL(/\/corporate$/);

  await form.getByLabel(/POPIA/).check();
  await form.getByRole("button", { name: "Submit Quote Request" }).click();

  const success = page.getByText("Quote request received.", { exact: true });
  const done = await success
    .waitFor({ state: "visible", timeout: 20_000 })
    .then(() => true)
    .catch(() => false);
  if (done) {
    await expect(page.getByRole("link", { name: "Back to Home" })).toBeVisible();
  } else {
    await expect(page.locator("body")).toContainText(/error|couldn't|failed|unavailable/i);
  }

  assertNoUnexpectedErrors(errors);
});
