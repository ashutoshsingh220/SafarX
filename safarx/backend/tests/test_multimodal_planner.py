import pytest
from datetime import datetime
from app.schemas import MultimodalPlanRequest, MultimodalBookingRequest
from app.services.transit_hubs import find_nearest_hub
from app.services.multimodal_planner import plan_multimodal_journey
from app.services.bundle_booking import create_bundle_booking


def test_nearest_hub_resolution_sit_pune_and_har_ki_pauri():
    # SIT Pune coordinates
    sit_lat, sit_lon = 18.5362, 73.7297
    # Har Ki Pauri coordinates
    har_lat, har_lon = 29.9567, 78.1700

    rail_origin, rail_dist = find_nearest_hub(sit_lat, sit_lon, "RAILWAY_STATION")
    assert rail_origin["code"] == "PUNE"
    assert 10.0 < rail_dist < 30.0

    rail_dest, rail_dest_dist = find_nearest_hub(har_lat, har_lon, "RAILWAY_STATION")
    assert rail_dest["code"] == "HW"
    assert rail_dest_dist < 5.0  # Haridwar Jn is ~3.5km from Har Ki Pauri

    airport_dest, air_dest_dist = find_nearest_hub(har_lat, har_lon, "AIRPORT")
    assert airport_dest["code"] == "DED"  # Dehradun Airport is closest to Haridwar
    assert 20.0 < air_dest_dist < 50.0


def test_multimodal_planning_sit_to_haridwar():
    req = MultimodalPlanRequest(
        origin_name="Symbiosis Institute of Technology, Lavale, Pune",
        origin_lat=18.5362,
        origin_lon=73.7297,
        destination_name="Har Ki Pauri, Haridwar",
        destination_lat=29.9567,
        destination_lon=78.1700,
        travel_date=datetime(2026, 9, 25, 8, 0),
        feeder_mode="AUTO",
    )

    response = plan_multimodal_journey(req)

    assert response.origin == req.origin_name
    assert response.destination == req.destination_name
    assert len(response.plans) == 4

    modes = {p.primary_mode for p in response.plans}
    assert modes == {"TRAIN", "FLIGHT", "BUS", "DIRECT_CAB"}

    # Validate Train plan
    train_plan = next(p for p in response.plans if p.primary_mode == "TRAIN")
    assert len(train_plan.legs) == 3
    assert train_plan.legs[0].leg_type == "FIRST_MILE"
    assert train_plan.legs[0].origin == req.origin_name
    assert train_plan.legs[0].destination == "Pune Junction"

    assert train_plan.legs[1].leg_type == "LONG_HAUL"
    assert train_plan.legs[1].mode == "TRAIN"
    assert train_plan.legs[1].origin == "Pune Junction"
    assert train_plan.legs[1].destination == "Haridwar Junction"

    assert train_plan.legs[2].leg_type == "LAST_MILE"
    assert train_plan.legs[2].origin == "Haridwar Junction"
    assert train_plan.legs[2].destination == req.destination_name

    # Validate fare addition: Leg 1 + Leg 2 + Leg 3 = Total Fare
    computed_sum = sum(l.fare for l in train_plan.legs)
    assert train_plan.total_fare == computed_sum

    # Validate badges
    badges = {p.badge for p in response.plans}
    assert "CHEAPEST" in badges
    assert "FASTEST" in badges
    assert "DIRECT_CAB" in badges

    cheapest_plan = next(p for p in response.plans if p.badge == "CHEAPEST")
    assert cheapest_plan.total_fare == min(p.total_fare for p in response.plans)

    fastest_plan = next(p for p in response.plans if p.badge == "FASTEST")
    assert fastest_plan.primary_mode == "FLIGHT"
    assert fastest_plan.total_duration_minutes == min(p.total_duration_minutes for p in response.plans)


@pytest.mark.asyncio
async def test_bundle_booking_creates_unified_pnr():
    req = MultimodalPlanRequest(
        origin_name="Symbiosis Institute of Technology, Lavale, Pune",
        origin_lat=18.5362,
        origin_lon=73.7297,
        destination_name="Har Ki Pauri, Haridwar",
        destination_lat=29.9567,
        destination_lon=78.1700,
        feeder_mode="AUTO",
    )
    plan_resp = plan_multimodal_journey(req)
    cheapest_plan = next(p for p in plan_resp.plans if p.badge == "CHEAPEST")

    book_req = MultimodalBookingRequest(
        user_id="sit_student_01",
        plan=cheapest_plan,
    )

    booking = await create_bundle_booking(book_req, db=None)

    assert booking.status == "CONFIRMED"
    assert booking.pnr.startswith("ST-2026-")
    assert len(booking.legs) == 3
    # Check that each leg has a generated ticket/voucher reference
    for leg in booking.legs:
        assert "(Ref: " in leg.operator
