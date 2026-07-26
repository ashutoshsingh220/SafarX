from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.ml.models import predict_demand, predict_eta, rank_options

router = APIRouter(prefix="/api/v1/ml", tags=["Machine Learning"])


class DemandRequest(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)


class DemandResponse(BaseModel):
    status: Literal["success"] = "success"
    cluster_id: int
    cluster_size: int
    demand_level: Literal["low", "medium", "high"]


class ETARequest(BaseModel):
    distance_km: float = Field(gt=0, le=2_000)
    hour_of_day: int = Field(ge=0, le=23)
    traffic_level: float = Field(default=0.5, ge=0, le=1)


class ETAResponse(BaseModel):
    status: Literal["success"] = "success"
    estimated_eta_minutes: float
    model: Literal["xgboost"] = "xgboost"


class RankOption(BaseModel):
    fare: float = Field(ge=0)
    duration_hours: float = Field(gt=0)
    transfers: int = Field(ge=0, le=10)
    comfort_score: float = Field(ge=1, le=5)


class RankedOption(BaseModel):
    option_index: int
    score: float


class RankRequest(BaseModel):
    options: list[RankOption] = Field(min_length=1, max_length=20)


class RankResponse(BaseModel):
    status: Literal["success"] = "success"
    ranked_options: list[RankedOption]


@router.post("/demand", response_model=DemandResponse)
async def get_demand_cluster(request: DemandRequest) -> DemandResponse:
    result = predict_demand(request.lat, request.lon)
    return DemandResponse(**result)


@router.post("/eta", response_model=ETAResponse)
async def get_eta(request: ETARequest) -> ETAResponse:
    try:
        eta_minutes = predict_eta(request.distance_km, request.hour_of_day, request.traffic_level)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return ETAResponse(estimated_eta_minutes=eta_minutes)


@router.post("/ranker", response_model=RankResponse)
async def rank_journey_options(request: RankRequest) -> RankResponse:
    ranked_options = rank_options([option.model_dump() for option in request.options])
    return RankResponse(ranked_options=ranked_options)
