/**
 * End-to-end performance benchmark.
 *
 * Phase 1 — HTTP: cold + warm response time for every route.
 * Phase 2 — Browser: real Chromium load of every page; measures TTFB,
 *   DOMContentLoaded, load, First Contentful Paint, Largest Contentful Paint,
 *   and the render time of each page's key components.
 *
 * Usage: npx tsx scripts/perf-bench.ts [BASE_URL]
 */

import "dotenv/config";
import { createHmac } from "crypto";
import { chromium } from "playwright-core";

const BASE = process.argv[2] || "http://localhost:3000";
const OWNER_PHONE = "+27820000001";

// ---------------------------------------------------------------- routes ---

const QUOTE_TOKEN = "HvJ60kBG0aYNAVOT4hhCQjA8";

const ROUTES: { path: string; name: string }[] = [
  { path: "/", name: "/" },
  { path: "/rooms", name: "/rooms" },
  { path: "/book", name: "/book" },
  { path: "/corporate", name: "/corporate" },
  { path: "/events", name: "/events" },
  { path: "/admin", name: "/admin" },
  { path: "/admin/dashboard", name: "/admin/dashboard" },
  { path: "/admin/quotes", name: "/admin/quotes" },
  { path: `/quote/${QUOTE_TOKEN}`, name: "/quote/[token]" },
  { path: `/quote/${QUOTE_TOKEN}/pdf`, name: "/quote/[token]/pdf" },
  { path: "/api/auth/me", name: "/api/auth/me" },
];

// Selectors (CSS or text=...) identifying each page's main components. Times
// are recorded relative to navigation start, so they include server TTFB +
// SSR streaming + client hydration of that component.
const COMPONENTS: Record<string, [string, string][]> = {
  "/": [
    ["main", "main"],
    ["stay", "#stay"],
    ["rooms", "#rooms"],
    ["events", "#events"],
    ["corporate", "#corporate"],
    ["payment", "#payment"],
    ["contact", "#contact"],
  ],
  "/rooms": [
    ["explorer", "#sortSelect"],
    ["grid", "#rooms-grid"],
  ],
  "/book": [
    ["heading", "text=Book your stay"],
    ["dates", "text=Pick your dates"],
    ["room", "text=Choose your room"],
    ["addons", "text=Add breakfast or dinner"],
    ["details", "text=Your details"],
  ],
  "/corporate": [["quoteForm", "#quote-form"]],
  "/events": [
    ["packages", "#packages"],
    ["catering", "#catering"],
    ["inquiryForm", "#inquiry-form"],
  ],
  "/admin": [
    ["loginCard", "text=Sign in to admin"],
    ["otpForm", "text=Request OTP"],
  ],
  "/admin/dashboard": [
    ["header", "text=Operations Dashboard"],
    ["queue", "text=Pending Requests"],
    ["contactBtn", "text=Contacted"],
  ],
  "/admin/quotes": [["page", "body"]],
  "/quote/[token]": [["page", "body"]],
  "/quote/[token]/pdf": [["page", "body"]],
};

// --------------------------------------------------------------- helpers ---

function ms(n: number | undefined | null): string {
  if (n === undefined || n === null || n < 0 || !isFinite(n)) return "   -";
  return (n / 1000).toFixed(1).padStart(5) + "s";
}

function fmt2(n: number | undefined | null): string {
  if (n === undefined || n === null || n < 0 || !isFinite(n)) return "-";
  return (n / 1000).toFixed(1);
}

async function httpProbe(
  path: string
): Promise<{ total: number; ttfb: number; status: number; bytes: number }> {
  const start = performance.now();
  const res = await fetch(BASE + path);
  const ttfb = performance.now() - start;
  const body = await res.arrayBuffer();
  return { total: performance.now() - start, ttfb, status: res.status, bytes: body.byteLength };
}

// --------------------------------------------------------------- Phase 1 ---

async function phaseHttp() {
  console.log("\n=== Phase 1: HTTP response time (dev server, Turbopack) ===\n");
  console.log(
    "route".padEnd(22),
    "status",
    "cold(ttfb)".padStart(11),
    "warm min".padStart(9),
    "warm avg".padStart(9),
    "warm max".padStart(9),
    "size".padStart(8)
  );
  const rows: { name: string; cold: number; warmMin: number; warmAvg: number; warmMax: number }[] = [];
  for (const { path, name } of ROUTES) {
    let cold: { total: number; ttfb: number; status: number; bytes: number } | null = null;
    try {
      cold = await httpProbe(path);
    } catch (e: any) {
      console.log(name.padEnd(22), "ERR", String(e?.message || e).slice(0, 50));
      continue;
    }
    const warm: number[] = [];
    for (let i = 0; i < 5; i++) {
      const w = await httpProbe(path);
      warm.push(w.total);
    }
    const min = Math.min(...warm);
    const avg = warm.reduce((a, b) => a + b, 0) / warm.length;
    const max = Math.max(...warm);
    rows.push({ name, cold: cold.ttfb, warmMin: min, warmAvg: avg, warmMax: max });
    console.log(
      name.padEnd(22),
      String(cold.status),
      ms(cold.ttfb),
      ms(min),
      ms(avg),
      ms(max),
      (cold.bytes / 1024).toFixed(0).padStart(6) + "kB"
    );
  }
  console.log("\ncold = first request to a route (includes Turbopack on-demand compile).");
  return rows;
}

// --------------------------------------------------------------- Phase 2 ---

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch {
    const { execSync } = await import("child_process");
    const out = execSync("ls /root/.cache/ms-playwright/*/chrome-headless-shell-linux64/chrome-headless-shell 2>/dev/null || ls /root/.cache/ms-playwright/*/chrome-linux/chrome 2>/dev/null", {
      encoding: "utf8",
    });
    const exe = out.trim().split("\n").pop();
    if (!exe) throw new Error("no chromium executable found");
    return chromium.launch({ headless: true, executablePath: exe });
  }
}

function componentWatcherSource(selectors: [string, string][]): string {
  const json = JSON.stringify(selectors);
  return `(() => {
    const targets = ${json};
    const found = {};
    const t0 = performance.now();
    function matches(el, sel) {
      if (sel.startsWith("text=")) {
        if (el.children.length > 0) return false;
        const t = sel.slice(5).trim();
        const txt = (el.textContent || "").trim();
        return txt === t;
      }
      return el.matches && el.matches(sel);
    }
    function find(sel) {
      if (sel.startsWith("text=")) {
        if (!document.body) return null;
        const w = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
        while (w.nextNode()) { const n = w.currentNode; if (matches(n, sel)) return n; }
        return null;
      }
      return document.querySelector(sel);
    }
    function check() {
      for (const [name, sel] of targets) {
        if (found[name] !== undefined) continue;
        const el = find(sel);
        if (el) {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) found[name] = performance.now() - t0;
        }
      }
    }
    // Observe the Document node itself — documentElement may not exist yet on
    // an init script running at the very start of a fresh navigation.
    new MutationObserver(check).observe(document, { childList: true, subtree: true, attributes: true, characterData: true });
    check();
    setInterval(check, 50);
    window.__compTimes = () => found;
  })();`;
}

// Mint a signed admin session cookie directly (mirrors lib/auth.ts) so the
// benchmark never depends on the dev OTP rate limiter across repeat runs.
function buildSessionCookie(): string {
  const secret =
    process.env.SESSION_SECRET || "gomodi-dev-secret-change-me";
  const payload = {
    userId: 1,
    role: "owner",
    name: "Owner",
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
  };
  const raw = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret).update(raw).digest("base64url");
  return `${raw}.${sig}`;
}

async function authenticate(ctx: any): Promise<boolean> {
  try {
    await ctx.addCookies([{ name: "session", value: buildSessionCookie(), url: BASE }]);
    return true;
  } catch {
    // Fallback: real OTP flow (only used if cookie signing above fails).
    try {
      const req = await ctx.request.post(`${BASE}/api/auth/request-otp`, {
        data: { phone: OWNER_PHONE },
      });
      const data = await req.json();
      const otp = data.devOtp;
      if (!otp) return false;
      const ver = await ctx.request.post(`${BASE}/api/auth/verify-otp`, {
        data: { phone: OWNER_PHONE, otp },
      });
      return ver.ok();
    } catch {
      return false;
    }
  }
}

async function browserPage(
  ctx: any,
  path: string,
  selectors: [string, string][],
  isPdf = false
): Promise<Record<string, any>> {
  const page = await ctx.newPage();
  await page.addInitScript(componentWatcherSource(selectors));

  const navStart = performance.now();
  let navError: string | null = null;

  if (isPdf) {
    // PDF route starts a download; goto always throws "Download is starting"
    // once the download begins — that's expected. Register the listener first,
    // then measure wall time until the download arrives.
    const dl = page.waitForEvent("download");
    try {
      await page.goto(BASE + path, { waitUntil: "commit", timeout: 60_000 });
    } catch (e: any) {
      if (!String(e?.message || "").includes("Download")) {
        navError = String(e?.message || e).slice(0, 80);
      }
    }
    try {
      const d = await Promise.race([dl, new Promise((r) => setTimeout(r, 30_000))]);
      await page.close();
      return { downloadMs: performance.now() - navStart, navError, filename: (d as any)?.suggestedFilename?.() };
    } catch (e: any) {
      navError = String(e?.message || e).slice(0, 80);
    }
    await page.close();
    return { downloadMs: performance.now() - navStart, navError };
  }

  try {
    await page.goto(BASE + path, { waitUntil: "load", timeout: 60_000 });
  } catch (e: any) {
    navError = String(e?.message || e).slice(0, 80);
  }
  const wallMs = performance.now() - navStart;

  const perf = await page.evaluate(
    async () => {
      const nav = performance.getEntriesByType("navigation")[0] as any;
      const paints = performance.getEntriesByType("paint").map((p: any) => [p.name, p.startTime]);

      let lcp = -1;
      try {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length) lcp = entries[entries.length - 1].startTime;
        }).observe({ type: "largest-contentful-paint", buffered: true });
      } catch {
        /* PerformanceObserver unavailable */
      }

      // Settle-poll: keep reading component render times until they stop
      // changing (async data fetches finish) or 8s elapse, so late-rendering
      // client components (e.g. the admin dashboard after its API calls) are
      // captured with their true render time.
      const settleStart = performance.now();
      let stableFor = 0;
      let prevCount = -1;
      while (performance.now() - settleStart < 8000) {
        const t = (window as any).__compTimes ? (window as any).__compTimes() : {};
        const count = Object.keys(t).length;
        if (count === prevCount && count > 0) {
          stableFor += 100;
          if (stableFor >= 600) break;
        } else {
          stableFor = 0;
          prevCount = count;
        }
        await new Promise((r) => setTimeout(r, 100));
      }
      await new Promise((r) => setTimeout(r, 200));

      const resources = performance
        .getEntriesByType("resource")
        .map((r: any) => ({
          name: r.name.replace(/^https?:\/\/[^/]+/, ""),
          dur: Math.round(r.duration),
          ttfb: Math.round(r.responseStart - r.requestStart),
        }))
        .sort((a: any, b: any) => b.dur - a.dur)
        .slice(0, 5);

      return {
        ttfb: nav ? nav.responseStart : -1,
        dcl: nav ? nav.domContentLoadedEventEnd : -1,
        load: nav ? nav.loadEventEnd : -1,
        paints,
        lcp,
        resources,
        compTimes: (window as any).__compTimes ? (window as any).__compTimes() : {},
      };
    }
  );

  await page.close();
  return { ...perf, wallMs, navError };
}

async function phaseBrowser() {
  console.log("\n=== Phase 2: Browser load (Chromium, warm routes) ===\n");
  const browser = await launchBrowser();

  // One shared authenticated context (single OTP request) for the admin pages,
  // so the run stays inside the dev-server OTP rate limit.
  const authedCtx = await browser.newContext();
  const authedOk = await authenticate(authedCtx);
  if (!authedOk) console.log("  (admin auth failed — /admin/dashboard and /admin/quotes will show the login gate)");

  for (const { path, name } of ROUTES) {
    if (path.startsWith("/api/")) continue;
    const selectors = COMPONENTS[name] || [["page", "body"]];
    const isPdf = name === "/quote/[token]/pdf";
    const ctx = name === "/admin/dashboard" || name === "/admin/quotes" ? authedCtx : await browser.newContext();
    const r = await browserPage(ctx, path, selectors, isPdf);
    console.log(`\n[${name}]` + (r.navError ? `  ERROR: ${r.navError}` : ""));
    if (r.navError) continue;
    if (isPdf) {
      console.log(`  PDF download started after ${ms(r.downloadMs)} (server generation incl.)${r.filename ? ` — ${r.filename}` : ""}`);
      continue;
    }

    const fcp = (r.paints || []).find((p: [string, number]) => p[0] === "first-contentful-paint");
    console.log(
      "  TTFB".padEnd(7),
      ms(r.ttfb),
      "| DCL".padEnd(5),
      ms(r.dcl),
      "| load".padEnd(6),
      ms(r.load),
      "| FCP".padEnd(5),
      ms(fcp ? fcp[1] : -1),
      "| LCP".padEnd(5),
      ms(r.lcp),
      "| wall".padEnd(6),
      ms(r.wallMs)
    );
    const comps = r.compTimes || {};
    const names = Object.keys(comps);
    if (names.length) {
      const rows = names.map((n) => [n, comps[n]]);
      rows.sort((a, b) => (a[1] as number) - (b[1] as number));
      for (const [n, t] of rows) {
        console.log(`  ${String(n).padEnd(12)} ${ms(t as number)}`);
      }
    } else {
      console.log("  (no component selectors matched)");
    }
    if ((r.resources || []).length) {
      console.log(
        "  slowest assets:",
        (r.resources as { name: string; dur: number; ttfb: number }[])
          .map((x) => `${x.name} ${ms(x.dur)}`)
          .join(", ")
      );
    }
  }
  await authedCtx.close();
  await browser.close();
}

// ----------------------------------------------------------------- main ---

async function main() {
  console.log(`Benchmarking against ${BASE}`);
  await phaseHttp();
  await phaseBrowser();
  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
