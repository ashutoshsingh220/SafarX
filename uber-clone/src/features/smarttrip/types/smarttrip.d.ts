export interface SearchFormData {
  origin: string;
  destination: string;
  date: string;
  passengers: number;
}

export interface TransportLeg {
  mode: string;
  start_location_name: string;
  end_location_name: string;
  operator?: string;
  duration_seconds?: number;
  fare?: number;
}

export interface TransportResult {
  id: string;
  type: string;
  title: string;
  provider: string;
  price: number;
  duration: string;
  departureTime: string;
  arrivalTime: string;
  legs?: TransportLeg[];
}

export interface BundleQuote {
  bundlePrice: number;
  feederDiscount: number;
  totalSavings: number;
}

export interface AgentMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export interface MultimodalLeg {
  leg_index: number;
  leg_type: "FIRST_MILE" | "LONG_HAUL" | "LAST_MILE";
  mode: string;
  operator: string;
  origin: string;
  destination: string;
  distance_km: number;
  duration_minutes: number;
  fare: number;
  description?: string;
  vehicle_icon: string;
}

export interface MultimodalPlan {
  plan_id: string;
  badge?: "CHEAPEST" | "FASTEST" | "BEST_VALUE" | "DIRECT_CAB";
  primary_mode: "TRAIN" | "FLIGHT" | "BUS" | "DIRECT_CAB";
  total_fare: number;
  total_duration_minutes: number;
  total_distance_km: number;
  legs: MultimodalLeg[];
  summary: string;
}

export interface MultimodalBooking {
  booking_id: string;
  pnr: string;
  status: string;
  total_fare: number;
  primary_mode: string;
  origin_address: string;
  destination_address: string;
  badge?: string;
  legs: MultimodalLeg[];
  qr_code_payload: string;
  created_at: string;
}

