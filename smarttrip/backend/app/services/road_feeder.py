import math
from typing import Literal, TypedDict
from app.services.transit_hubs import haversine_km


class FeederEstimate(TypedDict):
    distance_km: float
    duration_minutes: int
    fare: float
    mode: str
    operator: str
    description: str


def calculate_feeder_trip(
    start_lat: float,
    start_lon: float,
    end_lat: float,
    end_lon: float,
    mode: Literal["AUTO", "CAB", "E_RICKSHAW", "SHUTTLE"] = "AUTO",
    start_name: str = "Origin",
    end_name: str = "Transit Hub",
    leg_type: Literal["FIRST_MILE", "LAST_MILE"] = "FIRST_MILE",
) -> FeederEstimate:
    """Calculate realistic road distance, duration, and tariff for first/last-mile feeder."""
    straight_dist_km = haversine_km(start_lat, start_lon, end_lat, end_lon)
    # Urban road winding factor (approx 1.25x to 1.35x of straight-line)
    road_distance_km = max(1.0, round(straight_dist_km * 1.3, 1))

    # Average city travel speed: ~25 km/h for auto, ~30 km/h for cab, ~18 km/h for e-rickshaw
    if mode == "AUTO":
        avg_speed_kmh = 24.0
        # ₹30 base for first 1.5 km + ₹15/km thereafter
        if road_distance_km <= 1.5:
            fare = 30.0
        else:
            fare = 30.0 + (road_distance_km - 1.5) * 15.0
        operator = "Uber Auto / Local Auto"
        desc = f"Direct 3-wheeler auto to {end_name}"

    elif mode == "CAB":
        avg_speed_kmh = 28.0
        # ₹70 base for first 3 km + ₹20/km thereafter
        if road_distance_km <= 3.0:
            fare = 70.0
        else:
            fare = 70.0 + (road_distance_km - 3.0) * 20.0
        operator = "Uber Go / Sedan"
        desc = f"AC Cab pickup with luggage boot"

    elif mode == "E_RICKSHAW":
        avg_speed_kmh = 16.0
        # ₹20 flat for first 2 km + ₹12/km thereafter (local station drop)
        if road_distance_km <= 2.0:
            fare = 25.0
        else:
            fare = 25.0 + (road_distance_km - 2.0) * 12.0
        operator = "Local E-Rickshaw"
        desc = f"Eco-friendly local transit to {end_name}"

    else:  # SHUTTLE
        avg_speed_kmh = 22.0
        fare = 50.0  # Shared corridor flat fare
        operator = "SmartTrip Shared Feeder"
        desc = "Scheduled high-frequency shared feeder"

    duration_minutes = max(10, int((road_distance_km / avg_speed_kmh) * 60) + 5)

    return {
        "distance_km": road_distance_km,
        "duration_minutes": duration_minutes,
        "fare": round(fare, 0),
        "mode": mode,
        "operator": operator,
        "description": desc,
    }
