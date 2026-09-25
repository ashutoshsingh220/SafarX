from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List, Literal, Any
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


class MultimodalPlanRequest(BaseModel):
    origin_name: str = Field(description="Origin address/location name (e.g. Symbiosis Institute of Technology, Lavale, Pune)")
    origin_lat: float = Field(ge=-90, le=90)
    origin_lon: float = Field(ge=-180, le=180)
    destination_name: str = Field(description="Destination address/location name (e.g. Har Ki Pauri, Haridwar)")
    destination_lat: float = Field(ge=-90, le=90)
    destination_lon: float = Field(ge=-180, le=180)
    travel_date: Optional[datetime] = None
    feeder_mode: Optional[Literal["AUTO", "CAB", "SHUTTLE"]] = "AUTO"


class MultimodalLegOut(BaseModel):
    leg_index: int
    leg_type: Literal["FIRST_MILE", "LONG_HAUL", "LAST_MILE"]
    mode: Literal["AUTO", "CAB", "TRAIN", "FLIGHT", "BUS", "E_RICKSHAW"]
    operator: str
    origin: str
    destination: str
    distance_km: float
    duration_minutes: int
    fare: float
    description: Optional[str] = None
    vehicle_icon: str = "car"


class MultimodalPlanOut(BaseModel):
    plan_id: str
    badge: Optional[Literal["CHEAPEST", "FASTEST", "BEST_VALUE", "DIRECT_CAB"]] = None
    primary_mode: Literal["TRAIN", "FLIGHT", "BUS", "DIRECT_CAB"]
    total_fare: float
    total_duration_minutes: int
    total_distance_km: float
    legs: List[MultimodalLegOut]
    summary: str


class MultimodalPlanResponse(BaseModel):
    origin: str
    destination: str
    origin_coords: dict[str, float]
    destination_coords: dict[str, float]
    plans: List[MultimodalPlanOut]


class MultimodalBookingRequest(BaseModel):
    user_id: str = Field(default="guest_user", min_length=1)
    plan: MultimodalPlanOut


class MultimodalBookingResponse(BaseModel):
    booking_id: str
    pnr: str
    status: str
    total_fare: float
    primary_mode: str
    origin_address: str
    destination_address: str
    badge: Optional[str] = None
    legs: List[MultimodalLegOut]
    qr_code_payload: str
    created_at: datetime


class TransitClassOption(BaseModel):
    class_code: str  # "3A", "2A", "1A", "3E", "SL", "2S"
    class_name: str
    status: str  # "AVAILABLE 42", "RAC 14", "WL 18"
    fare: float
    status_color: str = "green"  # "green", "orange", "red"


class TrainInventoryItem(BaseModel):
    train_number: str
    train_name: str
    departure_time: str
    departure_station: str
    departure_date: str
    arrival_time: str
    arrival_station: str
    arrival_date: str
    duration_str: str
    running_days: List[str]  # ["M", "T", "W", "T", "F", "S", "S"]
    active_days: List[bool]
    classes: List[TransitClassOption]


class BusInventoryItem(BaseModel):
    bus_id: str
    operator_name: str
    bus_type: str
    departure_time: str
    boarding_point: str
    arrival_time: str
    dropping_point: str
    duration_str: str
    available_seats: int
    fare: float
    seat_types: List[dict[str, Any]] = []


class FlightInventoryItem(BaseModel):
    flight_number: str
    airline: str
    departure_time: str
    departure_airport: str
    arrival_time: str
    arrival_airport: str
    duration_str: str
    is_non_stop: bool = True
    fare_classes: List[dict[str, Any]] = []


class DirectCabInventoryItem(BaseModel):
    cab_id: str
    vehicle_type: str
    operator: str
    duration_str: str
    distance_km: float
    fare: float
    benefits: List[str] = []


class CorridorInventoryRequest(BaseModel):
    origin_name: str
    origin_lat: float
    origin_lon: float
    destination_name: str
    destination_lat: float
    destination_lon: float
    travel_date: Optional[str] = None  # "YYYY-MM-DD" or formatted date


class CorridorInventoryResponse(BaseModel):
    origin: str
    destination: str
    travel_date: str
    corridor_title: str
    has_direct_trains: bool = True
    connecting_train_note: Optional[str] = None
    connecting_itinerary: Optional[dict[str, Any]] = None
    trains: List[TrainInventoryItem]
    buses: List[BusInventoryItem]
    flights: List[FlightInventoryItem]
    cabs: List[DirectCabInventoryItem]
    feeder_options: dict[str, Any] = {}



class StitchDoorToDoorRequest(BaseModel):
    origin_name: str
    origin_lat: float
    origin_lon: float
    destination_name: str
    destination_lat: float
    destination_lon: float
    feeder_mode: Optional[Literal["AUTO", "CAB"]] = "AUTO"
    selected_mode: Literal["TRAIN", "BUS", "FLIGHT", "DIRECT_CAB"]
    selected_item_id: str
    selected_item_name: str
    selected_class: str
    selected_fare: float
    departure_hub_name: Optional[str] = ""
    departure_hub_lat: Optional[float] = None
    departure_hub_lon: Optional[float] = None
    arrival_hub_name: Optional[str] = ""
    arrival_hub_lat: Optional[float] = None
    arrival_hub_lon: Optional[float] = None
    departure_time: Optional[str] = None
    arrival_time: Optional[str] = None
    duration_minutes: Optional[int] = None


