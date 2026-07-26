from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey
from geoalchemy2 import Geometry
from app.database import Base

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    city = Column(String, index=True)
    geom = Column(Geometry(geometry_type='POINT', srid=4326))
    is_boarding_point = Column(Boolean, default=False)
    is_dropoff_point = Column(Boolean, default=False)

class Bus(Base):
    __tablename__ = "buses"

    id = Column(Integer, primary_key=True, index=True)
    operator_name = Column(String)
    bus_number = Column(String, unique=True)
    capacity = Column(Integer)
    base_fare = Column(Float)
    commission_rate = Column(Float, default=0.05)

class FeederCorridor(Base):
    __tablename__ = "feeder_corridors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    start_location_id = Column(Integer, ForeignKey("locations.id"))
    end_location_id = Column(Integer, ForeignKey("locations.id"))
    flat_fare = Column(Float, default=50.0)
