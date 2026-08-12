import { describe, expect, it } from "vitest";
import { bathLabel } from "../rooms";

describe("bathLabel", () => {
  it("maps Bath (any casing/whitespace) to Bath", () => {
    expect(bathLabel("Bath")).toBe("Bath");
    expect(bathLabel("bath")).toBe("Bath");
    expect(bathLabel("  Bath ")).toBe("Bath");
  });

  it("maps everything else to Shower", () => {
    expect(bathLabel("Shower")).toBe("Shower");
    expect(bathLabel("shower")).toBe("Shower");
    expect(bathLabel("")).toBe("Shower");
  });
});
