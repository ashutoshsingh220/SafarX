import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.config import settings
from app.models import Base, Location, Bus, FeederCorridor

async def seed_data():
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    async with engine.begin() as conn:
        # We assume tables are created by alembic or here for testing
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        # Check if already seeded
        result = await session.execute(text("SELECT COUNT(*) FROM locations"))
        if result.scalar() > 0:
            print("Data already seeded")
            return

        # Seed Locations (Pune/Bangalore boarding/dropoff)
        pune_boarding = Location(name="Susgaon", city="Pune", is_boarding_point=True, geom="SRID=4326;POINT(73.7431 18.5492)")
        wakad_boarding = Location(name="Wakad", city="Pune", is_boarding_point=True, geom="SRID=4326;POINT(73.7628 18.5987)")
        blr_dropoff = Location(name="Majestic", city="Bangalore", is_dropoff_point=True, geom="SRID=4326;POINT(77.5724 12.9779)")
        
        session.add_all([pune_boarding, wakad_boarding, blr_dropoff])
        await session.flush() # To get IDs
        
        # Seed Feeder Corridors
        corridor1 = FeederCorridor(name="Susgaon to Wakad", start_location_id=pune_boarding.id, end_location_id=wakad_boarding.id, flat_fare=50.0)
        session.add(corridor1)

        # Seed Buses
        buses = []
        for i in range(1, 41):
            buses.append(Bus(operator_name="SmartTrip Express", bus_number=f"MH-12-ST-{1000+i}", capacity=40, base_fare=1500.0))
        session.add_all(buses)

        await session.commit()
        print("Successfully seeded DB with Pune/Bangalore points, 40 buses, and feeder corridors.")

if __name__ == "__main__":
    from sqlalchemy import text
    asyncio.run(seed_data())
