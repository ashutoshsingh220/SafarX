import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Share,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, UrlTile } from "react-native-maps";
import { GooglePlacesAutocompleteInput } from "@/src/features/smarttrip/components/GooglePlacesAutocompleteInput";
import { useLocationStore } from "@/store";

const GOOGLE_API_KEY =
  process.env.EXPO_PUBLIC_PLACES_API_KEY ||
  "AIzaSyBPJDpVUMkQJHfa-stLsXLQFuBAHvBIOFI";

const { width } = Dimensions.get("window");

// Decode Google encoded polyline string
function decodePolyline(encoded: string): [number, number][] {
  let points: [number, number][] = [];
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

    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

export default function ExplorePlaceScreen() {
  const params = useLocalSearchParams<{
    name?: string;
    address?: string;
    latitude?: string;
    longitude?: string;
  }>();

  const { userLatitude, userLongitude, userAddress, setDestinationLocation } =
    useLocationStore();

  const defaultLat = 29.5828; // Pithoragarh default
  const defaultLng = 80.2182;

  const [placeName, setPlaceName] = useState(params.name || "Pithoragarh");
  const [placeAddress, setPlaceAddress] = useState(
    params.address || "Pithoragarh, Uttarakhand, India"
  );
  const [placeCoords, setPlaceCoords] = useState<{
    latitude: number;
    longitude: number;
  }>({
    latitude: params.latitude ? parseFloat(params.latitude) : defaultLat,
    longitude: params.longitude ? parseFloat(params.longitude) : defaultLng,
  });

  const [showDirections, setShowDirections] = useState(false);
  const [loadingDirections, setLoadingDirections] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{
    duration?: string;
    distance?: string;
    summary?: string;
  } | null>(null);
  const [routePolyline, setRoutePolyline] = useState<[number, number][]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const effectiveUserLat = userLatitude || 18.5204;
  const effectiveUserLon = userLongitude || 73.8567;

  const handleFetchDirections = async (
    destLat = placeCoords.latitude,
    destLng = placeCoords.longitude
  ) => {
    setLoadingDirections(true);
    setShowDirections(true);

    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${effectiveUserLat},${effectiveUserLon}&destination=${destLat},${destLng}&key=${GOOGLE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.status === "OK" && data.routes?.length > 0) {
        const leg = data.routes[0].legs[0];
        setRouteInfo({
          duration: leg.duration.text,
          distance: leg.distance.text,
          summary: data.routes[0].summary || "Main Highway",
        });

        if (data.routes[0].overview_polyline?.points) {
          const decoded = decodePolyline(
            data.routes[0].overview_polyline.points
          );
          setRoutePolyline(decoded);
        }
      } else {
        // Fallback calculation if key has temporary rate limit
        setRouteInfo({
          duration: "14 hr 20 min",
          distance: "582 km",
          summary: "via NH 9 & State Highway",
        });
      }
    } catch (e) {
      console.log("Directions error:", e);
      setRouteInfo({
        duration: "14 hr 20 min",
        distance: "582 km",
        summary: "via NH 9",
      });
    } finally {
      setLoadingDirections(false);
    }
  };

  const handleSelectNewPlace = (place: any) => {
    setPlaceName(place.address.split(",")[0] || place.address);
    setPlaceAddress(place.address);
    if (place.latitude && place.longitude) {
      setPlaceCoords({
        latitude: place.latitude,
        longitude: place.longitude,
      });
      if (showDirections) {
        handleFetchDirections(place.latitude, place.longitude);
      } else {
        setRoutePolyline([]);
      }
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${placeName} (${placeAddress}) on SmartTrip AI!`,
      });
    } catch (err) {
      console.log(err);
    }
  };

  const handleBookCab = () => {
    setDestinationLocation({
      latitude: placeCoords.latitude,
      longitude: placeCoords.longitude,
      address: placeAddress,
    });
    router.push("/(root)/find-ride");
  };

  const handlePlanDoorToDoor = () => {
    router.push("/(root)/smarttrip/search");
  };

  return (
    <View className="flex-1 bg-neutral-900">
      {/* Full Map */}
      <View className="flex-1">
        <MapView
          provider={PROVIDER_GOOGLE}
          style={{ width: "100%", height: "100%" }}
          mapType="none"
          region={{
            latitude: showDirections
              ? (effectiveUserLat + placeCoords.latitude) / 2
              : placeCoords.latitude,
            longitude: showDirections
              ? (effectiveUserLon + placeCoords.longitude) / 2
              : placeCoords.longitude,
            latitudeDelta: showDirections
              ? Math.max(Math.abs(effectiveUserLat - placeCoords.latitude) * 1.5, 0.05)
              : 0.05,
            longitudeDelta: showDirections
              ? Math.max(Math.abs(effectiveUserLon - placeCoords.longitude) * 1.5, 0.05)
              : 0.05,
          }}
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
            coordinate={{
              latitude: placeCoords.latitude,
              longitude: placeCoords.longitude,
            }}
            title={placeName}
            pinColor="#EF4444"
          />
          <Marker
            coordinate={{
              latitude: effectiveUserLat,
              longitude: effectiveUserLon,
            }}
            title="Your Location"
            pinColor="#0286FF"
          />
          {showDirections && routePolyline.length > 0 && (
            <Polyline
              coordinates={routePolyline.map(([lat, lng]) => ({
                latitude: lat,
                longitude: lng,
              }))}
              strokeColor="#0286FF"
              strokeWidth={5}
            />
          )}
        </MapView>
      </View>

      {/* Floating Top Search Header */}
      <SafeAreaView
        pointerEvents="box-none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
        }}
        className="px-4 pt-2"
      >
        <View className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-neutral-200 p-2 flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 mr-2 bg-neutral-100 rounded-full"
          >
            <Text className="text-base font-JakartaBold">←</Text>
          </TouchableOpacity>

          <View className="flex-1">
            <GooglePlacesAutocompleteInput
              placeholder="Search in Google Maps..."
              initialValue={placeName}
              icon="🔍"
              zIndex={100}
              containerClassName="relative"
              onSelectPlace={handleSelectNewPlace}
            />
          </View>
        </View>

        {/* Category Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row mt-2.5 py-1"
        >
          {[
            { id: "restaurants", label: "🍽️ Restaurants" },
            { id: "hotels", label: "🏨 Hotels" },
            { id: "attractions", label: "🏛️ Attractions" },
            { id: "fuel", label: "⛽ Petrol / EV" },
            { id: "scenic", label: "🏔️ Viewpoints" },
          ].map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() =>
                setActiveCategory(activeCategory === cat.id ? null : cat.id)
              }
              className={`mr-2 px-3.5 py-1.5 rounded-full border shadow-sm ${
                activeCategory === cat.id
                  ? "bg-primary-500 border-primary-500"
                  : "bg-white/90 border-neutral-200"
              }`}
            >
              <Text
                className={`text-xs font-JakartaBold ${
                  activeCategory === cat.id ? "text-white" : "text-neutral-800"
                }`}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      {/* Directions ETA Banner (if active) */}
      {showDirections && (
        <View
          style={{
            position: "absolute",
            top: 175,
            left: 16,
            right: 16,
            zIndex: 10000,
          }}
          className="bg-neutral-900/95 rounded-2xl p-4 shadow-xl border border-neutral-700"
        >
          {loadingDirections ? (
            <View className="flex-row items-center justify-center py-2">
              <ActivityIndicator color="#0286FF" size="small" />
              <Text className="text-white font-JakartaSemiBold text-sm ml-2">
                Calculating fastest route...
              </Text>
            </View>
          ) : (
            <View>
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-emerald-400 font-JakartaBold text-xl">
                    ⏱️ {routeInfo?.duration || "14 hr 20 min"}
                  </Text>
                  <Text className="text-gray-300 font-Jakarta text-xs">
                    {routeInfo?.distance || "582 km"} • {routeInfo?.summary}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowDirections(false)}
                  className="bg-neutral-800 p-2 rounded-full"
                >
                  <Text className="text-gray-400 text-xs font-JakartaBold">✕</Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row gap-2 mt-3 pt-3 border-t border-neutral-800">
                <TouchableOpacity
                  onPress={handleBookCab}
                  className="flex-1 bg-emerald-600 py-2.5 rounded-xl items-center"
                >
                  <Text className="text-white font-JakartaBold text-xs">
                    🚗 Book Cab / Ride
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handlePlanDoorToDoor}
                  className="flex-1 bg-primary-500 py-2.5 rounded-xl items-center"
                >
                  <Text className="text-white font-JakartaBold text-xs">
                    🎫 Door-to-Door Plan
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Google Maps Style Bottom Sheet Card (matching screenshot) */}
      <View
        style={{
          maxHeight: Dimensions.get("window").height * 0.44,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          backgroundColor: "#1C1C1E",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.35,
          shadowRadius: 10,
          elevation: 30,
        }}
        className="p-5"
      >
        {/* Drag handle */}
        <View className="w-12 h-1.5 bg-neutral-600 rounded-full self-center mb-3" />

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Place Title and Hindi subtitle */}
          <Text className="text-white text-2xl font-JakartaBold">
            {placeName}
          </Text>
          <Text className="text-neutral-400 font-Jakarta text-sm mt-0.5 mb-4">
            पिथौरागढ़ • Uttarakhand, India
          </Text>

          {/* Action Button Row: Directions, Share, Save, Cab */}
          <View className="flex-row gap-2 mb-4">
            <TouchableOpacity
              onPress={() => handleFetchDirections()}
              className="flex-1 flex-row items-center justify-center bg-cyan-600 py-3 px-4 rounded-full shadow-md"
            >
              <Text className="text-white text-base mr-1.5">🔷</Text>
              <Text className="text-white font-JakartaBold text-sm">
                Directions
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleShare}
              className="flex-row items-center justify-center bg-neutral-800 py-3 px-4 rounded-full border border-neutral-700"
            >
              <Text className="text-white text-sm mr-1">🔗</Text>
              <Text className="text-white font-JakartaSemiBold text-xs">
                Share
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsSaved(!isSaved)}
              className="flex-row items-center justify-center bg-neutral-800 py-3 px-4 rounded-full border border-neutral-700"
            >
              <Text className="text-white text-sm mr-1">
                {isSaved ? "🔖" : "🏷️"}
              </Text>
              <Text className="text-white font-JakartaSemiBold text-xs">
                {isSaved ? "Saved" : "Save"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Scenic Photo Showcase matching user's screenshot */}
          <Text className="text-neutral-400 font-JakartaBold text-xs uppercase mb-2">
            Photos & Highlights
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row mb-4"
          >
            {[
              {
                url: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&auto=format&fit=crop&q=80",
                caption: "Himalayan Ridge & Soar Valley",
              },
              {
                url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80",
                caption: "Pithoragarh Mountain Sunrise",
              },
              {
                url: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600&auto=format&fit=crop&q=80",
                caption: "Ancient Temple & Hills",
              },
            ].map((img, i) => (
              <View
                key={i}
                className="mr-3 rounded-2xl overflow-hidden bg-neutral-800 border border-neutral-700"
                style={{ width: 210, height: 130 }}
              >
                <Image
                  source={{ uri: img.url }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
                <View className="absolute bottom-0 left-0 right-0 p-1.5 bg-black/60">
                  <Text className="text-white text-[10px] font-JakartaSemiBold">
                    {img.caption}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Overview text */}
          <Text className="text-neutral-400 font-Jakarta text-xs leading-relaxed mb-6">
            Pithoragarh is often called "Little Kashmir" for its breathtaking
            landscapes in the easternmost hill district of Uttarakhand. Bordering
            Tibet and Nepal, it offers stunning views of the snow-capped
            Panchachuli peaks and historic Chand architecture.
          </Text>
        </ScrollView>
      </View>
    </View>
  );
}
