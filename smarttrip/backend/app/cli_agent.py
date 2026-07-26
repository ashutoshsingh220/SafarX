"""Run the SmartTrip travel-agent demo from the command line."""

import argparse
import asyncio

from app.agent.core import TravelAgent
from app.agent.schemas import AgentPlanRequest
from app.database import async_session


async def run(message: str) -> None:
    async with async_session() as db:
        response = await TravelAgent().plan(AgentPlanRequest(message=message), db)
    print(f"SmartTrip AI: {response.answer}")
    print(f"Tools used: {', '.join(response.tools_used)}")
    for journey in response.journeys:
        print(f"- {journey.journey_id}: ₹{journey.total_fare:.0f} | {journey.summary}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Ask the SmartTrip AI travel agent for a journey.")
    parser.add_argument(
        "message",
        nargs="?",
        default="I live in Susgaon Pune, going to Bangalore tomorrow night, low budget, safe pickup.",
    )
    args = parser.parse_args()
    asyncio.run(run(args.message))


if __name__ == "__main__":
    main()
