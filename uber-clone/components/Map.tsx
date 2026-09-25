import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, UrlTile } from "react-native-maps";

import { icons } from "@/constants";
import { useFetch } from "@/lib/fetch";
import {
  calculateDriverTimes,
  calculateRegion,
  decodePolyline,
  generateMarkersFromData,
  getResilientRoute,
} from "@/lib/map";
import { useDriverStore, useLocationStore } from "@/store";
import { Driver, MarkerData } from "@/types/type";

const directionsAPI = process.env.EXPO_PUBLIC_DIRECTIONS_API_KEY;

interface MapProps {
  currentLocationOnly?: boolean;
}

const Map = ({ currentLocationOnly = false }: MapProps) => {
  const mapRef = useRef<MapView>(null);
  const {
    userLongitude,
    userLatitude,
    destinationLatitude,
    destinationLongitude,
  } = useLocationStore();
  const { selectedDriver, setDrivers } = useDriverStore();

  const { data: drivers, loading, error } = useFetch<Driver[]>("/(api)/driver");
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [routeCoordinates, setRouteCoordinates] = useState<
    { latitude: number; longitude: number }[]
  >([]);
  const [routeDuration, setRouteDuration] = useState<string | null>(null);
  const [routeDistance, setRouteDistance] = useState<string | null>(null);
  const [routeMidpoint, setRouteMidpoint] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const effectiveLat = userLatitude || 18.5412;
  const effectiveLon = userLongitude || 73.7275;

  // Fetch live route polyline and duration whenever destination or user location changes
  useEffect(() => {
    if (currentLocationOnly || !destinationLatitude || !destinationLongitude) {
      setRouteCoordinates([]);
      setRouteDuration(null);
      setRouteDistance(null);
      setRouteMidpoint(null);
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
          setRouteCoordinates(routeResult.coordinates);
          setRouteDuration(routeResult.durationText);
          setRouteDistance(routeResult.distanceText);

          const midIdx = Math.floor(routeResult.coordinates.length / 2);
          setRouteMidpoint(routeResult.coordinates[midIdx]);

          setTimeout(() => {
            mapRef.current?.fitToCoordinates(routeResult.coordinates, {
              edgePadding: { top: 120, right: 60, bottom: 280, left: 60 },
              animated: true,
            });
          }, 400);
        }
      } catch (err) {
        console.log("Error fetching map route:", err);
      }
    };

    fetchRoute();
  }, [effectiveLat, effectiveLon, destinationLatitude, destinationLongitude]);

  useEffect(() => {
    if (Array.isArray(drivers) && drivers.length > 0) {
      const newMarkers = generateMarkersFromData({
        data: drivers,
        userLatitude: effectiveLat,
        userLongitude: effectiveLon,
      });
      setMarkers(newMarkers);
    } else {
      // Driver options: UberGo, UberPremier, and UberAuto
      const fallbackDrivers = [
        {
          id: 1,
          first_name: "Rahul",
          last_name: "Sharma",
          profile_image_url:
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
          car_image_url:
            "https://img.icons8.com/color/512/car--v1.png",
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
          car_image_url:
            "https://img.icons8.com/color/512/auto-rickshaw.png",
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
  }, [markers, destinationLatitude, destinationLongitude, effectiveLat, effectiveLon]);

  const region = calculateRegion({
    userLatitude: effectiveLat,
    userLongitude: effectiveLon,
    destinationLatitude,
    destinationLongitude,
  });

  return (
    <MapView
      ref={mapRef}
      provider={PROVIDER_GOOGLE}
      style={{ width: "100%", height: "100%", borderRadius: 16 }}
      mapType="none"
      initialRegion={region}
      showsUserLocation={true}
      userInterfaceStyle="light"
    >
      <UrlTile
        urlTemplate="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
        maximumZ={22}
        flipY={false}
        tileSize={256}
        shouldReplaceMapContent={true}
        zIndex={1}
      />

      {!currentLocationOnly && destinationLatitude && destinationLongitude && (
        <>
          <Marker
            key="destination"
            coordinate={{
              latitude: destinationLatitude,
              longitude: destinationLongitude,
            }}
            title="Destination"
            image={icons.pin}
          />

          {routeCoordinates.length > 0 && (
            <>
              {/* Outer boundary stroke for authentic Google Maps route depth */}
              <Polyline
                coordinates={routeCoordinates}
                strokeColor="#1A73E8"
                strokeWidth={7}
                zIndex={10}
              />
              {/* Vibrant inner Google blue path */}
              <Polyline
                coordinates={routeCoordinates}
                strokeColor="#388AF6"
                strokeWidth={5}
                zIndex={11}
              />

              {/* Midpoint duration badge pill matching Google Maps screenshot */}
              {routeMidpoint && routeDuration && (
                <Marker
                  coordinate={routeMidpoint}
                  anchor={{ x: 0.5, y: 0.5 }}
                  tracksViewChanges={false}
                  zIndex={20}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "#1A73E8",
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 16,
                      borderWidth: 1.5,
                      borderColor: "#FFFFFF",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.35,
                      shadowRadius: 3,
                      elevation: 6,
                    }}
                  >
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontSize: 12,
                        fontWeight: "700",
                      }}
                    >
                      🚗 {routeDuration}{routeDistance ? ` (${routeDistance})` : ""}
                    </Text>
                  </View>
                </Marker>
              )}
            </>
          )}
        </>
      )}
    </MapView>
  );
};

export default Map;
