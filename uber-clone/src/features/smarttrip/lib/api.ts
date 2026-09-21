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
