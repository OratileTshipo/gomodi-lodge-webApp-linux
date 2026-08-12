/* Comprehensive E2E + performance verification for the Gomodi demo.
 * Runs headless Chromium against the dev server and reports:
 *  - header/hero overlap (the fix)
 *  - horizontal overflow on desktop + mobile
 *  - console & page errors
 *  - resource weights (JS/CSS) and load timing
 *  - interactive flows: branch modal, mobile menu, room filters/detail,
 *    full booking submit, admin OTP login + approve
 */
import { chromium } from "playwright-core";

const BASE = "http://localhost:3100";
const CHROME = `${process.env.HOME}/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome`;

const report: Record<string, any> = { pages: [], flows: [] };
let failures = 0;

function check(name: string, cond: boolean, detail = "") {
  report.flows.push({ name, pass: cond, detail });
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!cond) failures++;
}

async function measurePage(
  page: any,
  path: string,
  viewport: string,
  hasHeader = true
) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const badResponses: string[] = [];
  const onResp = (r: any) => {
    if (r.status() >= 400) badResponses.push(`${r.status()} ${new URL(r.url()).pathname.slice(0, 80)}`);
  };
  const onConsole = (m: any) => {
    if (m.type() === "error") consoleErrors.push(m.text().slice(0, 200));
  };
  const onError = (e: any) => pageErrors.push(String(e).slice(0, 200));
  page.on("response", onResp);
  page.on("console", onConsole);
  page.on("pageerror", onError);

  const t0 = Date.now();
  const resp = await page.goto(BASE + path, { waitUntil: "load", timeout: 30000 });
  await page.waitForTimeout(1200); // let hydration/observer settle
  const loadMs = Date.now() - t0;

  const metrics = await page.evaluate(() => {
    const header = document.querySelector("header");
    const main = document.querySelector("main");
    const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
    const mainTop = main ? main.getBoundingClientRect().top : 0;
    const html = document.documentElement;
    const res = performance
      .getEntriesByType("resource")
      .map((r: any) => ({ n: r.name, t: r.transferSize || 0, init: r.initiatorType }))
      .filter((r: any) => /\.(js|css)(\?|$)/.test(r.n));
    let js = 0, css = 0;
    for (const r of res) {
      if (/\.js(\?|$)/.test(r.n)) js += r.t;
      else css += r.t;
    }
    const nav: any = performance.getEntriesByType("navigation")[0];
    return {
      headerBottom,
      mainTop,
      hOverflow: html.scrollWidth > window.innerWidth + 1,
      scrollWidth: html.scrollWidth,
      innerWidth: window.innerWidth,
      jsKB: Math.round(js / 1024),
      cssKB: Math.round(css / 1024),
      totalKB: Math.round((js + css) / 1024),
      domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd) : 0,
      bodyText: (document.body.innerText || "").slice(0, 300),
    };
  });

  const entry: any = {
    path, viewport,
    status: resp ? resp.status() : null,
    loadMs,
    consoleErrors,
    pageErrors,
    badResponses,
    hOverflow: metrics.hOverflow,
    headerBottom: Math.round(metrics.headerBottom),
    mainTop: Math.round(metrics.mainTop),
    jsKB: metrics.jsKB,
    cssKB: metrics.cssKB,
    totalKB: metrics.totalKB,
    domContentLoadedMs: metrics.domContentLoaded,
  };

  // The public site wraps content so <main> sits exactly below the fixed header.
  // Admin pages intentionally render their own layout without <main>.
  if (hasHeader && metrics.mainTop > 0) {
    const overlap = metrics.headerBottom > metrics.mainTop + 1;
    entry.heroOverlap = overlap;
    check(`${path} [${viewport}] hero starts below header (no overlap)`, !overlap,
      `header.bottom=${Math.round(metrics.headerBottom)}px main.top=${Math.round(metrics.mainTop)}px`);
  }
  check(`${path} [${viewport}] no horizontal overflow`, !metrics.hOverflow,
    `scrollWidth=${metrics.scrollWidth} innerWidth=${metrics.innerWidth}`);
  check(`${path} [${viewport}] HTTP 200`, entry.status === 200, `status=${entry.status}`);
  check(`${path} [${viewport}] zero 4xx/5xx resources`, entry.badResponses.length === 0,
    entry.badResponses.join(" | ").slice(0, 300));
  check(`${path} [${viewport}] zero console errors`, entry.consoleErrors.length === 0,
    entry.consoleErrors.join(" | ").slice(0, 300));
  check(`${path} [${viewport}] zero page errors`, entry.pageErrors.length === 0,
    entry.pageErrors.join(" | ").slice(0, 300));

  await page.screenshot({
    path: `/tmp/gomodi-shots/${viewport.replace("/", "-")}-${path.replace(/\//g, "_") || "home"}.png`,
    fullPage: true,
  });
  page.removeListener("response", onResp);
  page.removeListener("console", onConsole);
  page.removeListener("pageerror", onError);
  report.pages.push(entry);
}

async function main() {
  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"],
  });

  // ---------------- DESKTOP ----------------
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const dpage = await desktop.newPage();

  for (const p of ["/", "/rooms", "/book", "/corporate", "/events", "/admin"]) {
    await measurePage(dpage, p, "desktop");
  }

  // Branch modal on desktop
  await dpage.goto(BASE + "/", { waitUntil: "load" });
  await dpage.waitForTimeout(800);
  await dpage.getByRole("button", { name: "Book Now" }).first().click();
  await dpage.waitForTimeout(500);
  const branchHeading = await dpage.evaluate(() => {
    const els = [...document.querySelectorAll("h2,h3")].map((e) => e.textContent || "");
    return els.find((t) => /how are you visiting|what brings you/i.test(t)) || "";
  });
  check("Home: 'Book Now' opens the branch chooser modal", branchHeading.length > 0, branchHeading);
  // close the modal before moving on
  await dpage.keyboard.press("Escape");
  await dpage.waitForTimeout(400);

  // Rooms interactions
  await dpage.goto(BASE + "/rooms", { waitUntil: "load" });
  await dpage.waitForTimeout(800);
  const roomCards = await dpage.locator("article.room-card").count();
  check("Rooms: 9 room cards render", roomCards === 9, `count=${roomCards}`);
  await dpage.getByRole("button", { name: /Double Rooms/i }).click();
  await dpage.waitForTimeout(300);
  const doubleCards = await dpage.locator("article.room-card").count();
  check("Rooms: 'Double Rooms' filter narrows the grid", doubleCards < 9, `count=${doubleCards}`);
  await dpage.getByRole("button", { name: /All Rooms/i }).click();
  await dpage.waitForTimeout(300);
  await dpage.getByRole("button", { name: "View details" }).first().click();
  await dpage.waitForTimeout(400);
  const modalVisible = await dpage.getByRole("dialog").count();
  check("Rooms: detail modal opens", modalVisible === 1);
  await dpage.getByRole("button", { name: "Close", exact: true }).last().click();
  await dpage.waitForTimeout(300);

  // Full booking flow (leisure) — proves the complete public journey
  await dpage.goto(BASE + "/book", { waitUntil: "load" });
  await dpage.waitForTimeout(800);
  // pick dates: click day 10 then day 12 in the current-month calendar
  const picked = await dpage.evaluate(() => {
    const grid = [...document.querySelectorAll("div.grid")].find(
      (g) => g.className.includes("grid-cols-7") && [...g.children].some((c) => /^\d{1,2}$/.test((c.textContent || "").trim()))
    );
    if (!grid) return false;
    const days = [...grid.children].filter((c) => /^\d{1,2}$/.test((c.textContent || "").trim()));
    const today = new Date();
    const todayN = today.getDate();
    const target1 = todayN + 3 > 31 ? 8 : todayN + 3; // pick a safe future day
    const target2 = target1 + 2;
    const d1 = days.find((d) => d.textContent.trim() === String(target1));
    const d2 = days.find((d) => d.textContent.trim() === String(target2));
    if (!d1 || !d2) return false;
    (d1 as HTMLElement).click();
    setTimeout(() => (d2 as HTMLElement).click(), 50);
    return true;
  });
  check("Book: calendar dates can be picked", picked === true);
  // Wait for the availability fetch (getUnavailableRoomIds server action POST)
  // to settle and rooms to grey out before picking one, so we never click a
  // soon-to-be-booked room. The DB is remote, so this can take several seconds.
  await dpage
    .waitForResponse(
      (r: any) => r.request().method() === "POST" && new URL(r.url()).pathname === "/book" && r.status() === 200,
      { timeout: 20000 }
    )
    .catch(() => {});
  await dpage.waitForTimeout(800);

  // select a room — first card WITHOUT a "Booked" overlay, in the room step
  const roomClicked = await dpage.evaluate(() => {
    const heads = [...document.querySelectorAll("h2")];
    const h = heads.find((x) => (x.textContent || "").includes("Choose your room"));
    if (!h) return false;
    const section = h.closest("div.rounded-2xl");
    if (!section) return false;
    const cards = [...section.querySelectorAll("div[class*='cursor-pointer']")].filter(
      (c) => !(c.textContent || "").includes("Booked")
    );
    if (cards.length === 0) return false;
    (cards[0] as HTMLElement).click();
    return true;
  });
  check("Book: a room can be selected", roomClicked === true);
  await dpage.waitForTimeout(1000);
  const roomSet = await dpage.evaluate(() => {
    const aside = document.querySelector("aside");
    return aside ? /Room\s{1,2}\S/.test(aside.textContent || "") : false;
  });
  check("Book: room confirmed in summary sidebar", roomSet);

  // fill details
  const details = dpage.locator("div.rounded-2xl", { hasText: "Your details" });
  const inputs = details.locator("input");
  await inputs.nth(0).fill("E2E Browser Test " + Date.now().toString().slice(-4));
  await inputs.nth(1).fill("0829999001");
  await inputs.nth(2).fill("e2e-browser@example.com");
  // consent checkbox
  const consentBox = dpage.locator("div.rounded-2xl", { hasText: "POPIA" }).locator('input[type="checkbox"]');
  await consentBox.check();
  await dpage.getByRole("button", { name: "Send booking request" }).click();
  // First server-action call includes a cold Turbopack compile — poll patiently.
  // NOTE: the success badge is CSS-uppercased (REQUEST RECEIVED), so match case-insensitively.
  let success = false;
  for (let i = 0; i < 30; i++) {
    await dpage.waitForTimeout(500);
    success = await dpage.evaluate(() => /request received/i.test(document.body.innerText));
    if (success) break;
  }
  check("Book: submitting shows the success screen", success);

  // ---------------- ADMIN FLOW ----------------
  await dpage.goto(BASE + "/admin", { waitUntil: "load" });
  await dpage.waitForTimeout(800);
  await dpage.getByPlaceholder("+27...").fill("+27820000001");
  await dpage.getByRole("button", { name: "Request OTP" }).click();
  await dpage.waitForTimeout(1000);
  const otp = await dpage.evaluate(() => {
    const el = [...document.querySelectorAll("div")].find(
      (d) => /^\d{6}$/.test((d.textContent || "").trim()) && d.className.includes("text-4xl")
    );
    return el ? el.textContent!.trim() : "";
  });
  check("Admin: OTP is displayed on screen (dev mode)", /^\d{6}$/.test(otp), `otp=${otp}`);
  await dpage.getByPlaceholder("123456").fill(otp || "123456");
  await dpage.getByRole("button", { name: "Verify & Login" }).click();
  await dpage.waitForURL("**/admin/dashboard", { timeout: 20000 }).catch(() => {});
  // Dashboard shows a skeleton until /api/auth/me + requests resolve — poll
  let dashText = "";
  for (let i = 0; i < 40; i++) {
    await dpage.waitForTimeout(500);
    dashText = await dpage.evaluate(() => document.body.innerText || "");
    if (dashText.includes("Dashboard")) break;
  }
  check("Admin: dashboard loads after OTP login", /Dashboard/i.test(dashText));
  // The E2E guest name is unique per run (timestamp suffix) so this check is unambiguous
  const e2eGuest = await dpage.evaluate(() => {
    const m = document.body.innerText.match(/E2E Browser Test (\d{4})/);
    return m ? m[0] : "";
  });
  check("Admin: pending requests visible (incl. E2E Browser Test)", dashText.includes("E2E Browser Test") || e2eGuest.length > 0);
  // approve the E2E booking (full loop: site -> queue -> approved)
  const approved = await dpage.evaluate(() => {
    const cards = [...document.querySelectorAll("div.bg-white")];
    const card = cards.find((c) => /E2E Browser Test \d{4}/.test(c.textContent || ""));
    if (!card) return false;
    const btn = [...card.querySelectorAll("button")].find((b) => (b.textContent || "").trim() === "Approve");
    if (!btn) return false;
    (window as any).confirm = () => true;
    (btn as HTMLButtonElement).click();
    return true;
  });
  check("Admin: Approve button found & clicked for E2E booking", approved === true);
  let afterApprove = dashText;
  for (let i = 0; i < 20; i++) {
    await dpage.waitForTimeout(500);
    afterApprove = await dpage.evaluate(() => document.body.innerText || "");
    if (!/E2E Browser Test/.test(afterApprove)) break;
  }
  check("Admin: approved booking leaves the pending queue", !/E2E Browser Test/.test(afterApprove));

  // time clock
  const clockBtn = dpage.getByRole("button", { name: /Clock In|Clock Out|Logging/ });
  await clockBtn.first().click();
  await dpage.waitForTimeout(1200);
  const clockText = await dpage.evaluate(() => document.body.innerText);
  check("Admin: time clock logs an action", /Clocked (in|out)/i.test(clockText));

  await desktop.close();

  // ---------------- MOBILE ----------------
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  const mpage = await mobile.newPage();
  for (const p of ["/", "/rooms", "/book", "/corporate", "/events"]) {
    await measurePage(mpage, p, "mobile");
  }
  // hamburger menu
  await mpage.goto(BASE + "/", { waitUntil: "load" });
  await mpage.waitForTimeout(800);
  await mpage.getByRole("button", { name: "Menu" }).click();
  await mpage.waitForTimeout(500);
  const menuLinks = await mpage.locator("header a").allTextContents();
  check("Mobile: hamburger menu opens with nav links", menuLinks.some((t) => t.includes("Rooms")), menuLinks.join(","));
  // Close the hamburger menu first (its panel overlays the header button)
  await mpage.getByRole("button", { name: "Menu" }).click();
  await mpage.waitForTimeout(400);
  // Book Now modal on mobile (header button)
  await mpage.getByRole("button", { name: "Book Now" }).first().click();
  await mpage.waitForTimeout(500);
  const mobileModal = await mpage.evaluate(() => document.body.innerText);
  check("Mobile: Book Now opens branch modal", /Leisure|Corporate|Events/.test(mobileModal));
  await mobile.close();

  await browser.close();
  console.log("\n===== REPORT =====");
  console.log(JSON.stringify(report, null, 1));
  console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("SCRIPT ERROR:", e);
  process.exit(1);
});
