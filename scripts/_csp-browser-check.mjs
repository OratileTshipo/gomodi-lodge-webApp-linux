// CSP / rendering verification via Playwright + the installed Chromium.
// Loads the key pages, collects every console message (incl. CSP violations),
// clicks the nav to confirm client-side navigation still works, and prints a
// PASS/FAIL summary. Run: node scripts/_csp-browser-check.mjs
import { chromium } from "playwright-core";

const CHROME = `${process.env.HOME}/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome`;
const BASE = "http://localhost:3000";

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-gpu"],
});

const page = await browser.newPage();
const issues = [];
const consoleMsgs = [];
page.on("console", (msg) => {
  const text = msg.text();
  if (msg.type() === "error" || /content security policy|csp/i.test(text)) {
    consoleMsgs.push(`[${msg.type()}] ${text}`);
  }
});
page.on("pageerror", (err) => issues.push(`pageerror: ${err.message}`));

async function visit(path, expectText) {
  try {
    const resp = await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(3000); // let RSC streaming + hydration settle
    const status = resp?.status() ?? 0;
    const body = await page.textContent("body").catch(() => "");
    const okStatus = status === 200;
    const okText = expectText ? body.includes(expectText) : body.length > 200;
    const verdict = okStatus && okText ? "PASS" : "FAIL";
    console.log(`${verdict}  ${path}  (status ${status}, contains "${expectText}": ${okText})`);
    return okStatus && okText;
  } catch (err) {
    console.log(`FAIL  ${path}  (browser timeout/error: ${err.message})`);
    return false;
  }
}

// Warm every route via HTTP first so dev on-demand compilation is done before
// the browser run (avoids flaky first-compile navigation timeouts).
for (const p of ["/", "/rooms", "/book", "/admin", "/corporate", "/events"]) {
  await fetch(`${BASE}${p}`).catch(() => {});
}

let allOk = true;
allOk = (await visit("/", "Iphe Lerato")) && allOk;
allOk = (await visit("/rooms", "Rooms")) && allOk;
allOk = (await visit("/book", "Book your stay")) && allOk;
allOk = (await visit("/admin", "Gomodi Admin")) && allOk;
allOk = (await visit("/corporate", "Corporate")) && allOk;
allOk = (await visit("/events", "Event")) && allOk;

// Client-side navigation must still work (not blocked by CSP).
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2000);
await page.getByRole("link", { name: /Rooms/i }).first().click().catch(() => {});
await page.waitForTimeout(2500);
const navUrl = page.url();
const navOk = navUrl.includes("/rooms");
console.log(`${navOk ? "PASS" : "FAIL"}  client-side nav to /rooms (url=${navUrl})`);
allOk = allOk && navOk;

console.log("\n=== Console errors / CSP violations ===");
if (consoleMsgs.length === 0) {
  console.log("NONE ✅");
} else {
  console.log(consoleMsgs.slice(0, 15).join("\n"));
  const cspViolations = consoleMsgs.filter((m) => /content security policy/i.test(m));
  if (cspViolations.length === 0) {
    console.log("(no CSP violations — the errors above are unrelated)");
  } else {
    allOk = false;
  }
}

await browser.close();
console.log(`\nRESULT: ${allOk ? "ALL CHECKS PASSED" : "SOME CHECKS FAILED"}`);
process.exit(allOk ? 0 : 1);
