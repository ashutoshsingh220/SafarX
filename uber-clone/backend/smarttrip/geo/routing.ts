/**
 * OSRM Routing Utilities
 *
 * Uses the free public OSRM API for distance and ETA calculations.
 * Falls back to Geoapify routing if OSRM is unavailable.
 */

const OSRM_BASE = "https://router.project-osrm.org";
const GEOAPIFY_API_KEY = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY ?? "";

export interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
  geometry?: string; // Encoded polyline for map rendering
}

export interface RouteWaypoint {
  lat: number;
  lon: number;
}

/**
 * Calculate route between two points using OSRM (free public API).
 * Profile can be: "driving", "walking", "cycling"
 */
export async function calculateRoute(
  origin: RouteWaypoint,
  destination: RouteWaypoint,
  profile: "driving" | "walking" | "cycling" = "driving"
): Promise<RouteResult> {
  const coords = `${origin.lon},${origin.lat};${destination.lon},${destination.lat}`;
  const url = `${OSRM_BASE}/route/v1/${profile}/${coords}?overview=full&geometries=polyline`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`OSRM returned ${res.status}`);
    }

    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.length) {
      throw new Error(`OSRM no route found: ${data.code}`);
    }

    const route = data.routes[0];
    return {
      distanceKm: route.distance / 1000,
      durationMinutes: route.duration / 60,
      geometry: route.geometry,
    };
  } catch (err) {
    // Fallback to Geoapify routing
    console.warn("OSRM failed, falling back to Geoapify routing:", err);
    return calculateRouteGeoapify(origin, destination, profile);
  }
}

/**
 * Fallback: Geoapify routing API
 */
async function calculateRouteGeoapify(
  origin: RouteWaypoint,
  destination: RouteWaypoint,
  profile: "driving" | "walking" | "cycling"
): Promise<RouteResult> {
  const modeMap = {
    driving: "drive",
    walking: "walk",
    cycling: "bicycle",
  };
  const mode = modeMap[profile];

  const url = `https://api.geoapify.com/v1/routing?waypoints=${origin.lat},${origin.lon}|${destination.lat},${destination.lon}&mode=${mode}&apiKey=${GEOAPIFY_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Geoapify routing failed: ${res.status} ${res.statusText}`
    );
  }

  const data = await res.json();
  const feature = data.features?.[0];
  if (!feature) {
    throw new Error("Geoapify routing returned no results");
  }

  const props = feature.properties;
  return {
    distanceKm: (props.distance ?? 0) / 1000,
    durationMinutes: (props.time ?? 0) / 60,
    geometry: undefined, // Geoapify returns GeoJSON, not polyline
  };
}

/**
 * Haversine distance (km) between two points.
 * Used for quick checks (e.g., "is home > 1.5km from boarding?")
 * without making an API call.
 */
export function haversineDistanceKm(
  a: RouteWaypoint,
  b: RouteWaypoint
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const aCalc =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(aCalc), Math.sqrt(1 - aCalc));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
