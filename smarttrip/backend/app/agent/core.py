import json
from typing import List, Dict, Any
import google.generativeai as genai
from app.config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

# Define the model and tools
def get_agent():
    # Tools definition for Gemini
    tools = [
        {
            "function_declarations": [
                {
                    "name": "search_routes",
                    "description": "Searches for door-to-door multi-modal travel routes including bus, flight, and feeder shuttle options.",
                    "parameters": {
                        "type": "OBJECT",
                        "properties": {
                            "from_lat": {"type": "NUMBER"},
                            "from_lon": {"type": "NUMBER"},
                            "to_city": {"type": "STRING"},
                            "travel_date": {"type": "STRING", "description": "ISO format date e.g. 2026-07-27"}
                        },
                        "required": ["from_lat", "from_lon", "to_city", "travel_date"]
                    }
                },
                {
                    "name": "book_route",
                    "description": "Books a travel route given a journey_id",
                    "parameters": {
                        "type": "OBJECT",
                        "properties": {
                            "journey_id": {"type": "STRING"}
                        },
                        "required": ["journey_id"]
                    }
                }
            ]
        }
    ]

    model = genai.GenerativeModel(
        model_name='gemini-2.0-flash',
        tools=tools,
        system_instruction=(
            "You are SmartTrip AI, a door-to-door travel assistant. "
            "You help users plan multi-modal trips. "
            "When a user asks for a route, extract their location and destination, "
            "and use the 'search_routes' tool to find options. "
            "Present the total bundle price and duration to the user."
        )
    )
    return model

def process_agent_response(response, db_session) -> Dict[str, Any]:
    # Parse function calls and execute logic
    if response.parts:
        for part in response.parts:
            if part.function_call:
                func = part.function_call
                if func.name == "search_routes":
                    # Mock geocoding Susgaon Pune
                    from_lat, from_lon = func.args.get("from_lat", 18.5492), func.args.get("from_lon", 73.7431)
                    to_city = func.args.get("to_city", "Bangalore")
                    
                    return {
                        "action": "search",
                        "results": [
                            {"journey_id": "J1", "fare": 1600.0, "duration_seconds": 54000, "legs": ["Feeder", "Bus"]},
                            {"journey_id": "J2", "fare": 4500.0, "duration_seconds": 7000, "legs": ["Flight"]}
                        ]
                    }
                elif func.name == "book_route":
                    return {"action": "book", "status": "success", "journey_id": func.args["journey_id"]}
                    
    return {"reply": response.text}
