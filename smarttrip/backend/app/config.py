from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    GEMINI_API_KEY: str = ""
    GOOGLE_MAPS_API_KEY: str = ""
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_PRIVATE_KEY: str = ""
    FIREBASE_CLIENT_EMAIL: str = ""
    AMADEUS_CLIENT_ID: str = ""
    AMADEUS_CLIENT_SECRET: str = ""
    OPENWEATHER_API_KEY: str = ""

    USE_MOCK_FLIGHTS: bool = True
    USE_MOCK_WEATHER: bool = True
    USE_MOCK_PAYMENTS: bool = True
    USE_MOCK_MAPS: bool = True

    DATABASE_URL: str = "postgresql+asyncpg://smarttrip:smarttrip@localhost:5432/smarttrip"
    REDIS_URL: str = "redis://localhost:6379/0"

    class Config:
        env_file = ".env"

settings = Settings()
