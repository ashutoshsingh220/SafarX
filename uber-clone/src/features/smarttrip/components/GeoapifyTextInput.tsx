import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  ScrollView,
  Text,
  TouchableOpacity,
  Keyboard,
} from "react-native";
import { geoapifyAutocomplete } from "../lib/api";

interface GeoapifyTextInputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onSelectPlace?: (lat: number, lon: number, city?: string) => void;
  biasLat?: number;
  biasLon?: number;
}

export const GeoapifyTextInput: React.FC<GeoapifyTextInputProps> = ({
  placeholder,
  value,
  onChangeText,
  onSelectPlace,
  biasLat,
  biasLon,
}) => {
  const [results, setResults] = useState<any[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const fetchPlaces = async () => {
      if (value.length > 2 && isFocused) {
        const places = await geoapifyAutocomplete(value, biasLat, biasLon);
        setResults(places);
      } else {
        setResults([]);
      }
    };

    const timeoutId = setTimeout(fetchPlaces, 300);
    return () => clearTimeout(timeoutId);
  }, [value, isFocused, biasLat, biasLon]);

  const handleSelect = (item: any) => {
    onChangeText(item.city || item.formatted);
    setResults([]);
    setIsFocused(false);
    inputRef.current?.blur();
    Keyboard.dismiss();
    if (onSelectPlace) {
      onSelectPlace(item.lat, item.lon, item.city);
    }
  };

  return (
    <View className="relative z-50 w-full mb-4">
      <TextInput
        ref={inputRef}
        placeholder={placeholder}
        value={value}
        onChangeText={(text) => {
          onChangeText(text);
          setIsFocused(true);
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="bg-white p-4 rounded-xl border border-neutral-200 font-Jakarta"
      />
      {results.length > 0 && isFocused && (
        <View className="absolute top-14 left-0 right-0 bg-white border border-neutral-200 rounded-xl shadow-lg z-50 max-h-60">
          <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {results.map((item) => (
              <TouchableOpacity
                key={item.placeId}
                onPress={() => handleSelect(item)}
                className="p-4 border-b border-neutral-100"
              >
                <Text className="font-Jakarta" numberOfLines={2}>
                  {item.formatted}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};
