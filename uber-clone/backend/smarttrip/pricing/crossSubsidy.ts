/**
 * Cross-Subsidy Pricing Strategy
 *
 * Subsidizes the last-mile ride using the commission earned from the intercity bus fare.
 * subsidy = min(bus_commission * 0.5, ride_cost * 0.4)
 * (bus_commission = 5% of bus fare)
 */

export function computeCrossSubsidy(
  busFarePaisa: number,
  rideCostPaisa: number
): { subsidy: number; busCommission: number } {
  // Commission we make from the bus operator (assumed 5%)
  const busCommission = Math.floor(busFarePaisa * 0.05);

  // We are willing to give up to 50% of our commission to subsidize the ride,
  // but we won't subsidize more than 40% of the actual ride cost.
  const maxSubsidyFromCommission = Math.floor(busCommission * 0.5);
  const maxSubsidyFromRide = Math.floor(rideCostPaisa * 0.4);

  const subsidy = Math.min(maxSubsidyFromCommission, maxSubsidyFromRide);

  return {
    subsidy,
    busCommission,
  };
}
