from pydantic import BaseModel
from typing import Optional, List, Literal
from datetime import datetime

class LocationBase(BaseModel):
    name: str
    city: str
    is_boarding_point: bool = False
    is_dropoff_point: bool = False

class LocationCreate(LocationBase):
    lat: float
    lon: float

class LocationOut(LocationBase):
    id: int
    
    class Config:
        from_attributes = True

class HealthResponse(BaseModel):
    status: str
    db_connected: bool
    redis_connected: bool

class Leg(BaseModel):
    mode: Literal["WALK", "BUS", "FLIGHT", "TRANSFER", "FEEDER"]
    start_location_name: str
    end_location_name: str
    start_time: datetime
    end_time: datetime
    duration_seconds: int
    distance_meters: float
    fare: float = 0.0
    operator: Optional[str] = None
    vehicle_id: Optional[str] = None
    polyline: Optional[str] = None

class Journey(BaseModel):
    total_fare: float
    total_duration_seconds: int
    legs: List[Leg]

class SearchRequest(BaseModel):
    from_lat: float
    from_lon: float
    to_city: str
    travel_date: datetime
