from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Booking
from app.schemas import (
    BookingCheckoutRequest,
    BookingCheckoutResponse,
    BookingResponse,
    PaymentConfirmationRequest,
)
from app.services.auth import AuthenticatedUser, get_current_user
from app.services.notifications import send_booking_confirmation
from app.services.payments import confirm_payment, create_payment_order

router = APIRouter(prefix="/api/v1/bookings", tags=["Bookings"])


def _response(booking: Booking) -> BookingResponse:
    return BookingResponse(
        booking_id=booking.id,
        journey_id=booking.journey_id,
        status=booking.status,
        total_amount=booking.total_amount,
        currency=booking.currency,
        payment_order_id=booking.payment_order_id,
        payment_id=booking.payment_id,
        notification_status=booking.notification_status,
    )


@router.post("/checkout", response_model=BookingCheckoutResponse, status_code=status.HTTP_201_CREATED)
async def checkout_booking(
    request: BookingCheckoutRequest,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
) -> BookingCheckoutResponse:
    booking_id = str(uuid4())
    try:
        order = await create_payment_order(request.total_amount, receipt=booking_id)
    except ValueError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    booking = Booking(
        id=booking_id,
        user_id=user.user_id,
        journey_id=request.journey_id,
        total_amount=request.total_amount,
        currency=order.currency,
        status="pending_payment",
        payment_order_id=order.order_id,
        device_token=request.device_token,
    )
    db.add(booking)
    await db.commit()
    return BookingCheckoutResponse(
        booking_id=booking.id,
        status="pending_payment",
        payment_order_id=order.order_id,
        amount_paise=order.amount_paise,
        currency="INR",
        is_mock_payment=order.is_mock,
    )


@router.post("/{booking_id}/confirm", response_model=BookingResponse)
async def confirm_booking(
    booking_id: str,
    request: PaymentConfirmationRequest,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
) -> BookingResponse:
    booking = await db.get(Booking, booking_id)
    if booking is None or booking.user_id != user.user_id:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status == "confirmed":
        return _response(booking)
    try:
        booking.payment_id = await confirm_payment(booking.payment_order_id, request.payment_id, request.payment_signature)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    booking.status = "confirmed"
    booking.notification_status = await send_booking_confirmation(booking.device_token, booking.id)
    await db.commit()
    await db.refresh(booking)
    return _response(booking)


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking(
    booking_id: str,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
) -> BookingResponse:
    booking = await db.get(Booking, booking_id)
    if booking is None or booking.user_id != user.user_id:
        raise HTTPException(status_code=404, detail="Booking not found")
    return _response(booking)
