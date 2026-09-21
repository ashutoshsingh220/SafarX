import { describe, it, expect } from "vitest";
import { applyAdvanceBookingDiscount } from "../advanceBooking";
import type { FareBreakdown } from "../types";

const baseBreakdown: FareBreakdown = {
  busFare: 100000,
  rideFare: 5000,
  feederDiscount: 0,
  crossSubsidy: 0,
  membershipCap: 0,
  advanceDiscount: 0,
  total: 105000,
  currency: "INR",
  strategiesApplied: [],
};

describe("Pricing Engine: Advance Booking", () => {
  it("applies 10% discount if booked >= 6 hours ahead", () => {
    const bookingTime = new Date("2023-10-01T10:00:00Z");
    const departureTime = new Date("2023-10-01T17:00:00Z"); // 7 hours ahead

    const result = applyAdvanceBookingDiscount(baseBreakdown, bookingTime, departureTime);
    
    expect(result.advanceDiscount).toBe(10500); // 10% of 105000
    expect(result.total).toBe(94500); // 105000 - 10500
    expect(result.strategiesApplied).toContain("advance_booking");
  });

  it("applies 10% discount if booked exactly 6 hours ahead", () => {
    const bookingTime = new Date("2023-10-01T10:00:00Z");
    const departureTime = new Date("2023-10-01T16:00:00Z"); // 6 hours ahead

    const result = applyAdvanceBookingDiscount(baseBreakdown, bookingTime, departureTime);
    expect(result.advanceDiscount).toBe(10500);
  });

  it("does not apply discount if booked < 6 hours ahead", () => {
    const bookingTime = new Date("2023-10-01T10:00:00Z");
    const departureTime = new Date("2023-10-01T15:00:00Z"); // 5 hours ahead

    const result = applyAdvanceBookingDiscount(baseBreakdown, bookingTime, departureTime);
    
    expect(result.advanceDiscount).toBe(0);
    expect(result.total).toBe(105000);
  });
});
