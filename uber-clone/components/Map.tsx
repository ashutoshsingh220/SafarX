import React, { useEffect, useState } from "react";
import { View } from "react-native";

import InteractiveMap, { MapMarker } from "@/components/InteractiveMap";
import { useFetch } from "@/lib/fetch";
import {
  calculateDriverTimes,
  generateMarkersFromData,
  getResilientRoute,
} from "@/lib/map";
import { useDriverStore, useLocationStore } from "@/store";
import { Driver, MarkerData } from "@/types/type";

interface MapProps {
  currentLocationOnly?: boolean;
}

const Map = ({ currentLocationOnly = false }: MapProps) => {
  const {
    userLongitude,
    userLatitude,
    destinationLatitude,
    destinationLongitude,
    destinationAddress,
  } = useLocationStore();
  const { setDrivers } = useDriverStore();

  const { data: drivers } = useFetch<Driver[]>("/(api)/driver");
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>(
    []
  );
  const [routeDuration, setRouteDuration] = useState<string | null>(null);
  const [routeDistance, setRouteDistance] = useState<string | null>(null);

  const effectiveLat = userLatitude || 18.5412;
  const effectiveLon = userLongitude || 73.7275;

  // Fetch live route polyline and duration whenever destination or user location changes
  useEffect(() => {
    if (currentLocationOnly || !destinationLatitude || !destinationLongitude) {
      setRouteCoordinates([]);
      setRouteDuration(null);
      setRouteDistance(null);
      return;
    }

    const fetchRoute = async () => {
      try {
        const routeResult = await getResilientRoute(
          effectiveLat,
          effectiveLon,
          destinationLatitude,
          destinationLongitude
        );

        if (routeResult.coordinates.length > 0) {
          const latLngList: [number, number][] = routeResult.coordinates.map(
            (c) => [c.latitude, c.longitude]
          );
          setRouteCoordinates(latLngList);
          setRouteDuration(routeResult.durationText);
          setRouteDistance(routeResult.distanceText);
        }
      } catch (err) {
        console.log("Error fetching map route:", err);
      }
    };

    fetchRoute();
  }, [
    currentLocationOnly,
    effectiveLat,
    effectiveLon,
    destinationLatitude,
    destinationLongitude,
  ]);

  useEffect(() => {
    if (Array.isArray(drivers) && drivers.length > 0) {
      const newMarkers = generateMarkersFromData({
        data: drivers,
        userLatitude: effectiveLat,
        userLongitude: effectiveLon,
      });
      setMarkers(newMarkers);
    } else {
      // Authentic driver options around Pune / user coords
      const fallbackDrivers = [
        {
          id: 1,
          first_name: "Rahul",
          last_name: "Sharma",
          profile_image_url:
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
          car_image_url: "https://img.icons8.com/color/512/car--v1.png",
          car_seats: 4,
          rating: 4.85,
          latitude: effectiveLat + 0.003,
          longitude: effectiveLon + 0.002,
          title: "Rahul Sharma (UberGo)",
          rate_per_km: 22,
        },
        {
          id: 2,
          first_name: "Amit",
          last_name: "Verma",
          profile_image_url:
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
          car_image_url:
            "https://ucarecdn.com/a3872f80-c094-409c-82f8-c9ff38429327/-/preview/930x931/",
          car_seats: 4,
          rating: 4.92,
          latitude: effectiveLat - 0.003,
          longitude: effectiveLon - 0.003,
          title: "Amit Verma (UberPremier)",
          rate_per_km: 30,
        },
        {
          id: 3,
          first_name: "Suresh",
          last_name: "Patil",
          profile_image_url:
            "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80",
          car_image_url: "https://img.icons8.com/color/512/auto-rickshaw.png",
          car_seats: 3,
          rating: 4.78,
          latitude: effectiveLat + 0.001,
          longitude: effectiveLon - 0.004,
          title: "Suresh Patil (UberAuto)",
          rate_per_km: 18,
        },
      ];
      setMarkers(fallbackDrivers as MarkerData[]);
    }
  }, [drivers, effectiveLat, effectiveLon]);

  useEffect(() => {
    if (
      markers.length > 0 &&
      destinationLatitude !== undefined &&
      destinationLongitude !== undefined
    ) {
      calculateDriverTimes({
        markers,
        userLatitude: effectiveLat,
        userLongitude: effectiveLon,
        destinationLatitude,
        destinationLongitude,
      }).then((drivers) => {
        if (drivers) setDrivers(drivers as MarkerData[]);
      });
    }
  }, [
    markers,
    destinationLatitude,
    destinationLongitude,
    effectiveLat,
    effectiveLon,
  ]);

  const mapMarkers: MapMarker[] = markers.map((m) => ({
    id: m.id,
    latitude: m.latitude,
    longitude: m.longitude,
    title: m.title,
    type: "driver",
  }));

  return (
    <View style={{ width: "100%", height: "100%", borderRadius: 16, overflow: "hidden" }}>
      <InteractiveMap
        userLatitude={effectiveLat}
        userLongitude={effectiveLon}
        destinationLatitude={
          currentLocationOnly ? undefined : destinationLatitude
        }
        destinationLongitude={
          currentLocationOnly ? undefined : destinationLongitude
        }
        destinationTitle={destinationAddress || "Destination"}
        markers={currentLocationOnly ? [] : mapMarkers}
        routeCoordinates={currentLocationOnly ? [] : routeCoordinates}
        routeDuration={currentLocationOnly ? null : routeDuration}
        routeDistance={currentLocationOnly ? null : routeDistance}
        zoom={14}
        style={{ width: "100%", height: "100%", borderRadius: 16 }}
      />
    </View>
  );
};

export default Map;
