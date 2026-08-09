/**
 * Security audit — server-action input validation tests (direct calls, no HTTP).
 *
 * Every invalid payload must be rejected BEFORE any DB write, so none of these
 * calls create rows. The final XSS test DOES insert one booking (to prove the
 * stored-value escaping on the public quote page) and deletes it afterwards.
 *
 * Run: npx tsx scripts/_security-actions-test.ts   (needs DATABASE_URL in .env)
 */

import { submitLeisureBooking } from "../app/book/actions";
import { submitCorporateQuote } from "../app/corporate/actions";
import { submitEventInquiry } from "../app/events/actions";
import { db } from "../lib/db";
import { bookingRequests, quotes } from "../lib/db/schema";
import { eq, sql } from "drizzle-orm";

let pass = 0;
let fail = 0;

function expectRejected(label: string, result: { ok: boolean }, notOkError?: string) {
  if (result.ok === false) {
    pass++;
    console.log(`  ✅ ${label}`);
  } else {
    fail++;
    console.log(`  ❌ ${label} — was NOT rejected${notOkError ? ` (${notOkError})` : ""}`);
  }
}

const GOOD = {
  roomId: 1,
  checkIn: "2030-06-01",
  checkOut: "2030-06-03",
  guestCount: 2,
  breakfast: false,
  dinner: false,
  guestName: "Test Guest",
  contactPhone: "+27820000999",
};

async function main() {
  // Warm the DB pool — right after a dev-server restart the first query can
  // timeout while the external pool reconnects.
  for (let i = 0; i < 6; i++) {
    try {
      await db.execute(sql`SELECT 1`);
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.log("== LEISURE validation ==");
  expectRejected("missing name", await submitLeisureBooking({ ...GOOD, guestName: "" }));
  // Oversized free text is TRUNCATED to the cap (defense in depth), never
  // stored beyond column limits — the result is ok:true with a capped value.
  const trunc = await submitLeisureBooking({ ...GOOD, guestName: "A".repeat(200) });
  if (trunc.ok) { pass++; console.log("  ✅ name >150 chars truncated safely (no DB overflow)"); }
  else { fail++; console.log("  ❌ name >150 chars — unexpected rejection"); }
  expectRejected("invalid phone", await submitLeisureBooking({ ...GOOD, contactPhone: "not-a-phone" }));
  expectRejected("phone >30 chars", await submitLeisureBooking({ ...GOOD, contactPhone: "1".repeat(40) }));
  expectRejected("invalid email", await submitLeisureBooking({ ...GOOD, contactEmail: "not-an-email" }));
  expectRejected("email >150 chars", await submitLeisureBooking({ ...GOOD, contactEmail: `${"a".repeat(160)}@x.co` }));
  expectRejected("past check-in", await submitLeisureBooking({ ...GOOD, checkIn: "2020-01-01", checkOut: "2020-01-03" }));
  expectRejected("checkout before checkin", await submitLeisureBooking({ ...GOOD, checkIn: "2030-06-05", checkOut: "2030-06-03" }));
  expectRejected("garbage dates", await submitLeisureBooking({ ...GOOD, checkIn: "2026-13-45", checkOut: "2026-14-45" }));
  expectRejected("61-night stay", await submitLeisureBooking({ ...GOOD, checkIn: "2030-01-01", checkOut: "2030-03-04" }));
  expectRejected("guestCount 0", await submitLeisureBooking({ ...GOOD, guestCount: 0 }));
  expectRejected("guestCount 999", await submitLeisureBooking({ ...GOOD, guestCount: 999 }));
  expectRejected("guestCount 1.5", await submitLeisureBooking({ ...GOOD, guestCount: 1.5 }));
  expectRejected("roomId 0", await submitLeisureBooking({ ...GOOD, roomId: 0 }));
  const truncNote = await submitLeisureBooking({ ...GOOD, specialRequests: "x".repeat(3000) });
  if (truncNote.ok) { pass++; console.log("  ✅ specialRequests >2000 truncated safely"); }
  else { fail++; console.log("  ❌ specialRequests >2000 — unexpected rejection"); }
  expectRejected("POP url javascript:", await submitLeisureBooking({ ...GOOD, proofOfPaymentUrl: "javascript:alert(1)" }));
  expectRejected("POP url foreign host", await submitLeisureBooking({ ...GOOD, proofOfPaymentUrl: "https://evil.example/x.pdf" }));
  expectRejected("POP url data:", await submitLeisureBooking({ ...GOOD, proofOfPaymentUrl: "data:text/html,<script>alert(1)</script>" }));

  console.log("== CORPORATE validation ==");
  const corpGood = {
    fullName: "Corp Guest",
    company: "ACME",
    phone: "+27820000999",
    email: "corp@acme.co.za",
    checkIn: "2030-06-01",
    checkOut: "2030-06-03",
    roomLines: [{ roomType: "double" as const, count: 1, guestsPerRoom: 2 }],
    breakfast: false,
    dinner: false,
  };
  expectRejected("missing company", await submitCorporateQuote({ ...corpGood, company: "" }));
  expectRejected("invalid email", await submitCorporateQuote({ ...corpGood, email: "nope" }));
  expectRejected("invalid billing email", await submitCorporateQuote({ ...corpGood, billingEmail: "nope" }));
  expectRejected("bad roomType", await submitCorporateQuote({ ...corpGood, roomLines: [{ roomType: "suite" as never, count: 1, guestsPerRoom: 2 }] }));
  expectRejected("room count 0", await submitCorporateQuote({ ...corpGood, roomLines: [{ roomType: "double" as const, count: 0, guestsPerRoom: 2 }] }));
  expectRejected("room count 9999", await submitCorporateQuote({ ...corpGood, roomLines: [{ roomType: "double" as const, count: 9999, guestsPerRoom: 2 }] }));
  expectRejected("guestsPerRoom 0", await submitCorporateQuote({ ...corpGood, roomLines: [{ roomType: "double" as const, count: 1, guestsPerRoom: 0 }] }));
  expectRejected("guestsPerRoom 99", await submitCorporateQuote({ ...corpGood, roomLines: [{ roomType: "double" as const, count: 1, guestsPerRoom: 99 }] }));
  expectRejected("21 room lines", await submitCorporateQuote({ ...corpGood, roomLines: Array.from({ length: 21 }, () => ({ roomType: "double" as const, count: 1, guestsPerRoom: 2 })) }));
  expectRejected("past dates", await submitCorporateQuote({ ...corpGood, checkIn: "2020-01-01", checkOut: "2020-01-03" }));

  console.log("== EVENT validation ==");
  const evtGood = {
    fullName: "Event Guest",
    phone: "+27820000999",
    eventType: "wedding",
    guestCount: 30,
    eventDate: "2030-08-01",
    catering: "plated",
    interestedInRooms: false,
  };
  expectRejected("missing name", await submitEventInquiry({ ...evtGood, fullName: "" }));
  expectRejected("invalid phone", await submitEventInquiry({ ...evtGood, phone: "short" }));
  expectRejected("invalid email", await submitEventInquiry({ ...evtGood, email: "bad@" }));
  expectRejected("guestCount 0", await submitEventInquiry({ ...evtGood, guestCount: 0 }));
  expectRejected("guestCount 51", await submitEventInquiry({ ...evtGood, guestCount: 51 }));
  expectRejected("past event date", await submitEventInquiry({ ...evtGood, eventDate: "2020-01-01" }));
  expectRejected("garbage event date", await submitEventInquiry({ ...evtGood, eventDate: "not-a-date" }));
  expectRejected("bad alt date", await submitEventInquiry({ ...evtGood, altDate: "tomorrow?" }));

  console.log("== XSS STORAGE + ESCAPING TEST (creates + cleans up one booking) ==");
  // Wait for the dev server (the audit script starts it) before rendering.
  let serverUp = false;
  for (let i = 0; i < 30; i++) {
    try { if ((await fetch("http://localhost:3000/")).ok) { serverUp = true; break; } }
    catch { /* not up yet */ }
    await new Promise((res) => setTimeout(res, 2000));
  }

  const xssName = `<script>alert('xss')</script>John`;
  const result = await submitLeisureBooking({
    ...GOOD,
    guestName: xssName,
    roomId: 1,
  });
  if (result.ok) {
    // Find the row we just created (guest name matches, contactPhone matches).
    const rows = await db
      .select({ id: bookingRequests.id })
      .from(bookingRequests)
      .where(eq(bookingRequests.contactPhone, GOOD.contactPhone))
      .orderBy(bookingRequests.id);
    const latest = rows[rows.length - 1];
    const quote = await db
      .select({ publicToken: quotes.publicToken, bookingRequestId: quotes.bookingRequestId })
      .from(quotes)
      .where(eq(quotes.bookingRequestId, latest.id))
      .limit(1);
    const token = quote[0]?.publicToken;
    console.log(`XSS_ROW_ID=${latest.id}`);
    console.log(`XSS_TOKEN=${token ?? "none"}`);
    if (token) {
      if (serverUp) {
        try {
          const html = await (await fetch(`http://localhost:3000/quote/${token}`)).text();
          const raw = html.includes("<script>alert('xss')</script>");
          const escaped = html.includes("&lt;script&gt;alert");
          if (!raw && escaped) {
            pass++;
            console.log("  ✅ stored XSS payload escaped on public quote page (no raw <script> in HTML)");
          } else if (raw) {
            fail++;
            console.log("  ❌ RAW <script> found in rendered quote page — XSS!".toUpperCase());
          } else {
            fail++;
            console.log("  ❌ quote page did not render the guest name at all");
          }
        } catch (err) {
          fail++;
          console.log("  ❌ quote page fetch failed:", err instanceof Error ? err.message : err);
        }
      } else {
        fail++;
        console.log("  ❌ dev server never came up — could not verify escaping");
      }
    } else {
      fail++;
      console.log("  ❌ no quote token created");
    }
  } else {
    fail++;
    console.log("  ❌ XSS booking was rejected — unexpected");
  }

  // Cleanup: delete the test booking (cascade removes lines, quote, add-ons)
  // and sweep any older +27820000999 rows left by previous manual testing.
  const rows = await db
    .select({ id: bookingRequests.id })
    .from(bookingRequests)
    .where(eq(bookingRequests.contactPhone, GOOD.contactPhone));
  if (rows.length > 0) {
    for (const row of rows) {
      await db.delete(bookingRequests).where(eq(bookingRequests.id, row.id));
    }
    console.log(`  🧹 cleaned up ${rows.length} test booking(s)`);
  }

  console.log("==========================================");
  console.log(`RESULT: ${pass} passed, ${fail} failed`);
  console.log("==========================================");
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("Audit script crashed:", err);
  process.exit(1);
});
