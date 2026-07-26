"""Post route-polyline location updates to the local tracking endpoint."""
import argparse
import asyncio
import httpx

# Susgaon -> Wakad demo corridor; frontend can animate each received point.
ROUTE_POLYLINE = [(18.5492, 73.7431), (18.5580, 73.7485), (18.5704, 73.7546), (18.5850, 73.7590), (18.5987, 73.7628)]

async def simulate(journey_id: str, api_base_url: str, interval: float) -> None:
    async with httpx.AsyncClient(timeout=10) as client:
        for sequence, (lat, lon) in enumerate(ROUTE_POLYLINE):
            response = await client.post(f"{api_base_url}/ws/internal/update_location", params={"journey_id": journey_id}, json={"lat": lat, "lon": lon, "sequence": sequence})
            response.raise_for_status()
            print(f"{sequence}: {lat:.4f}, {lon:.4f}")
            await asyncio.sleep(interval)

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--journey-id", default="bus-1-demo")
    parser.add_argument("--api-base-url", default="http://127.0.0.1:8000")
    parser.add_argument("--interval", type=float, default=2.0)
    args = parser.parse_args()
    asyncio.run(simulate(args.journey_id, args.api_base_url, args.interval))

if __name__ == "__main__": main()
