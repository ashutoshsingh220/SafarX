from fastapi import APIRouter
from pydantic import BaseModel
from app.ml.models import predict_demand, predict_eta

router = APIRouter(prefix="/api/v1/ml", tags=["Machine Learning"])

class DemandRequest(BaseModel):
    lat: float
    lon: float

class ETARequest(BaseModel):
    distance_km: float
    hour_of_day: int

@router.post("/demand")
async def get_demand_cluster(req: DemandRequest):
    cluster = predict_demand(req.lat, req.lon)
    return {"status": "success", "demand_zone": cluster}

@router.post("/eta")
async def get_eta(req: ETARequest):
    eta_mins = predict_eta(req.distance_km, req.hour_of_day)
    return {"status": "success", "estimated_eta_minutes": round(eta_mins, 1)}
