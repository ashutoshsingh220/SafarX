import { describe, it, expect } from "vitest";
import { computeDoorToDoorPrice } from "../engine";
import type { BusOption } from "../../search/types";
import type { RideQuote, UserProfile } from "../types";

const mockBus: BusOption = {
  id: 1,
  operator: "Test",
  busType: "sleeper",
  originCity: "Mumbai",
  destCity: "Bengaluru",
  originStop: { id: 1, name: "Stop", city: "Mumbai", lat: 0, lon: 0, type: "bus_stop" },
  destStop: { id: 2, name: "Stop", city: "Bengaluru", lat: 0, lon: 0, type: "bus_stop" },
  departureTime: "20:00",
  arrivalTime: "08:00",
  durationHrs: 12,
  fareInr: 1000,
  availableSeats: 10,
  amenities: [],
  rating: 4.5,
  mode: "bus",
};

describe("Pricing Engine: Master Engine", () => {
  it("calculates complex pricing scenario with all strategies applied", () => {
    // Ride: 5 km (qualifies for feeder, which is ₹50 / 5000 paisa)
    // Base ride fare: ₹200 (20000 paisa)
    const ride: RideQuote = { distanceKm: 5, durationMinutes: 15, baseFareInr: 20000 };
    const user: UserProfile = { id: "u1", membershipPlan: "plus" }; // caps ride at ₹20 (2000 paisa)
    
    // Booking time: 10:00 AM, departure 20:00 (10 hours ahead -> 10% discount applies)
    const bookingTime = new Date("2023-10-01T10:00:00");

    const result = computeDoorToDoorPrice({ bus: mockBus, ride, user, bookingTime });

    // Step 1: Feeder
    // Feeder (5km) is available for 5000 paisa. Ride cost is 20000. Feeder applies.
    // Effective ride cost = 5000 paisa. Feeder discount = 15000.
    expect(result.feederDiscount).toBe(15000);
    expect(result.strategiesApplied).toContain("feeder_shuttle");

    // Step 2: Cross Subsidy
    // Bus fare = 100000 paisa. Commission = 5000 paisa. Max subsidy from commission = 2500.
    // Max subsidy from ride (5000) = 2000.
    // Subsidy = min(2500, 2000) = 2000.
    expect(result.crossSubsidy).toBe(2000);
    expect(result.strategiesApplied).toContain("cross_subsidy");

    // Step 3: Bundle
    // Actual ride fare charged (pre-membership) = 5000 - 2000 = 3000.
    // Bundle total (pre-membership) = 100000 + 3000 = 103000.

    // Step 4: Membership
    // Ride fare (3000) > cap (2000). Cap applies. Cap savings = 1000.
    // Ride fare becomes 2000. Total becomes 102000.
    expect(result.rideFare).toBe(2000);
    expect(result.membershipCap).toBe(1000);
    expect(result.strategiesApplied).toContain("membership_cap");

    // Step 5: Advance Booking
    // 10% off of 102000 = 10200.
    // Final total = 102000 - 10200 = 91800.
    expect(result.advanceDiscount).toBe(10200);
    expect(result.total).toBe(91800);
    expect(result.strategiesApplied).toContain("advance_booking");
  });

  it("calculates basic scenario without feeder, membership, or advance booking", () => {
    // Ride: 10 km (too far for feeder)
    // Base ride fare: ₹300 (30000 paisa)
    const ride: RideQuote = { distanceKm: 10, durationMinutes: 30, baseFareInr: 30000 };
    const user: UserProfile = { id: "u2", membershipPlan: "free" }; 
    
    // Booking time: 18:00, departure 20:00 (2 hours ahead -> no discount)
    const bookingTime = new Date("2023-10-01T18:00:00");

    const result = computeDoorToDoorPrice({ bus: mockBus, ride, user, bookingTime });

    expect(result.feederDiscount).toBe(0); // No feeder
    
    // Bus fare = 100000 paisa. Commission = 5000 paisa. Max subsidy from commission = 2500.
    // Max subsidy from ride (30000) = 12000.
    // Subsidy = min(2500, 12000) = 2500.
    expect(result.crossSubsidy).toBe(2500);

    // Ride fare = 30000 - 2500 = 27500.
    expect(result.rideFare).toBe(27500);

    expect(result.membershipCap).toBe(0);
    expect(result.advanceDiscount).toBe(0);

    expect(result.total).toBe(127500); // 100000 + 27500
  });
});
