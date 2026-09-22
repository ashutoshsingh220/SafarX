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

    const timesPromises = markers.map(async (marker) => {
      const timeToUser = 600; // ~10 min driver arrival

      // Pricing structure as requested:
      // UberGo: ₹22 per kilometer
      // UberPremier: ₹30 per kilometer
      let perKm = 22;
      let baseFare = 50;

      if (marker.title?.toLowerCase().includes("premier")) {
        perKm = 30; // ₹30/km for UberPremier
        baseFare = 100;
      } else if (marker.title?.toLowerCase().includes("auto")) {
        perKm = 15;
        baseFare = 30;
      }

      const fare = Math.round(baseFare + distanceKm * perKm);
      const price = fare.toLocaleString("en-IN");
      const totalTime = Math.round((timeToUser + timeToDestination) / 60);

      return {
        ...marker,
        time: totalTime,
        price,
        rate_per_km: perKm,
      };
    });

    return await Promise.all(timesPromises);
  } catch (error) {
    console.error("Error calculating driver times:", error);
  }
};
