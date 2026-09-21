import { SearchFormData, TransportResult } from "../types/smarttrip";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function sendAgentMessage({
  message,
  history,
}: {
  message: string;
  history: any[];
}) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/agent/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        reply: data.answer || "I found some options for your journey.",
        history: history,
        journeys: data.journeys || [],
      };
    }
  } catch (e) {
    console.warn("FastAPI agent backend offline, using fallback response...");
  }

  return {
    reply:
      "SmartTrip AI is ready! Connect the backend server at http://localhost:8000 to get real-time trip plans.",
    history,
  };
}

export async function searchTransport(
  searchForm: SearchFormData
): Promise<TransportResult[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/search/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from_city: searchForm.origin || "Pune",
        to_city: searchForm.destination || "Bangalore",
        from_lat: 18.5492,
        from_lon: 73.7431,
        travel_date: new Date(searchForm.date).toISOString(),
      }),
    });

    if (response.ok) {
      const journeys = await response.json();
      if (Array.isArray(journeys)) {
        return journeys.map((j: any) => ({
          id: j.journey_id,
          type: j.legs?.[0]?.mode?.toLowerCase() || "bus",
          title: j.summary,
          provider: j.legs?.[0]?.operator || "SmartTrip",
          price: j.total_fare,
          duration: `${Math.round((j.total_duration_seconds || 3600) / 3600)}h`,
          departureTime: "08:00 AM",
          arrivalTime: "10:00 PM",
          legs: j.legs,
        }));
      }
    }
  } catch (e) {
    console.warn("FastAPI search endpoint offline, returning demo options...");
  }

  return [
    {
      id: "bus-demo-1",
      type: "bus",
      title: "Feeder shuttle to Wakad + Volvo AC Bus",
      provider: "SmartTrip Express",
      price: 1250,
      duration: "14h",
      departureTime: "08:00 PM",
      arrivalTime: "10:00 AM",
    },
    {
      id: "flight-demo-1",
      type: "flight",
      title: "Direct Flight (PNQ -> BLR)",
      provider: "AirMock",
      price: 4500,
      duration: "1h 30m",
      departureTime: "09:30 PM",
      arrivalTime: "11:00 PM",
    },
  ];
}

export async function planMultimodalJourney(params: {
  origin_name: string;
  origin_lat: number;
  origin_lon: number;
  destination_name: string;
  destination_lat: number;
  destination_lon: number;
  feeder_mode?: string;
}): Promise<any[]> {
  const urls = [
    `${API_BASE_URL}/api/v1/multimodal/plan`,
    `http://10.0.2.2:8000/api/v1/multimodal/plan`,
    `http://127.0.0.1:8000/api/v1/multimodal/plan`,
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (response.ok) {
        const data = await response.json();
        return data.plans || [];
      }
    } catch (e) {
      // try next candidate
    }
  }

  // Fallback demo plans if backend unreachable
  return [
    {
      plan_id: "plan_train_cheapest",
      badge: "CHEAPEST",
      primary_mode: "TRAIN",
      total_fare: 2714,
      total_duration_minutes: 2040,
      total_distance_km: 1972.2,
      legs: [
        {
          leg_index: 1,
          leg_type: "FIRST_MILE",
          mode: "AUTO",
          operator: "Uber Auto / Local Auto",
          origin: params.origin_name,
          destination: "Pune Junction",
          distance_km: 28.6,
          duration_minutes: 55,
          fare: 436,
          description: "Direct 3-wheeler auto to Pune Junction",
          vehicle_icon: "car",
        },
        {
          leg_index: 2,
          leg_type: "LONG_HAUL",
          mode: "TRAIN",
          operator: "Indian Railways (12143 Express / 3AC)",
          origin: "Pune Junction",
          destination: "Haridwar Junction",
          distance_km: 1939.0,
          duration_minutes: 1963,
          fare: 2222,
          description: "Superfast express via 3rd AC (3A)",
          vehicle_icon: "train",
        },
        {
          leg_index: 3,
          leg_type: "LAST_MILE",
          mode: "E_RICKSHAW",
          operator: "Local E-Rickshaw",
          origin: "Haridwar Junction",
          destination: params.destination_name,
          distance_km: 4.6,
          duration_minutes: 22,
          fare: 56,
          description: "Eco-friendly local transit to Har Ki Pauri",
          vehicle_icon: "car",
        },
      ],
      summary: "Door-to-door via Pune Junction and Haridwar Junction express train",
    },
    {
      plan_id: "plan_flight_fastest",
      badge: "FASTEST",
      primary_mode: "FLIGHT",
      total_fare: 7453,
      total_duration_minutes: 385,
      total_distance_km: 1431.1,
      legs: [
        {
          leg_index: 1,
          leg_type: "FIRST_MILE",
          mode: "CAB",
          operator: "Uber Go / Sedan",
          origin: params.origin_name,
          destination: "Pune International Airport (PNQ)",
          distance_km: 29.9,
          duration_minutes: 69,
          fare: 608,
          description: "AC Cab pickup with luggage boot",
          vehicle_icon: "car",
        },
        {
          leg_index: 2,
          leg_type: "LONG_HAUL",
          mode: "FLIGHT",
          operator: "IndiGo / Air India (PNQ -> DED)",
          origin: "Pune Airport (PNQ)",
          destination: "Dehradun Airport (DED)",
          distance_km: 1363.0,
          duration_minutes: 220,
          fare: 6071,
          description: "Express commercial flight to Jolly Grant Airport",
          vehicle_icon: "flight",
        },
        {
          leg_index: 3,
          leg_type: "LAST_MILE",
          mode: "CAB",
          operator: "Airport Taxi / Cab",
          origin: "Dehradun Airport (DED)",
          destination: params.destination_name,
          distance_km: 38.2,
          duration_minutes: 86,
          fare: 774,
          description: "AC Cab from airport to Har Ki Pauri",
          vehicle_icon: "car",
        },
      ],
      summary: "Fastest door-to-door journey via PNQ to Dehradun Airport",
    },
    {
      plan_id: "plan_bus_sleeper",
      badge: "BEST_VALUE",
      primary_mode: "BUS",
      total_fare: 3025,
      total_duration_minutes: 2360,
      total_distance_km: 1918.0,
      legs: [],
      summary: "Comfortable multi-axle AC sleeper bus",
    },
    {
      plan_id: "plan_direct_cab",
      badge: "DIRECT_CAB",
      primary_mode: "DIRECT_CAB",
      total_fare: 30950,
      total_duration_minutes: 1710,
      total_distance_km: 1520.0,
      legs: [],
      summary: "Private non-stop outstation sedan door-to-door",
    },
  ];
}

export async function bookMultimodalBundle(params: {
  user_id: string;
  plan: any;
}): Promise<any> {
  const urls = [
    `${API_BASE_URL}/api/v1/multimodal/book`,
    `http://10.0.2.2:8000/api/v1/multimodal/book`,
    `http://127.0.0.1:8000/api/v1/multimodal/book`,
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      // try next
    }
  }

  // Fallback demo booking response
  const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  return {
    booking_id: "book-" + Date.now(),
    pnr: `ST-2026-${randomSuffix}`,
    status: "CONFIRMED",
    total_fare: params.plan.total_fare,
    primary_mode: params.plan.primary_mode,
    origin_address: params.plan.legs?.[0]?.origin || "Origin",
    destination_address: params.plan.legs?.[params.plan.legs.length - 1]?.destination || "Destination",
    badge: params.plan.badge,
    legs: params.plan.legs || [],
    qr_code_payload: `SMARTTRIP:ST-2026-${randomSuffix}:${params.user_id}:${params.plan.total_fare}`,
    created_at: new Date().toISOString(),
  };
}

