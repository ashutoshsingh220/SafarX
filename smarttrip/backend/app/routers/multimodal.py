from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database import get_db
from app.schemas import (
    MultimodalPlanRequest,
    MultimodalPlanResponse,
    MultimodalBookingRequest,
    MultimodalBookingResponse,
)
from app.services.multimodal_planner import plan_multimodal_journey
from app.services.bundle_booking import create_bundle_booking
from app.services.transit_hubs import INDIAN_TRANSIT_HUBS

router = APIRouter(prefix="/api/v1/multimodal", tags=["Multimodal Door-to-Door Planner"])


@router.post("/plan", response_model=MultimodalPlanResponse)
async def generate_multimodal_plans(request: MultimodalPlanRequest):
    """Generate and compare door-to-door 3-leg multimodal plans across Train, Flight, Bus, and Cab."""
    try:
        response = plan_multimodal_journey(request)
        return response
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Multimodal planning error: {str(exc)}") from exc


@router.post("/book", response_model=MultimodalBookingResponse)
async def book_multimodal_bundle(
    request: MultimodalBookingRequest,
    db: AsyncSession = Depends(get_db),
):
    """Execute 1-click bundle booking and issue all-in-one SmartTrip PNR."""
    try:
        response = await create_bundle_booking(request, db=db)
        return response
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Booking error: {str(exc)}") from exc


@router.get("/hubs")
async def list_transit_hubs():
    """List registered commercial transit hubs (railway junctions, airports, bus terminals)."""
    return {"hubs": INDIAN_TRANSIT_HUBS}
