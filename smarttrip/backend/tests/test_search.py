from datetime import datetime

import pytest

from app.schemas import SearchRequest
from app.services.search import build_mock_train_journey, get_distance_eta, search_flights
from app.config import settings


@pytest.mark.asyncio
async def test_mock_distance_returns_a_positive_estimate(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "USE_MOCK_MAPS", True)
    estimate = await get_distance_eta(18.5492, 73.7431, 18.5987, 73.7628)

    assert estimate.distance_meters > 0
    assert estimate.duration_seconds > 0
    assert estimate.polyline == "mock-straight-line"


@pytest.mark.asyncio
async def test_mock_flight_is_returned_for_pune_to_bangalore(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "USE_MOCK_FLIGHTS", True)
    flights = await search_flights("Pune", "Bangalore", datetime(2026, 8, 1, 0, 0))

    assert len(flights) == 1
    assert flights[0].mode == "FLIGHT"
    assert flights[0].vehicle_icon == "flight"


def test_mock_train_journey_has_a_vehicle_icon_and_bundle_shape() -> None:
    request = SearchRequest(
        from_lat=18.5492,
        from_lon=73.7431,
        from_city="Pune",
        to_city="Bangalore",
        travel_date=datetime(2026, 8, 1, 0, 0),
    )

    journey = build_mock_train_journey(request)

    assert journey is not None
    assert journey.legs[0].mode == "TRAIN"
    assert journey.legs[0].vehicle_icon == "train"
    assert journey.total_fare == journey.legs[0].fare
