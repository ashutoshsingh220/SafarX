import { describe, it, expect } from "vitest";
import { computeFeederFare } from "../feeder";

describe("Pricing Engine: Feeder Shuttle", () => {
  it("should provide feeder fare if within distance limit (1 passenger)", () => {
    const result = computeFeederFare(5, 1);
    expect(result.isFeederAvailable).toBe(true);
    expect(result.feederFare).toBe(5000); // 50 INR
  });

  it("should provide feeder fare if within distance limit (2 passengers)", () => {
    const result = computeFeederFare(5, 2);
    expect(result.isFeederAvailable).toBe(true);
    expect(result.feederFare).toBe(10000); // 100 INR
  });

  it("should not provide feeder fare if beyond distance limit", () => {
    const result = computeFeederFare(15, 1);
    expect(result.isFeederAvailable).toBe(false);
    expect(result.feederFare).toBe(0);
  });
});
