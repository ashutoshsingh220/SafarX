import asyncio
from app.agent.core import get_agent, process_agent_response

async def run_cli():
    print("Welcome to SmartTrip AI Agent CLI!")
    print("-----------------------------------")
    prompt = "I live in Susgaon Pune, going to Bangalore tomorrow night, low budget, safe pickup."
    print(f"User: {prompt}\n")
    
    agent = get_agent()
    chat = agent.start_chat()
    
    # Send user prompt
    response = chat.send_message(prompt)
    
    # Process function calls
    result = process_agent_response(response, None)
    
    if result.get("action") == "search":
        print(f"[TOOL EXECUTION] search_routes(...) -> returning mock database journeys")
        print(f"[RESULTS] {result['results']}\n")
        
        # Send tool response back to Gemini
        tool_response = chat.send_message(
            [
                {
                    "function_response": {
                        "name": "search_routes",
                        "response": {"result": result["results"]}
                    }
                }
            ]
        )
        print(f"Agent: {tool_response.text}")

if __name__ == "__main__":
    asyncio.run(run_cli())
