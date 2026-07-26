from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.schemas import Journey


class AgentPlanRequest(BaseModel):
    message: str = Field(min_length=5, max_length=2_000)
    booking_time: datetime | None = None
    is_smarttrip_plus: bool = False


class AgentPlanResponse(BaseModel):
    answer: str
    journeys: list[Journey]
    tools_used: list[str]
    is_mock: bool


class ToolResult(BaseModel):
    name: str
    payload: dict[str, Any]
