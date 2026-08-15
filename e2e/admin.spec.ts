import { expect } from "./fixtures";
import { test, skipWithoutDb, collectErrors, assertNoUnexpectedErrors } from "./fixtures";

/**
 * Admin: OTP login (dev OTP is exposed in non-production servers; in
 * production the flow is WhatsApp-delivered and the assertion set degrades
 * gracefully), the role-scoped dashboard, queue pages, and logout.
 */
test("admin dashboard redirects to the login page when unauthenticated", async ({
  page,
  dbReady,
}) => {
  skipWithoutDb(dbReady);
  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.locator("body")).toContainText(/Sign in to admin/);
});

test("admin OTP login reaches the dashboard; queue pages and logout work", async ({
  page,
  dbReady,
}) => {
  skipWithoutDb(dbReady);
  const errors = collectErrors(page);

  await page.goto("/admin");
  // The login screen intentionally renders a mobile (brand) + desktop h1 variant —
  // target the sign-in heading by name, not position.
  await expect(page.getByRole("heading", { name: /Sign in to admin/ })).toBeVisible();
  await expect(page.locator("body")).toContainText("Test credentials");

  // Step 1 — request the OTP
  await page.getByLabel("Phone Number").fill("+27820000001");
  await page.getByRole("button", { name: "Request OTP" }).click();

  // Development servers expose the OTP on screen; production delivers via WhatsApp.
  const devBox = page.getByText("Development Mode");
  const devVisible = await devBox
    .waitFor({ state: "visible", timeout: 15_000 })
    .then(() => true)
    .catch(() => false);

  if (!devVisible) {
    test.skip(true, "Production server does not expose the dev OTP — skipping login assertions (see E2E-TESTING.md)");
    return;
  }  // Step 2 — read the OTP from the dev panel and verify
  const devPanel = page.locator("div").filter({ hasText: "Development Mode" }).last();
  const panelText = await devPanel.innerText();
  const otpMatch = panelText.match(/\b\d{6}\b/);
  expect(otpMatch, `no 6-digit OTP in dev panel: ${panelText}`).toBeTruthy();
  const otp = otpMatch![0];
  await page.getByLabel("Enter OTP").fill(otp);
  await page.getByRole("button", { name: "Verify & Login" }).click();

  await expect(page).toHaveURL(/\/admin\/dashboard$/);
  await expect(page.locator("h1")).toContainText(/Dashboard/);
  await expect(page.locator("body")).toContainText("Owner · owner");
  await expect(page.getByRole("button", { name: "Clock In" })).toBeVisible();

  // Queue pages render without crashing
  await page.getByRole("button", { name: "Reviews" }).click();
  await expect(page).toHaveURL(/\/admin\/reviews$/);
  await expect(page.locator("body")).not.toContainText("Internal Server Error");

  await page.goto("/admin/quotes");
  await expect(page).toHaveURL(/\/admin\/quotes$/);
  await expect(page.locator("body")).not.toContainText("Internal Server Error");

  // Logout returns to the login page
  await page.goto("/admin/dashboard");
  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.locator("body")).toContainText(/Sign in to admin/);

  assertNoUnexpectedErrors(errors);
});

test("admin request OTP rejects unregistered numbers without leaking state", async ({
  request,
  dbReady,
}) => {
  skipWithoutDb(dbReady);
  const res = await request.post("/api/auth/request-otp", {
    data: { phone: "+27821111111" }, // not a seeded staff number
  });
  expect(res.status()).toBe(200);
  const body = (await res.json()) as { success?: boolean; message?: string };
  expect(body.success).toBe(true);
  expect(body.message).toContain("If this number is registered");
});
