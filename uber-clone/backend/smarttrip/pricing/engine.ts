/**
 * Master Pricing Engine
 *
 * Combines all pricing strategies in order to compute the final door-to-door price breakdown.
 */

import type { BusOption } from "../search/types";
import type { RideQuote, UserProfile, FareBreakdown } from "./types";
import { computeFeederFare } from "./feeder";
import { computeCrossSubsidy } from "./crossSubsidy";
import { computeBundle } from "./bundle";
import { applyMembership } from "./membership";
import { applyAdvanceBookingDiscount } from "./advanceBooking";

export function computeDoorToDoorPrice(input: {
  bus: BusOption;
  ride: RideQuote;
  user: UserProfile;
  bookingTime: Date;
  passengers?: number;
}): FareBreakdown {
  const passengers = input.passengers ?? 1;
  const busFarePaisa = input.bus.fareInr * 100 * passengers;
  const rideCostPaisa = input.ride.baseFareInr * passengers;

  // 1. Feeder Strategy
  const feeder = computeFeederFare(input.ride.distanceKm, passengers);
  let effectiveRideCost = rideCostPaisa;
  let feederDiscount = 0;
  let strategies: string[] = [];

  if (feeder.isFeederAvailable && feeder.feederFare < rideCostPaisa) {
    feederDiscount = rideCostPaisa - feeder.feederFare;
    effectiveRideCost = feeder.feederFare;
    strategies.push("feeder_shuttle");
  }

  // 2. Cross-Subsidy
  const subsidyInfo = computeCrossSubsidy(busFarePaisa, effectiveRideCost);
  if (subsidyInfo.subsidy > 0) {
    strategies.push("cross_subsidy");
  }

  // 3. Bundle calculation (pre-membership)
  const bundleTotal = computeBundle(busFarePaisa, effectiveRideCost, subsidyInfo.subsidy);
  const actualRideFareCharged = effectiveRideCost - subsidyInfo.subsidy;

  let breakdown: FareBreakdown = {
    busFare: busFarePaisa,
    rideFare: actualRideFareCharged,
    feederDiscount,
    crossSubsidy: subsidyInfo.subsidy,
    membershipCap: 0,
    advanceDiscount: 0,
    total: bundleTotal,
    currency: "INR",
    strategiesApplied: strategies,
  };

  // 4. Membership Cap
  breakdown = applyMembership(breakdown, input.user);

  // 5. Advance Booking Discount
  // Parse departure time from "HH:MM" relative to the date of booking (mock logic assuming same/next day)
  // For a robust system, we'd need the full departure datetime.
  // We'll mock a departure date by taking the booking date and setting the time.
  const [depHours, depMins] = input.bus.departureTime.split(":").map(Number);
  const departureDate = new Date(input.bookingTime);
  departureDate.setHours(depHours, depMins, 0, 0);

  // If the parsed departure is before booking, it means it's the next day
  if (departureDate < input.bookingTime) {
    departureDate.setDate(departureDate.getDate() + 1);
  }

  breakdown = applyAdvanceBookingDiscount(breakdown, input.bookingTime, departureDate);

  return breakdown;
}
