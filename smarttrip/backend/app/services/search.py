import math
from typing import List
from datetime import datetime, timedelta
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Location, Bus, FeederCorridor
from app.schemas import Leg, Journey, SearchRequest
from app.config import settings

async def find_nearest_boarding_point(db: AsyncSession, lat: float, lon: float) -> Location:
    # PostGIS ST_Distance calculation
    # Using 4326 (WGS84), the distance is in degrees, so we order by distance
    query = select(Location).where(Location.is_boarding_point == True).order_by(
        func.ST_Distance(Location.geom, func.ST_SetSRID(func.ST_MakePoint(lon, lat), 4326))
    ).limit(1)
    
    result = await db.execute(query)
    location = result.scalar_first()
    return location

async def get_distance_eta(start_lat: float, start_lon: float, end_lat: float, end_lon: float) -> dict:
    if settings.USE_MOCK_MAPS:
        # Haversine distance for mock
        R = 6371e3
        phi1 = start_lat * math.pi / 180
        phi2 = end_lat * math.pi / 180
        delta_phi = (end_lat - start_lat) * math.pi / 180
        delta_lambda = (end_lon - start_lon) * math.pi / 180

        a = math.sin(delta_phi/2) * math.sin(delta_phi/2) + \
            math.cos(phi1) * math.cos(phi2) * \
            math.sin(delta_lambda/2) * math.sin(delta_lambda/2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

        distance = R * c
        duration = int((distance / 1000) / 30 * 3600) # Assumes 30 km/h avg speed
        
        return {
            "distance_meters": distance,
            "duration_seconds": duration,
            "polyline": "mock_polyline"
        }
    else:
        # Real Google Maps call would go here
        raise NotImplementedError("Real Maps API not yet implemented")

async def search_flights(from_city: str, to_city: str, travel_date: datetime) -> List[Leg]:
    if settings.USE_MOCK_FLIGHTS:
        # Return a mock flight if between Pune and Bangalore
        if "Pune" in from_city and "Bangalore" in to_city:
            return [
                Leg(
                    mode="FLIGHT",
                    start_location_name="Pune Airport (PNQ)",
                    end_location_name="Kempegowda (BLR)",
                    start_time=travel_date + timedelta(hours=6),
                    end_time=travel_date + timedelta(hours=7, minutes=30),
                    duration_seconds=5400,
                    distance_meters=730000,
                    fare=4500.0,
                    operator="AirMock",
                    vehicle_id="AM-101"
                )
            ]
        return []
    else:
        raise NotImplementedError("Amadeus flights not yet implemented")

async def search_journeys(db: AsyncSession, request: SearchRequest) -> List[Journey]:
    journeys = []
    
    # 1. Find nearest boarding point for bus feeder
    boarding_point = await find_nearest_boarding_point(db, request.from_lat, request.from_lon)
    
    if boarding_point:
        # Distance from user to boarding point (Last mile)
        # We need the boarding point lat/lon. Since we used PostGIS geom, we can extract it or mock it.
        # For simplicity in mock, let's assume it takes 15 mins
        feeder_leg = Leg(
            mode="FEEDER",
            start_location_name="Pickup Location",
            end_location_name=boarding_point.name,
            start_time=request.travel_date,
            end_time=request.travel_date + timedelta(minutes=15),
            duration_seconds=900,
            distance_meters=5000,
            fare=100.0, # Will be adjusted by pricing engine later
            operator="SmartTrip Feeder"
        )
        
        # 2. Find Bus to destination city
        query = select(Bus).where(Bus.capacity > 0).limit(3) # Get top 3 buses
        buses = (await db.execute(query)).scalars().all()
        
        for bus in buses:
            bus_leg = Leg(
                mode="BUS",
                start_location_name=boarding_point.name,
                end_location_name=f"{request.to_city} Bus Stand",
                start_time=feeder_leg.end_time + timedelta(minutes=15), # 15 min wait
                end_time=feeder_leg.end_time + timedelta(hours=14), # 14 hours travel
                duration_seconds=14 * 3600,
                distance_meters=850000,
                fare=bus.base_fare,
                operator=bus.operator_name,
                vehicle_id=bus.bus_number
            )
            
            journeys.append(Journey(
                total_fare=feeder_leg.fare + bus_leg.fare,
                total_duration_seconds=feeder_leg.duration_seconds + bus_leg.duration_seconds + 900,
                legs=[feeder_leg, bus_leg]
            ))
            
    # 3. Add Flights as an alternative if requested
    flight_legs = await search_flights("Pune", request.to_city, request.travel_date)
    for f in flight_legs:
        journeys.append(Journey(
            total_fare=f.fare,
            total_duration_seconds=f.duration_seconds,
            legs=[f]
        ))
        
    return journeys
