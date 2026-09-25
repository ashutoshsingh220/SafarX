import datetime
import random
import string
import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import MultimodalBundleBooking, MultimodalBookingLeg
from app.schemas import MultimodalBookingRequest, MultimodalBookingResponse, MultimodalLegOut


def _generate_pnr() -> str:
    chars = "".join(random.choices(string.ascii_uppercase + string.digits, k=5))
    return f"ST-2026-{chars}"


def _generate_ticket_identifier(mode: str) -> str:
    if mode in ["AUTO", "CAB", "E_RICKSHAW"]:
        otp = "".join(random.choices(string.digits, k=4))
        return f"OTP-{otp}"
    elif mode == "TRAIN":
        pnr = "".join(random.choices(string.digits, k=10))
        return f"IRCTC-{pnr}"
    elif mode == "FLIGHT":
        pnr = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
        return f"AIR-{pnr}"
    elif mode == "BUS":
        tkt = "".join(random.choices(string.digits, k=8))
        return f"BUS-{tkt}"
    return f"PASS-{uuid.uuid4().hex[:6].upper()}"


async def create_bundle_booking(
    request: MultimodalBookingRequest,
    db: Optional[AsyncSession] = None,
) -> MultimodalBookingResponse:
    """Execute unified 1-click bundle booking and issue consolidated travel voucher."""
    booking_id = str(uuid.uuid4())
    pnr = _generate_pnr()
    plan = request.plan
    now = datetime.datetime.now(datetime.timezone.utc)

    # Anti-Tampering Security: Validate fare integrity and sanity
    if not plan.legs:
        raise ValueError("Cannot book an empty itinerary with zero legs.")

    if any(leg.fare < 0 for leg in plan.legs) or plan.total_fare <= 0:
        raise ValueError("Invalid negative or zero fare detected. Request blocked for security.")

    calculated_fare = sum(leg.fare for leg in plan.legs)
    if abs(calculated_fare - plan.total_fare) > 1.5:
        raise ValueError(
            f"Fare tampering detected: claimed total_fare (₹{plan.total_fare}) "
            f"does not match verified sum of leg fares (₹{calculated_fare}). Request blocked."
        )

    # Attach generated ticket identifiers to each leg
    processed_legs: list[MultimodalLegOut] = []
    for leg in plan.legs:
        leg_dict = leg.model_dump()
        identifier = _generate_ticket_identifier(leg.mode)
        leg_dict["operator"] = f"{leg.operator} (Ref: {identifier})"
        processed_legs.append(MultimodalLegOut(**leg_dict))

    qr_payload = f"SMARTTRIP:{pnr}:{request.user_id}:{plan.total_fare}:{plan.primary_mode}"

    # Persist to database if session is provided
    if db is not None:
        try:
            booking_record = MultimodalBundleBooking(
                id=booking_id,
                pnr=pnr,
                user_id=request.user_id,
                origin_address=plan.legs[0].origin if plan.legs else "Origin",
                destination_address=plan.legs[-1].destination if plan.legs else "Destination",
                primary_mode=plan.primary_mode,
                total_fare=plan.total_fare,
                total_duration_minutes=plan.total_duration_minutes,
                total_distance_km=plan.total_distance_km,
                badge=plan.badge,
                status="CONFIRMED",
                qr_code_payload=qr_payload,
            )
            db.add(booking_record)

            for leg in processed_legs:
                leg_record = MultimodalBookingLeg(
                    bundle_id=booking_id,
                    leg_index=leg.leg_index,
                    leg_type=leg.leg_type,
                    mode=leg.mode,
                    operator=leg.operator,
                    origin=leg.origin,
                    destination=leg.destination,
                    distance_km=leg.distance_km,
                    duration_minutes=leg.duration_minutes,
                    fare=leg.fare,
                    ticket_identifier=leg.operator,
                )
                db.add(leg_record)

            await db.commit()
        except Exception as exc:
            # Safe non-blocking fallback if local database tables are not yet migrated
            await db.rollback()
            print(f"Notice: DB commit skipped in demo mode: {exc}")

    return MultimodalBookingResponse(
        booking_id=booking_id,
        pnr=pnr,
        status="CONFIRMED",
        total_fare=plan.total_fare,
        primary_mode=plan.primary_mode,
        origin_address=plan.legs[0].origin if plan.legs else "Origin",
        destination_address=plan.legs[-1].destination if plan.legs else "Destination",
        badge=plan.badge,
        legs=processed_legs,
        qr_code_payload=qr_payload,
        created_at=now,
    )
