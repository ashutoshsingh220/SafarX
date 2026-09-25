"""HTTP endpoints for self-hosted OSRM routing."""

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.osrm import OSRMClient, OSRMClientError

router = APIRouter(prefix="/api/v1/route", tags=["Routing"])


class Coordinate(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)


class RouteRequest(BaseModel):
    origin: Coordinate
    destination: Coordinate


class RouteResponse(BaseModel):
    distance_meters: float
    duration_seconds: float
    geometry: dict[str, Any]


class TableRequest(BaseModel):
    origins: list[Coordinate] = Field(min_length=1)
    destinations: list[Coordinate] = Field(min_length=1)


class TableResponse(BaseModel):
    distances_meters: list[list[float | None]]
    durations_seconds: list[list[float | None]]


class NearestRequest(BaseModel):
    location: Coordinate


class NearestResponse(BaseModel):
    waypoint: dict[str, Any]


def _service_unavailable(error: OSRMClientError) -> HTTPException:
    return HTTPException(status_code=503, detail=str(error))


@router.post("", response_model=RouteResponse)
async def get_route(request: RouteRequest) -> dict[str, Any]:
    try:
        return await OSRMClient().get_route(request.origin.model_dump(), request.destination.model_dump())
    except OSRMClientError as exc:
        raise _service_unavailable(exc) from exc


@router.post("/table", response_model=TableResponse)
async def get_table(request: TableRequest) -> dict[str, Any]:
    try:
        return await OSRMClient().get_table(
            [point.model_dump() for point in request.origins],
            [point.model_dump() for point in request.destinations],
        )
    except OSRMClientError as exc:
        raise _service_unavailable(exc) from exc


@router.post("/nearest", response_model=NearestResponse)
async def get_nearest(request: NearestRequest) -> dict[str, Any]:
    try:
        return await OSRMClient().get_nearest(request.location.model_dump())
    except OSRMClientError as exc:
        raise _service_unavailable(exc) from exc
