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
} from "@/lib/map";
import { useDriverStore, useLocationStore } from "@/store";
import { Driver, MarkerData } from "@/types/type";

const directionsAPI = process.env.EXPO_PUBLIC_DIRECTIONS_API_KEY;

const Map = () => {
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
  const [routeMidpoint, setRouteMidpoint] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const effectiveLat = userLatitude || 18.5412;
  const effectiveLon = userLongitude || 73.7275;

  // Fetch live route polyline and duration whenever destination or user location changes
  useEffect(() => {
    if (!destinationLatitude || !destinationLongitude) {
      setRouteCoordinates([]);
      setRouteDuration(null);
      setRouteMidpoint(null);
      return;
    }

    const fetchRoute = async () => {
      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/directions/json?origin=${effectiveLat},${effectiveLon}&destination=${destinationLatitude},${destinationLongitude}&departure_time=now&traffic_model=best_guess&alternatives=true&key=${directionsAPI}`,
        );
        const data = await res.json();

        if (data.status === "OK" && data.routes?.length > 0) {
          // Select fastest route in real-time considering traffic conditions
          const sortedRoutes = [...data.routes].sort((a, b) => {
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

          const route = sortedRoutes[0];
          const leg = route.legs?.[0];
          if (leg) {
            const liveDuration =
              leg.duration_in_traffic?.text || leg.duration?.text;
            if (liveDuration) {
              setRouteDuration(liveDuration);
            }
          }

          if (route.overview_polyline?.points) {
            const decoded = decodePolyline(route.overview_polyline.points);
            setRouteCoordinates(decoded);

            if (decoded.length > 0) {
              const midIdx = Math.floor(decoded.length / 2);
              setRouteMidpoint(decoded[midIdx]);

              // Fit map camera to show the full route
              setTimeout(() => {
                mapRef.current?.fitToCoordinates(decoded, {
                  edgePadding: { top: 120, right: 60, bottom: 280, left: 60 },
                  animated: true,
                });
              }, 400);
            }
          }
        }
      } catch (err) {
        console.log("Error fetching map route:", err);
      }
    };

    fetchRoute();
  }, [effectiveLat, effectiveLon, destinationLatitude, destinationLongitude]);

  useEffect(() => {
    if (Array.isArray(drivers) && drivers.length > 0) {
      // Filter out auto rickshaws if any exist
      const cabDrivers = drivers.filter(
        (d) => !d.title?.toLowerCase().includes("auto"),
      );
      const newMarkers = generateMarkersFromData({
        data: cabDrivers.length > 0 ? cabDrivers : drivers,
        userLatitude: effectiveLat,
        userLongitude: effectiveLon,
      });
      setMarkers(newMarkers);
    } else {
      // Cab booking drivers: UberGo and UberPremier only (Auto excluded as requested)
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
        zIndex={1}
      />

      {markers.map((marker) => (
        <Marker
          key={marker.id}
          coordinate={{
            latitude: marker.latitude,
            longitude: marker.longitude,
          }}
          title={marker.title}
          pinColor="#F59E0B"
        />
      ))}

      {destinationLatitude && destinationLongitude && (
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
                      🚗 {routeDuration}
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
