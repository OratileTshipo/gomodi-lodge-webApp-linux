import { describe, expect, it } from "vitest";
import {
  intInRange,
  isNotInPast,
  isValidEmail,
  isValidHttpUrl,
  isValidIsoDate,
  isValidPhone,
  isValidStay,
  nightDates,
  nightsBetween,
  normalizePhone,
  oneOf,
} from "../validate";

describe("normalizePhone", () => {
  it("strips separators", () => {
    expect(normalizePhone("082 123 4567")).toBe("+27821234567");
    expect(normalizePhone("+27 (82) 123-4567")).toBe("+27821234567");
  });

  it("converts 00 international prefixes to +", () => {
    expect(normalizePhone("0044821234567")).toBe("+44821234567");
  });

  it("prefixes bare SA local numbers with +27", () => {
    expect(normalizePhone("0821234567")).toBe("+27821234567");
  });

  it("rejects garbage", () => {
    expect(normalizePhone("hello")).toBe("");
    expect(normalizePhone("123")).toBe("");
    expect(normalizePhone(undefined)).toBe("");
  });
});

describe("isValidPhone", () => {
  it("accepts E.164-ish numbers of 7-15 digits", () => {
    expect(isValidPhone("+27821234567")).toBe(true);
    expect(isValidPhone("021 555 1234")).toBe(true);
    expect(isValidPhone("not-a-phone")).toBe(false);
  });
});

describe("isValidEmail", () => {
  it("accepts normal addresses", () => {
    expect(isValidEmail("guest@example.com")).toBe(true);
    expect(isValidEmail("a.b+c@sub.example.co.za")).toBe(true);
  });

  it("rejects malformed addresses", () => {
    expect(isValidEmail("guest@")).toBe(false);
    expect(isValidEmail("@example.com")).toBe(false);
    expect(isValidEmail("a b@example.com")).toBe(false);
    expect(isValidEmail("guest@example")).toBe(false);
    expect(isValidEmail("guest@@example.com")).toBe(false);
    expect(isValidEmail("guest..x@example.com")).toBe(false);
  });
});

describe("isValidIsoDate", () => {
  it("accepts real calendar dates", () => {
    expect(isValidIsoDate("2026-08-14")).toBe(true);
    expect(isValidIsoDate("2026-02-28")).toBe(true);
  });

  it("rejects impossible dates and formats", () => {
    expect(isValidIsoDate("2026-02-30")).toBe(false);
    expect(isValidIsoDate("2026-13-01")).toBe(false);
    expect(isValidIsoDate("14/08/2026")).toBe(false);
    expect(isValidIsoDate("2026-8-1")).toBe(false);
  });
});

describe("nightsBetween / nightDates", () => {
  it("counts whole nights", () => {
    expect(nightsBetween("2026-08-14", "2026-08-17")).toBe(3);
    expect(nightsBetween("2026-08-17", "2026-08-14")).toBe(0);
  });

  it("expands dates check-in inclusive, check-out exclusive", () => {
    expect(nightDates("2026-08-14", "2026-08-17")).toEqual([
      "2026-08-14",
      "2026-08-15",
      "2026-08-16",
    ]);
  });
});

describe("isValidStay", () => {
  it("requires at least one night", () => {
    expect(isValidStay("2026-08-14", "2026-08-14")).toBe(false);
    expect(isValidStay("2026-08-14", "2026-08-15")).toBe(true);
  });

  it("caps the maximum stay", () => {
    expect(isValidStay("2026-08-01", "2026-10-30")).toBe(false);
  });
});

describe("isNotInPast", () => {
  it("allows today and future dates", () => {
    const today = new Date(2026, 7, 14); // 2026-08-14 local
    expect(isNotInPast("2026-08-14", today)).toBe(true);
    expect(isNotInPast("2026-08-20", today)).toBe(true);
    expect(isNotInPast("2026-08-13", today)).toBe(false);
  });
});

describe("intInRange", () => {
  it("accepts integers in range", () => {
    expect(intInRange("4", 1, 4)).toBe(4);
    expect(intInRange(1, 1, 4)).toBe(1);
  });

  it("rejects out-of-range and non-integers", () => {
    expect(intInRange("5", 1, 4)).toBe(null);
    expect(intInRange("1.5", 1, 4)).toBe(null);
    expect(intInRange("abc", 1, 4)).toBe(null);
  });
});

describe("isValidHttpUrl", () => {
  it("accepts http(s) URLs", () => {
    expect(isValidHttpUrl("https://example.com/x.png")).toBe(true);
    expect(isValidHttpUrl("http://localhost:3000/pop")).toBe(true);
  });

  it("rejects other schemes and junk", () => {
    expect(isValidHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isValidHttpUrl("data:text/html,x")).toBe(false);
    expect(isValidHttpUrl("not a url")).toBe(false);
  });
});

describe("oneOf", () => {
  it("restricts to the allowlist", () => {
    expect(oneOf("bath", ["bath", "shower"])).toBe("bath");
    expect(oneOf("swimming", ["bath", "shower"])).toBe(null);
  });
});
