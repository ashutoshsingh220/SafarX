import { Stack } from "expo-router";

export default function SmartTripLayout() {
  return (
    <Stack>
      <Stack.Screen name="agent" options={{ headerShown: false }} />
      <Stack.Screen name="search" options={{ headerShown: false }} />
      <Stack.Screen name="bundle" options={{ headerShown: false }} />
    </Stack>
  );
}
