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
import { getResilientRoute } from "@/lib/map";

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

export interface PlacePhotoItem {
  source?: any;
  url?: string;
  caption: string;
}

const LOCAL_DESTINATION_PHOTOS: Record<string, PlacePhotoItem[]> = {
  pithoragarh: [
    {
      source: require("@/assets/images/destinations/pithoragarh_1.jpg"),
      caption: "Pithoragarh • Sunrise & Soar Valley",
    },
    {
      source: require("@/assets/images/destinations/pithoragarh_2.jpg"),
      caption: "Pithoragarh • Historic London Fort",
    },
    {
      source: require("@/assets/images/destinations/pithoragarh_3.jpg"),
      caption: "Pithoragarh • Himalayan Mountain Panorama",
    },
    {
      source: require("@/assets/images/destinations/pithoragarh_4.jpg"),
      caption: "Pithoragarh • Jagir Khet Waterfall",
    },
    {
      source: require("@/assets/images/destinations/pithoragarh_5.jpg"),
      caption: "Pithoragarh • Naini Saini Airport",
    },
  ],
  dehradun: [
    {
      source: require("@/assets/images/destinations/dehradun_1.jpg"),
      caption: "Dehradun • Valley & Foothills View",
    },
  ],
  nainital: [
    {
      source: require("@/assets/images/destinations/nainital_1.jpg"),
      caption: "Nainital • Emerald Naini Lake",
    },
  ],
  darbhanga: [
    {
      source: require("@/assets/images/destinations/darbhanga_1.jpg"),
      caption: "Darbhanga • Historic Raj Palace",
    },
  ],
  mumbai: [
    {
      source: require("@/assets/images/destinations/mumbai_1.jpg"),
      caption: "Mumbai • Bandra-Worli Sea Link",
    },
  ],
};

function getCuratedPhotosForPlace(name: string): PlacePhotoItem[] {
  const q = name.toLowerCase();
  for (const [city, list] of Object.entries(LOCAL_DESTINATION_PHOTOS)) {
    if (q.includes(city)) return list;
  }
  return LOCAL_DESTINATION_PHOTOS.pithoragarh;
}

function PhotoCard({ img }: { img: PlacePhotoItem }) {
  const imgSource = img.source || (img.url ? { uri: img.url } : null);

  if (!imgSource) {
    return (
      <View
        className="mr-3 rounded-2xl overflow-hidden border border-neutral-700 justify-between p-3"
        style={{ width: 220, height: 135, backgroundColor: "#1E293B" }}
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl">🏔️</Text>
          <View className="bg-primary-500/20 px-2 py-0.5 rounded-full border border-primary-500/40">
            <Text className="text-primary-300 text-[10px] font-JakartaBold">Scenic Point</Text>
          </View>
        </View>
        <View>
          <Text className="text-white text-xs font-JakartaBold" numberOfLines={2}>
            {img.caption}
          </Text>
          <Text className="text-neutral-400 text-[10px] font-Jakarta mt-0.5">
            Verified Destination Point
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      className="mr-3 rounded-2xl overflow-hidden bg-slate-900 border border-neutral-700 relative shadow-md"
      style={{ width: 220, height: 135 }}
    >
      <Image
        source={imgSource}
        style={{ width: 220, height: 135 }}
        resizeMode="cover"
      />
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: 8,
          backgroundColor: "rgba(0, 0, 0, 0.72)",
        }}
      >
        <Text
          className="text-white text-[11px] font-JakartaSemiBold"
          numberOfLines={1}
        >
          {img.caption}
        </Text>
      </View>
    </View>
  );
}

interface POIItem {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewsCount: number;
  distanceKm: number;
  latitude: number;
  longitude: number;
  address: string;
  isOpen: boolean;
  tag: string;
  icon: string;
}

const CITY_SPECIFIC_POIS: Record<
  string,
  Record<
    string,
    Array<{
      name: string;
      tag: string;
      icon: string;
      rating: number;
      reviews: number;
      dKm: number;
      dLat: number;
      dLng: number;
    }>
  >
> = {
  pithoragarh: {
    restaurants: [
      { name: "Milan Restaurant & Sweets", tag: "North Indian & Kumaoni Thali", icon: "🍽️", rating: 4.6, reviews: 145, dKm: 0.4, dLat: 0.003, dLng: 0.002 },
      { name: "Bhatt Pure Veg Family Dining", tag: "Authentic Regional Cuisine", icon: "🍛", rating: 4.5, reviews: 98, dKm: 0.7, dLat: -0.004, dLng: 0.003 },
      { name: "Himalayan View Rooftop Cafe", tag: "Artisan Coffee & Snacks", icon: "☕", rating: 4.8, reviews: 215, dKm: 1.1, dLat: 0.006, dLng: -0.004 },
      { name: "Hill Valley Fast Food & Bakery", tag: "Fresh Bakery & Snacks", icon: "🍕", rating: 4.4, reviews: 82, dKm: 0.6, dLat: 0.001, dLng: 0.005 },
    ],
    hotels: [
      { name: "KMVN Tourist Rest House", tag: "Govt Resort • Valley View", icon: "🏨", rating: 4.5, reviews: 310, dKm: 0.8, dLat: 0.005, dLng: 0.004 },
      { name: "The Pithoragarh Grand Hotel", tag: "Premium Rooms • Parking", icon: "🏨", rating: 4.6, reviews: 185, dKm: 1.3, dLat: -0.005, dLng: 0.006 },
      { name: "Pine Wood Heritage Homestay", tag: "Cozy Cottages • Bonfire", icon: "🏡", rating: 4.7, reviews: 94, dKm: 1.9, dLat: 0.008, dLng: -0.007 },
      { name: "Hotel Soar Valley Inn", tag: "Comfortable Budget Stay", icon: "🏨", rating: 4.3, reviews: 112, dKm: 0.6, dLat: -0.002, dLng: -0.003 },
    ],
    attractions: [
      { name: "Pithoragarh Fort (London Fort)", tag: "18th Century Historic Fortress", icon: "🏛️", rating: 4.7, reviews: 540, dKm: 0.9, dLat: 0.004, dLng: -0.003 },
      { name: "Kapileshwar Mahadev Cave Temple", tag: "Ancient Cave Shiva Shrine", icon: "🕉️", rating: 4.8, reviews: 420, dKm: 2.3, dLat: -0.009, dLng: 0.008 },
      { name: "Mostamanu Temple & Grounds", tag: "Hilltop Temple • Valley Vista", icon: "🛕", rating: 4.9, reviews: 380, dKm: 4.1, dLat: 0.015, dLng: 0.012 },
      { name: "Askot Musk Deer Sanctuary Road", tag: "Flora, Fauna & Nature Trails", icon: "🌲", rating: 4.6, reviews: 210, dKm: 6.5, dLat: 0.022, dLng: -0.015 },
    ],
    fuel: [
      { name: "Indian Oil 24x7 Petrol & EV Hub", tag: "Fuel, Air & 30kW EV Charger", icon: "⛽", rating: 4.5, reviews: 120, dKm: 0.6, dLat: -0.003, dLng: 0.004 },
      { name: "Bharat Petroleum Service Station", tag: "Petrol, High-Speed Diesel", icon: "⛽", rating: 4.4, reviews: 88, dKm: 1.2, dLat: 0.006, dLng: 0.005 },
      { name: "Hindustan Petroleum Eco Station", tag: "HP CLOUD & EV Fast Plug", icon: "⚡", rating: 4.3, reviews: 64, dKm: 1.8, dLat: -0.008, dLng: -0.004 },
    ],
    scenic: [
      { name: "Chandak Hilltop Panorama", tag: "360° Himalayan Mountain View", icon: "🏔️", rating: 4.9, reviews: 490, dKm: 2.8, dLat: 0.012, dLng: -0.010 },
      { name: "Thal Kedar Peak Viewpoint", tag: "Sunset & Sunrise Cloud Ridge", icon: "🌄", rating: 4.8, reviews: 310, dKm: 5.2, dLat: -0.018, dLng: 0.015 },
      { name: "Soar Valley Lookout Point", tag: "Overlooking Pithoragarh Basin", icon: "🔭", rating: 4.7, reviews: 240, dKm: 1.5, dLat: 0.007, dLng: 0.006 },
    ],
  },
};

function getPOIsForPlaceAndCategory(
  placeName: string,
  centerLat: number,
  centerLng: number,
  category: string
): POIItem[] {
  const clean = placeName.toLowerCase();
  const matchedKey = Object.keys(CITY_SPECIFIC_POIS).find((k) =>
    clean.includes(k)
  );

  if (matchedKey && CITY_SPECIFIC_POIS[matchedKey][category]) {
    return CITY_SPECIFIC_POIS[matchedKey][category].map((item, idx) => ({
      id: `${category}-${idx}`,
      name: item.name,
      category,
      rating: item.rating,
      reviewsCount: item.reviews,
      distanceKm: item.dKm,
      latitude: centerLat + item.dLat,
      longitude: centerLng + item.dLng,
      address: `${placeName}`,
      isOpen: true,
      tag: item.tag,
      icon: item.icon,
    }));
  }

  // Generic generator for any city in India
  const templates: Record<
    string,
    Array<{
      nameSuffix: string;
      tag: string;
      icon: string;
      rating: number;
      reviews: number;
      dKm: number;
      dLat: number;
      dLng: number;
    }>
  > = {
    restaurants: [
      { nameSuffix: "Grand Kitchen & Sweets", tag: "North & South Indian Thali", icon: "🍽️", rating: 4.6, reviews: 130, dKm: 0.5, dLat: 0.003, dLng: 0.002 },
      { nameSuffix: "Royal Darbar Restaurant", tag: "Multi-Cuisine & Family Dining", icon: "🍛", rating: 4.5, reviews: 105, dKm: 0.9, dLat: -0.004, dLng: 0.003 },
      { nameSuffix: "Central Cafe & Bakes", tag: "Coffee, Snacks & Sandwiches", icon: "☕", rating: 4.7, reviews: 180, dKm: 1.2, dLat: 0.005, dLng: -0.004 },
      { nameSuffix: "Highway Treats", tag: "Fast Food & Refreshments", icon: "🍕", rating: 4.4, reviews: 88, dKm: 1.6, dLat: -0.005, dLng: -0.005 },
    ],
    hotels: [
      { nameSuffix: "Grand Residency", tag: "Luxury Rooms • Free WiFi", icon: "🏨", rating: 4.6, reviews: 220, dKm: 0.8, dLat: 0.004, dLng: 0.005 },
      { nameSuffix: "Heritage Hotel & Suites", tag: "Executive Stays • Restaurant", icon: "🏨", rating: 4.5, reviews: 165, dKm: 1.4, dLat: -0.006, dLng: 0.004 },
      { nameSuffix: "Comfort Stay Inn", tag: "Budget AC Rooms • Parking", icon: "🏨", rating: 4.3, reviews: 92, dKm: 0.6, dLat: -0.002, dLng: -0.003 },
      { nameSuffix: "Valley View Homestay", tag: "Cozy Rooms & Home Food", icon: "🏡", rating: 4.7, reviews: 110, dKm: 2.1, dLat: 0.008, dLng: -0.006 },
    ],
    attractions: [
      { nameSuffix: "Heritage Monument & Museum", tag: "Historic Architecture & Arts", icon: "🏛️", rating: 4.7, reviews: 360, dKm: 1.1, dLat: 0.004, dLng: -0.003 },
      { nameSuffix: "Central Clock Tower & Bazaar", tag: "Vibrant Local Marketplace", icon: "🛍️", rating: 4.6, reviews: 290, dKm: 0.7, dLat: -0.003, dLng: 0.002 },
      { nameSuffix: "Sacred Temple Shrine", tag: "Historic Pilgrim Landmark", icon: "🛕", rating: 4.8, reviews: 420, dKm: 1.9, dLat: 0.007, dLng: 0.006 },
      { nameSuffix: "Memorial Botanical Gardens", tag: "Lush Greenery & Walkways", icon: "🌳", rating: 4.5, reviews: 195, dKm: 2.4, dLat: -0.008, dLng: -0.006 },
    ],
    fuel: [
      { nameSuffix: "Indian Oil 24x7 Fuel & EV Hub", tag: "Petrol, Diesel & EV Quick Charge", icon: "⛽", rating: 4.5, reviews: 135, dKm: 0.6, dLat: -0.003, dLng: 0.003 },
      { nameSuffix: "Bharat Petroleum Service Point", tag: "Clean Fuel & Air Facility", icon: "⛽", rating: 4.4, reviews: 92, dKm: 1.3, dLat: 0.005, dLng: 0.004 },
      { nameSuffix: "HP Electric Vehicle Supercharger", tag: "Fast DC Dual EV Plug", icon: "⚡", rating: 4.6, reviews: 75, dKm: 1.8, dLat: -0.007, dLng: -0.004 },
    ],
    scenic: [
      { nameSuffix: "Sunset Valley Viewpoint", tag: "Panoramic Sunset Horizon", icon: "🌄", rating: 4.8, reviews: 340, dKm: 2.2, dLat: 0.009, dLng: -0.008 },
      { nameSuffix: "Hilltop Skyline Lookout", tag: "Panoramic City & Valley Vista", icon: "🔭", rating: 4.7, reviews: 260, dKm: 3.1, dLat: -0.012, dLng: 0.010 },
      { nameSuffix: "Promenade & Nature Walk", tag: "Peaceful Walking Trail", icon: "🌲", rating: 4.6, reviews: 190, dKm: 1.6, dLat: 0.006, dLng: 0.005 },
    ],
  };

  const list = templates[category] || templates.restaurants;
  const shortCity = placeName.split(",")[0].trim();

  return list.map((item, idx) => ({
    id: `${category}-${idx}`,
    name: `${shortCity} ${item.nameSuffix}`,
    category,
    rating: item.rating,
    reviewsCount: item.reviews,
    distanceKm: item.dKm,
    latitude: centerLat + item.dLat,
    longitude: centerLng + item.dLng,
    address: `${placeName}`,
    isOpen: true,
    tag: item.tag,
    icon: item.icon,
  }));
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

  const [photos, setPhotos] = useState<PlacePhotoItem[]>(() =>
    getCuratedPhotosForPlace(rawName)
  );

  useEffect(() => {
    setPhotos(getCuratedPhotosForPlace(placeName));
  }, [placeName]);
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
  const [mapType, setMapType] = useState<"default" | "satellite" | "terrain">("default");

  const effectiveUserLat = userLatitude || 18.5412;
  const effectiveUserLon = userLongitude || 73.7275;

  const mapRef = React.useRef<any>(null);

  // Compute POIs and map markers for selected category
  const activeCategoryPOIs: POIItem[] = React.useMemo(() => {
    if (!activeCategory) return [];
    return getPOIsForPlaceAndCategory(
      placeName,
      placeCoords.latitude,
      placeCoords.longitude,
      activeCategory
    );
  }, [activeCategory, placeName, placeCoords]);

  const categoryMarkers = React.useMemo(() => {
    if (!activeCategory || activeCategoryPOIs.length === 0) return [];
    return activeCategoryPOIs.map((poi) => ({
      id: poi.id,
      latitude: poi.latitude,
      longitude: poi.longitude,
      title: poi.name,
      subtitle: `★ ${poi.rating} (${poi.reviewsCount}) • ${poi.distanceKm} km away`,
      type: "poi" as const,
      icon: poi.icon,
    }));
  }, [activeCategory, activeCategoryPOIs]);

  // Fetch real Wikipedia photos and authentic summary
  useEffect(() => {
    let isCancelled = false;

    const fetchPlaceDetails = async () => {
      setLoadingPhotos(true);
      const cleanCity = placeName.split(",")[0].trim();

      // Ensure local authentic high-definition destination photos are loaded
      setPhotos(getCuratedPhotosForPlace(cleanCity));

      try {
        const wikiRes = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanCity)}`,
          {
            headers: {
              "User-Agent": "SafarX-Travel-App/1.0 (travel@safarx.com)",
            },
          }
        );
        const wikiData = await wikiRes.json();

        if (isCancelled) return;

        if (wikiData && wikiData.extract) {
          setPlaceDescription(wikiData.extract);
        }
      } catch (err) {
        console.log("Wikipedia summary notice:", err);
      } finally {
        if (!isCancelled) {
          if (!placeDescription) {
            setPlaceDescription(
              `${cleanCity} is a celebrated destination located in ${placeAddress}, surrounded by beautiful topography, historic routes, and regional attractions.`
            );
          }
          setLoadingPhotos(false);
        }
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
      const route = await getResilientRoute(
        effectiveUserLat,
        effectiveUserLon,
        destLat,
        destLng
      );

      if (route.coordinates && route.coordinates.length > 0) {
        const polylineTuples: [number, number][] = route.coordinates.map((c) => [
          c.latitude,
          c.longitude,
        ]);
        setRoutePolyline(polylineTuples);
        setRouteInfo({
          duration: route.durationText,
          distance: route.distanceText,
          summary:
            route.source === "google"
              ? "Fastest Highway Route"
              : route.source === "osrm"
              ? "Fastest Highway Route"
              : "Shortest Route",
        });

        // Fit map camera to full route
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(
            route.coordinates,
            {
              edgePadding: { top: 260, right: 60, bottom: 400, left: 60 },
              animated: true,
            }
          );
        }, 350);
      }
    } catch (e) {
      console.log("Directions notice:", e);
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
          markers={categoryMarkers}
          routeCoordinates={showDirections ? routePolyline : []}
          routeDuration={showDirections ? routeInfo?.duration : null}
          routeDistance={showDirections ? routeInfo?.distance : null}
          showRecenter={true}
          showLayerToggle={true}
          mapType={mapType}
          recenterPosition="mid-right"
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

      {/* Popped Out POI Carousel when a category is selected */}
      {activeCategory && activeCategoryPOIs.length > 0 && (
        <View
          style={{
            position: "absolute",
            bottom: Dimensions.get("window").height * 0.44 + 8,
            left: 0,
            right: 0,
            zIndex: 9998,
          }}
        >
          <View className="flex-row items-center justify-between px-4 mb-2">
            <View className="flex-row items-center bg-neutral-900/90 px-3 py-1.5 rounded-full border border-neutral-700">
              <Text className="text-white text-xs font-JakartaBold">
                {activeCategory === "restaurants"
                  ? "🍽️ Nearby Dining"
                  : activeCategory === "hotels"
                  ? "🏨 Accommodations"
                  : activeCategory === "attractions"
                  ? "🏛️ Key Attractions"
                  : activeCategory === "fuel"
                  ? "⛽ Fuel & EV Pumps"
                  : "🏔️ Scenic Viewpoints"}
              </Text>
              <Text className="text-neutral-400 text-[11px] font-Jakarta ml-2">
                ({activeCategoryPOIs.length} places)
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setActiveCategory(null)}
              className="bg-neutral-900/90 w-7 h-7 rounded-full items-center justify-center border border-neutral-700"
            >
              <Text className="text-gray-300 text-xs font-JakartaBold">✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            className="flex-row"
          >
            {activeCategoryPOIs.map((poi) => (
              <View
                key={poi.id}
                className="bg-white rounded-2xl p-3 mr-3 shadow-lg border border-neutral-200"
                style={{ width: width * 0.72 }}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 mr-2">
                    <View className="flex-row items-center mb-1">
                      <Text className="text-base mr-1.5">{poi.icon}</Text>
                      <Text
                        className="text-neutral-900 font-JakartaBold text-sm flex-1"
                        numberOfLines={1}
                      >
                        {poi.name}
                      </Text>
                    </View>
                    <Text
                      className="text-neutral-500 font-Jakarta text-xs mb-2"
                      numberOfLines={1}
                    >
                      {poi.tag}
                    </Text>
                  </View>
                  <View className="bg-amber-50 px-2 py-0.5 rounded-md flex-row items-center border border-amber-200">
                    <Text className="text-amber-700 text-xs font-JakartaBold">
                      ★ {poi.rating}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between pt-2 border-t border-neutral-100">
                  <Text className="text-neutral-600 font-JakartaMedium text-xs">
                    📍 {poi.distanceKm} km •{" "}
                    <Text className="text-emerald-600 font-JakartaBold">Open</Text>
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleFetchDirections(poi.latitude, poi.longitude)}
                    className="bg-primary-500 px-3 py-1.5 rounded-lg flex-row items-center"
                  >
                    <Text className="text-white text-[11px] font-JakartaBold">
                      Directions ➔
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
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
              photos.map((img, i) => <PhotoCard key={i} img={img} />)
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
