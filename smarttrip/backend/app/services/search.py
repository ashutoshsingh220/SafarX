"""Async, mock-safe multimodal search services.

All real network integrations are only used when their corresponding mock flag
is disabled and the required local environment variables are present.
"""

import math
from datetime import datetime, timedelta
from typing import Final

import httpx
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import Bus, FeederCorridor, Location
from app.schemas import BoardingPoint, DistanceEstimate, Journey, Leg, SearchRequest
from app.services.pricing import apply_pricing_strategies

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
    db: AsyncSession, lat: float, lon: float
) -> BoardingPoint | None:
    """Find the closest seed boarding point using meter-based PostGIS distance."""
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
    if row is None:
        return None

    location, distance, location_lat, location_lon = row
    return BoardingPoint(
        id=location.id,
        name=location.name,
        city=location.city,
        latitude=float(location_lat),
        longitude=float(location_lon),
        distance_meters=round(float(distance), 1),
    )


async def get_distance_eta(
    start_lat: float, start_lon: float, end_lat: float, end_lon: float
) -> DistanceEstimate:
    """Use a local Haversine estimate or Google Distance Matrix when configured."""
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


async def _amadeus_access_token(client: httpx.AsyncClient) -> str:
    if not settings.AMADEUS_CLIENT_ID or not settings.AMADEUS_CLIENT_SECRET:
        raise ExternalServiceError("Amadeus credentials are required when USE_MOCK_FLIGHTS=false")
    response = await client.post(
        f"{settings.AMADEUS_BASE_URL}/v1/security/oauth2/token",
        data={"grant_type": "client_credentials"},
        auth=(settings.AMADEUS_CLIENT_ID, settings.AMADEUS_CLIENT_SECRET),
    )
    response.raise_for_status()
    token = response.json().get("access_token")
    if not token:
        raise ExternalServiceError("Amadeus did not return an access token")
    return token


async def search_flights(from_city: str, to_city: str, travel_date: datetime) -> list[Leg]:
    """Return a mock flight or query Amadeus test data after explicit configuration."""
    if settings.USE_MOCK_FLIGHTS:
        if from_city.casefold() == "pune" and to_city.casefold() in {"bangalore", "bengaluru"}:
            departure = travel_date.replace(hour=20, minute=30, second=0, microsecond=0)
            return [
                Leg(
                    mode="FLIGHT",
                    start_location_name="Pune Airport (PNQ)",
                    end_location_name="Kempegowda Airport (BLR)",
                    start_time=departure,
                    end_time=departure + timedelta(hours=1, minutes=30),
                    duration_seconds=5_400,
                    distance_meters=730_000,
                    fare=4_500.0,
                    operator="AirMock",
                    vehicle_id="AM-101",
                    vehicle_icon="flight",
                )
            ]
        return []

    origin = CITY_AIRPORT_CODES.get(from_city.casefold())
    destination = CITY_AIRPORT_CODES.get(to_city.casefold())
    if not origin or not destination:
        raise ExternalServiceError("No Amadeus airport mapping is configured for this route")

    async with httpx.AsyncClient(timeout=settings.EXTERNAL_API_TIMEOUT_SECONDS) as client:
        token = await _amadeus_access_token(client)
        response = await client.get(
            f"{settings.AMADEUS_BASE_URL}/v2/shopping/flight-offers",
            params={
                "originLocationCode": origin,
                "destinationLocationCode": destination,
                "departureDate": travel_date.date().isoformat(),
                "adults": 1,
                "max": 3,
            },
            headers={"Authorization": f"Bearer {token}"},
        )
    response.raise_for_status()
    legs: list[Leg] = []
    for index, offer in enumerate(response.json().get("data", []), start=1):
        itinerary = offer.get("itineraries", [{}])[0]
        segments = itinerary.get("segments", [])
        if not segments:
            continue
        first, last = segments[0], segments[-1]
        departure = datetime.fromisoformat(first["departure"]["at"])
        arrival = datetime.fromisoformat(last["arrival"]["at"])
        legs.append(
            Leg(
                mode="FLIGHT",
                start_location_name=first["departure"]["iataCode"],
                end_location_name=last["arrival"]["iataCode"],
                start_time=departure,
                end_time=arrival,
                duration_seconds=int((arrival - departure).total_seconds()),
                distance_meters=0,
                fare=float(offer["price"]["grandTotal"]),
                operator=first.get("carrierCode", "Amadeus partner"),
                vehicle_id=f"flight-{index}",
                vehicle_icon="flight",
            )
        )
    return legs


def build_mock_train_journey(request: SearchRequest) -> Journey | None:
    if request.from_city.casefold() != "pune" or request.to_city.casefold() not in {"bangalore", "bengaluru"}:
        return None
    departure = request.travel_date.replace(hour=19, minute=45, second=0, microsecond=0)
    leg = Leg(
        mode="TRAIN",
        start_location_name="Pune Junction",
        end_location_name="KSR Bengaluru City Junction",
        start_time=departure,
        end_time=departure + timedelta(hours=15, minutes=20),
        duration_seconds=55_200,
        distance_meters=840_000,
        fare=1_250.0,
        operator="Indian Rail (mock)",
        vehicle_id="MOCK-TRAIN-11013",
        vehicle_icon="train",
    )
    return Journey(
        journey_id="train-pnq-blr-01",
        total_fare=leg.fare,
        total_duration_seconds=leg.duration_seconds,
        legs=[leg],
        summary="Overnight train from Pune Junction to KSR Bengaluru City Junction",
    )


async def _feeder_fare(db: AsyncSession, distance_meters: float) -> float:
    corridor_fare = await db.scalar(select(func.min(FeederCorridor.flat_fare)))
    if corridor_fare is not None:
        return float(corridor_fare)
    return round(max(50.0, distance_meters / 1000 * 12), 2)


async def _is_high_demand_corridor(db: AsyncSession, boarding_point_id: int) -> bool:
    """Treat a seeded corridor endpoint as a high-demand shared-shuttle corridor."""
    corridor = await db.scalar(
        select(FeederCorridor.id)
        .where(
            (FeederCorridor.start_location_id == boarding_point_id)
            | (FeederCorridor.end_location_id == boarding_point_id)
        )
        .limit(1)
    )
    return corridor is not None


async def search_journeys(db: AsyncSession, request: SearchRequest) -> list[Journey]:
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
        buses = (
            await db.execute(select(Bus).order_by(Bus.base_fare.asc(), Bus.id.asc()).limit(3))
        ).scalars().all()
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
                operator="SmartTrip Feeder",
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
