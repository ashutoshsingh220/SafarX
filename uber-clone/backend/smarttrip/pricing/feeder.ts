/**
 * Feeder Shuttle Pricing Strategy
 *
 * Implements a shared shuttle flat fare strategy: ~₹50/seat on supported corridors.
 */

const FEEDER_FARE_PAISA = 5000; // ₹50.00
const MAX_FEEDER_DISTANCE_KM = 8; // Max distance to qualify for shuttle pricing

export function computeFeederFare(
  distanceKm: number,
  seatsRequested: number = 1
): { isFeederAvailable: boolean; feederFare: number } {
  // If the ride is too long, a feeder shuttle isn't appropriate
  if (distanceKm > MAX_FEEDER_DISTANCE_KM) {
    return {
      isFeederAvailable: false,
      feederFare: 0,
    };
  }

  // Otherwise, it's available at the flat rate per seat
  return {
    isFeederAvailable: true,
    feederFare: FEEDER_FARE_PAISA * seatsRequested,
  };
}
