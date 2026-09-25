"""SmartTrip's transparent S1-S5 bundle-pricing rules."""

from datetime import datetime, timedelta

from app.schemas import PricingBreakdown

BUS_COMMISSION_RATE = 0.05
HIGH_DEMAND_SHUTTLE_FARE = 50.0
SMARTTRIP_PLUS_RIDE_CAP = 20.0
EARLY_BOOKING_MINIMUM = timedelta(hours=6)
EARLY_BOOKING_DISCOUNT = 0.10


def calculate_bus_commission(bus_fare: float, commission_rate: float = BUS_COMMISSION_RATE) -> float:
    return round(bus_fare * commission_rate, 2)


def apply_pricing_strategies(
    *,
    feeder_fare: float,
    bus_fare: float,
    is_smarttrip_plus: bool,
    booking_time: datetime,
    travel_time: datetime,
    is_high_demand_corridor: bool = False,
) -> PricingBreakdown:
    """Calculate one price breakdown using the five specified financial rules.

    S1: high-demand feeder routes are capped at INR 50.
    S2: subsidy = min(50% of bus commission, 40% of current ride price).
    S3: present bus plus discounted last-mile as one bundle.
    S4: SmartTrip Plus members have their pre-subsidy ride capped at INR 20.
    S5: bookings at least six hours ahead receive 10% off the last-mile ride.
    """
    if feeder_fare < 0 or bus_fare < 0:
        raise ValueError("Fares cannot be negative")

    feeder_after_shuttle = min(feeder_fare, HIGH_DEMAND_SHUTTLE_FARE) if is_high_demand_corridor else feeder_fare
    is_early_booking = travel_time - booking_time >= EARLY_BOOKING_MINIMUM
    feeder_after_early_booking = round(
        feeder_after_shuttle * (1 - EARLY_BOOKING_DISCOUNT) if is_early_booking else feeder_after_shuttle,
        2,
    )
    feeder_after_membership = min(feeder_after_early_booking, SMARTTRIP_PLUS_RIDE_CAP) if is_smarttrip_plus else feeder_after_early_booking
    commission = calculate_bus_commission(bus_fare)
    subsidy = round(min(commission * 0.5, feeder_after_membership * 0.4), 2)
    final_ride_cost = round(max(0.0, feeder_after_membership - subsidy), 2)

    return PricingBreakdown(
        original_feeder_fare=round(feeder_fare, 2),
        original_bus_fare=round(bus_fare, 2),
        feeder_after_shuttle=round(feeder_after_shuttle, 2),
        feeder_after_early_booking=feeder_after_early_booking,
        feeder_after_membership=round(feeder_after_membership, 2),
        bus_commission=commission,
        subsidy=subsidy,
        final_ride_cost=final_ride_cost,
        bundle_price=round(bus_fare + final_ride_cost, 2),
        applied_feeder_shuttle=is_high_demand_corridor,
        applied_early_booking=is_early_booking,
        applied_membership_cap=is_smarttrip_plus and feeder_after_early_booking > SMARTTRIP_PLUS_RIDE_CAP,
    )
