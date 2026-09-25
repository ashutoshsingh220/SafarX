import { Driver, MarkerData } from "@/types/type";

const directionsAPI = process.env.EXPO_PUBLIC_DIRECTIONS_API_KEY;

export const generateMarkersFromData = ({
  data,
  userLatitude,
  userLongitude,
}: {
  data: Driver[];
  userLatitude: number;
  userLongitude: number;
}): MarkerData[] => {
  return data.map((driver) => {
    const latOffset = (Math.random() - 0.5) * 0.01; // Random offset between -0.005 and 0.005
    const lngOffset = (Math.random() - 0.5) * 0.01; // Random offset between -0.005 and 0.005

    return {
      latitude: userLatitude + latOffset,
      longitude: userLongitude + lngOffset,
      title: `${driver.first_name} ${driver.last_name}`,
      ...driver,
    };
  });
};

export const calculateRegion = ({
  userLatitude,
  userLongitude,
  destinationLatitude,
  destinationLongitude,
}: {
  userLatitude: number | null;
  userLongitude: number | null;
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
}) => {
  if (!userLatitude || !userLongitude) {
    return {
      latitude: 18.5412,
      longitude: 73.7275,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  if (!destinationLatitude || !destinationLongitude) {
    return {
      latitude: userLatitude,
      longitude: userLongitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  const minLat = Math.min(userLatitude, destinationLatitude);
  const maxLat = Math.max(userLatitude, destinationLatitude);
  const minLng = Math.min(userLongitude, destinationLongitude);
  const maxLng = Math.max(userLongitude, destinationLongitude);

  const latitudeDelta = (maxLat - minLat) * 1.3; // Adding some padding
  const longitudeDelta = (maxLng - minLng) * 1.3; // Adding some padding

  const latitude = (userLatitude + destinationLatitude) / 2;
  const longitude = (userLongitude + destinationLongitude) / 2;

  return {
    latitude,
    longitude,
    latitudeDelta,
    longitudeDelta,
  };
};

export function decodePolyline(
  encoded: string,
): { latitude: number; longitude: number }[] {
  let points: { latitude: number; longitude: number }[] = [];
  let index = 0,
    len = encoded.length;
  let lat = 0,
    lng = 0;

  while (index < len) {
    let b,
      shift = 0,
      result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = (result & 1) ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = (result & 1) ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

export interface ResilientRouteResult {
  coordinates: { latitude: number; longitude: number }[];
  durationText: string;
  distanceText: string;
  distanceKm: number;
  durationMinutes: number;
  source: "google" | "osrm" | "spline";
}

export function generateSplineRoute(
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number,
  numPoints: number = 35
): { latitude: number; longitude: number }[] {
  const points: { latitude: number; longitude: number }[] = [];
  const midLat = (startLat + endLat) / 2;
  const midLon = (startLon + endLon) / 2;
  const dx = endLon - startLon;
  const dy = endLat - startLat;
  const perpLat = -dy * 0.08;
  const perpLon = dx * 0.08;
  const ctrlLat = midLat + perpLat;
  const ctrlLon = midLon + perpLon;

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const invT = 1 - t;
    const lat = invT * invT * startLat + 2 * invT * t * ctrlLat + t * t * endLat;
    const lon = invT * invT * startLon + 2 * invT * t * ctrlLon + t * t * endLon;
    points.push({ latitude: lat, longitude: lon });
  }
  return points;
}

export async function getResilientRoute(
  originLat: number,
  originLon: number,
  destLat: number,
  destLon: number
): Promise<ResilientRouteResult> {
  const R = 6371;
  const dLat = ((destLat - originLat) * Math.PI) / 180;
  const dLon = ((destLon - originLon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((originLat * Math.PI) / 180) *
      Math.cos((destLat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const fallbackDistKm = Math.max(1, Math.round(R * c * 1.25 * 10) / 10);
  const fallbackDurMin = Math.max(5, Math.round((fallbackDistKm / 28) * 60));

  // Tier 1: Google Directions API (if key configured)
  if (directionsAPI && directionsAPI.length > 5) {
    try {
      const gUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLon}&destination=${destLat},${destLon}&departure_time=now&traffic_model=best_guess&alternatives=true&key=${directionsAPI}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(gUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await res.json();

      if (data.status === "OK" && data.routes?.length > 0) {
        const sorted = [...data.routes].sort((r1, r2) => {
          const d1 = r1.legs?.[0]?.distance?.value ?? 99999999;
          const d2 = r2.legs?.[0]?.distance?.value ?? 99999999;
          return d1 - d2;
        });
        const route = sorted[0];
        const leg = route.legs?.[0];
        const pts = route.overview_polyline?.points
          ? decodePolyline(route.overview_polyline.points)
          : [];

        if (pts.length > 0) {
          const distVal = leg?.distance?.value ? leg.distance.value / 1000 : fallbackDistKm;
          const durSec = leg?.duration_in_traffic?.value ?? leg?.duration?.value ?? (fallbackDurMin * 60);
          return {
            coordinates: pts,
            distanceText: leg?.distance?.text || `${Math.round(distVal * 10) / 10} km`,
            durationText: leg?.duration_in_traffic?.text || leg?.duration?.text || `${Math.round(durSec / 60)} mins`,
            distanceKm: Math.round(distVal * 10) / 10,
            durationMinutes: Math.round(durSec / 60),
            source: "google",
          };
        }
      }
    } catch {
      // Gracefully fall through to Tier 2
    }
  }

  // Tier 2: OSRM Driving Engine (100% Free, No API Key, Never Expires)
  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originLon},${originLat};${destLon},${destLat}?overview=full&geometries=polyline`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const osrmRes = await fetch(osrmUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "SmartTrip-App/1.0" },
    });
    clearTimeout(timeoutId);
    const osrmData = await osrmRes.json();

    if (osrmData.code === "Ok" && osrmData.routes?.length > 0) {
      const best = osrmData.routes[0];
      const pts = decodePolyline(best.geometry);
      if (pts.length > 0) {
        const distKm = Math.round((best.distance / 1000) * 10) / 10;
        const durMin = Math.max(5, Math.round(best.duration / 60));
        return {
          coordinates: pts,
          distanceText: `${distKm} km`,
          durationText: `${durMin} mins`,
          distanceKm: distKm,
          durationMinutes: durMin,
          source: "osrm",
        };
      }
    }
  } catch {
    // Gracefully fall through to Tier 3
  }

  // Tier 3: High-Precision Curved Geometric Spline (Zero-Fail Guarantee)
  const splinePts = generateSplineRoute(originLat, originLon, destLat, destLon, 35);
  return {
    coordinates: splinePts,
    distanceText: `${fallbackDistKm} km`,
    durationText: `${fallbackDurMin} mins`,
    distanceKm: fallbackDistKm,
    durationMinutes: fallbackDurMin,
    source: "spline",
  };
}

export const calculateDriverTimes = async ({
  markers,
  userLatitude,
  userLongitude,
  destinationLatitude,
  destinationLongitude,
}: {
  markers: MarkerData[];
  userLatitude: number | null;
  userLongitude: number | null;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
}) => {
  if (
    !userLatitude ||
    !userLongitude ||
    !destinationLatitude ||
    !destinationLongitude
  )
    return;

  try {
    const routeInfo = await getResilientRoute(
      userLatitude,
      userLongitude,
      destinationLatitude,
      destinationLongitude
    );
    const timeToDestination = routeInfo.durationMinutes * 60;
    const distanceKm = routeInfo.distanceKm;

    // Check if auto should be included: only if distance <= 40 km
    const isAutoAllowed = distanceKm <= 40;

    let candidateMarkers = [...markers];

    if (isAutoAllowed) {
      // Ensure UberAuto option is available alongside UberGo and UberPremier
      const hasAuto = candidateMarkers.some((m) =>
        m.title?.toLowerCase().includes("auto"),
      );
      if (!hasAuto) {
        candidateMarkers.push({
          id: 3,
          first_name: "Suresh",
          last_name: "Patil",
          title: "Suresh Patil (UberAuto)",
          profile_image_url:
            "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80",
          car_image_url: "https://img.icons8.com/color/512/auto-rickshaw.png",
          car_seats: 3,
          rating: 4.78,
          latitude: userLatitude + 0.001,
          longitude: userLongitude - 0.003,
          rate_per_km: 18,
        });
      }
    } else {
      // If distance is greater than 40 km, no auto rickshaw is shown
      candidateMarkers = candidateMarkers.filter(
        (m) => !m.title?.toLowerCase().includes("auto"),
      );
    }

    const timesPromises = candidateMarkers.map(async (marker) => {
      const timeToUser = 600; // ~10 min driver arrival

      // Pricing structure as requested:
      // UberGo: ₹22 per kilometer
      // UberPremier: ₹30 per kilometer
      // UberAuto: ₹18 per kilometer
      let perKm = 22;
      let baseFare = 50;

      if (marker.title?.toLowerCase().includes("premier")) {
        perKm = 30; // ₹30/km for UberPremier
        baseFare = 100;
      } else if (marker.title?.toLowerCase().includes("auto")) {
        perKm = 18; // ₹18/km for UberAuto
        baseFare = 30;
      }

      // Real-time fare calculated directly from distance
      const fare = Math.round(baseFare + distanceKm * perKm);
      const price = fare.toLocaleString("en-IN");
      const totalTime = Math.round((timeToUser + timeToDestination) / 60);

      return {
        ...marker,
        time: totalTime,
        price,
        rate_per_km: perKm,
        distance_km: distanceKm,
      };
    });

    return await Promise.all(timesPromises);
  } catch (error) {
    console.error("Error calculating driver times:", error);
  }
};
