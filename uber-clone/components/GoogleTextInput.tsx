import React from "react";
import { View } from "react-native";
import { GooglePlacesAutocompleteInput } from "@/src/features/smarttrip/components/GooglePlacesAutocompleteInput";
import { GoogleInputProps } from "@/types/type";


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
            handlePress({
              latitude: place.latitude || 18.5412,
              longitude: place.longitude || 73.7275,
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
