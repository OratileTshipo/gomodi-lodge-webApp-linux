import { describe, expect, it } from "vitest";
import { buildDraftLines } from "../quotes";
import type { SeasonalPeriod } from "../seasonal";

const festive: SeasonalPeriod = {
  id: 1,
  label: "Festive season",
  startDate: "2026-12-15",
  endDate: "2027-01-05",
  ratePerNight: "950.00",
  active: true,
};

const inactive: SeasonalPeriod = {
  id: 3,
  label: "Paused weekend",
  startDate: "2026-09-01",
  endDate: "2026-09-30",
  ratePerNight: "1200.00",
  active: false,
};

const roomLine = (over: Partial<{ roomName: string; checkIn: string; checkOut: string; baseRate: string }> = {}) => ({
  roomName: "Room 1",
  checkIn: "2026-08-10",
  checkOut: "2026-08-12",
  baseRate: "1050.00",
  ...over,
});

describe("buildDraftLines — room lines", () => {
  it("builds one line per room at the base rate with night quantity", () => {
    const lines = buildDraftLines({ roomLines: [roomLine()], addOns: [] });
    expect(lines).toEqual([
      {
        description: "Room 1",
        quantity: "2",
        unit: "night",
        unitPrice: "1050.00",
        sortOrder: 0,
      },
    ]);
  });

  it("skips stays with zero nights", () => {
    const lines = buildDraftLines({
      roomLines: [roomLine({ checkIn: "2026-08-10", checkOut: "2026-08-10" })],
      addOns: [],
    });
    expect(lines).toEqual([]);
  });

  it("emits a separate line per room", () => {
    const lines = buildDraftLines({
      roomLines: [roomLine({ roomName: "Room 1" }), roomLine({ roomName: "Room 2", checkOut: "2026-08-13" })],
      addOns: [],
    });
    expect(lines.map((l) => l.description)).toEqual(["Room 1", "Room 2"]);
    expect(lines[1]!.quantity).toBe("3");
  });

  it("clamps a negative/missing base rate to 0", () => {
    const lines = buildDraftLines({ roomLines: [roomLine({ baseRate: "-50" })], addOns: [] });
    expect(lines[0]!.unitPrice).toBe("0.00");
  });
});

describe("buildDraftLines — seasonal pricing", () => {
  it("applies the seasonal rate when every night is inside an active period", () => {
    const lines = buildDraftLines({
      roomLines: [roomLine({ checkIn: "2026-12-20", checkOut: "2026-12-23" })],
      addOns: [],
      periods: [festive],
    });
    expect(lines).toEqual([
      { description: "Room 1", quantity: "3", unit: "night", unitPrice: "950.00", sortOrder: 0 },
    ]);
  });

  it("splits a stay straddling a festive window into rate segments", () => {
    // 5 nights: Dec 13-14 at base (1050), Dec 15-17 inside festive (950).
    const lines = buildDraftLines({
      roomLines: [roomLine({ checkIn: "2026-12-13", checkOut: "2026-12-18" })],
      addOns: [],
      periods: [festive],
    });
    expect(lines).toEqual([
      { description: "Room 1", quantity: "2", unit: "night", unitPrice: "1050.00", sortOrder: 0 },
      {
        description: "Room 1 (Festive season)",
        quantity: "3",
        unit: "night",
        unitPrice: "950.00",
        sortOrder: 1,
      },
    ]);
  });

  it("picks the shortest active label for a seasonal segment", () => {
    // Two active windows at the same rate, different labels. The stay
    // straddles both, so the seasonal segment must use the shorter label.
    const both: SeasonalPeriod[] = [
      { ...festive, label: "Festive Season 2026/27" }, // 22 chars
      { ...festive, label: "Christmas", startDate: "2026-12-20", endDate: "2026-12-24" }, // 9 chars, narrower window
    ];
    const lines = buildDraftLines({
      // 6 nights: Dec 10-14 at base (1050), Dec 15 inside the windows (950).
      roomLines: [roomLine({ checkIn: "2026-12-10", checkOut: "2026-12-16" })],
      addOns: [],
      periods: both,
    });
    expect(lines.map((l) => l.description)).toEqual(["Room 1", "Room 1 (Christmas)"]);
    expect(lines[0]!.quantity).toBe("5");
    expect(lines[0]!.unitPrice).toBe("1050.00");
    expect(lines[1]!.quantity).toBe("1");
    expect(lines[1]!.unitPrice).toBe("950.00");
  });

  it("ignores inactive periods entirely", () => {
    const lines = buildDraftLines({
      roomLines: [roomLine({ checkIn: "2026-09-10", checkOut: "2026-09-12" })],
      addOns: [],
      periods: [inactive],
    });
    expect(lines[0]!.unitPrice).toBe("1050.00");
    expect(lines[0]!.description).toBe("Room 1");
  });
});

describe("buildDraftLines — meal add-ons", () => {
  it("aggregates each meal type into one person-night line", () => {
    const lines = buildDraftLines({
      roomLines: [roomLine({ checkIn: "2026-08-10", checkOut: "2026-08-13" })], // 3 nights
      addOns: [
        { type: "breakfast", persons: 2, unitPrice: "175.00" },
        { type: "breakfast", persons: 2, unitPrice: "175.00" }, // same guest, nights 1+2
        { type: "dinner", persons: 1, unitPrice: "300.00" },
      ],
    });
    expect(lines).toEqual([
      { description: "Room 1", quantity: "3", unit: "night", unitPrice: "1050.00", sortOrder: 0 },
      { description: "Breakfast", quantity: "4", unit: "person-night", unitPrice: "175.00", sortOrder: 1 },
      { description: "Dinner", quantity: "1", unit: "person-night", unitPrice: "300.00", sortOrder: 2 },
    ]);
  });

  it("clamps a negative meal unit price", () => {
    const lines = buildDraftLines({
      roomLines: [],
      addOns: [{ type: "dinner", persons: 2, unitPrice: "-10" }],
    });
    expect(lines[0]!.unitPrice).toBe("0.00");
  });

  it("builds only meal lines when there are no room lines", () => {
    const lines = buildDraftLines({
      roomLines: [],
      addOns: [{ type: "breakfast", persons: 1, unitPrice: "175.00" }],
    });
    expect(lines.map((l) => l.description)).toEqual(["Breakfast"]);
  });
});
