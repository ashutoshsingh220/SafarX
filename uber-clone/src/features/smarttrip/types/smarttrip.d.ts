/**
 * SmartTrip Type Declarations
 *
 * Frontend-specific types for the SmartTrip AI feature.
 */

// === Transport Options ===

export type TransportMode = "bus" | "train" | "flight";

export interface BoardingPoint {
  id: number;
  name: string;
  city: string;
  lat: number;
  lon: number;
  type: "bus_stop" | "railway_station" | "airport";
}

export interface BusResult {
  id: number;
  operator: string;
  busType: string;
  originStop: BoardingPoint;
  destStop: BoardingPoint;
  departureTime: string;
  arrivalTime: string;
  durationHrs: number;
  fareInr: number;
  availableSeats: number;
  amenities: string[];
  rating: number;
  mode: "bus";
}

export interface TrainResult {
  id: number;
  trainNumber: string;
  trainName: string;
  originStation: BoardingPoint;
  destStation: BoardingPoint;
  departureTime: string;
  arrivalTime: string;
  durationHrs: number;
  classes: { code: string; name: string; fareInr: number; availableSeats: number }[];
  mode: "train";
}

export interface FlightResult {
  id: number;
  airline: string;
  flightNumber: string;
  originAirport: BoardingPoint;
  destAirport: BoardingPoint;
  departureTime: string;
  arrivalTime: string;
  durationHrs: number;
  fareInr: number;
  cabinClass: string;
  mode: "flight";
}

export type TransportResult = BusResult | TrainResult | FlightResult;

// === Price Breakdown ===

export interface PriceBreakdown {
  busFare: number;
  rideFare: number;
  feederDiscount: number;
  crossSubsidy: number;
  membershipCap: number;
  advanceDiscount: number;
  total: number;
  currency: "INR";
  strategies: string[];
}

// === Bundle ===

export interface BundleQuote {
  id: string;
  transport: TransportResult;
  lastMile: {
    pickupPoint: BoardingPoint;
    dropoffAddress: string;
    distanceKm: number;
    durationMinutes: number;
  } | null;
  pricing: PriceBreakdown;
  isFeederAvailable: boolean;
}

// === Agent ===

export interface AgentMessage {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  toolName?: string;
  toolResult?: string;
  timestamp: number;
  isStreaming?: boolean;
}

// === Search Form ===

export interface SearchFormData {
  origin: string;
  destination: string;
  date: string;
  passengers: number;
  originLat?: number;
  originLon?: number;
  destLat?: number;
  destLon?: number;
}
