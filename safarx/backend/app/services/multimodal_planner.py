import uuid
from typing import List
from app.schemas import (
    MultimodalLegOut,
    MultimodalPlanOut,
    MultimodalPlanRequest,
    MultimodalPlanResponse,
    ReachabilityInfo,
)
from app.services.transit_hubs import find_nearest_hub, resolve_locality_context
from app.services.road_feeder import calculate_feeder_trip
from app.services.intercity_transit import (
    calculate_train_leg,
    calculate_flight_leg,
    calculate_bus_leg,
    calculate_direct_outstation_cab,
)


def plan_multimodal_journey(request: MultimodalPlanRequest) -> MultimodalPlanResponse:
    """Generate and compare end-to-end 3-leg multimodal plans between ANY two locations in India.
    Includes rich reachability analysis: where train/flight reaches, exact feeder distances, and fares.
    """
    orig_name = request.origin_name
    orig_lat = request.origin_lat
    orig_lon = request.origin_lon

    dest_name = request.destination_name
    dest_lat = request.destination_lat
    dest_lon = request.destination_lon

    # 1. Resolve authentic locality context, state, district, and reachability
    orig_ctx = resolve_locality_context(orig_name, orig_lat, orig_lon)
    dest_ctx = resolve_locality_context(dest_name, dest_lat, dest_lon)

    # Use resolved genuine coordinates if initial were 0.0 or approximations
    orig_lat = orig_ctx["lat"]
    orig_lon = orig_ctx["lon"]
    dest_lat = dest_ctx["lat"]
    dest_lon = dest_ctx["lon"]

    preferred_feeder = request.feeder_mode or "AUTO"
    if orig_ctx["is_hill"]:
        preferred_feeder = "CAB"

    # 2. Resolve nearest transit hubs
    orig_rail, _ = find_nearest_hub(orig_lat, orig_lon, "RAILWAY_STATION")
    dest_rail, _ = find_nearest_hub(dest_lat, dest_lon, "RAILWAY_STATION")

    orig_air, _ = find_nearest_hub(orig_lat, orig_lon, "AIRPORT")
    dest_air, _ = find_nearest_hub(dest_lat, dest_lon, "AIRPORT")

    orig_bus, _ = find_nearest_hub(orig_lat, orig_lon, "BUS_TERMINAL")
    dest_bus, _ = find_nearest_hub(dest_lat, dest_lon, "BUS_TERMINAL")

    plans: List[MultimodalPlanOut] = []

    # =========================================================================
    # PLAN A: 🚆 TRAIN MULTIMODAL ROUTE (First-Mile Feeder + Train + Last-Mile Feeder)
    # =========================================================================
    leg1_train = calculate_feeder_trip(
        orig_lat, orig_lon, orig_rail["latitude"], orig_rail["longitude"],
        mode="CAB" if orig_ctx["is_hill"] else preferred_feeder,
        start_name=orig_name, end_name=orig_rail["name"], leg_type="FIRST_MILE",
        is_hill=orig_ctx["is_hill"], is_remote=orig_ctx["is_remote"]
    )
    leg2_train = calculate_train_leg(orig_rail, dest_rail, train_class="SL" if request.feeder_mode == "SHUTTLE" else "3A")
    
    leg3_train_mode = "CAB" if dest_ctx["is_hill"] else ("E_RICKSHAW" if dest_rail["city"] == "Haridwar" else "AUTO")
    leg3_train = calculate_feeder_trip(
        dest_rail["latitude"], dest_rail["longitude"], dest_lat, dest_lon,
        mode=leg3_train_mode,
        start_name=dest_rail["name"], end_name=dest_name, leg_type="LAST_MILE",
        is_hill=dest_ctx["is_hill"], is_remote=dest_ctx["is_remote"]
    )

    first_mile_desc = (
        f"{orig_ctx['rail_reachability_text']} Feeder: {leg1_train['operator']} ({leg1_train['distance_km']} km, ₹{leg1_train['fare']})"
        if not orig_ctx["train_reachable_direct"]
        else leg1_train["description"]
    )
    last_mile_desc = (
        f"{dest_ctx['rail_reachability_text']} Last-mile: {leg3_train['operator']} ({leg3_train['distance_km']} km, ₹{leg3_train['fare']})"
        if not dest_ctx["train_reachable_direct"]
        else leg3_train["description"]
    )

    train_legs = [
        MultimodalLegOut(
            leg_index=1, leg_type="FIRST_MILE", mode=leg1_train["mode"],
            operator=leg1_train["operator"], origin=orig_name, destination=orig_rail["name"],
            distance_km=leg1_train["distance_km"], duration_minutes=leg1_train["duration_minutes"],
            fare=leg1_train["fare"], description=first_mile_desc, vehicle_icon="car"
        ),
        MultimodalLegOut(
            leg_index=2, leg_type="LONG_HAUL", mode="TRAIN",
            operator=leg2_train["operator"], origin=orig_rail["name"], destination=dest_rail["name"],
            distance_km=leg2_train["distance_km"], duration_minutes=leg2_train["duration_minutes"],
            fare=leg2_train["fare"], description=leg2_train["description"], vehicle_icon="train"
        ),
        MultimodalLegOut(
            leg_index=3, leg_type="LAST_MILE", mode=leg3_train["mode"],
            operator=leg3_train["operator"], origin=dest_rail["name"], destination=dest_name,
            distance_km=leg3_train["distance_km"], duration_minutes=leg3_train["duration_minutes"],
            fare=leg3_train["fare"], description=last_mile_desc, vehicle_icon="car"
        ),
    ]

    total_train_fare = sum(l.fare for l in train_legs)
    total_train_duration = sum(l.duration_minutes for l in train_legs) + 30
    total_train_distance = sum(l.distance_km for l in train_legs)

    plans.append(MultimodalPlanOut(
        plan_id="plan_train_railway",
        badge="CHEAPEST",
        primary_mode="TRAIN",
        total_fare=total_train_fare,
        total_duration_minutes=total_train_duration,
        total_distance_km=total_train_distance,
        legs=train_legs,
        summary=f"Door-to-door via {orig_rail['name']} and {dest_rail['name']} express train",
    ))

    # =========================================================================
    # PLAN B: ✈️ FLIGHT MULTIMODAL ROUTE (First-Mile Cab + Flight + Last-Mile Cab)
    # =========================================================================
    leg1_flight = calculate_feeder_trip(
        orig_lat, orig_lon, orig_air["latitude"], orig_air["longitude"],
        mode="CAB", start_name=orig_name, end_name=orig_air["name"], leg_type="FIRST_MILE",
        is_hill=orig_ctx["is_hill"], is_remote=orig_ctx["is_remote"]
    )
    leg2_flight = calculate_flight_leg(orig_air, dest_air)
    leg3_flight = calculate_feeder_trip(
        dest_air["latitude"], dest_air["longitude"], dest_lat, dest_lon,
        mode="CAB", start_name=dest_air["name"], end_name=dest_name, leg_type="LAST_MILE",
        is_hill=dest_ctx["is_hill"], is_remote=dest_ctx["is_remote"]
    )

    flight_legs = [
        MultimodalLegOut(
            leg_index=1, leg_type="FIRST_MILE", mode="CAB",
            operator=leg1_flight["operator"], origin=orig_name, destination=orig_air["name"],
            distance_km=leg1_flight["distance_km"], duration_minutes=leg1_flight["duration_minutes"],
            fare=leg1_flight["fare"], description=f"Airport Feeder: {leg1_flight['operator']} to {orig_air['name']} ({leg1_flight['distance_km']} km, ₹{leg1_flight['fare']})", vehicle_icon="car"
        ),
        MultimodalLegOut(
            leg_index=2, leg_type="LONG_HAUL", mode="FLIGHT",
            operator=leg2_flight["operator"], origin=orig_air["name"], destination=dest_air["name"],
            distance_km=leg2_flight["distance_km"], duration_minutes=leg2_flight["duration_minutes"],
            fare=leg2_flight["fare"], description=leg2_flight["description"], vehicle_icon="flight"
        ),
        MultimodalLegOut(
            leg_index=3, leg_type="LAST_MILE", mode="CAB",
            operator=leg3_flight["operator"], origin=dest_air["name"], destination=dest_name,
            distance_km=leg3_flight["distance_km"], duration_minutes=leg3_flight["duration_minutes"],
            fare=leg3_flight["fare"], description=f"Airport Drop: {leg3_flight['operator']} from {dest_air['name']} to doorstep ({leg3_flight['distance_km']} km, ₹{leg3_flight['fare']})", vehicle_icon="car"
        ),
    ]

    total_flight_fare = sum(l.fare for l in flight_legs)
    total_flight_duration = sum(l.duration_minutes for l in flight_legs) + 45
    total_flight_distance = sum(l.distance_km for l in flight_legs)

    plans.append(MultimodalPlanOut(
        plan_id="plan_flight_express",
        badge="FASTEST",
        primary_mode="FLIGHT",
        total_fare=total_flight_fare,
        total_duration_minutes=total_flight_duration,
        total_distance_km=total_flight_distance,
        legs=flight_legs,
        summary=f"Fastest door-to-door journey via {orig_air['code']} to {dest_air['name']}",
    ))

    # =========================================================================
    # PLAN C: 🚌 INTERCITY BUS MULTIMODAL ROUTE (Auto/Cab + AC Sleeper Bus + Auto/Cab)
    # =========================================================================
    leg1_bus = calculate_feeder_trip(
        orig_lat, orig_lon, orig_bus["latitude"], orig_bus["longitude"],
        mode="CAB" if orig_ctx["is_hill"] else "AUTO",
        start_name=orig_name, end_name=orig_bus["name"], leg_type="FIRST_MILE",
        is_hill=orig_ctx["is_hill"], is_remote=orig_ctx["is_remote"]
    )
    leg2_bus = calculate_bus_leg(orig_bus, dest_bus)
    leg3_bus = calculate_feeder_trip(
        dest_bus["latitude"], dest_bus["longitude"], dest_lat, dest_lon,
        mode="CAB" if dest_ctx["is_hill"] else "AUTO",
        start_name=dest_bus["name"], end_name=dest_name, leg_type="LAST_MILE",
        is_hill=dest_ctx["is_hill"], is_remote=dest_ctx["is_remote"]
    )

    bus_legs = [
        MultimodalLegOut(
            leg_index=1, leg_type="FIRST_MILE", mode=leg1_bus["mode"],
            operator=leg1_bus["operator"], origin=orig_name, destination=orig_bus["name"],
            distance_km=leg1_bus["distance_km"], duration_minutes=leg1_bus["duration_minutes"],
            fare=leg1_bus["fare"], description=leg1_bus["description"], vehicle_icon="car"
        ),
        MultimodalLegOut(
            leg_index=2, leg_type="LONG_HAUL", mode="BUS",
            operator=leg2_bus["operator"], origin=orig_bus["name"], destination=dest_bus["name"],
            distance_km=leg2_bus["distance_km"], duration_minutes=leg2_bus["duration_minutes"],
            fare=leg2_bus["fare"], description=leg2_bus["description"], vehicle_icon="bus"
        ),
        MultimodalLegOut(
            leg_index=3, leg_type="LAST_MILE", mode=leg3_bus["mode"],
            operator=leg3_bus["operator"], origin=dest_bus["name"], destination=dest_name,
            distance_km=leg3_bus["distance_km"], duration_minutes=leg3_bus["duration_minutes"],
            fare=leg3_bus["fare"], description=leg3_bus["description"], vehicle_icon="car"
        ),
    ]

    total_bus_fare = sum(l.fare for l in bus_legs)
    total_bus_duration = sum(l.duration_minutes for l in bus_legs) + 20
    total_bus_distance = sum(l.distance_km for l in bus_legs)

    plans.append(MultimodalPlanOut(
        plan_id="plan_bus_sleeper",
        badge="BEST_VALUE",
        primary_mode="BUS",
        total_fare=total_bus_fare,
        total_duration_minutes=total_bus_duration,
        total_distance_km=total_bus_distance,
        legs=bus_legs,
        summary=f"Comfortable sleeper bus journey via {orig_bus['name']} to {dest_bus['name']}",
    ))

    # =========================================================================
    # PLAN D: 🚗 DIRECT OUTSTATION PRIVATE CAB (Single Leg Door-to-Door)
    # =========================================================================
    direct_cab = calculate_direct_outstation_cab(orig_lat, orig_lon, dest_lat, dest_lon, orig_name, dest_name)
    cab_legs = [
        MultimodalLegOut(
            leg_index=1, leg_type="LONG_HAUL", mode="CAB",
            operator=direct_cab["operator"], origin=orig_name, destination=dest_name,
            distance_km=direct_cab["distance_km"], duration_minutes=direct_cab["duration_minutes"],
            fare=direct_cab["fare"], description=direct_cab["description"], vehicle_icon="car"
        )
    ]

    plans.append(MultimodalPlanOut(
        plan_id="plan_direct_cab",
        badge="DIRECT_CAB",
        primary_mode="DIRECT_CAB",
        total_fare=direct_cab["fare"],
        total_duration_minutes=direct_cab["duration_minutes"],
        total_distance_km=direct_cab["distance_km"],
        legs=cab_legs,
        summary="Private non-stop outstation sedan with door-to-door pickup & drop",
    ))

    # 3. Resolve Badges dynamically
    min_fare_plan = min(plans, key=lambda p: p.total_fare)
    min_duration_plan = min(plans, key=lambda p: p.total_duration_minutes)

    for p in plans:
        if p == min_fare_plan:
            p.badge = "CHEAPEST"
        elif p == min_duration_plan:
            p.badge = "FASTEST"
        elif p.primary_mode == "DIRECT_CAB":
            p.badge = "DIRECT_CAB"
        else:
            p.badge = "BEST_VALUE"

    badge_order = {"CHEAPEST": 0, "BEST_VALUE": 1, "FASTEST": 2, "DIRECT_CAB": 3}
    plans.sort(key=lambda p: badge_order.get(p.badge or "", 99))

    # Build Reachability Info objects
    orig_reach = ReachabilityInfo(
        place_name=orig_ctx["clean_name"],
        state=orig_ctx["state"],
        district=orig_ctx["district"],
        is_hill=orig_ctx["is_hill"],
        is_island=orig_ctx["is_island"],
        train_reachable_direct=orig_ctx["train_reachable_direct"],
        nearest_railhead_name=orig_ctx["rail_station"],
        nearest_railhead_code=orig_ctx["rail_code"],
        railhead_distance_km=orig_ctx["rail_dist_km"],
        railhead_duration_minutes=orig_ctx["feeder_duration_minutes"],
        railhead_feeder_mode=orig_ctx["feeder_mode"],
        railhead_feeder_fare=orig_ctx["feeder_fare"],
        railhead_reachability_text=orig_ctx["rail_reachability_text"],
        nearest_airport_name=orig_ctx["airport"],
        nearest_airport_code=orig_ctx["airport_code"],
        airport_distance_km=orig_ctx["airport_dist_km"],
        airport_duration_minutes=max(15, int(orig_ctx["airport_dist_km"] / 45.0 * 60)),
        airport_feeder_mode="CAB",
        airport_feeder_fare=max(120.0, round(orig_ctx["airport_dist_km"] * 2.2, 0)),
        airport_reachability_text=orig_ctx["airport_reachability_text"],
        nearest_bus_terminal=orig_ctx["bus_terminal"],
        bus_distance_km=orig_ctx["bus_dist_km"],
        feeder_summary=orig_ctx["feeder_summary"],
    )

    dest_reach = ReachabilityInfo(
        place_name=dest_ctx["clean_name"],
        state=dest_ctx["state"],
        district=dest_ctx["district"],
        is_hill=dest_ctx["is_hill"],
        is_island=dest_ctx["is_island"],
        train_reachable_direct=dest_ctx["train_reachable_direct"],
        nearest_railhead_name=dest_ctx["rail_station"],
        nearest_railhead_code=dest_ctx["rail_code"],
        railhead_distance_km=dest_ctx["rail_dist_km"],
        railhead_duration_minutes=dest_ctx["feeder_duration_minutes"],
        railhead_feeder_mode=dest_ctx["feeder_mode"],
        railhead_feeder_fare=dest_ctx["feeder_fare"],
        railhead_reachability_text=dest_ctx["rail_reachability_text"],
        nearest_airport_name=dest_ctx["airport"],
        nearest_airport_code=dest_ctx["airport_code"],
        airport_distance_km=dest_ctx["airport_dist_km"],
        airport_duration_minutes=max(15, int(dest_ctx["airport_dist_km"] / 45.0 * 60)),
        airport_feeder_mode="CAB",
        airport_feeder_fare=max(120.0, round(dest_ctx["airport_dist_km"] * 2.2, 0)),
        airport_reachability_text=dest_ctx["airport_reachability_text"],
        nearest_bus_terminal=dest_ctx["bus_terminal"],
        bus_distance_km=dest_ctx["bus_dist_km"],
        feeder_summary=dest_ctx["feeder_summary"],
    )

    reach_note = (
        f"Door-to-door transit reachability: "
        f"{orig_ctx['clean_name']} ({orig_ctx['state']}) connects via railhead {orig_ctx['rail_station']}. "
        f"Express train connects to {dest_ctx['rail_station']}, where last-mile feeder transfers directly to {dest_ctx['clean_name']} ({dest_ctx['state']})."
    )

    return MultimodalPlanResponse(
        origin=orig_name,
        destination=dest_name,
        origin_coords={"lat": orig_lat, "lon": orig_lon},
        destination_coords={"lat": dest_lat, "lon": dest_lon},
        origin_reachability=orig_reach,
        destination_reachability=dest_reach,
        reachability_note=reach_note,
        plans=plans,
    )
