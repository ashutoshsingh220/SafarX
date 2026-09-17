/**
 * Bundle Pricing Strategy
 *
 * bundle = bus_fare + discounted_ride - discount
 * In our engine, this calculates the initial bundle total before membership or advance booking rules.
 */

export function computeBundle(
  busFarePaisa: number,
  rideCostPaisa: number,
  crossSubsidyPaisa: number
): number {
  // Ensure we don't subsidize more than the ride cost
  const appliedSubsidy = Math.min(rideCostPaisa, crossSubsidyPaisa);
  const discountedRide = rideCostPaisa - appliedSubsidy;

  // Total bundle is bus fare plus whatever is left of the ride cost
  return busFarePaisa + discountedRide;
}
