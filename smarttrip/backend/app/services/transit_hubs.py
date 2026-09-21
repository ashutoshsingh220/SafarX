import math
from typing import Literal, TypedDict


class HubInfo(TypedDict):
    name: str
    code: str
    city: str
    state: str
    hub_type: str
    latitude: float
    longitude: float


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance between two GPS coordinates in kilometers."""
    radius_km = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    )
    return radius_km * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# Curated high-performance registry of key Indian commercial transit nodes
INDIAN_TRANSIT_HUBS: list[HubInfo] = [
    # --- RAILWAY JUNCTIONS ---
    {
        "name": "Pune Junction",
        "code": "PUNE",
        "city": "Pune",
        "state": "Maharashtra",
        "hub_type": "RAILWAY_STATION",
        "latitude": 18.5284,
        "longitude": 73.8744,
    },
    {
        "name": "Haridwar Junction",
        "code": "HW",
        "city": "Haridwar",
        "state": "Uttarakhand",
        "hub_type": "RAILWAY_STATION",
        "latitude": 29.9463,
        "longitude": 78.1565,
    },
    {
        "name": "Dehradun Railway Station",
        "code": "DDN",
        "city": "Dehradun",
        "state": "Uttarakhand",
        "hub_type": "RAILWAY_STATION",
        "latitude": 30.3180,
        "longitude": 78.0322,
    },
    {
        "name": "Rishikesh Yog Nagari",
        "code": "YNRK",
        "city": "Rishikesh",
        "state": "Uttarakhand",
        "hub_type": "RAILWAY_STATION",
        "latitude": 30.0869,
        "longitude": 78.2882,
    },
    {
        "name": "New Delhi Railway Station",
        "code": "NDLS",
        "city": "Delhi",
        "state": "Delhi",
        "hub_type": "RAILWAY_STATION",
        "latitude": 28.6429,
        "longitude": 77.2195,
    },
    {
        "name": "Hazrat Nizamuddin Railway Station",
        "code": "NZM",
        "city": "Delhi",
        "state": "Delhi",
        "hub_type": "RAILWAY_STATION",
        "latitude": 28.5892,
        "longitude": 77.2530,
    },
    {
        "name": "Mumbai CSMT",
        "code": "CSMT",
        "city": "Mumbai",
        "state": "Maharashtra",
        "hub_type": "RAILWAY_STATION",
        "latitude": 18.9401,
        "longitude": 72.8354,
    },
    {
        "name": "KSR Bengaluru City Junction",
        "code": "SBC",
        "city": "Bengaluru",
        "state": "Karnataka",
        "hub_type": "RAILWAY_STATION",
        "latitude": 12.9778,
        "longitude": 77.5667,
    },
    {
        "name": "Jaipur Junction",
        "code": "JP",
        "city": "Jaipur",
        "state": "Rajasthan",
        "hub_type": "RAILWAY_STATION",
        "latitude": 26.9200,
        "longitude": 75.7878,
    },
    {
        "name": "Ahmedabad Junction",
        "code": "ADI",
        "city": "Ahmedabad",
        "state": "Gujarat",
        "hub_type": "RAILWAY_STATION",
        "latitude": 23.0232,
        "longitude": 72.6009,
    },
    {
        "name": "Lucknow Charbagh",
        "code": "LKO",
        "city": "Lucknow",
        "state": "Uttar Pradesh",
        "hub_type": "RAILWAY_STATION",
        "latitude": 26.8317,
        "longitude": 80.9234,
    },

    # --- COMMERCIAL AIRPORTS ---
    {
        "name": "Pune International Airport",
        "code": "PNQ",
        "city": "Pune",
        "state": "Maharashtra",
        "hub_type": "AIRPORT",
        "latitude": 18.5822,
        "longitude": 73.9197,
    },
    {
        "name": "Dehradun Jolly Grant Airport",
        "code": "DED",
        "city": "Dehradun",
        "state": "Uttarakhand",
        "hub_type": "AIRPORT",
        "latitude": 30.1897,
        "longitude": 78.1803,
    },
    {
        "name": "Indira Gandhi International Airport",
        "code": "DEL",
        "city": "Delhi",
        "state": "Delhi",
        "hub_type": "AIRPORT",
        "latitude": 28.5562,
        "longitude": 77.1000,
    },
    {
        "name": "Chhatrapati Shivaji Maharaj International Airport",
        "code": "BOM",
        "city": "Mumbai",
        "state": "Maharashtra",
        "hub_type": "AIRPORT",
        "latitude": 19.0896,
        "longitude": 72.8656,
    },
    {
        "name": "Kempegowda International Airport",
        "code": "BLR",
        "city": "Bengaluru",
        "state": "Karnataka",
        "hub_type": "AIRPORT",
        "latitude": 13.1986,
        "longitude": 77.7066,
    },

    # --- INTERSTATE BUS TERMINALS ---
    {
        "name": "Pune Swargate Bus Terminal",
        "code": "PUN-SGT",
        "city": "Pune",
        "state": "Maharashtra",
        "hub_type": "BUS_TERMINAL",
        "latitude": 18.5018,
        "longitude": 73.8586,
    },
    {
        "name": "Pune Wakad Bus Stand",
        "code": "PUN-WKD",
        "city": "Pune",
        "state": "Maharashtra",
        "hub_type": "BUS_TERMINAL",
        "latitude": 18.5987,
        "longitude": 73.7628,
    },
    {
        "name": "Haridwar Inter-State Bus Stand (ISBT)",
        "code": "HW-ISBT",
        "city": "Haridwar",
        "state": "Uttarakhand",
        "hub_type": "BUS_TERMINAL",
        "latitude": 29.9360,
        "longitude": 78.1432,
    },
    {
        "name": "Dehradun ISBT",
        "code": "DDN-ISBT",
        "city": "Dehradun",
        "state": "Uttarakhand",
        "hub_type": "BUS_TERMINAL",
        "latitude": 30.2858,
        "longitude": 77.9984,
    },
    {
        "name": "Kashmere Gate ISBT Delhi",
        "code": "DEL-ISBT",
        "city": "Delhi",
        "state": "Delhi",
        "hub_type": "BUS_TERMINAL",
        "latitude": 28.6675,
        "longitude": 77.2285,
    },
]


def find_nearest_hub(
    lat: float,
    lon: float,
    hub_type: Literal["RAILWAY_STATION", "AIRPORT", "BUS_TERMINAL"],
) -> tuple[HubInfo, float]:
    """Find the closest transit hub of given type to the coordinates.

    Returns:
        (HubInfo, distance_km)
    """
    candidates = [h for h in INDIAN_TRANSIT_HUBS if h["hub_type"] == hub_type]
    if not candidates:
        raise ValueError(f"No transit hubs registered for type {hub_type}")

    best_hub = None
    min_dist = float("inf")

    for hub in candidates:
        dist = haversine_km(lat, lon, hub["latitude"], hub["longitude"])
        if dist < min_dist:
            min_dist = dist
            best_hub = hub

    return best_hub, round(min_dist, 2)
