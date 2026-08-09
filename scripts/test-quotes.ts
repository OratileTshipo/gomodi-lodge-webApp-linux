/**
 * DB-free regression test for the quotation engine (lib/quotes.ts):
 * draft line building from room lines + meals, and cents-safe totals math.
 * Run: npx tsx scripts/test-quotes.ts
 */
import { buildDraftLines } from "../lib/quotes";
import { computeTotals } from "../lib/quote-math";

let fails = 0;
function assert(name: string, cond: boolean) {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}`);
  if (!cond) fails++;
}

// ---- buildDraftLines -------------------------------------------------------
const lines = buildDraftLines({
  roomLines: [
    { roomName: "Room 1", checkIn: "2026-08-14", checkOut: "2026-08-17", baseRate: "1050.00" }, // 3 nights
    { roomName: "Room 2", checkIn: "2026-08-14", checkOut: "2026-08-16", baseRate: "1200.00" }, // 2 nights
  ],
  addOns: [
    { type: "breakfast", persons: 2, unitPrice: "175.00" }, // per night per person
    { type: "breakfast", persons: 2, unitPrice: "175.00" },
    { type: "dinner", persons: 2, unitPrice: "300.00" },
  ],
});

assert("one line per room line", lines.filter((l) => l.unit === "night").length === 2);
assert("room night quantities computed (3 + 2)", lines.filter((l) => l.unit === "night").map((l) => l.quantity).join(",") === "3,2");
assert("room rate threaded through (not name-looked-up)", lines.find((l) => l.description === "Room 1")?.unitPrice === "1050.00");
assert("breakfast aggregated to person-nights (2x2=4)", lines.find((l) => l.description === "Breakfast")?.quantity === "4");
assert("dinner aggregated to person-nights (2)", lines.find((l) => l.description === "Dinner")?.quantity === "2");
assert("meal unit price kept", lines.find((l) => l.description === "Breakfast")?.unitPrice === "175.00");
assert("sort order is sequential", lines.map((l) => l.sortOrder).join(",") === "0,1,2,3");

// Zero-length stays excluded
const empty = buildDraftLines({ roomLines: [{ roomName: "X", checkIn: "2026-08-14", checkOut: "2026-08-14", baseRate: "1000.00" }], addOns: [] });
assert("zero-night stay produces no room line", empty.length === 0);

// Missing baseRate falls back to 0.00 instead of crashing
const noRate = buildDraftLines({ roomLines: [{ roomName: "X", checkIn: "2026-08-14", checkOut: "2026-08-15" }], addOns: [] });
assert("missing baseRate falls back to 0.00", noRate[0].unitPrice === "0.00");

// ---- computeTotals (cents-safe) -------------------------------------------
const t1 = computeTotals(
  [
    { quantity: "3", unitPrice: "1050.00" }, // R3150
    { quantity: "4", unitPrice: "175.00" },  // R700
    { quantity: "2", unitPrice: "300.00" },  // R600
  ],
  "15"
);
assert("subtotal correct (4450.00)", t1.subtotal === "4450.00");
assert("VAT 15% correct (667.50)", t1.vatAmount === "667.50");
assert("total correct (5117.50)", t1.total === "5117.50");

const t2 = computeTotals([{ quantity: "1", unitPrice: "199.99" }], "0");
assert("0% VAT = no VAT", t2.vatAmount === "0.00" && t2.total === "199.99");

const t3 = computeTotals([{ quantity: "0.5", unitPrice: "1000.00" }], "15");
assert("half-night handled (500.00)", t3.subtotal === "500.00");

const t4 = computeTotals([{ quantity: "1", unitPrice: "100.00" }], "9999");
assert("VAT clamped to 100% max", t4.vatAmount === "100.00");

console.log(fails === 0 ? "\nALL TESTS PASSED" : `\n${fails} TEST(S) FAILED`);
process.exit(fails === 0 ? 0 : 1);
