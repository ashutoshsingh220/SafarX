from datetime import datetime, timedelta

def calculate_bus_commission(bus_fare: float, commission_rate: float = 0.05) -> float:
    return bus_fare * commission_rate

def apply_pricing_strategies(
    feeder_fare: float,
    bus_fare: float,
    is_smarttrip_plus: bool,
    booking_time: datetime,
    travel_time: datetime,
    is_high_demand_corridor: bool = False
) -> dict:
    """
    Applies the 5 financial strategies:
    S1: Feeder shuttles flat fare on high demand ~50
    S2: Cross-subsidy
    S3: Bundle pricing
    S4: Membership cap
    S5: Early booking
    """
    # Base ride cost
    ride_cost = feeder_fare
    
    # S1: Feeder Shuttles flat fare
    if is_high_demand_corridor:
        ride_cost = min(ride_cost, 50.0)

    # S5: Early Booking
    time_diff = travel_time - booking_time
    if time_diff >= timedelta(hours=6):
        ride_cost *= 0.90 # 10% off last-mile

    # S4: Membership SmartTrip Plus
    if is_smarttrip_plus:
        ride_cost = min(ride_cost, 20.0)

    # S2: Cross-subsidy from bus commission
    bus_commission = calculate_bus_commission(bus_fare)
    subsidy = min(bus_commission * 0.5, ride_cost * 0.4)

    # S3: Bundle Pricing
    final_ride_cost = ride_cost - subsidy
    bundle_price = bus_fare + final_ride_cost

    return {
        "original_feeder_fare": feeder_fare,
        "original_bus_fare": bus_fare,
        "bus_commission": bus_commission,
        "subsidy": subsidy,
        "final_ride_cost": final_ride_cost,
        "bundle_price": bundle_price
    }
