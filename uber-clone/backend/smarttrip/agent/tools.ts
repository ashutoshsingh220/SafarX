/**
 * Agent Tools Implementation
 */

import { searchBuses, getBusById } from "../search/buses";
import { searchTrains, getTrainById } from "../search/trains";
import { searchFlights, getFlightById } from "../search/flights";
import { findNearestBoardingPoints } from "../search/boardingPoints";
import { calculateRoute } from "../geo/routing";
import { computeDoorToDoorPrice } from "../pricing/engine";
import type { UserContext } from "./types";
import type { RideQuote, UserProfile } from "../pricing/types";

// Mock user profile since we don't have DB wiring in the pure CLI yet
const MOCK_USER: UserProfile = { id: "test_user", membershipPlan: "free" };

export const smartTripTools = {
  search_options: async ({ originCity, destCity, date }: any) => {
    const q = { originCity, destCity, date };
    const buses = searchBuses(q).slice(0, 3); // top 3
    const trains = searchTrains(q).slice(0, 2);
    const flights = searchFlights(q).slice(0, 2);
    return { buses, trains, flights };
  },

  get_nearest_boarding: async ({ lat, lon }: any) => {
    return findNearestBoardingPoints(lat, lon);
  },

  price_last_mile: async ({ pickupLat, pickupLon, dropLat, dropLon }: any) => {
    const route = await calculateRoute(
      { lat: pickupLat, lon: pickupLon },
      { lat: dropLat, lon: dropLon }
    );
    // Simple base fare estimate: 20 Rs base + 15 Rs per km
    const baseFareInr = 2000 + Math.floor(route.distanceKm * 1500); 
    
    return {
      distanceKm: route.distanceKm,
      durationMinutes: route.durationMinutes,
      baseFareInr
    };
  },

  build_bundle: async ({ transportId, transportMode, pickupLat, pickupLon, dropLat, dropLon }: any) => {
    let transport: any;
    if (transportMode === "bus") transport = getBusById(transportId);
    if (transportMode === "train") transport = getTrainById(transportId);
    if (transportMode === "flight") transport = getFlightById(transportId);

    if (!transport) return { error: "Transport not found" };

    const route = await calculateRoute(
      { lat: pickupLat, lon: pickupLon },
      { lat: dropLat, lon: dropLon }
    );
    const baseFareInr = 2000 + Math.floor(route.distanceKm * 1500); 
    const ride: RideQuote = { distanceKm: route.distanceKm, durationMinutes: route.durationMinutes, baseFareInr };

    // We only have the pricing engine fully built out for buses right now
    if (transportMode === "bus") {
      const breakdown = computeDoorToDoorPrice({
        bus: transport,
        ride,
        user: MOCK_USER,
        bookingTime: new Date()
      });
      return { transport, ride, breakdown };
    }

    return { transport, ride, error: "Pricing engine currently supports only buses for full door-to-door breakdown. But here are the raw details." };
  },

  create_booking: async ({ bundleId, userId }: any) => {
    // Hooks into existing stripe flow
    return { status: "success", bookingId: "ST_" + Math.random().toString(36).substr(2, 9), redirect: "payment_sheet" };
  }
};
