from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database import get_db
from app.schemas import SearchRequest, Journey
from app.services.search import search_journeys

router = APIRouter(prefix="/api/v1/search", tags=["Search"])

@router.post("/", response_model=List[Journey])
async def perform_search(request: SearchRequest, db: AsyncSession = Depends(get_db)):
    try:
        journeys = await search_journeys(db, request)
        return journeys
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
