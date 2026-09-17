from fastapi import Depends, FastAPI
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as redis
from app.config import settings
from app.database import get_db
from app.schemas import HealthResponse
from app.routers import agent, bookings, ml, search
from app.websockets import manager as ws_manager

from fastapi.security import APIKeyHeader
from fastapi import Security

app = FastAPI(title="SmartTrip AI API")

# Define API Key security scheme for Swagger UI
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
bearer_token = APIKeyHeader(name="Authorization", auto_error=False)

app.include_router(search.router, dependencies=[Security(api_key_header), Security(bearer_token)])
app.include_router(ml.router, dependencies=[Security(api_key_header), Security(bearer_token)])
app.include_router(bookings.router, dependencies=[Security(api_key_header), Security(bearer_token)])
app.include_router(agent.router)
app.include_router(ws_manager.router)

@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check(db: AsyncSession = Depends(get_db)):
    """Report dependency health without exposing connection details or secrets."""
    db_connected = False
    redis_connected = False

    try:
        await db.execute(text("SELECT 1"))
        db_connected = True
    except Exception:
        pass

    redis_client = redis.from_url(settings.REDIS_URL)
    try:
        await redis_client.ping()
        redis_connected = True
    except Exception:
        pass
    finally:
        await redis_client.aclose()

    status = "ok" if db_connected and redis_connected else "degraded"
    return HealthResponse(status=status, db_connected=db_connected, redis_connected=redis_connected)
