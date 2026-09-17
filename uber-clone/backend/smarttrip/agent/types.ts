/**
 * Agent Types
 */

export interface UserContext {
  userId?: string;
  locationLat?: number;
  locationLon?: number;
}

export interface AgentMessage {
  role: "user" | "model" | "function";
  parts: any[];
}
