"""Firebase token verification with a local development fallback."""

import asyncio
from typing import Annotated

from fastapi import Header, HTTPException
from pydantic import BaseModel

from app.config import settings


class AuthenticatedUser(BaseModel):
    user_id: str
    phone_number: str | None = None


def _firebase_verify(token: str) -> dict:
    import firebase_admin
    from firebase_admin import auth, credentials

    if not firebase_admin._apps:
        if not settings.FIREBASE_SERVICE_ACCOUNT_JSON:
            raise ValueError("FIREBASE_SERVICE_ACCOUNT_JSON is required when USE_MOCK_AUTH=false")
        firebase_admin.initialize_app(credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_JSON))
    return auth.verify_id_token(token)


async def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
) -> AuthenticatedUser:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Bearer token is required")
    token = authorization.removeprefix("Bearer ").strip()
    if settings.USE_MOCK_AUTH:
        if token != settings.MOCK_AUTH_TOKEN:
            raise HTTPException(status_code=401, detail="Invalid local development token")
        return AuthenticatedUser(user_id="demo_user", phone_number="+919999999999")
    try:
        decoded = await asyncio.to_thread(_firebase_verify, token)
    except ValueError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid Firebase token") from exc
    return AuthenticatedUser(user_id=decoded["uid"], phone_number=decoded.get("phone_number"))
