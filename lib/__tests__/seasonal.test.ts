import { describe, expect, it } from "vitest";
import {
  isDateInPeriod,
  nightlyRateForDate,
  nightlyRatesForStay,
  stayHasSeasonalNights,
  toISODate,
  type SeasonalPeriod,
} from "../seasonal";

const festive: SeasonalPeriod = {
  id: 1,
  label: "Festive season",
  startDate: "2026-12-15",
  endDate: "2027-01-05",
  ratePerNight: "950.00",
  active: true,
};

const inactive: SeasonalPeriod = {
  id: 2,
  label: "Paused weekend",
  startDate: "2026-09-01",
  endDate: "2026-09-30",
  ratePerNight: "1200.00",
  active: false,
};

describe("toISODate", () => {
  it("renders local-calendar dates with padding", () => {
    expect(toISODate(new Date(2026, 7, 3))).toBe("2026-08-03");
    expect(toISODate(new Date(2026, 11, 25))).toBe("2026-12-25");
  });
});

describe("nightlyRateForDate", () => {
  it("applies the seasonal rate inside an active period", () => {
    expect(nightlyRateForDate("1050.00", "2026-12-20", [festive])).toBe("950.00");
  });

  it("uses the base rate outside active periods", () => {
    expect(nightlyRateForDate("1050.00", "2026-11-01", [festive])).toBe("1050.00");
  });

  it("ignores inactive periods", () => {
    expect(nightlyRateForDate("1050.00", "2026-09-10", [inactive])).toBe("1050.00");
  });

  it("treats period bounds as inclusive", () => {
    expect(nightlyRateForDate("1050.00", "2026-12-15", [festive])).toBe("950.00");
    expect(nightlyRateForDate("1050.00", "2027-01-05", [festive])).toBe("950.00");
  });
});

describe("nightlyRatesForStay", () => {
  it("prices each night of the stay (check-in inclusive, check-out exclusive)", () => {
    const nights = nightlyRatesForStay("1050.00", "2026-12-14", "2026-12-17", [festive]);
    expect(nights.map((n) => n.rate)).toEqual(["1050.00", "950.00", "950.00"]);
    expect(nights.map((n) => n.date)).toEqual([
      "2026-12-14",
      "2026-12-15",
      "2026-12-16",
    ]);
  });

  it("returns an empty list for a zero-night stay", () => {
    expect(nightlyRatesForStay("1050.00", "2026-08-01", "2026-08-01", [])).toEqual([]);
  });
});

describe("stayHasSeasonalNights", () => {
  it("is true when any night lands in an active period", () => {
    expect(stayHasSeasonalNights("1050.00", "2026-12-14", "2026-12-17", [festive])).toBe(
      true
    );
  });

  it("is false when no night is seasonal", () => {
    expect(stayHasSeasonalNights("1050.00", "2026-10-01", "2026-10-03", [festive])).toBe(
      false
    );
  });
});

describe("isDateInPeriod", () => {
  it("matches within inclusive bounds", () => {
    expect(isDateInPeriod("2026-12-15", festive)).toBe(true);
    expect(isDateInPeriod("2027-01-05", festive)).toBe(true);
    expect(isDateInPeriod("2027-01-06", festive)).toBe(false);
  });
});
