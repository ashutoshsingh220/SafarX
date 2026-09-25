"""Razorpay checkout adapter with deterministic local mock behavior."""

import asyncio
from dataclasses import dataclass
from uuid import uuid4

from app.config import settings


@dataclass(frozen=True)
class PaymentOrder:
    order_id: str
    amount_paise: int
    currency: str
    is_mock: bool


def _create_razorpay_order(amount_paise: int, receipt: str) -> dict:
    import razorpay

    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise ValueError("Razorpay credentials are required when USE_MOCK_PAYMENTS=false")
    client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
    return client.order.create({"amount": amount_paise, "currency": "INR", "receipt": receipt})


async def create_payment_order(amount_rupees: float, receipt: str) -> PaymentOrder:
    amount_paise = int(round(amount_rupees * 100))
    if settings.USE_MOCK_PAYMENTS:
        return PaymentOrder(f"mock_order_{uuid4().hex}", amount_paise, "INR", True)
    payload = await asyncio.to_thread(_create_razorpay_order, amount_paise, receipt)
    return PaymentOrder(payload["id"], int(payload["amount"]), payload["currency"], False)


def _verify_razorpay_payment(order_id: str, payment_id: str, payment_signature: str) -> None:
    import razorpay

    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise ValueError("Razorpay credentials are required when USE_MOCK_PAYMENTS=false")
    client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
    client.utility.verify_payment_signature(
        {
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": payment_signature,
        }
    )


async def confirm_payment(order_id: str, payment_id: str | None, payment_signature: str | None) -> str:
    if settings.USE_MOCK_PAYMENTS:
        return payment_id or f"mock_payment_{uuid4().hex}"
    if not payment_id or not payment_signature:
        raise ValueError("payment_id and payment_signature are required")
    await asyncio.to_thread(_verify_razorpay_payment, order_id, payment_id, payment_signature)
    return payment_id
