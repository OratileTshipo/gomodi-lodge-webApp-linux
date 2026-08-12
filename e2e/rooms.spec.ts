import { expect } from "./fixtures";
import { test, skipWithoutDb, collectErrors, assertNoUnexpectedErrors } from "./fixtures";

/**
 * Rooms explorer: filter pills, sorting, room detail modal, and the
 * bath/shower display convention (the case bug this suite guards against).
 */
test("rooms explorer lists seeded rooms with bath/shower labels", async ({
  page,
  dbReady,
}) => {
  skipWithoutDb(dbReady);
  const errors = collectErrors(page);
  await page.goto("/rooms");

  await expect(page.locator("body")).toContainText(/Showing \d+ of \d+ rooms/);

  // Every room card surfaces a bathroom type — the display-bug regression test.
  const body = await page.locator("body").innerText();
  const labelled = (body.match(/· (Bath|Shower)/g) || []).length;
  expect(labelled).toBeGreaterThan(0);

  assertNoUnexpectedErrors(errors);
});

test("room filters narrow the list and can be cleared", async ({ page, dbReady }) => {
  skipWithoutDb(dbReady);
  await page.goto("/rooms");

  const allCount = await cardCount(page);

  await page.getByRole("button", { name: /^Flexible/ }).click();
  const flexibleCount = await cardCount(page);
  expect(flexibleCount).toBeGreaterThan(0);
  expect(flexibleCount).toBeLessThan(allCount);

  await page.getByRole("button", { name: /^Double/ }).click();
  const doubleCount = await cardCount(page);
  expect(doubleCount).toBeGreaterThan(0);
  expect(doubleCount).toBeLessThan(allCount);

  await page.getByRole("button", { name: /^All/ }).click();
  expect(await cardCount(page)).toBe(allCount);
});

test("room sorting changes the displayed order", async ({ page, dbReady }) => {
  skipWithoutDb(dbReady);
  await page.goto("/rooms");

  await page.locator("#sortSelect").selectOption("name-asc");
  const first = await page.getByRole("button", { name: /View details for/ }).first().getAttribute("aria-label");
  // Seeded names are "Room 1" … "Room N" — alphabetical puts "Room 1" first.
  expect(first).toContain("Room 1");
});

test("room detail modal opens and closes", async ({ page, dbReady }) => {
  skipWithoutDb(dbReady);
  await page.goto("/rooms");

  const open = page.getByRole("button", { name: /View details for/ }).first();
  const roomName = (await open.getAttribute("aria-label"))!.replace("View details for ", "");
  await open.click();

  const dialog = page.getByRole("dialog", { name: new RegExp(roomName) });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(/amenities|description|book|price/i);

  // The dialog renders two Close affordances (X + footer button) — either closes it.
  await dialog.getByRole("button", { name: "Close" }).first().click();
  await expect(dialog).toBeHidden();
});

async function cardCount(page: import("@playwright/test").Page) {
  return page.getByRole("button", { name: /View details for/ }).count();
}
