import asyncio
import httpx
import random
import time

API_URL = "http://127.0.0.1:8000/ws/internal/update_location"

async def simulate_driver(journey_id: str, start_lat: float, start_lon: float):
    lat = start_lat
    lon = start_lon
    print(f"Starting driver simulation for journey: {journey_id}")
    
    async with httpx.AsyncClient() as client:
        for _ in range(20):
            # Move slightly northeast
            lat += random.uniform(0.0001, 0.001)
            lon += random.uniform(0.0001, 0.001)
            
            try:
                response = await client.post(
                    f"{API_URL}?journey_id={journey_id}&lat={lat}&lon={lon}"
                )
                print(f"Updated {journey_id}: {lat}, {lon} -> Status: {response.status_code}")
            except Exception as e:
                print(f"Failed to update {journey_id}: {e}")
                
            await asyncio.sleep(2) # Update every 2 seconds
            
    print(f"Driver simulation for {journey_id} completed.")

if __name__ == "__main__":
    asyncio.run(simulate_driver("J1", 18.5492, 73.7431))
