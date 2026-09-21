import { getBusById } from "../../../backend/smarttrip/search/buses";
import { getTrainById } from "../../../backend/smarttrip/search/trains";
import { getFlightById } from "../../../backend/smarttrip/search/flights";
import { calculateRoute } from "../../../backend/smarttrip/geo/routing";
import { computeDoorToDoorPrice } from "../../../backend/smarttrip/pricing/engine";
import { RideQuote } from "../../../backend/smarttrip/pricing/types";

export async function POST(request: Request) {
  try {
    const { transportId, transportMode, pickupLat, pickupLon, dropoffLat, dropoffLon } = await request.json();
    
    let transport: any;
    if (transportMode === "bus") transport = getBusById(transportId);
    if (transportMode === "train") transport = getTrainById(transportId);
    if (transportMode === "flight") transport = getFlightById(transportId);

    if (!transport) {
      return Response.json({ error: "Transport option not found" }, { status: 404 });
    }

    // Default or fallback location if coordinates not provided
    // For demo purposes, we fallback to a hardcoded 5km distance if Geoapify fails
    let distanceKm = 5;
    let durationMinutes = 15;

    if (pickupLat && pickupLon && dropoffLat && dropoffLon) {
      try {
        const route = await calculateRoute(
          { lat: pickupLat, lon: pickupLon },
          { lat: dropoffLat, lon: dropoffLon }
        );
        distanceKm = route.distanceKm;
        durationMinutes = route.durationMinutes;
      } catch (err) {
        console.log("Routing failed, falling back to 5km estimate");
      }
    }

    const baseFareInr = 2000 + Math.floor(distanceKm * 1500); // 20 rs + 15/km
    const ride: RideQuote = { distanceKm, durationMinutes, baseFareInr };

    // Default mock user
    const user = { id: "test_user", membershipPlan: "free" as const };

    // We only have the detailed pricing engine fully supported for buses right now
    if (transportMode === "bus") {
      const breakdown = computeDoorToDoorPrice({
        bus: transport,
        ride,
        user,
        bookingTime: new Date()
      });
      return Response.json({ data: { transport, ride, pricing: breakdown, isFeederAvailable: breakdown.strategiesApplied.includes("feeder_shuttle") } });
    }

    // Basic fallback for trains/flights
    const pricing = {
      busFare: transport.fareInr * 100 || (transport.classes?.[0]?.fareInr * 100) || 0,
      rideFare: baseFareInr,
      total: (transport.fareInr * 100 || (transport.classes?.[0]?.fareInr * 100) || 0) + baseFareInr,
      currency: "INR",
      strategiesApplied: [],
      feederDiscount: 0,
      crossSubsidy: 0,
      membershipCap: 0,
      advanceDiscount: 0,
    };

    return Response.json({ data: { transport, ride, pricing, isFeederAvailable: false } });
  } catch (error: any) {
    console.error("Bundle API Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
