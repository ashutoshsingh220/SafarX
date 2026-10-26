import { UserProfile } from "@/store/profileStore";

export interface AgentContext {
  userAddress?: string | null;
  userLatitude?: number | null;
  userLongitude?: number | null;
  destinationAddress?: string | null;
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
  selectedDriver?: number | null;
  drivers?: any[];
  userProfile?: UserProfile | null;
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

  const profile = context.userProfile || {
    firstName: "Ashutosh",
    lastName: "Singh",
    email: "ashutosh.singh@safarx.app",
    phone: "+91 98765 43210",
    travelStyle: "BALANCED",
    trainClass: "3A",
    flightClass: "ECONOMY",
    cabPreference: "PRIVATE_SEDAN",
  };

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

  return `You are the SafarX AI Orchestration Layer & Smart Transit Assistant for the SafarX app.
You are directly integrated into the app with real-time visibility into the user's active session, GPS coordinates, route telemetry, and personalized travel profile.

============================================================
USER PERSONAL TRAVEL PROFILE & AI ORCHESTRATION PARAMETERS:
- Traveler Name: ${profile.firstName} ${profile.lastName}
- Contact: ${profile.email} | ${profile.phone}
- Travel Philosophy & Budget: ${profile.travelStyle}
  * ECONOMICAL: User prioritizes lowest possible cost, budget sleeper class trains, shared cabs/sumos, and affordable options.
  * BALANCED: User wants the best value balance of travel duration, comfort, and fair price (e.g. 3rd AC, standard economy flight, UberGo).
  * COMFORT_LUXURY: User values top-tier comfort above price (prefers 1st AC / 2nd AC trains, business/flexi flights, premium private cabs/SUVs).
  * FASTEST: User prioritizes minimum travel time, direct flights, express trains, and expressway road feeders.
- Preferred Train Class: ${profile.trainClass} (${
    profile.trainClass === "SL" ? "Sleeper Class (lowest fare)" :
    profile.trainClass === "3A" ? "3rd AC / 3-Economy (AC value)" :
    profile.trainClass === "2A" ? "2nd AC (Spacious comfort & privacy)" :
    "1st AC / Executive EC (Top luxury coupe)"
  })
- Preferred Flight Cabin: ${profile.flightClass} (${
    profile.flightClass === "ECONOMY" ? "Standard Economy (best airfare)" :
    profile.flightClass === "PREMIUM_ECONOMY" ? "Premium Economy / Flexi fare" :
    "Business Class (Executive lounge, priority boarding, flatbed)"
  })
- First/Last-Mile Cab Preference: ${profile.cabPreference} (${
    profile.cabPreference === "SHARED" ? "Shared Taxi / Auto / Sumo / Bolero (lowest feeder cost)" :
    profile.cabPreference === "PRIVATE_SEDAN" ? "Dedicated Private Sedan (Swift / Dzire / City / UberGo / Premier)" :
    "Spacious SUV / Innova (Mountain travel & extra luggage room)"
  })
============================================================

CURRENT USER TELEMETRY & APP STATE:
- User GPS Pickup Location: ${userLoc} [Coordinates: ${userCoords}]
- Active Destination: ${destLoc} [Coordinates: ${destCoords}]
- Selected Driver / Ride: ${selectedDriverInfo}
- Available Local Cab Pricing:
  1. UberGo: Driver Rahul Sharma, 4.85 ★ rating, ₹22 per kilometer (Budget sedan/hatchback).
  2. UberPremier: Driver Amit Verma, 4.92 ★ rating, ₹30 per kilometer (Premium executive sedan).
- All-India Reachability Radar: Active across all 28 Indian States & 8 Union Territories. Connects any remote village/district to the nearest railway junction or airport via calibrated road feeders.

CRITICAL INSTRUCTIONS FOR AI ORCHESTRATION:
1. Greet the traveler by their first name (${profile.firstName}) warmly.
2. Personalize Every Recommendation:
   - When suggesting train routes, explicitly highlight fares and availability for their preferred class (${profile.trainClass}).
   - When proposing flight connections, reflect their preferred cabin (${profile.flightClass}).
   - For first/last-mile transit from stations/airports to rural villages, tailor the road feeder to ${profile.cabPreference}.
   - Explain why your recommended plan fits their ${profile.travelStyle} profile!
3. Door-to-Door Multimodal Journey Calculation:
   - Show complete breakdown: (A) First-mile cab to station/airport -> (B) Long-haul train/flight -> (C) Last-mile feeder to exact destination village.
   - Sum up total estimated travel time and total expense in Indian Rupees (₹).
4. Tone & Style:
   - Smart, helpful, structured, concise, and clear.
   - Use bullet points, bold highlights, and emoji tags.`;
};

export const askTravelAgent = async (
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  context: AgentContext
): Promise<string> => {
  const apiKey =
    process.env.EXPO_PUBLIC_GROQ_API_KEY ||
    process.env.EXPO_PUBLIC_GROK_API_KEY ||
    "";

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
        max_tokens: 850,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn("Groq API error response:", response.status, errText);
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
            max_tokens: 850,
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
  const profile = context.userProfile || {
    firstName: "Ashutosh",
    lastName: "Singh",
    travelStyle: "BALANCED" as const,
    trainClass: "3A" as const,
    flightClass: "ECONOMY" as const,
    cabPreference: "PRIVATE_SEDAN" as const,
  };

  const name = profile.firstName || "Traveler";
  const style = profile.travelStyle;

  if (q.includes("profile") || q.includes("preference") || q.includes("recommend") || q.includes("personal") || q.includes("best option")) {
    return `👋 **Hello ${name}! Here is your AI Personalized Travel Plan:**\n\n` +
      `Based on your **${style}** profile, here is how SafarX orchestrates your journey:\n\n` +
      `🚆 **Train Recommendation**: Prioritizing **${profile.trainClass} Class** (e.g., Vande Bharat / Rajdhani / Express) for maximum comfort and value.\n` +
      `✈️ **Flight Recommendation**: Booked under **${profile.flightClass}** cabin.\n` +
      `🚕 **First & Last-Mile Feeder**: **${profile.cabPreference === "SHARED" ? "Shared Sumo / Local Feeder (Lowest Cost)" : profile.cabPreference === "SUV" ? "Dedicated Mountain SUV / Innova" : "Private Dedicated Sedan (UberGo / Swift Dzire)"}**.\n\n` +
      `📍 **Active Pickup**: ${userLoc}\n` +
      `🎯 **Target Destination**: ${dest}\n\n` +
      `Would you like me to calculate the complete door-to-door schedule and total tariff?`;
  }

  if (q.includes("price") || q.includes("fare") || q.includes("cost") || q.includes("rate") || q.includes("ubergo") || q.includes("premier")) {
    const recommendedCab = style === "COMFORT_LUXURY" 
      ? `• **UberPremier (Recommended for your Luxury Profile)**: **₹30 / km** (Amit Verma, Honda City, 4.92 ★)`
      : `• **UberGo (Recommended for your Budget/Value Profile)**: **₹22 / km** (Rahul Sharma, Swift Dzire, 4.85 ★)`;

    return `💰 **Personalized Ride Rates for ${name} from ${userLoc}**\n\n` +
      `${recommendedCab}\n` +
      `• **UberGo**: ₹22 / km (Budget 4-seater)\n` +
      `• **UberPremier**: ₹30 / km (Executive Sedan)\n\n` +
      `Door-to-door transit utilizes Google Maps Directions with live traffic optimization.`;
  }

  if (q.includes("traffic") || q.includes("route") || q.includes("time") || q.includes("fastest")) {
    return `🚦 **Route & Real-Time Traffic for ${name}**\n\n` +
      `• **Origin**: ${userLoc}\n` +
      `• **Destination**: ${dest}\n` +
      `• **Orchestration**: Google Directions with live traffic telemetry (\`departure_time=now\`).\n` +
      `• **Recommended Route**: Leaving Lavale via Pashan-Sus bypass to avoid Hinjewadi traffic delays.`;
  }

  if (q.includes("driver")) {
    return `🚗 **Verified Drivers for ${name}**\n\n` +
      `1. **Rahul Sharma** (UberGo)\n` +
      `   • Rating: 4.85 ★ | Vehicle: Swift / Dzire\n` +
      `   • Rate: ₹22/km (Ideal for Economical trips)\n\n` +
      `2. **Amit Verma** (UberPremier)\n` +
      `   • Rating: 4.92 ★ | Vehicle: Executive Honda City\n` +
      `   • Rate: ₹30/km (Ideal for Comfort trips)`;
  }

  return `📍 **SafarX AI Assistant (Personalized for ${name})**\n\n` +
    `• **Your Profile**: ${style} | Train: ${profile.trainClass} | Flight: ${profile.flightClass} | Feeder: ${profile.cabPreference}\n` +
    `• **Origin**: ${userLoc}\n` +
    `• **Destination**: ${dest}\n\n` +
    `Ask me for recommendations, fares, train class comparisons, or door-to-door village reachability across India!`;
};
