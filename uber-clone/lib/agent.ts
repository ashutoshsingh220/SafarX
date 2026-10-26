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

  return `You are SafarX, an intelligent and friendly personal travel companion for India.
You provide clear door-to-door transit routes, fares, train classes, flight options, and local cab information.

TRAVELER PROFILE:
- Name: ${profile.firstName} ${profile.lastName}
- Travel Style: ${profile.travelStyle} (${
    profile.travelStyle === "ECONOMICAL" ? "Budget-friendly, lowest cost first" :
    profile.travelStyle === "COMFORT_LUXURY" ? "Premium comfort, 1st/2nd AC, private sedans" :
    profile.travelStyle === "FASTEST" ? "Time-first, quickest transit options" :
    "Balanced value for money"
  })
- Preferred Train Class: ${profile.trainClass} (${
    profile.trainClass === "SL" ? "Sleeper Class (lowest fare)" :
    profile.trainClass === "3A" ? "3rd AC (AC value)" :
    profile.trainClass === "2A" ? "2nd AC (Spacious comfort & privacy)" :
    "1st AC / Executive EC (Top luxury coupe)"
  })
- Preferred Flight Cabin: ${profile.flightClass}
- Local Feeder Preference: ${profile.cabPreference} (${
    profile.cabPreference === "SHARED" ? "Shared Taxi / Auto / Sumo (lowest cost)" :
    profile.cabPreference === "PRIVATE_SEDAN" ? "Dedicated Private Sedan (Swift / Dzire)" :
    "Spacious SUV / Innova"
  })

CURRENT TRIP CONTEXT:
- Pickup: ${userLoc}
- Destination: ${destLoc}
- Available Cabs: UberGo at ₹22/km, UberPremier at ₹30/km

CRITICAL FORMATTING RULES (STRICT COMPLIANCE REQUIRED):
1. NEVER USE DOUBLE ASTERISKS (**) FOR BOLDING: Mobile screens cannot parse markdown bold and show ugly raw asterisks. Never output "**word**". Use natural English, clean capitalization, and bullet points.
2. NEVER OUTPUT MARKDOWN TABLES: Do not use "|" or "---" table formatting. Tables get completely mangled on mobile screens.
3. NEVER OUTPUT HTML TAGS: Do not write "<br>" or "<p>". Use clean line breaks (\n).
4. CLEAR STEP-BY-STEP ITINERARY: Format door-to-door travel cleanly with distinct lines:

   Example format:
   Hey ${profile.firstName}! Here is a recommended plan from [Origin] to [Destination] tailored for your ${profile.travelStyle.toLowerCase()} preference:

   Leg 1: Feeder Cab
   • Pickup: [Locality] to [Nearest Station/Airport]
   • Mode: [UberGo / Cab / Auto]
   • Approx Fare: ₹X (~X mins)

   Leg 2: Long-Haul Transit
   • Option A (Train): [Train Name] (Class: ${profile.trainClass}), Fare: ₹X (~X hrs)
   • Option B (Flight): [Airline], Fare: ₹X (~X hrs)

   Leg 3: Last-Mile Feeder
   • [Station/Airport] to [Destination Village/Town]
   • Mode: [Local Shared Sumo / Dedicated Cab]
   • Approx Fare: ₹X (~X mins)

   Summary:
   • Total Estimated Fare: ₹X
   • Total Travel Time: ~X hrs

5. TONE: Warm, concise, direct, and helpful.`;
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
        temperature: 0.5,
        max_tokens: 800,
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
            temperature: 0.5,
            max_tokens: 800,
          }),
        });
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          return cleanOutputText(fallbackData.choices?.[0]?.message?.content || "No response received.");
        }
      }
      throw new Error(`Groq API returned HTTP ${response.status}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "I didn't receive a reply from the assistant. Please try again.";
    return cleanOutputText(rawContent);
  } catch (error) {
    console.error("Agent request failed, generating contextual fallback:", error);
    return getLocalFallbackResponse(messages[messages.length - 1]?.content || "", context);
  }
};

/**
 * Strips raw markdown table syntax, <br> tags, and double asterisks (**)
 * so output is always clean, polished, and mobile-friendly.
 */
export const cleanOutputText = (text: string): string => {
  if (!text) return "";

  let cleaned = text;

  // Replace <br> and <br/> with newline
  cleaned = cleaned.replace(/<br\s*\/?>/gi, "\n");

  // Remove markdown table header separators like |---|---|
  cleaned = cleaned.replace(/\|[-:\s|]+\|/g, "");

  // Convert table rows | a | b | c | into clean bulleted text
  cleaned = cleaned.replace(/\|([^\n|]+)\|([^\n|]+)\|([^\n|]+)\|([^\n|]+)\|/g, (match, p1, p2, p3, p4) => {
    const trim1 = p1.trim();
    const trim2 = p2.trim();
    const trim3 = p3.trim();
    const trim4 = p4.trim();
    if (trim1.toLowerCase().includes("leg") && trim2.toLowerCase().includes("mode")) {
      return "";
    }
    return `\nLeg ${trim1}: ${trim2}\n• Details: ${trim3}\n• Cost: ${trim4}\n`;
  });

  // Convert generic remaining table pipes
  cleaned = cleaned.replace(/\|\s*/g, " • ").replace(/\s*•\s*$/gm, "");

  // Strip all double asterisks (**) and single leading/trailing asterisks
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, "$1");
  cleaned = cleaned.replace(/\*(.*?)\*/g, "$1");

  // Clean excessive blank lines
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  return cleaned.trim();
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
    const cabLabel = profile.cabPreference === "SHARED" 
      ? "Shared Taxi / Auto (Lowest Cost)" 
      : profile.cabPreference === "SUV" 
      ? "Mountain SUV / Innova" 
      : "Private Sedan (UberGo / Swift Dzire)";

    return `Hey ${name}! 👋\n\n` +
      `Here is a travel plan from ${userLoc} to ${dest} matched to your ${style} preferences:\n\n` +
      `Leg 1: Feeder Cab\n` +
      `• Pickup: ${userLoc} to nearest rail junction or airport\n` +
      `• Vehicle: ${cabLabel}\n\n` +
      `Leg 2: Long-Haul Transit\n` +
      `• Train Option: Prioritizing ${profile.trainClass} Class for comfort and value\n` +
      `• Flight Option: ${profile.flightClass} cabin\n\n` +
      `Leg 3: Last-Mile Feeder\n` +
      `• Station/Airport connection directly to ${dest}\n\n` +
      `Would you like me to calculate the complete timetable and total tariff?`;
  }

  if (q.includes("price") || q.includes("fare") || q.includes("cost") || q.includes("rate") || q.includes("ubergo") || q.includes("premier")) {
    const recommendedCab = style === "COMFORT_LUXURY" 
      ? `• UberPremier (Recommended for your Luxury preference): ₹30 / km (Amit Verma, Honda City, 4.92 ★)`
      : `• UberGo (Recommended for your Value preference): ₹22 / km (Rahul Sharma, Swift Dzire, 4.85 ★)`;

    return `Ride Rates from ${userLoc}:\n\n` +
      `${recommendedCab}\n` +
      `• UberGo: ₹22 / km (Budget 4-seater)\n` +
      `• UberPremier: ₹30 / km (Executive Sedan)\n\n` +
      `Door-to-door transit includes real-time Google Maps live traffic routing.`;
  }

  if (q.includes("traffic") || q.includes("route") || q.includes("time") || q.includes("fastest")) {
    return `Route & Traffic from ${userLoc} to ${dest}:\n\n` +
      `• Route Telemetry: Real-time traffic navigation active.\n` +
      `• Suggested Highway Corridor: Leaving Lavale via Pashan-Sus bypass to minimize Hinjewadi bottleneck delays.`;
  }

  if (q.includes("driver")) {
    return `Verified Drivers in your area:\n\n` +
      `1. Rahul Sharma (UberGo)\n` +
      `• Rating: 4.85 ★ | Vehicle: Swift / Dzire\n` +
      `• Rate: ₹22/km (Ideal for budget/value trips)\n\n` +
      `2. Amit Verma (UberPremier)\n` +
      `• Rating: 4.92 ★ | Vehicle: Executive Honda City\n` +
      `• Rate: ₹30/km (Ideal for premium comfort)`;
  }

  return `Hey ${name}! 👋\n\n` +
    `I am ready to help you plan your journey from ${userLoc} to ${dest}.\n\n` +
    `Your saved preferences: ${style} | Train: ${profile.trainClass} | Flight: ${profile.flightClass}\n\n` +
    `Ask me for route suggestions, train/flight connections, fares, or rural village reachability!`;
};
