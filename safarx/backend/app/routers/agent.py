from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.agent.core import TravelAgent
from app.agent.schemas import AgentPlanRequest, AgentPlanResponse
from app.database import get_db

router = APIRouter(prefix="/api/v1/agent", tags=["AI Agent"])
agent = TravelAgent()


@router.post("/plan", response_model=AgentPlanResponse)
async def plan_trip(request: AgentPlanRequest, db: AsyncSession | None = Depends(get_db)) -> AgentPlanResponse:
    try:
        return await agent.plan(request, db)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
