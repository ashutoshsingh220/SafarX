import { describe, it, expect } from "vitest";
import { computeCrossSubsidy } from "../crossSubsidy";

describe("Pricing Engine: Cross Subsidy", () => {
  it("calculates subsidy correctly based on 50% commission limit", () => {
    // Bus fare 1000 INR (100,000 paisa) => commission is 5000 paisa.
    // Max subsidy is 2500 paisa.
    // Ride cost is 200 INR (20,000 paisa) => max ride subsidy is 8000 paisa.
    // Min(2500, 8000) = 2500
    const result = computeCrossSubsidy(100000, 20000);
    expect(result.busCommission).toBe(5000);
    expect(result.subsidy).toBe(2500);
  });

  it("calculates subsidy correctly based on 40% ride cost limit", () => {
    // Bus fare 1000 INR (100,000 paisa) => commission is 5000 paisa.
    // Max subsidy is 2500 paisa.
    // Ride cost is 50 INR (5000 paisa) => max ride subsidy is 2000 paisa.
    // Min(2500, 2000) = 2000
    const result = computeCrossSubsidy(100000, 5000);
    expect(result.busCommission).toBe(5000);
    expect(result.subsidy).toBe(2000);
  });

  it("handles zero values gracefully", () => {
    const result = computeCrossSubsidy(0, 0);
    expect(result.busCommission).toBe(0);
    expect(result.subsidy).toBe(0);
  });
});
