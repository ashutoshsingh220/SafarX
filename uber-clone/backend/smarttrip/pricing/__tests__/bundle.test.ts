import { describe, it, expect } from "vitest";
import { computeBundle } from "../bundle";

describe("Pricing Engine: Bundle", () => {
  it("computes bundle total correctly", () => {
    // bus fare 1000, ride cost 200, cross subsidy 50
    // total = 1000 + (200 - 50) = 1150
    const total = computeBundle(1000, 200, 50);
    expect(total).toBe(1150);
  });

  it("caps subsidy to not exceed ride cost", () => {
    // bus fare 1000, ride cost 200, cross subsidy 250 (more than ride cost)
    // total = 1000 + (200 - 200) = 1000
    const total = computeBundle(1000, 200, 250);
    expect(total).toBe(1000);
  });
});
