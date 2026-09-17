/**
 * Advance Booking Pricing Strategy
 *
 * 10% off the total bundle if the booking is made >= 6 hours ahead of the trip departure time.
 */

import type { FareBreakdown } from "./types";

const ADVANCE_BOOKING_DISCOUNT_PERCENT = 0.10;
const ADVANCE_BOOKING_THRESHOLD_HOURS = 6;

export function applyAdvanceBookingDiscount(
  currentBreakdown: FareBreakdown,
  bookingTime: Date,
  departureTime: Date
): FareBreakdown {
  const hoursAhead = (departureTime.getTime() - bookingTime.getTime()) / (1000 * 60 * 60);

  if (hoursAhead >= ADVANCE_BOOKING_THRESHOLD_HOURS) {
    const discountAmount = Math.floor(currentBreakdown.total * ADVANCE_BOOKING_DISCOUNT_PERCENT);

    return {
      ...currentBreakdown,
      advanceDiscount: discountAmount,
      total: currentBreakdown.total - discountAmount,
      strategiesApplied: [...currentBreakdown.strategiesApplied, "advance_booking"],
    };
  }

  return currentBreakdown;
}
