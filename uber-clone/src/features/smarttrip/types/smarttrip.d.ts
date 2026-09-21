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
