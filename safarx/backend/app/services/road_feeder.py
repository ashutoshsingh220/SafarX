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

GOOGLE_API_HEADERS = {
    "User-Agent": "SafarX/3.0",
    "X-Android-Package": "com.ashukharayat.uberclone",
    "X-Android-Cert": "9E013D154716FFBD112ECA1E2C178CBFB0023848",
}

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
        req = urllib.request.Request(url, headers=GOOGLE_API_HEADERS)
        with urllib.request.urlopen(req, timeout=4.5) as resp:
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
    mode: str = "AUTO",
    start_name: str = "Origin",
    end_name: str = "Transit Hub",
    leg_type: Literal["FIRST_MILE", "LAST_MILE"] = "FIRST_MILE",
    is_hill: bool = False,
    is_remote: bool = False,
) -> FeederEstimate:
    """Calculate realistic road distance, duration, and tariff for first/last-mile feeder across plains and hill states."""
    # 1. Attempt live Google Directions calculation
    google_res = calculate_road_trip_google(start_lat, start_lon, end_lat, end_lon)
    if google_res:
        road_distance_km, base_duration_mins = google_res
    else:
        straight_dist_km = haversine_km(start_lat, start_lon, end_lat, end_lon)
        factor = 1.65 if is_hill else (1.4 if is_remote else 1.25)
        road_distance_km = max(1.0, round(straight_dist_km * factor, 1))
        base_duration_mins = None

    # 2. Hill and Remote long-distance routing adjustments
    if is_hill or (road_distance_km > 25.0 and mode not in ["CAB", "AUTO"]):
        avg_speed_kmh = 24.0 if is_hill else 42.0
        if mode in ["SHARED_SUMO", "SHUTTLE"]:
            fare = max(120.0, round(road_distance_km * 2.5, 0))
            operator = "Mountain Shared Sumo / Bolero 4x4" if is_hill else "Regional Shared Shuttle"
            desc = f"Shared mountain shuttle from {start_name} to {end_name}"
            res_mode = "CAB"
        else:
            fare = max(250.0, round(250.0 + max(0.0, road_distance_km - 5.0) * 18.0, 0))
            operator = "Mountain Feeder Taxi / Bolero 4x4" if is_hill else "Regional Feeder Sedan"
            desc = f"Private door-to-door mountain cab from {start_name} to {end_name}"
            res_mode = "CAB"
    elif road_distance_km > 25.0:
        # Long distance on plains: Auto is not suitable for >25 km
        avg_speed_kmh = 45.0
        fare = max(150.0, round(120.0 + max(0.0, road_distance_km - 5.0) * 16.0, 0))
        operator = "Regional Feeder Cab"
        desc = f"Outstation feeder cab from {start_name} to {end_name}"
        res_mode = "CAB"
    elif mode == "AUTO":
        avg_speed_kmh = 24.0
        if road_distance_km <= 1.5:
            fare = 30.0
        else:
            fare = 30.0 + (road_distance_km - 1.5) * 15.0
        operator = "Uber Auto / Local Auto"
        desc = f"Direct 3-wheeler auto to {end_name}"
        res_mode = "AUTO"
    elif mode == "CAB":
        avg_speed_kmh = 28.0
        if road_distance_km <= 3.0:
            fare = 70.0
        else:
            fare = 70.0 + (road_distance_km - 3.0) * 20.0
        operator = "Uber Go / Sedan"
        desc = f"AC Cab pickup with luggage boot to {end_name}"
        res_mode = "CAB"
    elif mode == "E_RICKSHAW":
        avg_speed_kmh = 16.0
        if road_distance_km <= 2.0:
            fare = 25.0
        else:
            fare = 25.0 + (road_distance_km - 2.0) * 12.0
        operator = "Local E-Rickshaw"
        desc = f"Eco-friendly local transit to {end_name}"
        res_mode = "E_RICKSHAW"
    else:
        avg_speed_kmh = 22.0
        fare = 50.0
        operator = "SafarX Feeder Shuttle"
        desc = f"High-frequency feeder to {end_name}"
        res_mode = "AUTO"

    if base_duration_mins is not None:
        if is_hill:
            duration_minutes = max(15, int(base_duration_mins * 1.05))
        elif res_mode == "AUTO":
            duration_minutes = max(8, int(base_duration_mins * 1.05))
        elif res_mode == "E_RICKSHAW":
            duration_minutes = max(10, int(base_duration_mins * 1.40))
        else:
            duration_minutes = max(8, base_duration_mins)
    else:
        duration_minutes = max(10, int((road_distance_km / avg_speed_kmh) * 60) + 5)

    return {
        "distance_km": road_distance_km,
        "duration_minutes": duration_minutes,
        "fare": round(fare, 0),
        "mode": res_mode,
        "operator": operator,
        "description": desc,
    }
