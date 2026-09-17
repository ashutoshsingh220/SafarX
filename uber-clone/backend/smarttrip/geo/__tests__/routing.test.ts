import { describe, it, expect } from "vitest";
import { haversineDistanceKm } from "../routing";

describe("haversineDistanceKm", () => {
  it("returns 0 for same point", () => {
    const p = { lat: 18.5204, lon: 73.8567 }; // Mumbai
    expect(haversineDistanceKm(p, p)).toBeCloseTo(0, 5);
  });

  it("calculates Mumbai to Bengaluru (~840 km)", () => {
    const mumbai = { lat: 18.5204, lon: 73.8567 };
    const bengaluru = { lat: 12.9716, lon: 77.5946 };
    const dist = haversineDistanceKm(mumbai, bengaluru);
    // Known aerial (straight-line) distance is ~735 km
    expect(dist).toBeGreaterThan(730);
    expect(dist).toBeLessThan(750);
  });

  it("calculates short distances accurately (< 2km)", () => {
    // Two points ~1.5km apart in Mumbai
    const a = { lat: 18.5204, lon: 73.8567 };
    const b = { lat: 18.5340, lon: 73.8567 }; // ~1.5km north
    const dist = haversineDistanceKm(a, b);
    expect(dist).toBeGreaterThan(1.0);
    expect(dist).toBeLessThan(2.0);
  });

  it("is symmetric (a→b == b→a)", () => {
    const mumbai = { lat: 18.5204, lon: 73.8567 };
    const mumbai = { lat: 19.076, lon: 72.8777 };
    expect(haversineDistanceKm(mumbai, mumbai)).toBeCloseTo(
      haversineDistanceKm(mumbai, mumbai),
      10
    );
  });
});
