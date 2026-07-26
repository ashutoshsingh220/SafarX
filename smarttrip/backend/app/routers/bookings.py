from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from pydantic import BaseModel
from app.database import get_db
from app.services.payments import process_payment

router = APIRouter(prefix="/api/v1/bookings", tags=["Bookings"])

class BookingRequest(BaseModel):
    journey_id: str
    total_amount: float
    user_id: str

class BookingResponse(BaseModel):
    booking_id: str
    status: str
    transaction_id: Optional[str] = None
    message: str

# Mock Auth Dependency
async def verify_token(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid Firebase token")
    token = authorization.split(" ")[1]
    if token != "mock_valid_token":
        raise HTTPException(status_code=401, detail="Unauthorized")
    return {"user_id": "user_123"}

@router.post("/", response_model=BookingResponse)
async def create_booking(
    req: BookingRequest, 
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(verify_token)
):
    # Process payment first
    payment_result = await process_payment(req.total_amount, req.user_id, req.journey_id)
    
    if payment_result["status"] == "success":
        # In a real system, we'd save the booking to Postgres here using the db session
        # Transaction integrity would ensure booking is only saved if payment succeeds
        return BookingResponse(
            booking_id="bk_9999",
            status="confirmed",
            transaction_id=payment_result["transaction_id"],
            message="Booking confirmed successfully"
        )
    else:
        raise HTTPException(status_code=400, detail=payment_result["reason"])
