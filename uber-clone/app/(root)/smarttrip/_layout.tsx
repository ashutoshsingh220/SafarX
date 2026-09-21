import { Stack } from "expo-router";

const Layout = () => {
  return (
    <Stack>
      <Stack.Screen name="search" options={{ headerShown: false }} />
      <Stack.Screen name="agent" options={{ headerShown: false }} />
      <Stack.Screen name="bundle" options={{ headerShown: false }} />
    </Stack>
  );
};

export default Layout;
