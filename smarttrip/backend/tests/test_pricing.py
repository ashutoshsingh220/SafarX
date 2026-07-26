import pytest
from datetime import datetime, timedelta
from app.services.pricing import apply_pricing_strategies

def test_standard_pricing():
    now = datetime.now()
    res = apply_pricing_strategies(
        feeder_fare=100.0,
        bus_fare=1500.0,
        is_smarttrip_plus=False,
        booking_time=now,
        travel_time=now + timedelta(hours=2),
        is_high_demand_corridor=False
    )
    assert res["original_feeder_fare"] == 100.0
    assert res["bus_commission"] == 75.0 # 5% of 1500
    # Subsidy: min(75*0.5, 100*0.4) = min(37.5, 40) = 37.5
    assert res["subsidy"] == 37.5
    assert res["final_ride_cost"] == 100.0 - 37.5
    assert res["bundle_price"] == 1500.0 + 62.5

def test_smarttrip_plus_and_early():
    now = datetime.now()
    res = apply_pricing_strategies(
        feeder_fare=150.0,
        bus_fare=2000.0,
        is_smarttrip_plus=True,
        booking_time=now,
        travel_time=now + timedelta(hours=8), # > 6 hours
        is_high_demand_corridor=False
    )
    # S5: 150 * 0.9 = 135
    # S4: cap at 20 -> 20.0
    # S2: commission = 100. Subsidy = min(50, 20*0.4) = 8.0
    assert res["subsidy"] == 8.0
    assert res["final_ride_cost"] == 12.0
    assert res["bundle_price"] == 2012.0

def test_high_demand_corridor():
    now = datetime.now()
    res = apply_pricing_strategies(
        feeder_fare=120.0,
        bus_fare=1000.0,
        is_smarttrip_plus=False,
        booking_time=now,
        travel_time=now + timedelta(hours=1),
        is_high_demand_corridor=True
    )
    # S1: ride_cost = 50.0
    # S2: commission = 50. Subsidy = min(25, 50*0.4) = 20.0
    assert res["subsidy"] == 20.0
    assert res["final_ride_cost"] == 30.0
    assert res["bundle_price"] == 1030.0
