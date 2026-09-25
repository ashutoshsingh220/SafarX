from fastapi import Depends, FastAPI
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
try:
    import redis.asyncio as redis
except ImportError:
    redis = None
from app.config import settings
from app.database import get_db
from app.schemas import HealthResponse
from app.routers import agent, bookings, ml, multimodal, routes, search
from app.websockets import manager as ws_manager

from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from fastapi.responses import JSONResponse
from fastapi import Security, Request

app = FastAPI(
    title="SmartTrip AI API",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Policy: Restrict to local dev servers, emulators, and mobile clients
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|10\.0\.2\.2)(:\d+)?",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Server"] = "SmartTrip-Secure-Gateway"
    return response

# Global Sanitized Exception Handler (Protects internal server paths & stack traces from leaking)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import logging
    logging.getLogger("uvicorn.error").error(f"Unhandled error on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An internal processing error occurred. Please try again.",
            "status": "error"
        }
    )

# Define API Key security scheme for Swagger UI
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
bearer_token = APIKeyHeader(name="Authorization", auto_error=False)

app.include_router(search.router, dependencies=[Security(api_key_header), Security(bearer_token)])
app.include_router(multimodal.router)
app.include_router(ml.router, dependencies=[Security(api_key_header), Security(bearer_token)])
app.include_router(bookings.router, dependencies=[Security(api_key_header), Security(bearer_token)])
app.include_router(agent.router)
app.include_router(routes.router)
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

    if redis is not None:
        try:
            redis_client = redis.from_url(settings.REDIS_URL)
            await redis_client.ping()
            redis_connected = True
            await redis_client.aclose()
        except Exception:
            pass

    status = "ok" if db_connected and redis_connected else "degraded"
    return HealthResponse(status=status, db_connected=db_connected, redis_connected=redis_connected)
