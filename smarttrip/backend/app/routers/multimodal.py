from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database import get_db
from app.schemas import (
    MultimodalPlanRequest,
    MultimodalPlanResponse,
    MultimodalBookingRequest,
    MultimodalBookingResponse,
    CorridorInventoryRequest,
    CorridorInventoryResponse,
    StitchDoorToDoorRequest,
    MultimodalPlanOut,
)
from app.services.multimodal_planner import plan_multimodal_journey
from app.services.bundle_booking import create_bundle_booking
from app.services.transit_hubs import INDIAN_TRANSIT_HUBS
from app.services.transit_inventory import get_corridor_inventory, stitch_door_to_door_plan

router = APIRouter(prefix="/api/v1/multimodal", tags=["Multimodal Door-to-Door Planner"])


@router.post("/inventory", response_model=CorridorInventoryResponse)
async def fetch_corridor_inventory(request: CorridorInventoryRequest):
    """Retrieve full catalog of Trains (IRCTC-style), Buses, Flights, and Cabs for chosen corridor and date."""
    try:
        return get_corridor_inventory(request)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Inventory search error: {str(exc)}") from exc


@router.post("/stitch", response_model=MultimodalPlanOut)
async def stitch_custom_trip(request: StitchDoorToDoorRequest):
    """Dynamically stitch user-selected train class, bus seat, flight or cab into a complete 3-leg door-to-door journey."""
    try:
        return stitch_door_to_door_plan(request)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Stitching error: {str(exc)}") from exc


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
    """Execute 1-click bundle booking and issue all-in-one SafarX PNR."""
    try:
        response = await create_bundle_booking(request, db=db)
        return response
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err)) from val_err
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Booking processing failed. Please retry.") from exc


@router.get("/hubs")
async def list_transit_hubs():
    """List registered commercial transit hubs (railway junctions, airports, bus terminals)."""
    return {"hubs": INDIAN_TRANSIT_HUBS}

