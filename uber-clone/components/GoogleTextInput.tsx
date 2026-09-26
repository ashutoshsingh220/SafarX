import React from "react";
import { View } from "react-native";
import { GooglePlacesAutocompleteInput } from "@/src/features/smarttrip/components/GooglePlacesAutocompleteInput";
import { GoogleInputProps } from "@/types/type";

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

const GoogleTextInput = ({
  icon,
  initialLocation,
  initialValue,
  containerStyle,
  textInputBackgroundColor,
  handlePress,
  onClear,
}: GoogleInputProps) => {
  return (
    <View
      style={{ zIndex: 1000 }}
      className={`relative z-50 rounded-2xl ${containerStyle || ""}`}
    >
      <GooglePlacesAutocompleteInput
        placeholder={initialLocation || "Where do you want to go?"}
        initialValue={initialValue !== undefined ? initialValue : (initialLocation || "")}
        icon="🔍"
        zIndex={1000}
        containerClassName="relative"
        onSelectPlace={(place) => {
          if (place.address) {
            const cityMatch = lookupKnownCoords(place.address);
            handlePress({
              latitude: place.latitude || cityMatch?.latitude || 30.3165,
              longitude: place.longitude || cityMatch?.longitude || 78.0322,
              address: place.address,
            });
          } else {
            if (onClear) {
              onClear();
            }
          }
        }}
      />
    </View>
  );
};

export default GoogleTextInput;
