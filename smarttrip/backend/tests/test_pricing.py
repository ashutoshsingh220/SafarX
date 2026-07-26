from datetime import datetime, timedelta

import pytest

from app.services.pricing import apply_pricing_strategies, calculate_bus_commission


NOW = datetime(2026, 8, 1, 9, 0)


def price(**overrides):
    values = {
        "feeder_fare": 100.0,
        "bus_fare": 1_500.0,
        "is_smarttrip_plus": False,
        "booking_time": NOW,
        "travel_time": NOW + timedelta(hours=2),
        "is_high_demand_corridor": False,
    }
    values.update(overrides)
    return apply_pricing_strategies(**values)


def test_s1_high_demand_corridor_caps_feeder_at_fifty() -> None:
    result = price(feeder_fare=120.0, is_high_demand_corridor=True)

    assert result.feeder_after_shuttle == 50.0
    assert result.applied_feeder_shuttle is True


def test_s2_cross_subsidy_uses_the_lower_of_both_caps() -> None:
    result = price(feeder_fare=100.0, bus_fare=1_500.0)

    assert result.bus_commission == 75.0
    assert result.subsidy == 37.5
    assert result.final_ride_cost == 62.5


def test_s3_bundle_price_is_bus_plus_discounted_last_mile() -> None:
    result = price(feeder_fare=100.0, bus_fare=1_500.0)

    assert result.bundle_price == 1_562.5


def test_s4_membership_caps_pre_subsidy_ride_at_twenty() -> None:
    result = price(feeder_fare=150.0, bus_fare=2_000.0, is_smarttrip_plus=True)

    assert result.feeder_after_membership == 20.0
    assert result.subsidy == 8.0
    assert result.final_ride_cost == 12.0
    assert result.applied_membership_cap is True


def test_s5_early_booking_reduces_last_mile_by_ten_percent() -> None:
    result = price(travel_time=NOW + timedelta(hours=6))

    assert result.feeder_after_early_booking == 90.0
    assert result.applied_early_booking is True


def test_negative_fares_are_rejected() -> None:
    with pytest.raises(ValueError, match="cannot be negative"):
        price(feeder_fare=-1.0)


def test_bus_commission_defaults_to_five_percent() -> None:
    assert calculate_bus_commission(1_500.0) == 75.0
