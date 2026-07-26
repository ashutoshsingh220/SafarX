from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
from app.database import Base

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    city = Column(String, index=True, nullable=False)
    geom = Column(Geometry(geometry_type='POINT', srid=4326), nullable=False)
    is_boarding_point = Column(Boolean, default=False, nullable=False)
    is_dropoff_point = Column(Boolean, default=False, nullable=False)

class Bus(Base):
    __tablename__ = "buses"

    id = Column(Integer, primary_key=True, index=True)
    operator_name = Column(String, nullable=False)
    bus_number = Column(String, unique=True, nullable=False)
    capacity = Column(Integer, nullable=False)
    base_fare = Column(Float, nullable=False)
    commission_rate = Column(Float, default=0.05, nullable=False)

class FeederCorridor(Base):
    __tablename__ = "feeder_corridors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    start_location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    end_location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    flat_fare = Column(Float, default=50.0, nullable=False)


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(String(36), primary_key=True)
    user_id = Column(String(128), index=True, nullable=False)
    journey_id = Column(String(128), index=True, nullable=False)
    total_amount = Column(Float, nullable=False)
    currency = Column(String(3), nullable=False, default="INR")
    status = Column(String(32), nullable=False, default="pending_payment")
    payment_order_id = Column(String(128), unique=True, nullable=False)
    payment_id = Column(String(128), nullable=True)
    device_token = Column(String(512), nullable=True)
    notification_status = Column(String(32), nullable=False, default="not_requested")
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
