import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, UrlTile } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";

import { icons } from "@/constants";
import { useFetch } from "@/lib/fetch";
import {
  calculateDriverTimes,
  calculateRegion,
  generateMarkersFromData,
} from "@/lib/map";
import { useDriverStore, useLocationStore } from "@/store";
import { Driver, MarkerData } from "@/types/type";

const directionsAPI = process.env.EXPO_PUBLIC_DIRECTIONS_API_KEY;

const Map = () => {
  const {
    userLongitude,
    userLatitude,
    destinationLatitude,
    destinationLongitude,
  } = useLocationStore();
  const { selectedDriver, setDrivers } = useDriverStore();

  const { data: drivers, loading, error } = useFetch<Driver[]>("/(api)/driver");
  const [markers, setMarkers] = useState<MarkerData[]>([]);

  const effectiveLat = userLatitude || 18.5412;
  const effectiveLon = userLongitude || 73.7275;
  const [directionsError, setDirectionsError] = useState(false);

  useEffect(() => {
    setDirectionsError(false);
  }, [destinationLatitude, destinationLongitude]);

  useEffect(() => {
    if (Array.isArray(drivers) && drivers.length > 0) {
      const newMarkers = generateMarkersFromData({
        data: drivers,
        userLatitude: effectiveLat,
        userLongitude: effectiveLon,
      });
      setMarkers(newMarkers);
    } else {
      // Fallback realistic nearby drivers in area
      const fallbackDrivers = [
        {
          id: 1,
          first_name: "Rahul",
          last_name: "Sharma",
          profile_image_url: "https://ucarecdn.com/dae59f69-2c1f-48c3-a883-017bcf0f9950/-/preview/1000x1000/",
          car_image_url: "https://ucarecdn.com/a2dc52b2-8bf7-4e40-ba66-3ff4f5610444/-/preview/465x466/",
          car_seats: 4,
          rating: "4.80",
          latitude: effectiveLat + 0.004,
          longitude: effectiveLon + 0.003,
          title: "Rahul Sharma (UberGo)",
        },
        {
          id: 2,
          first_name: "Amit",
          last_name: "Verma",
          profile_image_url: "https://ucarecdn.com/6ea6d83d-ef1a-4838-80cf-c444a3f61ab9/-/preview/1000x1000/",
          car_image_url: "https://ucarecdn.com/a3872f80-c094-409c-82f8-c9ff38429327/-/preview/930x931/",
          car_seats: 4,
          rating: "4.90",
          latitude: effectiveLat - 0.003,
          longitude: effectiveLon - 0.004,
          title: "Amit Verma (UberPremier)",
        },
        {
          id: 3,
          first_name: "Suresh",
          last_name: "Patil",
          profile_image_url: "https://ucarecdn.com/dae59f69-2c1f-48c3-a883-017bcf0f9950/-/preview/1000x1000/",
          car_image_url: "https://ucarecdn.com/a2dc52b2-8bf7-4e40-ba66-3ff4f5610444/-/preview/465x466/",
          car_seats: 3,
          rating: "4.75",
          latitude: effectiveLat + 0.002,
          longitude: effectiveLon - 0.005,
          title: "Suresh Patil (Local Auto)",
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
      <Marker
        key="user-current-location"
        coordinate={{
          latitude: effectiveLat,
          longitude: effectiveLon,
        }}
        title="Symbiosis Institute of Technology, Pune"
        description="Your Current Location"
        pinColor="#EA4335"
      >
        <View style={{ alignItems: "center", justifyContent: "center" }}>
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: "rgba(234, 67, 53, 0.22)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: "#EA4335",
                borderWidth: 2.5,
                borderColor: "#FFFFFF",
                elevation: 4,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.3,
                shadowRadius: 2,
              }}
            />
          </View>
        </View>
      </Marker>

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
          {!directionsError && (
            <MapViewDirections
              origin={{
                latitude: effectiveLat,
                longitude: effectiveLon,
              }}
              destination={{
                latitude: destinationLatitude,
                longitude: destinationLongitude,
              }}
              apikey={directionsAPI!}
              strokeColor="#0286FF"
              strokeWidth={3}
              onError={(errorMessage) => {
                console.log("MapViewDirections handled:", errorMessage);
                setDirectionsError(true);
              }}
            />
          )}
        </>
      )}
    </MapView>
  );
};

export default Map;
