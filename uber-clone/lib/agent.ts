export interface AgentContext {
  userAddress?: string | null;
  userLatitude?: number | null;
  userLongitude?: number | null;
  destinationAddress?: string | null;
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
  selectedDriver?: number | null;
  drivers?: any[];
}

export interface ChatMessage {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: string;
  suggestedActions?: string[];
}

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export const buildSystemPrompt = (context: AgentContext): string => {
  const userLoc = context.userAddress || "Symbiosis Institute of Technology (SIT), Lavale, Pune";
  const userCoords = context.userLatitude && context.userLongitude 
    ? `${context.userLatitude.toFixed(4)}° N, ${context.userLongitude.toFixed(4)}° E` 
    : "18.5412° N, 73.7275° E";

  const destLoc = context.destinationAddress || "None currently selected";
  const destCoords = context.destinationLatitude && context.destinationLongitude
    ? `${context.destinationLatitude.toFixed(4)}° N, ${context.destinationLongitude.toFixed(4)}° E`
    : "N/A";

  const driverList = [
    {
      id: 1,
      name: "Rahul Sharma",
      service: "UberGo",
      rate: "₹22/km",
      rating: "4.85 ★",
      car: "Maruti Swift / Dzire (4 Seats)",
    },
    {
      id: 2,
      name: "Amit Verma",
      service: "UberPremier",
      rate: "₹30/km",
      rating: "4.92 ★",
      car: "Honda City / Hyundai Verna (Executive 4 Seats)",
    }
  ];

  let selectedDriverInfo = "No specific driver chosen yet.";
  if (context.selectedDriver) {
    const d = driverList.find((x) => x.id === context.selectedDriver);
    if (d) {
      selectedDriverInfo = `${d.name} (${d.service}) at ${d.rate}, rated ${d.rating}, driving a ${d.car}.`;
    }
  }

  return `You are the Smart Trip AI & Ride Assistant for the Uber Clone app.
You are directly integrated into the app and have real-time visibility into the user's active session, GPS coordinates, route telemetry, and driver pricing.

CURRENT USER TELEMETRY & APP STATE:
- User GPS Pickup Location: ${userLoc} [Coordinates: ${userCoords}]
- Active Destination: ${destLoc} [Coordinates: ${destCoords}]
- Selected Driver / Ride: ${selectedDriverInfo}
- Available Cab Categories & Verified Pricing:
  1. UberGo: Driver Rahul Sharma, 4.85 ★ rating, ₹22 per kilometer (Budget-friendly, economical sedan/hatchback).
  2. UberPremier: Driver Amit Verma, 4.92 ★ rating, ₹30 per kilometer (Premium comfort, executive sedan).
  *(Note: Auto-rickshaws are excluded from car cab bookings).*
- Route Optimization: Powered by Google Maps Directions with live traffic algorithm (fastest real-time route, departure_time=now).

YOUR CAPABILITIES & INSTRUCTIONS:
1. Ride & Fare Inquiries:
   - Provide clear calculations based on distance and exact rates: ₹22/km for UberGo and ₹30/km for UberPremier.
   - Mention driver credentials (e.g., Rahul Sharma or Amit Verma).
2. Route & Traffic Intelligence:
   - Detail the best highway corridors, current road conditions, tolls, and real-time traffic bottlenecks from SIT Lavale / Pune.
3. Long Distance & Intercity Travel (e.g., Haldwani, Uttarakhand, Delhi, etc.):
   - Explain the direct highway driving route (via Mumbai-Pune Expressway, NH48, Agra-Lucknow Expressway).
   - Also provide smart multimodal door-to-door options:
     * Cab from SIT Pune to Pune International Airport (PNQ) (~45-55 mins via Pashan-Sus / Baner Rd).
     * Flight to Dehradun / Pantnagar or Delhi IGI.
     * Connecting cab/taxi to final destination (e.g. Haldwani / Nainital).
4. Tone & Style:
   - Friendly, precise, helpful, and concise.
   - Use Indian Rupees (₹) for all pricing.
   - Use bullet points and clean formatting so the response is easy to read on mobile.`;
};

export const askTravelAgent = async (
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  context: AgentContext
): Promise<string> => {
  const apiKey =
    process.env.EXPO_PUBLIC_GROQ_API_KEY ||
    process.env.EXPO_PUBLIC_GROK_API_KEY ||
    "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";

  const model = process.env.EXPO_PUBLIC_GROQ_MODEL || "openai/gpt-oss-120b";

  const systemPrompt = buildSystemPrompt(context);

  const fullMessages = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: fullMessages,
        temperature: 0.6,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn("Groq API error response:", response.status, errText);
      // If the selected model failed, try a reliable fallback model
      if (model !== "qwen/qwen3.8-27b") {
        const fallbackRes = await fetch(GROQ_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "qwen/qwen3.8-27b",
            messages: fullMessages,
            temperature: 0.6,
            max_tokens: 800,
          }),
        });
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          return fallbackData.choices?.[0]?.message?.content || "No response received.";
        }
      }
      throw new Error(`Groq API returned HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "I didn't receive a reply from the agent. Please try again.";
  } catch (error) {
    console.error("Agent request failed, generating contextual fallback:", error);
    return getLocalFallbackResponse(messages[messages.length - 1]?.content || "", context);
  }
};

const getLocalFallbackResponse = (query: string, context: AgentContext): string => {
  const q = query.toLowerCase();
  const dest = context.destinationAddress || "your destination";
  const userLoc = context.userAddress || "Symbiosis Institute of Technology, Pune";

  if (q.includes("price") || q.includes("fare") || q.includes("cost") || q.includes("rate") || q.includes("ubergo") || q.includes("premier")) {
    return `💰 **Ride Rates & Fares from ${userLoc}**\n\n` +
      `• **UberGo**: **₹22 / km** (Driver: Rahul Sharma, 4.85 ★, 4-seater Swift/Dzire)\n` +
      `• **UberPremier**: **₹30 / km** (Driver: Amit Verma, 4.92 ★, Executive Honda City)\n\n` +
      `Both rides include real-time traffic tracking via Google Maps fastest route algorithm.`;
  }

  if (q.includes("traffic") || q.includes("route") || q.includes("time") || q.includes("fastest")) {
    return `🚦 **Route & Real-Time Traffic Information**\n\n` +
      `• **Origin**: ${userLoc}\n` +
      `• **Destination**: ${dest}\n` +
      `• **Navigation**: Using Google Maps Directions with live traffic optimization (\`departure_time=now\`).\n` +
      `• **Corridor**: Leaving Lavale via Pashan-Sus bypass to minimize Hinjewadi bottleneck delays.`;
  }

  if (q.includes("driver")) {
    return `🚗 **Available Drivers**\n\n` +
      `1. **Rahul Sharma** (UberGo)\n` +
      `   • Rating: 4.85 ★ | Vehicle: Swift / Dzire\n` +
      `   • Pricing: ₹22/km\n\n` +
      `2. **Amit Verma** (UberPremier)\n` +
      `   • Rating: 4.92 ★ | Vehicle: Executive Honda City\n` +
      `   • Pricing: ₹30/km`;
  }

  return `📍 **Trip Summary & Support**\n\n` +
    `• **Pickup**: ${userLoc}\n` +
    `• **Destination**: ${dest}\n` +
    `• **Options**: UberGo (₹22/km) or UberPremier (₹30/km)\n\n` +
    `How else can I assist with your journey today?`;
};
