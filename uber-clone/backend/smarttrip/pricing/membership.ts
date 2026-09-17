/**
 * Membership Pricing Strategy
 *
 * Plan 'plus' (₹99/mo) caps pickup fare at ₹20 (2000 paisa)
 */

import type { FareBreakdown, UserProfile } from "./types";

const PLUS_MEMBERSHIP_CAP_PAISA = 2000; // ₹20.00

export function applyMembership(
  currentBreakdown: FareBreakdown,
  user: UserProfile
): FareBreakdown {
  if (user.membershipPlan === "plus" || user.membershipPlan === "premium") {
    if (currentBreakdown.rideFare > PLUS_MEMBERSHIP_CAP_PAISA) {
      const capSavings = currentBreakdown.rideFare - PLUS_MEMBERSHIP_CAP_PAISA;

      return {
        ...currentBreakdown,
        rideFare: PLUS_MEMBERSHIP_CAP_PAISA,
        membershipCap: capSavings,
        total: currentBreakdown.total - capSavings,
        strategiesApplied: [...currentBreakdown.strategiesApplied, "membership_cap"],
      };
    }
  }

  return currentBreakdown;
}
