"""Gemini function-calling agent with a deterministic local fallback."""

import asyncio
import re
from datetime import datetime, timedelta
from typing import Any

from google import genai
from google.genai import types
from sqlalchemy.ext.asyncio import AsyncSession

from app.agent.schemas import AgentPlanRequest, AgentPlanResponse, ToolResult
from app.config import settings
from app.schemas import Journey, SearchRequest
from app.services.pricing import apply_pricing_strategies
from app.services.search import search_journeys


GEMINI_TOOLS: list[dict[str, Any]] = [
    {
        "function_declarations": [
            {
                "name": "search_routes",
                "description": "Search door-to-door bus, train, and flight travel options.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "from_lat": {"type": "NUMBER"},
                        "from_lon": {"type": "NUMBER"},
                        "from_city": {"type": "STRING"},
                        "to_city": {"type": "STRING"},
                        "travel_date": {"type": "STRING", "description": "ISO-8601 datetime"},
                        "is_smarttrip_plus": {"type": "BOOLEAN"},
                    },
                    "required": ["from_lat", "from_lon", "from_city", "to_city", "travel_date"],
                },
            },
            {
                "name": "price_bundle",
                "description": "Calculate SmartTrip's S1-S5 bundled bus and last-mile price.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "feeder_fare": {"type": "NUMBER"},
                        "bus_fare": {"type": "NUMBER"},
                        "is_smarttrip_plus": {"type": "BOOLEAN"},
                        "booking_time": {"type": "STRING"},
                        "travel_time": {"type": "STRING"},
                        "is_high_demand_corridor": {"type": "BOOLEAN"},
                    },
                    "required": ["feeder_fare", "bus_fare", "booking_time", "travel_time"],
                },
            },
            {
                "name": "book_route",
                "description": "Create a booking intent for a selected journey. Payment confirmation is handled separately.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {"journey_id": {"type": "STRING"}},
                    "required": ["journey_id"],
                },
            },
        ]
    }
]


def _tomorrow_night() -> datetime:
    tomorrow = datetime.now() + timedelta(days=1)
    return tomorrow.replace(hour=20, minute=0, second=0, microsecond=0)


def extract_mock_search_request(request: AgentPlanRequest) -> SearchRequest:
    """Parse the demo city's natural-language query without an external model."""
    message = request.message.casefold()
    if "bangalore" not in message and "bengaluru" not in message:
        raise ValueError("The mock agent currently supports trips to Bangalore only")
    from_city = "Pune" if "pune" in message or "susgaon" in message else "Pune"
    travel_date = _tomorrow_night() if "tomorrow" in message else datetime.now() + timedelta(days=1)
    return SearchRequest(
        from_lat=18.5492,
        from_lon=73.7431,
        from_city=from_city,
        to_city="Bangalore",
        travel_date=travel_date,
        booking_time=request.booking_time or datetime.now(tz=travel_date.tzinfo),
        is_smarttrip_plus=request.is_smarttrip_plus or "smarttrip plus" in message,
    )


def _answer_from_journeys(journeys: list[Journey]) -> str:
    if not journeys:
        return "I could not find a journey for that request. Try Pune to Bangalore for the current demo."
    best = journeys[0]
    modes = " + ".join(leg.mode.title() for leg in best.legs)
    duration_hours = best.total_duration_seconds / 3600
    return (
        f"The best value option is {modes} at ₹{best.total_fare:.0f}, "
        f"taking about {duration_hours:.1f} hours. {best.summary}."
    )


async def execute_tool(name: str, arguments: dict[str, Any], db: AsyncSession) -> ToolResult:
    """Execute only the tools declared to Gemini with typed inputs and outputs."""
    if name == "search_routes":
        search_request = SearchRequest.model_validate(arguments)
        journeys = await search_journeys(db, search_request)
        return ToolResult(
            name=name,
            payload={"journeys": [journey.model_dump(mode="json") for journey in journeys]},
        )
    if name == "price_bundle":
        pricing = apply_pricing_strategies(
            feeder_fare=float(arguments["feeder_fare"]),
            bus_fare=float(arguments["bus_fare"]),
            is_smarttrip_plus=bool(arguments.get("is_smarttrip_plus", False)),
            booking_time=datetime.fromisoformat(arguments["booking_time"]),
            travel_time=datetime.fromisoformat(arguments["travel_time"]),
            is_high_demand_corridor=bool(arguments.get("is_high_demand_corridor", False)),
        )
        return ToolResult(name=name, payload=pricing.model_dump())
    if name == "book_route":
        return ToolResult(
            name=name,
            payload={
                "journey_id": str(arguments["journey_id"]),
                "status": "booking_intent_created",
                "next_step": "Confirm payment in the checkout flow",
            },
        )
    raise ValueError(f"Unsupported tool: {name}")


class TravelAgent:
    async def plan(self, request: AgentPlanRequest, db: AsyncSession) -> AgentPlanResponse:
        if settings.USE_MOCK_AI:
            return await self._mock_plan(request, db)
        return await self._gemini_plan(request, db)

    async def _mock_plan(self, request: AgentPlanRequest, db: AsyncSession) -> AgentPlanResponse:
        search_request = extract_mock_search_request(request)
        tool_result = await execute_tool("search_routes", search_request.model_dump(mode="json"), db)
        journeys = [Journey.model_validate(item) for item in tool_result.payload["journeys"]]
        return AgentPlanResponse(
            answer=_answer_from_journeys(journeys),
            journeys=journeys,
            tools_used=["search_routes"],
            is_mock=True,
        )

    async def _gemini_plan(self, request: AgentPlanRequest, db: AsyncSession) -> AgentPlanResponse:
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is required when USE_MOCK_AI=false")
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        config = types.GenerateContentConfig(
            tools=[types.Tool(function_declarations=GEMINI_TOOLS[0]["function_declarations"])],
            system_instruction=(
                "You are SmartTrip AI. Always use search_routes before recommending an itinerary. "
                "Present one bundle price and explain vehicle modes clearly."
            ),
        )
        contents: list[Any] = [types.Content(role="user", parts=[types.Part(text=request.message)])]
        response = await asyncio.to_thread(
            client.models.generate_content,
            model=settings.GEMINI_MODEL,
            contents=contents,
            config=config,
        )
        tools_used: list[str] = []
        journeys: list[Journey] = []
        function_response_parts: list[Any] = []

        for function_call in response.function_calls or []:
            name = function_call.name
            arguments = dict(function_call.args)
            tool_result = await execute_tool(name, arguments, db)
            tools_used.append(name)
            if name == "search_routes":
                journeys = [Journey.model_validate(item) for item in tool_result.payload["journeys"]]
            function_response_parts.append(
                types.Part.from_function_response(
                    name=name,
                    response={"result": tool_result.payload},
                    id=function_call.id,
                )
            )

        if function_response_parts:
            contents.append(response.candidates[0].content)
            contents.append(types.Content(role="user", parts=function_response_parts))
            response = await asyncio.to_thread(
                client.models.generate_content,
                model=settings.GEMINI_MODEL,
                contents=contents,
                config=config,
            )

        answer = response.text or _answer_from_journeys(journeys)
        return AgentPlanResponse(answer=answer, journeys=journeys, tools_used=tools_used, is_mock=False)
