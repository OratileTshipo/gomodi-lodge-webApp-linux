import { defineConfig, devices } from "@playwright/test";

/**
 * E2E configuration for the Gomodi Guest Lodge site.
 *
 * Server behaviour:
 *  - Default: Playwright starts `npm run dev` (fast local iteration). The
 *    development OTP is exposed in dev mode, so the full admin login flow runs.
 *  - E2E_SERVER=prod → Playwright starts `npm run start` (expects `npm run build`
 *    to have been run first). Used by CI and for realistic performance budgets.
 *  - E2E_NO_WEBSERVER=1 → no server is started; point E2E_BASE_URL at a server
 *    you already have running (e.g. the Freebuff preview).
 *
 * DB-gating: specs that touch the backend skip themselves when /api/ping does
 * not report a healthy database, so the suite degrades gracefully in
 * DB-less environments. Run the full suite against a Postgres with
 * `npm run db:push && npm run db:seed` (see E2E-TESTING.md).
 */
const PORT = Number(process.env.E2E_PORT || 3000);
const BASE_URL = process.env.E2E_BASE_URL || `http://localhost:${PORT}`;

const webServer =
  process.env.E2E_NO_WEBSERVER === "1"
    ? undefined
    : {
        command:
          process.env.E2E_SERVER === "prod" ? "npm run start" : "npm run dev",
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 180_000,
      };

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 90_000,
  expect: { timeout: 12_000 },
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
  outputDir: "test-results",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "mobile",
      // Chromium-based mobile device so only one browser needs installing.
      use: { ...devices["Pixel 5"] },
      // Performance budgets are measured on the desktop viewport only.
      testIgnore: /perf\.spec\.ts/,
    },
  ],
  webServer,
});
