import { Driver, MarkerData } from "@/types/type";

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
      latitude: 18.5204,
      longitude: 73.8567,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
  }

  if (!destinationLatitude || !destinationLongitude) {
    return {
      latitude: userLatitude,
      longitude: userLongitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }

  const minLat = Math.min(userLatitude, destinationLatitude);
  const maxLat = Math.max(userLatitude, destinationLatitude);
  const minLng = Math.min(userLongitude, destinationLongitude);
  const maxLng = Math.max(userLongitude, destinationLongitude);

  const midLat = (minLat + maxLat) / 2;
  const midLng = (minLng + maxLng) / 2;

  const latDelta = (maxLat - minLat) * 1.5 || 0.05;
  const lngDelta = (maxLng - minLng) * 1.5 || 0.05;

  return {
    latitude: midLat,
    longitude: midLng,
    latitudeDelta: Math.max(latDelta, 0.02),
    longitudeDelta: Math.max(lngDelta, 0.02),
  };
};

export const generateMarkersFromData = ({
  data,
  userLatitude,
  userLongitude,
}: {
  data: Driver[];
  userLatitude: number;
  userLongitude: number;
}): MarkerData[] => {
  if (!Array.isArray(data)) return [];

  return data.map((driver) => {
    const latOffset = (Math.random() - 0.5) * 0.02;
    const lngOffset = (Math.random() - 0.5) * 0.02;

    return {
      id: driver.id || Math.random(),
      title: `${driver.first_name || "Driver"} ${driver.last_name || ""}`,
      latitude: userLatitude + latOffset,
      longitude: userLongitude + lngOffset,
      rating: driver.rating || 4.5,
      price: driver.price || "150",
      time: Math.floor(Math.random() * 10) + 5,
      car_seats: driver.car_seats || 4,
      profile_image_url: driver.profile_image_url,
      car_image_url: driver.car_image_url,
    };
  });
};

export const calculateDriverTimes = ({
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
  if (!markers || !userLatitude || !userLongitude) return [];

  return markers.map((marker) => {
    const timeToUser = Math.floor(Math.random() * 8) + 2;
    const timeToDestination = Math.floor(Math.random() * 20) + 15;

    return {
      ...marker,
      time: timeToUser,
      price: (timeToDestination * 12).toFixed(0),
    };
  });
};
