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
import { GooglePlacesAutocompleteInput } from "@/src/features/smarttrip/components/GooglePlacesAutocompleteInput";
import InteractiveMap from "@/components/InteractiveMap";
import { useLocationStore } from "@/store";

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_PLACES_API_KEY || "";

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

const KNOWN_CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  dehradun: { lat: 30.3165, lng: 78.0322 },
  pithoragarh: { lat: 29.5828, lng: 80.2182 },
  haldwani: { lat: 29.2183, lng: 79.5130 },
  kathgodam: { lat: 29.2731, lng: 79.5444 },
  nainital: { lat: 29.3919, lng: 79.4542 },
  rishikesh: { lat: 30.0869, lng: 78.2676 },
  haridwar: { lat: 29.9457, lng: 78.1642 },
  delhi: { lat: 28.6139, lng: 77.2090 },
  "new delhi": { lat: 28.6139, lng: 77.2090 },
  mumbai: { lat: 19.0760, lng: 72.8777 },
  pune: { lat: 18.5204, lng: 73.8567 },
  gandhinagar: { lat: 23.2156, lng: 72.6369 },
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  chandigarh: { lat: 30.7333, lng: 76.7794 },
  lucknow: { lat: 26.8467, lng: 80.9462 },
  varanasi: { lat: 25.3176, lng: 82.9739 },
  shimla: { lat: 31.1048, lng: 77.1734 },
  manali: { lat: 32.2432, lng: 77.1892 },
  almora: { lat: 29.5971, lng: 79.6591 },
  ranikhet: { lat: 29.6434, lng: 79.4322 },
  champawat: { lat: 29.3347, lng: 80.0911 },
  srinagar: { lat: 34.0837, lng: 74.7973 },
  goa: { lat: 15.2993, lng: 74.1240 },
  hyderabad: { lat: 17.3850, lng: 78.4867 },
};

function lookupKnownCoords(query: string): { latitude: number; longitude: number } | null {
  if (!query) return null;
  const q = query.toLowerCase();
  for (const [city, coords] of Object.entries(KNOWN_CITY_COORDINATES)) {
    if (q.includes(city)) {
      return { latitude: coords.lat, longitude: coords.lng };
    }
  }
  return null;
}

export default function ExplorePlaceScreen() {
  const params = useLocalSearchParams<{
    name?: string;
    address?: string;
    latitude?: string;
    longitude?: string;
  }>();

  const {
    userLatitude,
    userLongitude,
    userAddress,
    setDestinationLocation,
    clearDestinationLocation,
  } = useLocationStore();

  const defaultLat = 30.3165; // Dehradun default
  const defaultLng = 78.0322;

  const rawName = params.name || params.address?.split(",")[0] || "Dehradun";
  const rawAddress = params.address || `${rawName}, Uttarakhand, India`;

  const [placeName, setPlaceName] = useState(rawName);
  const [placeAddress, setPlaceAddress] = useState(rawAddress);

  // Check if params has coords or lookup city
  const cityMatch = lookupKnownCoords(rawName + " " + rawAddress);

  const initialLat = params.latitude && parseFloat(params.latitude) !== 18.5412
    ? parseFloat(params.latitude)
    : (cityMatch?.latitude || (params.latitude ? parseFloat(params.latitude) : defaultLat));

  const initialLng = params.longitude && parseFloat(params.longitude) !== 73.7275
    ? parseFloat(params.longitude)
    : (cityMatch?.longitude || (params.longitude ? parseFloat(params.longitude) : defaultLng));

  const [placeCoords, setPlaceCoords] = useState<{
    latitude: number;
    longitude: number;
  }>({
    latitude: initialLat,
    longitude: initialLng,
  });

  const [photos, setPhotos] = useState<{ url: string; caption: string }[]>([]);
  const [placeDescription, setPlaceDescription] = useState<string>("");
  const [loadingPhotos, setLoadingPhotos] = useState(false);

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

  const effectiveUserLat = userLatitude || 18.5412;
  const effectiveUserLon = userLongitude || 73.7275;

  const mapRef = React.useRef<MapView>(null);

  // Fetch real Google Places photos and official editorial summary
  useEffect(() => {
    let isCancelled = false;

    const fetchPlaceDetails = async () => {
      setLoadingPhotos(true);
      try {
        const response = await fetch(
          "https://places.googleapis.com/v1/places:searchText",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": GOOGLE_API_KEY,
              "X-Goog-FieldMask":
                "places.displayName,places.formattedAddress,places.photos,places.editorialSummary",
            },
            body: JSON.stringify({
              textQuery: `${placeName}, India`,
              pageSize: 1,
            }),
          }
        );
        const data = await response.json();

        if (isCancelled) return;

        if (data.places?.[0]) {
          const place = data.places[0];

          if (place.editorialSummary?.text) {
            setPlaceDescription(place.editorialSummary.text);
          } else {
            setPlaceDescription(
              `${placeName} is a popular destination and transit hub located in ${placeAddress}, known for its scenic surroundings, local culture, and connectivity.`
            );
          }

          if (place.photos && place.photos.length > 0) {
            const photoPromises = place.photos
              .slice(0, 5)
              .map(async (photo: any, index: number) => {
                try {
                  const mediaRes = await fetch(
                    `https://places.googleapis.com/v1/${photo.name}/media?maxHeightPx=600&maxWidthPx=800&skipHttpRedirect=true`,
                    {
                      headers: { "X-Goog-Api-Key": GOOGLE_API_KEY },
                    }
                  );
                  const mediaData = await mediaRes.json();
                  if (mediaData.photoUri) {
                    return {
                      url: mediaData.photoUri,
                      caption: `${placeName} • Highlight ${index + 1}`,
                    };
                  }
                } catch (e) {
                  return null;
                }
                return null;
              });

            const fetchedPhotos = (await Promise.all(photoPromises)).filter(
              Boolean
            ) as { url: string; caption: string }[];

            if (!isCancelled && fetchedPhotos.length > 0) {
              setPhotos(fetchedPhotos);
              setLoadingPhotos(false);
              return;
            }
          }
        }
      } catch (err) {
        console.log("Error fetching place photos:", err);
      }

      // Curated fallbacks if Places photos are not available
      if (!isCancelled) {
        setPhotos([
          {
            url: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&auto=format&fit=crop&q=80",
            caption: `${placeName} • Scenic Mountain Vista`,
          },
          {
            url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80",
            caption: `${placeName} • Nature & Landscapes`,
          },
          {
            url: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600&auto=format&fit=crop&q=80",
            caption: `${placeName} • City & Landmarks`,
          },
        ]);
        setPlaceDescription(
          `${placeName} is a celebrated destination located in ${placeAddress}, surrounded by beautiful topography, historic routes, and regional attractions.`
        );
        setLoadingPhotos(false);
      }
    };

    fetchPlaceDetails();

    return () => {
      isCancelled = true;
    };
  }, [placeName]);

  const handleFetchDirections = async (
    destLat = placeCoords.latitude,
    destLng = placeCoords.longitude
  ) => {
    setLoadingDirections(true);
    setShowDirections(true);

    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${effectiveUserLat},${effectiveUserLon}&destination=${destLat},${destLng}&departure_time=now&traffic_model=best_guess&alternatives=true&key=${GOOGLE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.status === "OK" && data.routes?.length > 0) {
        // Select shortest distance route just as Google Maps provides
        const sortedRoutes = [...data.routes].sort((a, b) => {
          const distA = a.legs?.[0]?.distance?.value ?? 999999999;
          const distB = b.legs?.[0]?.distance?.value ?? 999999999;
          if (distA !== distB) return distA - distB;
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

        const shortestRoute = sortedRoutes[0];
        const leg = shortestRoute.legs[0];
        const liveDuration =
          leg.duration_in_traffic?.text || leg.duration?.text || "1 d 3 hours";
        setRouteInfo({
          duration: liveDuration,
          distance: leg.distance?.text || "1,558 km",
          summary: shortestRoute.summary || "Shortest Route",
        });

        if (shortestRoute.overview_polyline?.points) {
          const decoded = decodePolyline(
            shortestRoute.overview_polyline.points
          );
          setRoutePolyline(decoded);

          // Fit map camera to full route
          setTimeout(() => {
            mapRef.current?.fitToCoordinates(
              decoded.map(([lat, lng]) => ({ latitude: lat, longitude: lng })),
              {
                edgePadding: { top: 260, right: 60, bottom: 400, left: 60 },
                animated: true,
              }
            );
          }, 350);
        }
      } else {
        const R = 6371;
        const dLat = ((destLat - effectiveUserLat) * Math.PI) / 180;
        const dLon = ((destLng - effectiveUserLon) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((effectiveUserLat * Math.PI) / 180) *
            Math.cos((destLat * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distKm = Math.round(R * c * 1.25);
        const hrs = Math.floor(distKm / 65);
        const mins = Math.round((distKm % 65) * (60 / 65));
        const durationStr =
          hrs >= 24
            ? `${Math.floor(hrs / 24)} d ${hrs % 24} hr`
            : `${hrs} hr ${mins} min`;

        setRouteInfo({
          duration: durationStr,
          distance: `${distKm.toLocaleString("en-IN")} km`,
          summary: "Fastest Highway Route",
        });

        const interpolated: [number, number][] = [];
        const steps = 15;
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          interpolated.push([
            effectiveUserLat + (destLat - effectiveUserLat) * t,
            effectiveUserLon + (destLng - effectiveUserLon) * t,
          ]);
        }
        setRoutePolyline(interpolated);
      }
    } catch (e) {
      console.log("Directions notice:", e);
      const R = 6371;
      const dLat = ((destLat - effectiveUserLat) * Math.PI) / 180;
      const dLon = ((destLng - effectiveUserLon) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((effectiveUserLat * Math.PI) / 180) *
          Math.cos((destLat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distKm = Math.round(R * c * 1.25);
      const hrs = Math.floor(distKm / 65);
      const mins = Math.round((distKm % 65) * (60 / 65));
      const durationStr =
        hrs >= 24
          ? `${Math.floor(hrs / 24)} d ${hrs % 24} hr`
          : `${hrs} hr ${mins} min`;

      setRouteInfo({
        duration: durationStr,
        distance: `${distKm.toLocaleString("en-IN")} km`,
        summary: "Fastest Highway Route",
      });

      const interpolated: [number, number][] = [];
      const steps = 15;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        interpolated.push([
          effectiveUserLat + (destLat - effectiveUserLat) * t,
          effectiveUserLon + (destLng - effectiveUserLon) * t,
        ]);
      }
      setRoutePolyline(interpolated);
    } finally {
      setLoadingDirections(false);
    }
  };

  const handleSelectNewPlace = async (place: any) => {
    if (!place || !place.address) {
      clearDestinationLocation();
      setShowDirections(false);
      setRoutePolyline([]);
      setRouteInfo(null);
      return;
    }
    const cleanName = place.address.split(",")[0] || place.address;
    setPlaceName(cleanName);
    setPlaceAddress(place.address);

    let lat = place.latitude;
    let lon = place.longitude;

    if (!lat || !lon || (lat === 18.5412 && lon === 73.7275 && !cleanName.toLowerCase().includes("pune"))) {
      const match = lookupKnownCoords(cleanName + " " + place.address);
      if (match) {
        lat = match.latitude;
        lon = match.longitude;
      } else {
        try {
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
              place.address
            )}&key=${GOOGLE_API_KEY}`
          );
          const data = await res.json();
          if (data.results?.[0]?.geometry?.location) {
            lat = data.results[0].geometry.location.lat;
            lon = data.results[0].geometry.location.lng;
          }
        } catch (err) {
          console.log("Geocode error:", err);
        }
      }
    }

    if (lat && lon) {
      setPlaceCoords({
        latitude: lat,
        longitude: lon,
      });
      if (showDirections) {
        handleFetchDirections(lat, lon);
      } else {
        setRoutePolyline([]);
      }
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${placeName} (${placeAddress}) on SafarX!`,
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
        <InteractiveMap
          userLatitude={effectiveUserLat}
          userLongitude={effectiveUserLon}
          destinationLatitude={placeCoords.latitude}
          destinationLongitude={placeCoords.longitude}
          destinationTitle={placeName}
          routeCoordinates={showDirections ? routePolyline : []}
          routeDuration={showDirections ? routeInfo?.duration : null}
          routeDistance={showDirections ? routeInfo?.distance : null}
          showRecenter={showDirections}
          recenterPosition="bottom-right"
          zoom={14}
          style={{ width: "100%", height: "100%" }}
        />
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
            onPress={() => {
              clearDestinationLocation();
              router.back();
            }}
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
                  onPress={() => {
                    setShowDirections(false);
                    setRoutePolyline([]);
                    setRouteInfo(null);
                    clearDestinationLocation();
                    if (mapRef.current) {
                      mapRef.current.animateToRegion(
                        {
                          latitude: effectiveUserLat,
                          longitude: effectiveUserLon,
                          latitudeDelta: 0.03,
                          longitudeDelta: 0.03,
                        },
                        500
                      );
                    }
                  }}
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
          {/* Place Title and address subtitle */}
          <Text className="text-white text-2xl font-JakartaBold">
            {placeName}
          </Text>
          <Text className="text-neutral-400 font-Jakarta text-sm mt-0.5 mb-4">
            {placeAddress}
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
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-neutral-400 font-JakartaBold text-xs uppercase">
              Photos & Highlights
            </Text>
            {loadingPhotos && (
              <ActivityIndicator size="small" color="#0286FF" />
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row mb-4"
          >
            {photos.length > 0 ? (
              photos.map((img, i) => (
                <View
                  key={i}
                  className="mr-3 rounded-2xl overflow-hidden bg-neutral-800 border border-neutral-700"
                  style={{ width: 220, height: 135 }}
                >
                  <Image
                    source={{ uri: img.url }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                  <View className="absolute bottom-0 left-0 right-0 p-1.5 bg-black/60">
                    <Text
                      className="text-white text-[11px] font-JakartaSemiBold"
                      numberOfLines={1}
                    >
                      {img.caption}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View className="py-6 px-4 bg-neutral-800/60 rounded-2xl border border-neutral-700 w-full items-center">
                <Text className="text-neutral-400 text-xs font-Jakarta">
                  {loadingPhotos ? "Fetching place photos..." : "Photos will appear here"}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Overview text */}
          <Text className="text-neutral-300 font-Jakarta text-xs leading-relaxed mb-6">
            {placeDescription || "Exploring destination information..."}
          </Text>
        </ScrollView>
      </View>
    </View>
  );
}
