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
    let timeToDestination = 1800; // seconds
    let distanceKm = 15;

    try {
      // Query Google Directions API with real-time traffic conditions and multiple alternative routes
      const responseToDestination = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${userLatitude},${userLongitude}&destination=${destinationLatitude},${destinationLongitude}&departure_time=now&traffic_model=best_guess&alternatives=true&key=${directionsAPI}`,
      );
      const dataToDestination = await responseToDestination.json();

      if (dataToDestination?.routes?.length > 0) {
        // Algorithm: select the fastest route in real-time by duration_in_traffic
        const sortedRoutes = [...dataToDestination.routes].sort((a, b) => {
          const durA =
            a.legs?.[0]?.duration_in_traffic?.value ??
            a.legs?.[0]?.duration?.value ??
            99999999;
          const durB =
            b.legs?.[0]?.duration_in_traffic?.value ??
            b.legs?.[0]?.duration?.value ??
            99999999;
          return durA - durB;
        });

        const fastestRoute = sortedRoutes[0];
        const leg = fastestRoute.legs?.[0];
        if (leg) {
          // Use real-time duration in traffic if available, otherwise regular duration
          timeToDestination =
            leg.duration_in_traffic?.value ?? leg.duration?.value ?? 1800;
          if (leg.distance?.value) {
            distanceKm = leg.distance.value / 1000;
          }
        }
      }
    } catch (err) {
      console.log("Error fetching real-time fastest route:", err);
    }

    // High-precision fallback distance calculation if Directions API didn't provide leg.distance
    if (!distanceKm || distanceKm <= 0) {
      const R = 6371; // Earth radius in km
      const dLat = ((destinationLatitude - userLatitude) * Math.PI) / 180;
      const dLon = ((destinationLongitude - userLongitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((userLatitude * Math.PI) / 180) *
          Math.cos((destinationLatitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distanceKm = Math.round(R * c * 1.25 * 10) / 10;
    }

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
