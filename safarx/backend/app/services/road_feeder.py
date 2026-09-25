import json
import logging
import math
import os
import urllib.parse
import urllib.request
from typing import Literal, Optional, TypedDict
from dotenv import load_dotenv
from app.services.transit_hubs import haversine_km

load_dotenv()
logger = logging.getLogger(__name__)

_GOOGLE_DIRECTIONS_CACHE: dict[str, tuple[float, int]] = {}


class FeederEstimate(TypedDict):
    distance_km: float
    duration_minutes: int
    fare: float
    mode: str
    operator: str
    description: str


def calculate_road_trip_google(
    start_lat: float,
    start_lon: float,
    end_lat: float,
    end_lon: float,
) -> Optional[tuple[float, int]]:
    """Calculate authentic driving road distance (km) and driving duration (minutes) via Google Directions API."""
    if not (start_lat and start_lon and end_lat and end_lon):
        return None

    # Round coordinates to 4 decimal places (~11m precision) for stable caching
    cache_key = f"{round(start_lat, 4)},{round(start_lon, 4)}->{round(end_lat, 4)},{round(end_lon, 4)}"
    if cache_key in _GOOGLE_DIRECTIONS_CACHE:
        return _GOOGLE_DIRECTIONS_CACHE[cache_key]

    api_key = os.getenv("GOOGLE_MAPS_API_KEY") or os.getenv("EXPO_PUBLIC_GOOGLE_API_KEY")
    if not api_key:
        return None

    try:
        url = (
            f"https://maps.googleapis.com/maps/api/directions/json"
            f"?origin={start_lat},{start_lon}"
            f"&destination={end_lat},{end_lon}"
            f"&mode=driving"
            f"&key={api_key}"
        )
        req = urllib.request.Request(url, headers={"User-Agent": "SmartTrip/3.0"})
        with urllib.request.urlopen(req, timeout=4.0) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        if data.get("status") == "OK" and data.get("routes"):
            route = data["routes"][0]
            legs = route.get("legs", [])
            if legs:
                total_meters = sum(l.get("distance", {}).get("value", 0) for l in legs)
                total_secs = sum(l.get("duration", {}).get("value", 0) for l in legs)
                dist_km = round(total_meters / 1000.0, 1)
                dur_mins = max(5, int(total_secs / 60))
                result = (dist_km, dur_mins)
                _GOOGLE_DIRECTIONS_CACHE[cache_key] = result
                logger.info(f"Google Directions: {cache_key} -> {dist_km} km, {dur_mins} mins")
                return result
    except Exception as exc:
        logger.warning(f"Google Directions API call failed for {cache_key}: {exc}")

    return None


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
    # 1. Attempt live Google Directions calculation
    google_res = calculate_road_trip_google(start_lat, start_lon, end_lat, end_lon)
    if google_res:
        road_distance_km, base_duration_mins = google_res
    else:
        straight_dist_km = haversine_km(start_lat, start_lon, end_lat, end_lon)
        # Urban road winding factor (approx 1.25x to 1.35x of straight-line)
        road_distance_km = max(1.0, round(straight_dist_km * 1.3, 1))
        base_duration_mins = None

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
        operator = "SafarX Shared Feeder"
        desc = "Scheduled high-frequency shared feeder"

    if base_duration_mins is not None:
        if mode == "AUTO":
            duration_minutes = max(8, int(base_duration_mins * 1.05))
        elif mode == "E_RICKSHAW":
            duration_minutes = max(10, int(base_duration_mins * 1.40))
        elif mode == "CAB":
            duration_minutes = max(8, base_duration_mins)
        else:  # SHUTTLE
            duration_minutes = max(12, int(base_duration_mins * 1.15))
    else:
        duration_minutes = max(10, int((road_distance_km / avg_speed_kmh) * 60) + 5)

    return {
        "distance_km": road_distance_km,
        "duration_minutes": duration_minutes,
        "fare": round(fare, 0),
        "mode": mode,
        "operator": operator,
        "description": desc,
    }
