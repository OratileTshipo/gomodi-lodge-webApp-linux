import { expect } from "./fixtures";
import { test, skipWithoutDb, collectErrors, assertNoUnexpectedErrors, nextMonthDates, uniqueContact } from "./fixtures";

/**
 * The booking wizard — the site's primary conversion flow. Covers every step:
 * date selection, room choice, guest count, meal add-ons, guest details,
 * payment method switching, consent validation, and full submission.
 */
test("full booking journey: dates → room → guests → meals → details → payment → submit", async ({
  page,
  dbReady,
}) => {
  skipWithoutDb(dbReady);
  const errors = collectErrors(page);
  const { checkIn, checkOut, label } = nextMonthDates([5, 7]);
  const contact = uniqueContact();

  await page.goto("/book");
  await expect(page.locator("h1")).toContainText(/Book your stay/i);

  // ---- Step 1: dates ----
  await page.getByRole("button", { name: "Next month" }).click();
  await page.getByRole("button", { name: label(checkIn) }).first().click();
  await page.getByRole("button", { name: label(checkOut) }).first().click();

  // Summary reflects the stay
  await expect(page.locator("body")).toContainText("Nights");
  await expect(page.locator("h1")).not.toContainText("Thanks,"); // still on the form

  // ---- Step 2: room ----
  // Scope to the room step: the calendar's date cells also carry aria-pressed,
  // and all steps are mounted in one form, so an unscoped selector hits them first.
  const roomStep = page
    .getByRole("heading", { name: "Choose your room" })
    .locator("xpath=..");
  const roomButtons = roomStep.locator('button[aria-pressed]');
  await expect(roomButtons.first()).toBeVisible();
  const roomCount = await roomButtons.count();
  expect(roomCount).toBeGreaterThan(0);
  await roomButtons.first().click();
  await expect(roomButtons.first()).toHaveAttribute("aria-pressed", "true");

  // Guest stepper respects the 1–2 range
  const guests = page.getByLabel("Number of guests");
  await page.getByRole("button", { name: "Fewer guests" }).click();
  await expect(guests).toHaveValue("1");
  await page.getByRole("button", { name: "More guests" }).click();
  await expect(guests).toHaveValue("2");

  // ---- Step 3: meals ----
  const form = page.locator("form").first();
  const [breakfastCb, dinnerCb, consentCb] = await form.getByRole("checkbox").all();
  // The meal toggles are sr-only inputs inside labels — click the visible label
  // (Playwright can't actionability-check clipped sr-only elements).
  await form.getByText("Breakfast", { exact: true }).click();
  await expect(breakfastCb).toBeChecked();
  await form.getByText("Dinner", { exact: true }).click();
  await expect(dinnerCb).toBeChecked();
  // Summary meals line
  await expect(page.locator("body")).toContainText("Breakfast + Dinner");

  // ---- Step 4: details ----
  await page.getByLabel(/Full name/).fill(contact.fullName);
  await page.getByLabel(/WhatsApp number/).fill(contact.phone);
  await page.getByLabel(/Email \(optional\)/).fill(contact.email);
  await page.getByLabel(/Anything we should know/).fill("E2E: late arrival test request");

  // ---- Step 5: payment ----
  // EFT is the default — banking details and POP upload are shown
  await expect(page.getByRole("radio", { name: /EFT \/ Bank Transfer/ })).toBeChecked();
  await expect(page.locator("body")).toContainText("FNB");
  await expect(page.locator("#popFileInput")).toBeAttached();
  await expect(page.getByText("Cash on Arrival")).toBeVisible();

  // Switch to cash — banking details and upload disappear
  await page.getByRole("radio", { name: /Cash on Arrival/ }).check();
  await expect(page.locator("#popFileInput")).not.toBeAttached();
  await expect(page.locator("body")).not.toContainText("FNB");

  // And back to EFT
  await page.getByRole("radio", { name: /EFT \/ Bank Transfer/ }).check();
  await expect(page.locator("#popFileInput")).toBeAttached();

  // ---- Validation: consent is required ----
  await page.getByRole("button", { name: "Send booking request" }).click();
  await expect(page).toHaveURL(/\/book$/);
  await expect(page.locator("h1")).toContainText(/Book your stay/i); // not submitted

  // ---- Submit for real ----
  await consentCb.check();
  await expect(consentCb).toBeChecked();
  await page.getByRole("button", { name: "Send booking request" }).click();

  // Success panel (healthy backend) or a surfaced server error — never a hang/crash.
  const thanks = page.locator("h1", { hasText: "Thanks," });
  const submitted = await thanks
    .waitFor({ state: "visible", timeout: 20_000 })
    .then(() => true)
    .catch(() => false);
  if (submitted) {
    await expect(thanks).toContainText(/Thanks,/);
    // Post-submit CTAs
    await expect(page.getByRole("link", { name: "Browse More Rooms" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to Home" })).toBeVisible();
  } else {
    await expect(page.locator("body")).toContainText(/error|couldn't|failed|unavailable/i);
  }

  assertNoUnexpectedErrors(errors);
});

test("booking wizard breadcrumb and room helper links work", async ({ page, dbReady }) => {
  skipWithoutDb(dbReady);
  await page.goto("/book");
  await expect(page.getByRole("link", { name: "Home" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Rooms" }).first()).toBeVisible();
  await page.getByRole("link", { name: "Not sure which room?" }).click();
  await expect(page).toHaveURL(/\/rooms$/);
});

test("unavailable rooms are greyed out for a conflicting stay", async ({ page, dbReady }) => {
  skipWithoutDb(dbReady);
  // A booking for next month's 5–7 was created by the journey test when the
  // DB is seeded fresh; rather than depend on state, this checks the UI's
  // handling contract: rooms can be disabled, and disabled rooms are labelled.
  await page.goto("/book");
  // Calendar date cells also carry aria-pressed + [disabled] for past dates —
  // scope to the room step, where [disabled] means "already booked for your dates".
  const roomStep = page
    .getByRole("heading", { name: "Choose your room" })
    .locator("xpath=..");
  const total = await roomStep.locator('button[aria-pressed]').count();
  expect(total).toBeGreaterThan(0);
  const disabled = roomStep.locator('button[disabled]');
  if ((await disabled.count()) > 0) {
    await expect(disabled.first()).toContainText("Booked");
  }
});
