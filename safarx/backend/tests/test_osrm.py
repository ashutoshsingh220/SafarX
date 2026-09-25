import httpx
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.routers import routes
from app.services.osrm import OSRMClient, OSRMClientError


def _route_payload() -> dict:
    return {
        "code": "Ok",
        "routes": [
            {
                "distance": 6123.4,
                "duration": 813.2,
                "geometry": {"type": "LineString", "coordinates": [[73.7, 18.5], [73.8, 18.6]]},
            }
        ],
    }


@pytest.mark.asyncio
async def test_successful_routing_returns_pydantic_friendly_data() -> None:
    transport = httpx.MockTransport(lambda request: httpx.Response(200, json=_route_payload()))
    async with httpx.AsyncClient(base_url="https://osrm.test", transport=transport) as http_client:
        route = await OSRMClient(client=http_client).get_route(
            {"lat": 18.5492, "lon": 73.7431}, {"lat": 18.5987, "lon": 73.7628}
        )

    assert route["distance_meters"] == 6123.4
    assert route["duration_seconds"] == 813.2
    assert route["geometry"]["type"] == "LineString"


def test_route_endpoint_rejects_invalid_coordinates() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/route",
            json={
                "origin": {"lat": 100, "lon": 73.7431},
                "destination": {"lat": 18.5987, "lon": 73.7628},
            },
        )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_osrm_unavailable_is_reported_cleanly() -> None:
    transport = httpx.MockTransport(lambda request: httpx.Response(503, json={"code": "Error"}))
    async with httpx.AsyncClient(base_url="https://osrm.test", transport=transport) as http_client:
        with pytest.raises(OSRMClientError, match="request failed"):
            await OSRMClient(client=http_client).get_nearest({"lat": 18.5492, "lon": 73.7431})


@pytest.mark.asyncio
async def test_osrm_timeout_is_reported_cleanly() -> None:
    def timeout(_: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("slow routing service")

    transport = httpx.MockTransport(timeout)
    async with httpx.AsyncClient(base_url="https://osrm.test", transport=transport) as http_client:
        with pytest.raises(OSRMClientError, match="timed out"):
            await OSRMClient(client=http_client).get_nearest({"lat": 18.5492, "lon": 73.7431})


def test_route_endpoint_returns_osrm_data(monkeypatch: pytest.MonkeyPatch) -> None:
    class FakeOSRMClient:
        async def get_route(self, origin: dict[str, float], destination: dict[str, float]) -> dict:
            return {
                "distance_meters": 1000.0,
                "duration_seconds": 120.0,
                "geometry": {"type": "LineString", "coordinates": []},
            }

    monkeypatch.setattr(routes, "OSRMClient", FakeOSRMClient)
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/route",
            json={
                "origin": {"lat": 18.5492, "lon": 73.7431},
                "destination": {"lat": 18.5987, "lon": 73.7628},
            },
        )

    assert response.status_code == 200
    assert response.json()["distance_meters"] == 1000.0
