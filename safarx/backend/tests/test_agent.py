from datetime import datetime

import pytest

from app.agent.core import GEMINI_TOOLS, TravelAgent, extract_mock_search_request
from app.agent.schemas import AgentPlanRequest
from app.config import settings
from app.schemas import Journey, Leg


def test_agent_declares_search_price_and_booking_tools() -> None:
    names = {item["name"] for item in GEMINI_TOOLS[0]["function_declarations"]}

    assert names == {"search_routes", "price_bundle", "book_route"}


def test_mock_parser_understands_sample_prompt() -> None:
    request = extract_mock_search_request(
        AgentPlanRequest(message="I live in Susgaon Pune, going to Bangalore tomorrow night, low budget")
    )

    assert request.from_city == "Pune"
    assert request.to_city == "Bangalore"


@pytest.mark.asyncio
async def test_mock_agent_returns_a_search_answer(monkeypatch: pytest.MonkeyPatch) -> None:
    journey = Journey(
        journey_id="bus-demo",
        total_fare=1_527.0,
        total_duration_seconds=50_400,
        legs=[
            Leg(
                mode="BUS",
                start_location_name="Pune",
                end_location_name="Bangalore",
                start_time=datetime(2026, 8, 1, 20, 0),
                end_time=datetime(2026, 8, 2, 10, 0),
                duration_seconds=50_400,
                distance_meters=850_000,
                fare=1_527.0,
                vehicle_icon="bus",
            )
        ],
        summary="Demo bus journey",
    )

    async def fake_search(*_args, **_kwargs):
        return [journey]

    monkeypatch.setattr(settings, "USE_MOCK_AI", True)
    monkeypatch.setattr("app.agent.core.search_journeys", fake_search)
    response = await TravelAgent().plan(AgentPlanRequest(message="Pune to Bangalore tomorrow"), db=None)

    assert response.is_mock is True
    assert response.tools_used == ["search_routes"]
    assert "₹1527" in response.answer
