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

export interface TransitClassOption {
  class_code: string;
  class_name: string;
  status: string;
  fare: number;
  status_color?: "green" | "orange" | "red" | string;
}

export interface TrainInventoryItem {
  train_number: string;
  train_name: string;
  departure_time: string;
  departure_station: string;
  departure_date: string;
  arrival_time: string;
  arrival_station: string;
  arrival_date: string;
  duration_str: string;
  running_days: string[];
  active_days: boolean[];
  classes: TransitClassOption[];
}

export interface BusInventoryItem {
  bus_id: string;
  operator_name: string;
  bus_type: string;
  departure_time: string;
  boarding_point: string;
  arrival_time: string;
  dropping_point: string;
  duration_str: string;
  available_seats: number;
  fare: number;
  seat_types: { type: string; fare: number; available: number }[];
}

export interface FlightInventoryItem {
  flight_number: string;
  airline: string;
  departure_time: string;
  departure_airport: string;
  arrival_time: string;
  arrival_airport: string;
  duration_str: string;
  is_non_stop: boolean;
  fare_classes: { class: string; fare: number; seats: number; baggage?: string }[];
}

export interface DirectCabInventoryItem {
  cab_id: string;
  vehicle_type: string;
  operator: string;
  duration_str: string;
  distance_km: number;
  fare: number;
  benefits: string[];
}

export interface CorridorInventory {
  origin: string;
  destination: string;
  travel_date: string;
  corridor_title: string;
  has_direct_trains?: boolean;
  connecting_train_note?: string;
  connecting_itinerary?: {
    transit_hub?: string;
    leg1?: string;
    leg2?: string;
    transfer_buffer?: string;
    recommendation?: string;
  };
  trains: TrainInventoryItem[];
  buses: BusInventoryItem[];
  flights: FlightInventoryItem[];
  cabs: DirectCabInventoryItem[];
  feeder_options: {
    auto_rate_per_km?: number;
    cab_rate_per_km?: number;
  };
}



