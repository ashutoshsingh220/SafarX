from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """Runtime configuration loaded from the local, untracked .env file."""

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[1] / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"
    GOOGLE_MAPS_API_KEY: str = ""
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    FIREBASE_API_KEY: str = ""
    FIREBASE_AUTH_DOMAIN: str = ""
    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_STORAGE_BUCKET: str = ""
    FIREBASE_MESSAGING_SENDER_ID: str = ""
    FIREBASE_APP_ID: str = ""
    FIREBASE_PRIVATE_KEY: str = ""
    FIREBASE_CLIENT_EMAIL: str = ""
    FIREBASE_SERVICE_ACCOUNT_JSON: str = ""
    AMADEUS_CLIENT_ID: str = ""
    AMADEUS_CLIENT_SECRET: str = ""
    AMADEUS_BASE_URL: str = "https://test.api.amadeus.com"
    OPENWEATHER_API_KEY: str = ""
    EXTERNAL_API_TIMEOUT_SECONDS: float = 12.0

    USE_MOCK_FLIGHTS: bool = True
    USE_MOCK_WEATHER: bool = True
    USE_MOCK_PAYMENTS: bool = True
    USE_MOCK_MAPS: bool = True
    USE_MOCK_AI: bool = True
    USE_MOCK_AUTH: bool = True
    USE_MOCK_PUSH: bool = True
    MOCK_AUTH_TOKEN: str = "smarttrip_demo_token"

    DATABASE_URL: str = "postgresql+asyncpg://smarttrip:smarttrip@localhost:5432/smarttrip"
    REDIS_URL: str = "redis://localhost:6379/0"

settings = Settings()
