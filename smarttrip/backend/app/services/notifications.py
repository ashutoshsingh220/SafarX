"""Firebase Cloud Messaging adapter with a local no-network fallback."""

import asyncio

from app.config import settings


def _send_fcm(device_token: str, title: str, body: str) -> str:
    import firebase_admin
    from firebase_admin import credentials, messaging

    if not firebase_admin._apps:
        if not settings.FIREBASE_SERVICE_ACCOUNT_JSON:
            raise ValueError("FIREBASE_SERVICE_ACCOUNT_JSON is required when USE_MOCK_PUSH=false")
        firebase_admin.initialize_app(credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_JSON))
    return messaging.send(messaging.Message(notification=messaging.Notification(title=title, body=body), token=device_token))


async def send_booking_confirmation(device_token: str | None, booking_id: str) -> str:
    if not device_token:
        return "not_requested"
    if settings.USE_MOCK_PUSH:
        return "mock_queued"
    await asyncio.to_thread(_send_fcm, device_token, "Booking confirmed", f"SmartTrip booking {booking_id} is confirmed.")
    return "sent"
