/**
 * Geoapify Geocoding Utilities
 *
 * Uses the Geoapify API (free tier) for geocoding and reverse geocoding.
 * Replaces Google Maps APIs for all SmartTrip-specific features.
 */

const GEOAPIFY_API_KEY = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY ?? "";
const GEOAPIFY_BASE = "https://api.geoapify.com/v1";

export interface GeocodeResult {
  lat: number;
  lon: number;
  formatted: string;
  city?: string;
  state?: string;
  country?: string;
  postcode?: string;
}

export interface AutocompleteResult {
  placeId: string;
  formatted: string;
  lat: number;
  lon: number;
  city?: string;
  state?: string;
}

/**
 * Forward geocode: address string → lat/lon
 */
export async function geocode(address: string): Promise<GeocodeResult[]> {
  const url = `${GEOAPIFY_BASE}/geocode/search?text=${encodeURIComponent(address)}&apiKey=${GEOAPIFY_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Geoapify geocode failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return (data.features ?? []).map((f: any) => ({
    lat: f.properties.lat,
    lon: f.properties.lon,
    formatted: f.properties.formatted,
    city: f.properties.city,
    state: f.properties.state,
    country: f.properties.country,
    postcode: f.properties.postcode,
  }));
}

/**
 * Reverse geocode: lat/lon → address
 */
export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<GeocodeResult | null> {
  const url = `${GEOAPIFY_BASE}/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${GEOAPIFY_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Geoapify reverse geocode failed: ${res.status} ${res.statusText}`
    );
  }

  const data = await res.json();
  const feature = data.features?.[0];
  if (!feature) return null;

  return {
    lat: feature.properties.lat,
    lon: feature.properties.lon,
    formatted: feature.properties.formatted,
    city: feature.properties.city,
    state: feature.properties.state,
    country: feature.properties.country,
    postcode: feature.properties.postcode,
  };
}

/**
 * Autocomplete: partial text → suggestions
 * Used by the GeoapifyTextInput component on the frontend.
 */
export async function autocomplete(
  text: string,
  bias?: { lat: number; lon: number }
): Promise<AutocompleteResult[]> {
  let url = `${GEOAPIFY_BASE}/geocode/autocomplete?text=${encodeURIComponent(text)}&apiKey=${GEOAPIFY_API_KEY}&limit=5`;
  if (bias) {
    url += `&bias=proximity:${bias.lon},${bias.lat}`;
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Geoapify autocomplete failed: ${res.status} ${res.statusText}`
    );
  }

  const data = await res.json();
  return (data.features ?? []).map((f: any) => ({
    placeId: f.properties.place_id,
    formatted: f.properties.formatted,
    lat: f.properties.lat,
    lon: f.properties.lon,
    city: f.properties.city,
    state: f.properties.state,
  }));
}
