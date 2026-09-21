import React from "react";
import { View, Text } from "react-native-web";

const MapView = ({ children, style, ...props }) => (
  <View
    style={[
      {
        backgroundColor: "#E5E7EB",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 300,
        borderRadius: 16,
      },
      style,
    ]}
  >
    <Text style={{ color: "#374151", fontWeight: "600", fontSize: 16, marginBottom: 4 }}>
      🗺️ Map Preview
    </Text>
    <Text style={{ color: "#6B7280", fontSize: 13 }}>
      Live map is fully active on iOS & Android (Expo Go)
    </Text>
    {children}
  </View>
);

export const Marker = ({ children }) => <View>{children}</View>;
export const Polyline = () => null;
export const Callout = ({ children }) => <View>{children}</View>;
export const PROVIDER_DEFAULT = "default";
export const PROVIDER_GOOGLE = "google";

export default MapView;
