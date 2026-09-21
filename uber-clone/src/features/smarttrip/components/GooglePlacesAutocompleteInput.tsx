import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";

const GOOGLE_API_KEY =
  process.env.EXPO_PUBLIC_PLACES_API_KEY ||
  "AIzaSyBPJDpVUMkQJHfa-stLsXLQFuBAHvBIOFI";

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
}

interface GooglePlacesAutocompleteInputProps {
  label: string;
  placeholder: string;
  initialValue?: string;
  icon?: string;
  zIndex?: number;
  onSelectPlace: (place: PlaceResult) => void;
  onChangeText?: (text: string) => void;
}

export const GooglePlacesAutocompleteInput = ({
  label,
  placeholder,
  initialValue = "",
  icon = "📍",
  zIndex = 10,
  onSelectPlace,
  onChangeText,
}: GooglePlacesAutocompleteInputProps) => {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceTimer = useRef<any>(null);

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

    setLoading(true);
    try {
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
          }),
        }
      );

      const data = await response.json();
      if (data.suggestions && Array.isArray(data.suggestions)) {
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
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
    } catch (err) {
      console.log("Autocomplete fetch error:", err);
      setSuggestions([]);
      setIsOpen(false);
    } finally {
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
      if (details?.location) {
        onSelectPlace({
          address: item.fullText,
          latitude: details.location.latitude,
          longitude: details.location.longitude,
        });
        return;
      }
    } catch (err) {
      console.log("Details fetch error:", err);
    }

    onSelectPlace({ address: item.fullText });
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
    if (onChangeText) onChangeText("");
    onSelectPlace({ address: "" });
  };

  return (
    <View
      style={{
        zIndex: isOpen ? 9999 : zIndex,
        elevation: isOpen ? 50 : zIndex,
      }}
      className="relative mb-4"
    >
      <Text className="text-xs font-JakartaBold text-gray-400 uppercase mb-1">
        {label}
      </Text>

      <View className="flex-row items-center bg-neutral-100 rounded-2xl px-3.5 py-2.5 border border-neutral-200/80">
        <Text className="text-base mr-2">{icon}</Text>
        <TextInput
          className="flex-1 font-Jakarta text-base text-gray-900 py-1"
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={handleChangeText}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          autoCorrect={false}
        />
        {loading && <ActivityIndicator size="small" color="#0286FF" className="mr-1" />}
        {query.length > 0 && !loading && (
          <TouchableOpacity onPress={handleClear} className="p-1">
            <Text className="text-gray-400 font-JakartaBold text-xs">✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {isOpen && suggestions.length > 0 && (
        <View
          style={{
            position: "absolute",
            top: 72,
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
