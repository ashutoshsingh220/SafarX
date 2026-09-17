import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { router } from "expo-router";

const SmartTripMenu = () => {
  return (
    <SafeAreaView className="flex-1 bg-general-500">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text className="text-2xl font-JakartaBold mb-2">SmartTrip AI 🚌✨</Text>
        <Text className="text-md font-Jakarta text-gray-500 mb-8">
          Plan door-to-door trips across cities with AI-powered multi-modal bundling.
        </Text>

        <TouchableOpacity 
          onPress={() => router.push("/(root)/smarttrip/search")}
          className="bg-primary-500 p-5 rounded-2xl mb-4 flex-row items-center justify-between shadow-md shadow-neutral-300"
        >
          <View>
            <Text className="text-white font-JakartaSemiBold text-lg">Travel Search</Text>
            <Text className="text-white font-Jakarta text-sm opacity-90 mt-1">Search intercity buses, trains & flights</Text>
          </View>
          <Text className="text-3xl">🎫</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => router.push("/(root)/smarttrip/agent")}
          className="bg-general-400 p-5 rounded-2xl flex-row items-center justify-between shadow-md shadow-neutral-300"
        >
          <View>
            <Text className="text-black font-JakartaSemiBold text-lg">AI Assistant</Text>
            <Text className="text-black font-Jakarta text-sm opacity-60 mt-1">Chat to build your perfect trip bundle</Text>
          </View>
          <Text className="text-3xl">🤖</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SmartTripMenu;
