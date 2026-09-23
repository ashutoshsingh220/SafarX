import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Pressable,
} from "react-native";

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_PLACES_API_KEY || "";

export interface PlaceResult {
  address: string;
  latitude?: number;
  longitude?: number;
}

interface Suggestion {
  placeId: string;
  fullText: string;
  mainText: string;
  secondaryText: string;
  latitude?: number;
  longitude?: number;
}

interface GooglePlacesAutocompleteInputProps {
  label?: string;
  placeholder: string;
  initialValue?: string;
  icon?: string;
  zIndex?: number;
  containerClassName?: string;
  onSelectPlace: (place: PlaceResult) => void;
  onChangeText?: (text: string) => void;
}

export const GooglePlacesAutocompleteInput = ({
  label,
  placeholder,
  initialValue = "",
  icon = "📍",
  zIndex = 10,
  containerClassName = "relative mb-3",
  onSelectPlace,
  onChangeText,
}: GooglePlacesAutocompleteInputProps) => {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceTimer = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  const fetchSuggestions = async (input: string) => {
    if (!input.trim() || input.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      // 1. Try Autocomplete API
      const response = await fetch(
        "https://places.googleapis.com/v1/places:autocomplete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GOOGLE_API_KEY,
          },
          body: JSON.stringify({
            input: input.trim(),
            includedRegionCodes: ["in"],
          }),
          signal: controller.signal,
        }
      );

      const data = await response.json();
      if (data.suggestions && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        const list: Suggestion[] = data.suggestions
          .filter((s: any) => s.placePrediction)
          .map((s: any) => ({
            placeId: s.placePrediction.placeId,
            fullText: s.placePrediction.text?.text || "",
            mainText:
              s.placePrediction.structuredFormat?.mainText?.text ||
              s.placePrediction.text?.text ||
              "",
            secondaryText:
              s.placePrediction.structuredFormat?.secondaryText?.text || "",
          }));
        setSuggestions(list);
        setIsOpen(list.length > 0);
        clearTimeout(timeoutId);
        setLoading(false);
        return;
      }
    } catch (err: any) {
      console.log("Autocomplete fetch fallback:", err?.message || err);
    }

    // 2. Fallback to searchText API if autocomplete returned nothing or timed out
    try {
      const searchRes = await fetch(
        "https://places.googleapis.com/v1/places:searchText",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GOOGLE_API_KEY,
            "X-Goog-FieldMask":
              "places.id,places.displayName,places.formattedAddress,places.location",
          },
          body: JSON.stringify({
            textQuery: input.trim(),
            languageCode: "en",
          }),
        }
      );
      const searchData = await searchRes.json();
      if (searchData.places && Array.isArray(searchData.places)) {
        const list: Suggestion[] = searchData.places.map((p: any) => ({
          placeId: p.id,
          fullText: p.formattedAddress || p.displayName?.text || "",
          mainText: p.displayName?.text || p.formattedAddress || "",
          secondaryText: p.formattedAddress || "",
          latitude: p.location?.latitude,
          longitude: p.location?.longitude,
        }));
        setSuggestions(list);
        setIsOpen(list.length > 0);
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
    } catch (err) {
      console.log("SearchText error:", err);
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const handleChangeText = (text: string) => {
    setQuery(text);
    if (onChangeText) onChangeText(text);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(text);
    }, 300);
  };

  const handleSelect = async (item: Suggestion) => {
    setQuery(item.fullText);
    setIsOpen(false);
    setSuggestions([]);

    // If coordinates are already present from searchText
    if (item.latitude && item.longitude) {
      onSelectPlace({
        address: item.fullText,
        latitude: item.latitude,
        longitude: item.longitude,
      });
      return;
    }

    // Fetch place details for exact lat/lon
    try {
      const res = await fetch(
        `https://places.googleapis.com/v1/places/${item.placeId}`,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GOOGLE_API_KEY,
            "X-Goog-FieldMask": "location,formattedAddress,displayName",
          },
        }
      );
      const details = await res.json();
      let lat = details.location?.latitude;
      let lon = details.location?.longitude;
      if (!lat || !lon) {
        const geoRes = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?place_id=${item.placeId}&key=${GOOGLE_API_KEY}`
        );
        const geoData = await geoRes.json();
        if (geoData.results?.[0]?.geometry?.location) {
          lat = geoData.results[0].geometry.location.lat;
          lon = geoData.results[0].geometry.location.lng;
        }
      }
      onSelectPlace({
        address: item.fullText,
        latitude: lat,
        longitude: lon,
      });
    } catch (e) {
      try {
        const geoRes = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(item.fullText)}&key=${GOOGLE_API_KEY}`
        );
        const geoData = await geoRes.json();
        const loc = geoData.results?.[0]?.geometry?.location;
        onSelectPlace({
          address: item.fullText,
          latitude: loc?.lat,
          longitude: loc?.lng,
        });
      } catch (err) {
        onSelectPlace({ address: item.fullText });
      }
    }
  };

  const handleClear = () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
    setLoading(false);
    if (onChangeText) onChangeText("");
    onSelectPlace({ address: "" });
  };

  return (
    <View
      style={{
        zIndex: isOpen ? 9999 : zIndex,
        elevation: isOpen ? 50 : zIndex,
      }}
      className={containerClassName}
    >
      {label ? (
        <Text className="text-xs font-JakartaBold text-gray-400 uppercase mb-1">
          {label}
        </Text>
      ) : null}

      <View
        style={{
          backgroundColor: "#F3F4F6",
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderWidth: 1,
          borderColor: "#E5E7EB",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        {icon ? <Text className="text-base mr-2">{icon}</Text> : null}
        <TextInput
          style={{ flex: 1, fontSize: 15, color: "#111827", paddingVertical: 0 }}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={handleChangeText}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          autoCorrect={false}
        />
        {loading && <ActivityIndicator size="small" color="#0286FF" className="mr-2" />}
        {query.length > 0 && (
          <TouchableOpacity
            onPress={handleClear}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="p-1 rounded-full bg-neutral-200"
          >
            <Text className="text-gray-600 font-JakartaBold text-xs px-1">✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {isOpen && suggestions.length > 0 && (
        <View
          style={{
            position: "absolute",
            top: label ? 74 : 56,
            left: 0,
            right: 0,
            zIndex: 9999,
            elevation: 20,
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#E5E7EB",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
            maxHeight: 240,
            overflow: "hidden",
          }}
        >
          <ScrollView
            keyboardShouldPersistTaps="always"
            nestedScrollEnabled={true}
            style={{ backgroundColor: "#FFFFFF" }}
          >
            {suggestions.map((item, idx) => (
              <TouchableOpacity
                key={item.placeId || idx.toString()}
                onPress={() => handleSelect(item)}
                style={{ backgroundColor: "#FFFFFF" }}
                className={`p-3.5 flex-row items-center active:bg-neutral-100 ${
                  idx < suggestions.length - 1
                    ? "border-b border-neutral-100"
                    : ""
                }`}
              >
                <Text className="text-base mr-3">📍</Text>
                <View className="flex-1">
                  <Text
                    className="font-JakartaBold text-sm text-gray-800"
                    numberOfLines={1}
                  >
                    {item.mainText}
                  </Text>
                  {item.secondaryText ? (
                    <Text
                      className="font-Jakarta text-xs text-gray-500 mt-0.5"
                      numberOfLines={1}
                    >
                      {item.secondaryText}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};
