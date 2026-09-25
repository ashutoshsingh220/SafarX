"""Async, mock-safe multimodal search services.

All real network integrations are only used when their corresponding mock flag
is disabled and the required local environment variables are present.
"""

import math
import json
from datetime import datetime, timedelta
from typing import Final

import httpx
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import Bus, FeederCorridor, Location
from app.schemas import BoardingPoint, DistanceEstimate, Journey, Leg, SearchRequest
from app.services.pricing import apply_pricing_strategies
from app.services.osrm import OSRMClient, OSRMClientError

CITY_AIRPORT_CODES: Final[dict[str, str]] = {
    "pune": "PNQ",
    "bangalore": "BLR",
    "bengaluru": "BLR",
}


class ExternalServiceError(RuntimeError):
    """Raised when an enabled external provider returns an unusable response."""


def _haversine_meters(start_lat: float, start_lon: float, end_lat: float, end_lon: float) -> float:
    radius_meters = 6_371_000
    phi_1, phi_2 = math.radians(start_lat), math.radians(end_lat)
    delta_phi = math.radians(end_lat - start_lat)
    delta_lambda = math.radians(end_lon - start_lon)
    value = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi_1) * math.cos(phi_2) * math.sin(delta_lambda / 2) ** 2
    )
    return radius_meters * 2 * math.atan2(math.sqrt(value), math.sqrt(1 - value))


async def find_nearest_boarding_point(
    db: AsyncSession | None, lat: float, lon: float
) -> BoardingPoint | None:
    """Find the closest seed boarding point using meter-based PostGIS distance."""
    if db is not None:
        try:
            user_point = func.ST_SetSRID(func.ST_MakePoint(lon, lat), 4326)
            distance_meters = func.ST_DistanceSphere(Location.geom, user_point).label("distance_meters")
            latitude = func.ST_Y(Location.geom).label("latitude")
            longitude = func.ST_X(Location.geom).label("longitude")
            result = await db.execute(
                select(Location, distance_meters, latitude, longitude)
                .where(Location.is_boarding_point.is_(True))
                .order_by(distance_meters)
                .limit(1)
            )
            row = result.first()
            if row is not None:
                location, distance, location_lat, location_lon = row
                return BoardingPoint(
                    id=location.id,
                    name=location.name,
                    city=location.city,
                    latitude=float(location_lat),
                    longitude=float(location_lon),
                    distance_meters=round(float(distance), 1),
                )
        except Exception:
            pass

    # Deterministic default boarding point for demo & offline mode
    return BoardingPoint(
        id=1,
        name="Wakad / Hinjewadi Bridge Boarding Hub",
        city="Pune",
        latitude=18.5987,
        longitude=73.7628,
        distance_meters=3200.0,
    )


async def get_distance_eta(
    start_lat: float, start_lon: float, end_lat: float, end_lon: float
) -> DistanceEstimate:
    """Use OSRM when enabled; otherwise preserve the local mock calculation."""
    if settings.USE_REAL_OSRM:
        try:
            route = await OSRMClient().get_route(
                {"lat": start_lat, "lon": start_lon}, {"lat": end_lat, "lon": end_lon}
            )
        except OSRMClientError as exc:
            raise ExternalServiceError(str(exc)) from exc
        return DistanceEstimate(
            distance_meters=route["distance_meters"],
            duration_seconds=round(route["duration_seconds"]),
            polyline=json.dumps(route["geometry"], separators=(",", ":")),
        )

    if settings.USE_MOCK_MAPS:
        distance = _haversine_meters(start_lat, start_lon, end_lat, end_lon)
        duration = max(60, int((distance / 1000) / 30 * 3600))
        return DistanceEstimate(
            distance_meters=round(distance, 1),
            duration_seconds=duration,
            polyline="mock-straight-line",
        )

    if not settings.GOOGLE_MAPS_API_KEY:
        raise ExternalServiceError("GOOGLE_MAPS_API_KEY is required when USE_MOCK_MAPS=false")

    params = {
        "origins": f"{start_lat},{start_lon}",
        "destinations": f"{end_lat},{end_lon}",
        "mode": "driving",
        "key": settings.GOOGLE_MAPS_API_KEY,
    }
    async with httpx.AsyncClient(timeout=settings.EXTERNAL_API_TIMEOUT_SECONDS) as client:
        response = await client.get(
            "https://maps.googleapis.com/maps/api/distancematrix/json", params=params
        )
    response.raise_for_status()
    payload = response.json()
    element = payload.get("rows", [{}])[0].get("elements", [{}])[0]
    if payload.get("status") != "OK" or element.get("status") != "OK":
        raise ExternalServiceError(f"Google Distance Matrix error: {payload.get('status', element.get('status'))}")
    return DistanceEstimate(
        distance_meters=float(element["distance"]["value"]),
        duration_seconds=int(element["duration"]["value"]),
    )


async def search_flights(from_city: str, to_city: str, travel_date: datetime) -> list[Leg]:
    """Search domestic flights using SerpApi Google Flights, or return deterministic flight for demo."""
    if settings.USE_MOCK_FLIGHTS or not settings.SERPAPI_API_KEY:
        departure = travel_date.replace(hour=18, minute=30, second=0, microsecond=0)
        return [
            Leg(
                mode="FLIGHT",
                start_location_name=f"{from_city} Airport",
                end_location_name=f"{to_city} Airport",
                start_time=departure,
                end_time=departure + timedelta(hours=1, minutes=25),
                duration_seconds=5_100,
                distance_meters=700_000,
                fare=3_850.0,
                operator="IndiGo / Air India Express",
                vehicle_id="6E-502",
                vehicle_icon="flight",
            )
        ]

    origin = CITY_AIRPORT_CODES.get(from_city.casefold())
    destination = CITY_AIRPORT_CODES.get(to_city.casefold())
    if not origin or not destination:
        departure = travel_date.replace(hour=18, minute=30, second=0, microsecond=0)
        return [
            Leg(
                mode="FLIGHT",
                start_location_name=f"{from_city} Airport",
                end_location_name=f"{to_city} Airport",
                start_time=departure,
                end_time=departure + timedelta(hours=1, minutes=25),
                duration_seconds=5_100,
                distance_meters=700_000,
                fare=3_850.0,
                operator="IndiGo / Air India Express",
                vehicle_id="6E-502",
                vehicle_icon="flight",
            )
        ]

    try:
        url = "https://serpapi.com/search.json"
        params = {
            "engine": "google_flights",
            "departure_id": origin,
            "arrival_id": destination,
            "outbound_date": travel_date.date().isoformat(),
            "currency": "INR",
            "hl": "en",
            "api_key": settings.SERPAPI_API_KEY,
        }
        async with httpx.AsyncClient(timeout=settings.EXTERNAL_API_TIMEOUT_SECONDS) as client:
            response = await client.get(url, params=params)
        response.raise_for_status()
        payload = response.json()
        best_flights = payload.get("best_flights", []) or payload.get("other_flights", [])
        legs: list[Leg] = []
        for index, item in enumerate(best_flights[:3], start=1):
            flights = item.get("flights", [])
            if not flights:
                continue
            first = flights[0]
            departure = travel_date.replace(hour=8, minute=0, second=0, microsecond=0)
            dur_mins = item.get("total_duration", 120)
            legs.append(
                Leg(
                    mode="FLIGHT",
                    start_location_name=f"{origin} Airport",
                    end_location_name=f"{destination} Airport",
                    start_time=departure,
                    end_time=departure + timedelta(minutes=dur_mins),
                    duration_seconds=dur_mins * 60,
                    distance_meters=0,
                    fare=float(item.get("price", 5000.0)),
                    operator=first.get("airline", "IndiGo / Air India"),
                    vehicle_id=first.get("flight_number", f"FL-{index}"),
                    vehicle_icon="flight",
                )
            )
        return legs
    except Exception as exc:
        raise ExternalServiceError(f"SerpApi Google Flights error: {str(exc)}") from exc


def build_mock_train_journey(request: SearchRequest) -> Journey | None:
    departure = request.travel_date.replace(hour=19, minute=45, second=0, microsecond=0)
    leg = Leg(
        mode="TRAIN",
        start_location_name=f"{request.from_city} Junction",
        end_location_name=f"{request.to_city} Junction",
        start_time=departure,
        end_time=departure + timedelta(hours=10, minutes=15),
        duration_seconds=36_900,
        distance_meters=720_000,
        fare=1_180.0,
        operator="Indian Railways (Superfast Express)",
        vehicle_id="IR-12901",
        vehicle_icon="train",
    )
    return Journey(
        journey_id=f"train-{request.from_city.lower()[:3]}-{request.to_city.lower()[:3]}-01",
        total_fare=leg.fare,
        total_duration_seconds=leg.duration_seconds,
        legs=[leg],
        summary=f"Superfast Express train from {request.from_city} Junction to {request.to_city} Junction",
    )


async def _feeder_fare(db: AsyncSession | None, distance_meters: float) -> float:
    if db is not None:
        try:
            corridor_fare = await db.scalar(select(func.min(FeederCorridor.flat_fare)))
            if corridor_fare is not None:
                return float(corridor_fare)
        except Exception:
            pass
    return round(max(50.0, distance_meters / 1000 * 12), 2)


async def _is_high_demand_corridor(db: AsyncSession | None, boarding_point_id: int) -> bool:
    """Treat a seeded corridor endpoint as a high-demand shared-shuttle corridor."""
    if db is not None:
        try:
            corridor = await db.scalar(
                select(FeederCorridor.id)
                .where(
                    (FeederCorridor.start_location_id == boarding_point_id)
                    | (FeederCorridor.end_location_id == boarding_point_id)
                )
                .limit(1)
            )
            return corridor is not None
        except Exception:
            pass
    return False


async def search_journeys(db: AsyncSession | None, request: SearchRequest) -> list[Journey]:
    """Create ranked mock-safe bus, train, and flight journey options."""
    journeys: list[Journey] = []
    boarding_point = await find_nearest_boarding_point(db, request.from_lat, request.from_lon)

    if boarding_point:
        feeder_distance = await get_distance_eta(
            request.from_lat, request.from_lon, boarding_point.latitude, boarding_point.longitude
        )
        feeder_fare = await _feeder_fare(db, feeder_distance.distance_meters)
        high_demand_corridor = await _is_high_demand_corridor(db, boarding_point.id)
        feeder_start = request.travel_date
        feeder_end = feeder_start + timedelta(seconds=feeder_distance.duration_seconds)
        
        buses = []
        if db is not None:
            try:
                buses = (
                    await db.execute(select(Bus).order_by(Bus.base_fare.asc(), Bus.id.asc()).limit(3))
                ).scalars().all()
            except Exception:
                buses = []

        if not buses:
            class MockBus:
                def __init__(self, id, operator_name, bus_number, base_fare):
                    self.id = id
                    self.operator_name = operator_name
                    self.bus_number = bus_number
                    self.base_fare = base_fare

            buses = [
                MockBus(1, "Zingbus Premium AC Sleeper", "ZB-901", 850.0),
                MockBus(2, "IntrCity SmartBus Multi-Axle", "IC-402", 950.0),
                MockBus(3, "VRL Travels Volvo AC", "VRL-778", 1100.0),
            ]

        for index, bus in enumerate(buses, start=1):
            feeder_leg = Leg(
                mode="FEEDER",
                start_location_name="Your pickup location",
                end_location_name=boarding_point.name,
                start_time=feeder_start,
                end_time=feeder_end,
                duration_seconds=feeder_distance.duration_seconds,
                distance_meters=feeder_distance.distance_meters,
                fare=feeder_fare,
                operator="SafarX Feeder",
                vehicle_id=f"feeder-{boarding_point.id}",
                polyline=feeder_distance.polyline,
                vehicle_icon="shuttle",
            )
            bus_start = feeder_end + timedelta(minutes=20 + index * 10)
            bus_leg = Leg(
                mode="BUS",
                start_location_name=boarding_point.name,
                end_location_name=f"{request.to_city} Bus Stand",
                start_time=bus_start,
                end_time=bus_start + timedelta(hours=14),
                duration_seconds=50_400,
                distance_meters=850_000,
                fare=float(bus.base_fare),
                operator=bus.operator_name,
                vehicle_id=bus.bus_number,
                vehicle_icon="bus",
            )
            pricing = apply_pricing_strategies(
                feeder_fare=feeder_leg.fare,
                bus_fare=bus_leg.fare,
                is_smarttrip_plus=request.is_smarttrip_plus,
                booking_time=request.booking_time or datetime.now(tz=request.travel_date.tzinfo),
                travel_time=feeder_leg.start_time,
                is_high_demand_corridor=high_demand_corridor,
            )
            feeder_leg.fare = pricing.final_ride_cost
            journeys.append(
                Journey(
                    journey_id=f"bus-{bus.id}-{request.travel_date.date().isoformat()}",
                    total_fare=pricing.bundle_price,
                    total_duration_seconds=(
                        feeder_leg.duration_seconds + 1_200 + index * 600 + bus_leg.duration_seconds
                    ),
                    legs=[feeder_leg, bus_leg],
                    summary=f"Feeder shuttle to {boarding_point.name}, then {bus.operator_name} bus",
                    pricing=pricing,
                )
            )

    train_journey = build_mock_train_journey(request)
    if train_journey:
        journeys.append(train_journey)

    for index, flight_leg in enumerate(
        await search_flights(request.from_city, request.to_city, request.travel_date), start=1
    ):
        journeys.append(
            Journey(
                journey_id=f"flight-{index}-{request.travel_date.date().isoformat()}",
                total_fare=flight_leg.fare,
                total_duration_seconds=flight_leg.duration_seconds,
                legs=[flight_leg],
                summary=f"{flight_leg.operator} flight to {request.to_city}",
            )
        )

    return sorted(journeys, key=lambda journey: (journey.total_fare, journey.total_duration_seconds))
