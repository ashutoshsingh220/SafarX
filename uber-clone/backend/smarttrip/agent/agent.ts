/**
 * Agent Execution Loop
 */

import Groq from "groq-sdk";
import { SYSTEM_PROMPT } from "./systemPrompt";
import { smartTripTools } from "./tools";
import type { AgentMessage } from "./types";

let groqClient: Groq;
function getGroq() {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });
  }
  return groqClient;
}

const tools: Groq.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "search_options",
      description: "Search for buses, trains, and flights between two cities.",
      parameters: {
        type: "object",
        properties: {
          originCity: { type: "string", description: "Origin city name" },
          destCity: { type: "string", description: "Destination city name" },
          date: { type: "string", description: "Date of travel (YYYY-MM-DD)" },
        },
        required: ["originCity", "destCity", "date"],
      },
    }
  },
  {
    type: "function",
    function: {
      name: "get_nearest_boarding",
      description: "Get the nearest boarding points (bus stops, railway stations) to a given location.",
      parameters: {
        type: "object",
        properties: {
          lat: { type: "number" },
          lon: { type: "number" },
        },
        required: ["lat", "lon"],
      },
    }
  },
  {
    type: "function",
    function: {
      name: "price_last_mile",
      description: "Calculate distance, duration, and base fare for a last-mile ride.",
      parameters: {
        type: "object",
        properties: {
          pickupLat: { type: "number" },
          pickupLon: { type: "number" },
          dropLat: { type: "number" },
          dropLon: { type: "number" },
        },
        required: ["pickupLat", "pickupLon", "dropLat", "dropLon"],
      },
    }
  },
  {
    type: "function",
    function: {
      name: "build_bundle",
      description: "Build a complete door-to-door bundle with intelligent pricing (cross-subsidy, feeder shuttles).",
      parameters: {
        type: "object",
        properties: {
          transportId: { type: "number" },
          transportMode: { type: "string", description: "'bus', 'train', or 'flight'" },
          pickupLat: { type: "number" },
          pickupLon: { type: "number" },
          dropLat: { type: "number" },
          dropLon: { type: "number" },
        },
        required: ["transportId", "transportMode", "pickupLat", "pickupLon", "dropLat", "dropLon"],
      },
    }
  },
  {
    type: "function",
    function: {
      name: "create_booking",
      description: "Initiate a booking for a given bundle.",
      parameters: {
        type: "object",
        properties: {
          bundleId: { type: "string" },
          userId: { type: "string" },
        },
        required: ["bundleId"],
      },
    }
  }
];

export async function runAgent(history: AgentMessage[], userMessage: string): Promise<any> {
  const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history
      .filter(msg => msg.role === "user" || msg.role === "model")
      .map(msg => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.parts?.[0]?.text || msg.content || ""
      } as Groq.Chat.Completions.ChatCompletionMessageParam)),
    { role: "user", content: userMessage }
  ];

  let isFinished = false;
  let finalResponse = "";
  
  while (!isFinished) {
    const response = await getGroq().chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: messages,
      tools: tools,
    });

    const choice = response.choices[0];
    const message = choice.message;

    if (message.tool_calls && message.tool_calls.length > 0) {
      messages.push(message);

      for (const toolCall of message.tool_calls) {
        const funcName = toolCall.function.name as keyof typeof smartTripTools;
        const args = JSON.parse(toolCall.function.arguments);

        console.log(`[Agent Calling Tool]: ${funcName}`, args);

        let result;
        try {
          if (smartTripTools[funcName]) {
            result = await (smartTripTools[funcName] as any)(args);
          } else {
            result = { error: `Tool ${funcName} not found.` };
          }
        } catch (e: any) {
          result = { error: e.message };
        }

        console.log(`[Tool Result]:`, JSON.stringify(result).substring(0, 200) + "...");

        messages.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: funcName,
          content: JSON.stringify(result),
        });
      }
    } else {
      isFinished = true;
      // Strip <think>...</think> reasoning tags that reasoning models may emit
      finalResponse = (message.content || "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
      messages.push({ role: "assistant", content: finalResponse });
    }
  }

  const updatedHistory: AgentMessage[] = messages
    .filter(m => m.role === "user" || m.role === "assistant")
    .map(m => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content || "" }],
      content: m.content || "",
    }));

  return {
    text: finalResponse,
    history: updatedHistory,
  };
}
