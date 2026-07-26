from pydantic import BaseModel, ConfigDict, Field
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

    model_config = ConfigDict(from_attributes=True)

class HealthResponse(BaseModel):
    status: str
    db_connected: bool
    redis_connected: bool

class Leg(BaseModel):
    mode: Literal["WALK", "BUS", "TRAIN", "FLIGHT", "TRANSFER", "FEEDER"]
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
    vehicle_icon: str = "vehicle"

class Journey(BaseModel):
    journey_id: str
    total_fare: float
    total_duration_seconds: int
    legs: List[Leg]
    summary: str
    pricing: "PricingBreakdown | None" = None


class PricingBreakdown(BaseModel):
    original_feeder_fare: float
    original_bus_fare: float
    feeder_after_shuttle: float
    feeder_after_early_booking: float
    feeder_after_membership: float
    bus_commission: float
    subsidy: float
    final_ride_cost: float
    bundle_price: float
    applied_feeder_shuttle: bool
    applied_early_booking: bool
    applied_membership_cap: bool

class SearchRequest(BaseModel):
    from_lat: float = Field(ge=-90, le=90)
    from_lon: float = Field(ge=-180, le=180)
    from_city: str = Field(default="Pune", min_length=2, max_length=100)
    to_city: str = Field(min_length=2, max_length=100)
    travel_date: datetime
    booking_time: Optional[datetime] = None
    is_smarttrip_plus: bool = False


class BookingCheckoutRequest(BaseModel):
    journey_id: str = Field(min_length=1, max_length=128)
    total_amount: float = Field(gt=0, le=1_000_000)
    device_token: Optional[str] = Field(default=None, max_length=512)


class BookingCheckoutResponse(BaseModel):
    booking_id: str
    status: Literal["pending_payment"]
    payment_order_id: str
    amount_paise: int
    currency: Literal["INR"] = "INR"
    is_mock_payment: bool


class PaymentConfirmationRequest(BaseModel):
    payment_id: Optional[str] = Field(default=None, max_length=128)
    payment_signature: Optional[str] = Field(default=None, max_length=512)


class BookingResponse(BaseModel):
    booking_id: str
    journey_id: str
    status: str
    total_amount: float
    currency: str
    payment_order_id: str
    payment_id: Optional[str] = None
    notification_status: str


class BoardingPoint(BaseModel):
    id: int
    name: str
    city: str
    latitude: float
    longitude: float
    distance_meters: float


class DistanceEstimate(BaseModel):
    distance_meters: float
    duration_seconds: int
    polyline: Optional[str] = None
