import React from "react";
import { View } from "react-native";
import { GooglePlacesAutocompleteInput } from "@/src/features/smarttrip/components/GooglePlacesAutocompleteInput";
import { GoogleInputProps } from "@/types/type";

const GoogleTextInput = ({
  icon,
  initialLocation,
  containerStyle,
  textInputBackgroundColor,
  handlePress,
}: GoogleInputProps) => {
  return (
    <View
      style={{ zIndex: 1000 }}
      className={`relative z-50 rounded-2xl ${containerStyle || ""}`}
    >
      <GooglePlacesAutocompleteInput
        placeholder={initialLocation || "Where do you want to go?"}
        initialValue=""
        icon="🔍"
        zIndex={1000}
        containerClassName="relative"
        onSelectPlace={(place) => {
          if (place.address) {
            handlePress({
              latitude: place.latitude || 29.5828,
              longitude: place.longitude || 80.2182,
              address: place.address,
            });
          }
        }}
      />
    </View>
  );
};

export default GoogleTextInput;
