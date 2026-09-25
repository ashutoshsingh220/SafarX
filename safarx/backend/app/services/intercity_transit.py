import math
from typing import Literal, TypedDict
from app.services.transit_hubs import haversine_km, HubInfo


class IntercityLegEstimate(TypedDict):
    mode: str
    operator: str
    distance_km: float
    duration_minutes: int
    fare: float
    description: str
    vehicle_icon: str


def calculate_train_leg(origin_hub: HubInfo, dest_hub: HubInfo, train_class: str = "3A") -> IntercityLegEstimate:
    """Calculate realistic train distance, duration, and IRCTC tariff."""
    straight_km = haversine_km(
        origin_hub["latitude"], origin_hub["longitude"],
        dest_hub["latitude"], dest_hub["longitude"]
    )
    rail_dist_km = max(50.0, round(straight_km * 1.25, 0))

    # Standard Indian Railways telescopic passenger tariffs
    if train_class == "SL":
        fare = 120.0 + rail_dist_km * 0.40
        class_name = "Sleeper (SL)"
    elif train_class == "2A":
        fare = 560.0 + rail_dist_km * 1.35
        class_name = "2nd AC (2A)"
    else:  # 3A
        fare = 380.0 + rail_dist_km * 0.95
        class_name = "3rd AC (3A)"

    # Average Indian Superfast express speed: ~58 km/h
    duration_minutes = int((rail_dist_km / 58.0) * 60) + 45

    return {
        "mode": "TRAIN",
        "operator": f"Indian Railways ({origin_hub['code']} - {dest_hub['code']} Superfast Express)",
        "distance_km": rail_dist_km,
        "duration_minutes": duration_minutes,
        "fare": round(fare, 0),
        "description": f"Direct long-haul train via {class_name}",
        "vehicle_icon": "train",
    }


def calculate_flight_leg(origin_airport: HubInfo, dest_airport: HubInfo) -> IntercityLegEstimate:
    """Calculate commercial domestic flight flight-time and fare."""
    flight_dist_km = haversine_km(
        origin_airport["latitude"], origin_airport["longitude"],
        dest_airport["latitude"], dest_airport["longitude"]
    )
    flight_dist_km = max(100.0, round(flight_dist_km, 0))

    # Domestic aviation fare: Base ₹2,800 + ₹2.4/km
    fare = 2800.0 + (flight_dist_km * 2.4)

    # Flight duration: Air cruising time (~700 km/h) + 100 min security/boarding & taxi
    air_minutes = int((flight_dist_km / 680.0) * 60)
    duration_minutes = air_minutes + 100

    return {
        "mode": "FLIGHT",
        "operator": f"IndiGo / Air India ({origin_airport['code']} -> {dest_airport['code']})",
        "distance_km": flight_dist_km,
        "duration_minutes": duration_minutes,
        "fare": round(fare, 0),
        "description": f"Express commercial domestic flight to {dest_airport['name']}",
        "vehicle_icon": "flight",
    }


def calculate_bus_leg(origin_bus_hub: HubInfo, dest_bus_hub: HubInfo) -> IntercityLegEstimate:
    """Calculate intercity sleeper bus duration and tariff."""
    road_dist_km = haversine_km(
        origin_bus_hub["latitude"], origin_bus_hub["longitude"],
        dest_bus_hub["latitude"], dest_bus_hub["longitude"]
    )
    road_dist_km = max(50.0, round(road_dist_km * 1.22, 0))

    # AC Sleeper bus rate: ~₹1.35/km
    fare = max(350.0, road_dist_km * 1.35)

    # Average highway bus cruising speed: ~50 km/h + rest stops
    duration_minutes = int((road_dist_km / 50.0) * 60) + 120

    return {
        "mode": "BUS",
        "operator": f"IntrCity SmartBus / Zingbus Multi-Axle AC Sleeper",
        "distance_km": road_dist_km,
        "duration_minutes": duration_minutes,
        "fare": round(fare, 0),
        "description": "Overnight/Long-distance AC Sleeper with onboard amenities",
        "vehicle_icon": "bus",
    }


def calculate_direct_outstation_cab(
    orig_lat: float, orig_lon: float,
    dest_lat: float, dest_lon: float,
    orig_name: str, dest_name: str
) -> IntercityLegEstimate:
    """Calculate direct door-to-door private outstation cab drive."""
    dist_km = haversine_km(orig_lat, orig_lon, dest_lat, dest_lon)
    road_dist_km = max(20.0, round(dist_km * 1.25, 0))

    # Outstation cab: ₹16/km + driver allowance ₹500/day + toll estimates
    days = max(1, int(road_dist_km / 600) + 1)
    fare = (road_dist_km * 16.0) + (days * 500.0) + (road_dist_km * 1.5)  # tolls

    # Average long-distance drive speed: 60 km/h with fuel/food stops
    duration_minutes = int((road_dist_km / 58.0) * 60) + (days * 90)

    return {
        "mode": "CAB",
        "operator": "SafarX Outstation Private AC Sedan",
        "distance_km": road_dist_km,
        "duration_minutes": duration_minutes,
        "fare": round(fare, 0),
        "description": f"Private door-to-door drive without changing vehicles from {orig_name} to {dest_name}",
        "vehicle_icon": "car",
    }
