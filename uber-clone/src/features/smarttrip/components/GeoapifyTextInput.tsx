import React from "react";
import { View, TextInput, Text } from "react-native";

interface GeoapifyTextInputProps {
  icon?: any;
  initialLocation?: string;
  containerStyle?: string;
  textInputBackgroundColor?: string;
  handlePress: (location: { latitude: number; longitude: number; address: string }) => void;
}

export const GeoapifyTextInput = ({
  icon,
  initialLocation,
  containerStyle,
  textInputBackgroundColor,
  handlePress,
}: GeoapifyTextInputProps) => {
  const [query, setQuery] = React.useState(initialLocation || "");

  return (
    <View className={`flex-row items-center justify-center relative z-50 rounded-xl ${containerStyle}`}>
      <TextInput
        className={`bg-white rounded-xl p-3 font-Jakarta text-base w-full ${textInputBackgroundColor}`}
        placeholder="Where do you want to go?"
        value={query}
        onChangeText={(text) => {
          setQuery(text);
          handlePress({ latitude: 18.5204, longitude: 73.8567, address: text });
        }}
      />
    </View>
  );
};
