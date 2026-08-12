import { describe, expect, it } from "vitest";
import {
  clampNonNegative,
  computeTotals,
  formatZAR,
  toCents,
} from "../quote-math";

describe("toCents", () => {
  it("converts decimal strings to integer cents", () => {
    expect(toCents("1050.00")).toBe(105000);
    expect(toCents("0.10")).toBe(10);
    expect(toCents(12.345)).toBe(1235);
  });

  it("falls back to 0 for non-finite input", () => {
    expect(toCents("abc")).toBe(0);
    expect(toCents(Number.NaN)).toBe(0);
  });
});

describe("computeTotals", () => {
  it("computes subtotal / VAT / total in integer cents without float drift", () => {
    const totals = computeTotals(
      [
        { quantity: "3", unitPrice: "1050.00" },
        { quantity: "2", unitPrice: "1200.00" },
      ],
      15
    );
    // (3 × 1050) + (2 × 1200) = 5550; VAT 15% = 832.50
    expect(totals.subtotal).toBe("5550.00");
    expect(totals.vatAmount).toBe("832.50");
    expect(totals.total).toBe("6382.50");
  });

  it("clamps VAT rate to 100%", () => {
    const totals = computeTotals([{ quantity: "1", unitPrice: "100.00" }], 150);
    expect(totals.vatAmount).toBe("100.00");
  });

  it("treats a missing/invalid VAT rate as 0", () => {
    const totals = computeTotals([{ quantity: "1", unitPrice: "100.00" }], 0);
    expect(totals.vatAmount).toBe("0.00");
    expect(totals.total).toBe("100.00");
  });

  it("handles an empty line list", () => {
    const totals = computeTotals([], 15);
    expect(totals).toEqual({ subtotal: "0.00", vatAmount: "0.00", total: "0.00" });
  });
});

describe("formatZAR", () => {
  it("formats with ZAR currency and 2 decimals", () => {
    expect(formatZAR(1050.5)).toMatch(/^R\s/);
    expect(formatZAR(1050.5)).toContain("050,50");
  });

  it("falls back to 0 for invalid input", () => {
    expect(formatZAR("nope")).toContain("0,00");
  });
});

describe("clampNonNegative", () => {
  it("keeps valid non-negative values with 2dp", () => {
    expect(clampNonNegative("12.5")).toBe("12.50");
    expect(clampNonNegative(7)).toBe("7.00");
  });

  it("clamps negatives to 0", () => {
    expect(clampNonNegative("-5")).toBe("0.00");
  });

  it("falls back for garbage input", () => {
    expect(clampNonNegative("abc")).toBe("0.00");
    expect(clampNonNegative(null)).toBe("0.00");
  });
});
