import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { images } from "@/constants";

export default function SmartTripTabScreen() {
  return (
    <SafeAreaView className="flex-1 bg-neutral-100 p-4">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-1 mr-3">
            <Text className="text-3xl font-JakartaBold mb-1">SafarX</Text>
            <Text className="text-gray-500 font-Jakarta">
              Next-generation door-to-door transit engine & travel companion.
            </Text>
          </View>
          <Image
            source={images.safarxLogo}
            style={{ width: 44, height: 44, borderRadius: 22 }}
            resizeMode="contain"
          />
        </View>

        <TouchableOpacity
          onPress={() => router.push("/(root)/smarttrip/search")}
          className="bg-primary-500 p-5 rounded-2xl mb-4 shadow-sm flex-row items-center justify-between"
        >
          <View className="flex-1 mr-3">
            <Text className="text-white font-JakartaBold text-xl mb-1">🎫 Trip Planner & Booking</Text>
            <Text className="text-white/80 font-Jakarta text-sm">
              Plan & book door-to-door trips across cabs, express trains & flights.
            </Text>
          </View>
          <Text className="text-white text-2xl font-JakartaBold">→</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
