/**
 * SmartTrip Pricing Types
 *
 * Types used across the 5-strategy pricing engine.
 */

import type { BusOption } from "../search/types";

// Subset of User for pricing engine (e.g. from clerk / db)
export interface UserProfile {
  id: string;
  membershipPlan: "free" | "plus" | "premium";
}

// Result from Geoapify/OSRM for the last-mile ride
export interface RideQuote {
  distanceKm: number;
  durationMinutes: number;
  // Estimated raw fare based on time/distance (before any discounts)
  baseFareInr: number;
}

// The output of the pricing engine
export interface FareBreakdown {
  busFare: number;
  rideFare: number;
  feederDiscount: number; // e.g. saved by using shuttle vs base ride fare
  crossSubsidy: number;
  membershipCap: number; // amount discounted due to cap
  advanceDiscount: number;
  total: number;
  currency: "INR";
  strategiesApplied: string[];
}
