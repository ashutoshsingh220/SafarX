/**
 * SmartTrip Search Types
 *
 * Shared type definitions for multi-modal search results.
 */

export type TransportMode = "bus" | "train" | "flight";

export interface BoardingPoint {
  id: number;
  name: string;
  city: string;
  lat: number;
  lon: number;
  type: "bus_stop" | "railway_station" | "airport";
  address?: string;
}

export interface BusOption {
  id: number;
  operator: string;
  busType: "sleeper" | "semi-sleeper" | "seater" | "ac-sleeper";
  originCity: string;
  destCity: string;
  originStop: BoardingPoint;
  destStop: BoardingPoint;
  departureTime: string; // "HH:MM"
  arrivalTime: string;   // "HH:MM"
  durationHrs: number;
  fareInr: number;       // In rupees (not paisa)
  availableSeats: number;
  amenities: string[];
  rating: number;
  mode: "bus";
}

export interface TrainOption {
  id: number;
  trainNumber: string;
  trainName: string;
  originStation: BoardingPoint;
  destStation: BoardingPoint;
  departureTime: string;
  arrivalTime: string;
  durationHrs: number;
  classes: TrainClass[];
  mode: "train";
}

export interface TrainClass {
  code: string;      // "SL", "3A", "2A", "1A", "CC"
  name: string;
  fareInr: number;
  availableSeats: number;
}

export interface FlightOption {
  id: number;
  airline: string;
  flightNumber: string;
  originAirport: BoardingPoint;
  destAirport: BoardingPoint;
  departureTime: string;  // ISO datetime
  arrivalTime: string;
  durationHrs: number;
  fareInr: number;
  cabinClass: "economy" | "premium_economy" | "business";
  mode: "flight";
}

export type TransportOption = BusOption | TrainOption | FlightOption;

export interface SearchQuery {
  originCity: string;
  destCity: string;
  date: string; // "YYYY-MM-DD"
  passengers?: number;
}

export interface SearchResults {
  buses: BusOption[];
  trains: TrainOption[];
  flights: FlightOption[];
  query: SearchQuery;
  timestamp: string;
}
