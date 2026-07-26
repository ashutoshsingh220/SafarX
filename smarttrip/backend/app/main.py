from fastapi import FastAPI, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.database import get_db, engine
from app.schemas import HealthResponse
import redis.asyncio as redis
from app.routers import search, ml, bookings
from app.websockets import manager as ws_manager

app = FastAPI(title="SmartTrip AI API")

app.include_router(search.router)
app.include_router(ml.router)
app.include_router(bookings.router)
app.include_router(ws_manager.router)

@app.get("/health", response_model=HealthResponse)
async def health_check(db: AsyncSession = Depends(get_db)):
    db_connected = False
    redis_connected = False
    
    # Check DB
    try:
        await db.execute(text("SELECT 1"))
        db_connected = True
    except Exception as e:
        print(f"DB Error: {e}")

    # Check Redis
    try:
        r = redis.from_url(settings.REDIS_URL)
        await r.ping()
        redis_connected = True
        await r.aclose()
    except Exception as e:
        print(f"Redis Error: {e}")

    status = "ok" if db_connected and redis_connected else "error"
    return HealthResponse(status=status, db_connected=db_connected, redis_connected=redis_connected)
