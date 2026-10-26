import pytest
from app.schemas import CorridorInventoryRequest, MultimodalPlanRequest
from app.services.transit_hubs import (
    INDIAN_TRANSIT_HUBS,
    find_nearest_hub,
    resolve_locality_context,
)
from app.services.transit_inventory import get_corridor_inventory
from app.services.multimodal_planner import plan_multimodal_journey


ALL_28_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
    "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
    "Uttar Pradesh", "Uttarakhand", "West Bengal"
]

ALL_8_UTS = [
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
]


def test_all_28_states_and_8_uts_coverage():
    """Verify that every single state and UT has registered operational transit hubs."""
    states_in_registry = set(h["state"] for h in INDIAN_TRANSIT_HUBS)
    
    missing_states = [s for s in ALL_28_STATES if s not in states_in_registry]
    assert not missing_states, f"Missing states in transit hub registry: {missing_states}"

    missing_uts = [u for u in ALL_8_UTS if u not in states_in_registry]
    assert not missing_uts, f"Missing UTs in transit hub registry: {missing_uts}"

    assert len(INDIAN_TRANSIT_HUBS) >= 200, "Registry must contain comprehensive hub coverage"


def test_mountain_village_reachability_mana_uttarakhand():
    """Verify that Mana village (Chamoli) correctly indicates no direct train, reaches Rishikesh/Haridwar, and calculates feeder."""
    ctx = resolve_locality_context("Mana, Chamoli, Uttarakhand")
    assert ctx["is_hill"] is True
    assert ctx["train_reachable_direct"] is False
    assert "YNRK" in ctx["rail_station"] or "HW" in ctx["rail_station"] or "DDN" in ctx["rail_station"]
    assert ctx["rail_dist_km"] > 150.0  # High Himalayan mountain distance
    assert ctx["feeder_fare"] > 400.0  # Realistic mountain feeder fare
    assert "mountain" in ctx["rail_reachability_text"].lower() or "terrain" in ctx["rail_reachability_text"].lower()
    assert "DED" in ctx["airport"]


def test_desert_village_reachability_khuri_rajasthan():
    """Verify that Khuri desert village (Thar, Jaisalmer) reaches JSM railhead and JSA airport with authentic feeder."""
    ctx = resolve_locality_context("Khuri, Jaisalmer, Rajasthan")
    assert "JSM" in ctx["rail_station"]
    assert 25.0 <= ctx["rail_dist_km"] <= 90.0  # Actual road distance is ~61 km
    assert "JSA" in ctx["airport"]
    assert ctx["feeder_fare"] > 100.0


def test_spiti_valley_village_reachability_kaza():
    """Verify that Kaza (Spiti Valley, HP) reaches foothill railhead and Bhuntar/Kullu airport."""
    ctx = resolve_locality_context("Kaza, Spiti, Himachal Pradesh")
    assert ctx["is_hill"] is True
    assert ctx["train_reachable_direct"] is False
    assert "KLK" in ctx["rail_station"] or "UHL" in ctx["rail_station"] or "PTK" in ctx["rail_station"]
    assert ctx["rail_dist_km"] > 200.0
    assert "KUU" in ctx["airport"] or "DHM" in ctx["airport"] or "SLV" in ctx["airport"]


def test_island_territory_reachability_mayabunder():
    """Verify that Andaman Island township correctly reports island reachability."""
    ctx = resolve_locality_context("Mayabunder, Andaman and Nicobar Islands")
    assert ctx["is_island"] is True
    assert ctx["train_reachable_direct"] is False
    assert "IXZ" in ctx["airport"]
    assert "island" in ctx["rail_reachability_text"].lower()


def test_interstate_remote_village_corridor_inventory():
    """Verify corridor inventory between Mana (Uttarakhand village) and Khuri (Rajasthan village)."""
    req = CorridorInventoryRequest(
        origin_name="Mana, Chamoli, Uttarakhand",
        origin_lat=30.7726,
        origin_lon=79.4953,
        destination_name="Khuri, Jaisalmer, Rajasthan",
        destination_lat=26.6133,
        destination_lon=70.7150,
        travel_date="2026-11-20",
    )
    res = get_corridor_inventory(req)
    assert "MANA" in res.corridor_title and "KHURI" in res.corridor_title
    assert res.has_direct_trains is False  # Because villages have no direct train tracks
    assert res.origin_reachability is not None
    assert res.destination_reachability is not None
    assert len(res.trains) > 0
    assert len(res.flights) > 0
    assert len(res.buses) > 0
    assert len(res.cabs) > 0


def test_multimodal_journey_remote_villages():
    """Verify multimodal plan generation between remote villages across different states."""
    req = MultimodalPlanRequest(
        origin_name="Mana, Chamoli, Uttarakhand",
        origin_lat=30.7726,
        origin_lon=79.4953,
        destination_name="Khuri, Jaisalmer, Rajasthan",
        destination_lat=26.6133,
        destination_lon=70.7150,
        feeder_mode="CAB",
    )
    res = plan_multimodal_journey(req)
    assert res.origin_reachability is not None
    assert res.destination_reachability is not None
    assert len(res.plans) == 4

    train_plan = next(p for p in res.plans if p.primary_mode == "TRAIN")
    assert len(train_plan.legs) == 3
    assert train_plan.legs[0].distance_km > 100.0  # Mana to railhead
    assert train_plan.legs[2].distance_km > 25.0   # JSM to Khuri
    assert train_plan.total_fare > 3000.0
